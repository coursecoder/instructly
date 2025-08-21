import { router, publicProcedure, protectedProcedure } from '../index';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { 
  createLessonSchema, 
  updateLessonSchema, 
  lessonSequenceUpdateSchema,
  bulkLessonSequenceUpdateSchema,
  topicSchema,
  accessibilityStatusSchema
} from './../../types/shared';
import { LessonRepository } from '../../services/lessonRepository';
import { ProjectRepository } from '../../services/projectRepository';

// Lazy-loaded repositories to ensure environment variables are loaded first
let lessonRepository: LessonRepository;
let projectRepository: ProjectRepository;

const getLessonRepository = () => {
  if (!lessonRepository) {
    lessonRepository = new LessonRepository();
  }
  return lessonRepository;
};

const getProjectRepository = () => {
  if (!projectRepository) {
    projectRepository = new ProjectRepository();
  }
  return projectRepository;
};

export const lessonsRouter = router({
  /**
   * Create a new lesson
   */
  create: protectedProcedure
    .input(createLessonSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Authentication required to create lesson',
          });
        }

        // Verify user has access to the project
        const project = await getProjectRepository().getById(input.projectId, ctx.user.id);
        if (!project) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'No access to the specified project',
          });
        }

        const lesson = await getLessonRepository().create(input);

        return {
          success: true,
          data: lesson,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Failed to create lesson:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create lesson',
        });
      }
    }),

  /**
   * Get lesson by ID
   */
  getById: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          });
        }

        const lesson = await getLessonRepository().getById(input.id);
        
        if (!lesson) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Lesson not found',
          });
        }

        // Verify user has access to the project containing this lesson
        const project = await getProjectRepository().getById(lesson.projectId, ctx.user.id);
        if (!project) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'No access to this lesson',
          });
        }

        return {
          success: true,
          data: lesson,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Failed to get lesson:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get lesson',
        });
      }
    }),

  /**
   * Get lessons by project ID
   */
  getByProject: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          });
        }

        // Verify user has access to the project
        const project = await getProjectRepository().getById(input.projectId, ctx.user.id);
        if (!project) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'No access to the specified project',
          });
        }

        const lessons = await getLessonRepository().findByProject(input.projectId);

        return {
          success: true,
          data: lessons,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Failed to get project lessons:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get lessons',
        });
      }
    }),

  /**
   * Update a lesson
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      title: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      status: z.enum(['draft', 'generating', 'generated', 'reviewed', 'approved']).optional(),
      estimatedDuration: z.number().positive().optional(),
      deliveryFormat: z.enum(['instructor_led', 'self_paced', 'hybrid', 'virtual_classroom']).optional(),
      topics: z.array(topicSchema).optional(),
      accessibilityCompliance: accessibilityStatusSchema.optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          });
        }

        // Get the lesson to verify access
        const existingLesson = await getLessonRepository().getById(input.id);
        if (!existingLesson) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Lesson not found',
          });
        }

        // Verify user has access to the project
        const project = await getProjectRepository().getById(existingLesson.projectId, ctx.user.id);
        if (!project) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'No access to this lesson',
          });
        }

        const { id, ...updateData } = input;
        const lesson = await getLessonRepository().update(id, updateData);

        return {
          success: true,
          data: lesson,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Failed to update lesson:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update lesson',
        });
      }
    }),

  /**
   * Delete a lesson
   */
  delete: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          });
        }

        // Get the lesson to verify access
        const lesson = await getLessonRepository().getById(input.id);
        if (!lesson) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Lesson not found',
          });
        }

        // Verify user has access to the project
        const project = await getProjectRepository().getById(lesson.projectId, ctx.user.id);
        if (!project) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'No access to this lesson',
          });
        }

        await getLessonRepository().delete(input.id);

        return {
          success: true,
          message: 'Lesson deleted successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Failed to delete lesson:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete lesson',
        });
      }
    }),

  /**
   * Update lesson sequence for drag-and-drop reordering
   */
  updateSequence: protectedProcedure
    .input(lessonSequenceUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          });
        }

        // Verify user has access to the project
        const project = await getProjectRepository().getById(input.projectId, ctx.user.id);
        if (!project) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'No access to the specified project',
          });
        }

        // Verify all lessons belong to the project
        for (const lessonId of input.lessonSequence) {
          const lesson = await getLessonRepository().getById(lessonId);
          if (!lesson || lesson.projectId !== input.projectId) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Lesson ${lessonId} does not belong to project ${input.projectId}`,
            });
          }
        }

        await getLessonRepository().updateSequence(input);

        return {
          success: true,
          message: 'Lesson sequence updated successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Failed to update lesson sequence:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update lesson sequence',
        });
      }
    }),

  /**
   * Update lesson sequence for bulk drag-and-drop reordering
   */
  bulkUpdateSequence: protectedProcedure
    .input(bulkLessonSequenceUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          });
        }

        // Verify user has access to the project
        const project = await getProjectRepository().getById(input.projectId, ctx.user.id);
        if (!project) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'No access to the specified project',
          });
        }

        // Verify all lessons belong to the project and user has access to selected lessons
        for (const lessonId of input.lessonSequence) {
          const lesson = await getLessonRepository().getById(lessonId);
          if (!lesson || lesson.projectId !== input.projectId) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Lesson ${lessonId} does not belong to project ${input.projectId}`,
            });
          }
        }

        // Verify selected lessons are subset of lesson sequence
        for (const selectedId of input.selectedLessons) {
          if (!input.lessonSequence.includes(selectedId)) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Selected lesson ${selectedId} is not in the lesson sequence`,
            });
          }
        }

        // Use the same update sequence method as single lesson reordering
        // The selected lessons parameter is for frontend state management
        // The actual reordering logic handles the full sequence
        await getLessonRepository().updateSequence({
          projectId: input.projectId,
          lessonSequence: input.lessonSequence,
        });

        return {
          success: true,
          message: 'Bulk lesson sequence updated successfully',
          data: {
            updatedCount: input.selectedLessons.length,
            totalSequence: input.lessonSequence.length,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Failed to update bulk lesson sequence:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update bulk lesson sequence',
        });
      }
    }),

  /**
   * Search lessons
   */
  search: protectedProcedure
    .input(z.object({
      query: z.string().min(1).max(100),
    }))
    .query(async ({ input, ctx }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          });
        }

        const lessons = await getLessonRepository().search(input.query, ctx.user.id);

        return {
          success: true,
          data: lessons,
        };
      } catch (error) {
        console.error('Failed to search lessons:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to search lessons',
        });
      }
    }),

  /**
   * Get lesson statistics for a project
   */
  getProjectStats: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          });
        }

        // Verify user has access to the project
        const project = await getProjectRepository().getById(input.projectId, ctx.user.id);
        if (!project) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'No access to the specified project',
          });
        }

        const stats = await getLessonRepository().getLessonStats(input.projectId);

        return {
          success: true,
          data: stats,
        };
      } catch (error) {
        console.error('Failed to get lesson stats:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get lesson statistics',
        });
      }
    }),

  /**
   * Duplicate a lesson
   */
  duplicate: protectedProcedure
    .input(z.object({
      lessonId: z.string().uuid(),
      targetProjectId: z.string().uuid(),
      newTitle: z.string().min(1).max(255).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          });
        }

        // Verify access to source lesson
        const sourceLesson = await getLessonRepository().getById(input.lessonId);
        if (!sourceLesson) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Source lesson not found',
          });
        }

        const sourceProject = await getProjectRepository().getById(sourceLesson.projectId, ctx.user.id);
        if (!sourceProject) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'No access to source lesson',
          });
        }

        // Verify access to target project
        const targetProject = await getProjectRepository().getById(input.targetProjectId, ctx.user.id);
        if (!targetProject) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'No access to target project',
          });
        }

        const duplicatedLesson = await getLessonRepository().duplicate(
          input.lessonId,
          input.targetProjectId,
          input.newTitle
        );

        return {
          success: true,
          data: duplicatedLesson,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Failed to duplicate lesson:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to duplicate lesson',
        });
      }
    }),

  /**
   * Move lesson to different project
   */
  moveToProject: protectedProcedure
    .input(z.object({
      lessonId: z.string().uuid(),
      targetProjectId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          });
        }

        // Verify access to source lesson
        const lesson = await getLessonRepository().getById(input.lessonId);
        if (!lesson) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Lesson not found',
          });
        }

        const sourceProject = await getProjectRepository().getById(lesson.projectId, ctx.user.id);
        if (!sourceProject) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'No access to source lesson',
          });
        }

        // Verify access to target project
        const targetProject = await getProjectRepository().getById(input.targetProjectId, ctx.user.id);
        if (!targetProject) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'No access to target project',
          });
        }

        const movedLesson = await getLessonRepository().moveToProject(
          input.lessonId,
          input.targetProjectId
        );

        return {
          success: true,
          data: movedLesson,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Failed to move lesson:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to move lesson',
        });
      }
    }),

  /**
   * Archive a lesson
   */
  archive: protectedProcedure
    .input(z.object({
      lessonId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          });
        }

        // Verify access to lesson
        const lesson = await getLessonRepository().getById(input.lessonId);
        if (!lesson) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Lesson not found',
          });
        }

        const project = await getProjectRepository().getById(lesson.projectId, ctx.user.id);
        if (!project) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'No access to this lesson',
          });
        }

        const archivedLesson = await getLessonRepository().archive(input.lessonId);

        return {
          success: true,
          data: archivedLesson,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Failed to archive lesson:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to archive lesson',
        });
      }
    }),
});