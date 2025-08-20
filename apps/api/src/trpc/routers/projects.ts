import { router, publicProcedure, protectedProcedure } from '../index';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { 
  createProjectSchema, 
  updateProjectSchema, 
  projectSettingsSchema 
} from '@instructly/shared';
import { ProjectRepository } from '../../services/projectRepository';

// Lazy-loaded repository to ensure environment variables are loaded first
let projectRepository: ProjectRepository;
const getProjectRepository = () => {
  if (!projectRepository) {
    projectRepository = new ProjectRepository();
  }
  return projectRepository;
};

export const projectsRouter = router({
  /**
   * Create a new project
   */
  create: protectedProcedure
    .input(createProjectSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Authentication required to create project',
          });
        }

        const project = await getProjectRepository().create({
          title: input.title,
          description: input.description,
          targetAudience: input.targetAudience,
          estimatedDuration: input.estimatedDuration,
          ownerId: ctx.user.id,
          settings: input.settings,
        });

        return {
          success: true,
          data: project,
        };
      } catch (error) {
        console.error('Failed to create project:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create project',
        });
      }
    }),

  /**
   * Get project by ID
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

        const project = await getProjectRepository().getById(input.id, ctx.user.id);
        
        if (!project) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Project not found or access denied',
          });
        }

        return {
          success: true,
          data: project,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Failed to get project:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get project',
        });
      }
    }),

  /**
   * Get all projects for the authenticated user
   */
  getUserProjects: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          });
        }

        const projects = await getProjectRepository().findByUserAccess(ctx.user.id);
        
        return {
          success: true,
          data: projects,
        };
      } catch (error) {
        console.error('Failed to get user projects:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get projects',
        });
      }
    }),

  /**
   * Update a project
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      title: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      targetAudience: z.string().max(500).optional(),
      estimatedDuration: z.number().positive().optional(),
      status: z.enum(['draft', 'in_progress', 'review', 'completed', 'archived']).optional(),
      collaborators: z.array(z.string().uuid()).optional(),
      settings: projectSettingsSchema.optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          });
        }

        const { id, ...updateData } = input;
        
        const project = await getProjectRepository().update(id, updateData, ctx.user.id);

        return {
          success: true,
          data: project,
        };
      } catch (error) {
        console.error('Failed to update project:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update project',
        });
      }
    }),

  /**
   * Delete a project
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

        await getProjectRepository().delete(input.id, ctx.user.id);

        return {
          success: true,
          message: 'Project deleted successfully',
        };
      } catch (error) {
        console.error('Failed to delete project:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete project',
        });
      }
    }),

  /**
   * Search projects
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

        const projects = await getProjectRepository().search(input.query, ctx.user.id);

        return {
          success: true,
          data: projects,
        };
      } catch (error) {
        console.error('Failed to search projects:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to search projects',
        });
      }
    }),

  /**
   * Get project statistics for dashboard
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          });
        }

        const stats = await getProjectRepository().getProjectStats(ctx.user.id);

        return {
          success: true,
          data: stats,
        };
      } catch (error) {
        console.error('Failed to get project stats:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get project statistics',
        });
      }
    }),

});