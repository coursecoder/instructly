import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { lessonsRouter } from '../../src/trpc/routers/lessons';
import { TRPCError } from '@trpc/server';

// Mock repositories
const mockLessonRepository = {
  getById: vi.fn(),
  updateSequence: vi.fn(),
};

const mockProjectRepository = {
  getById: vi.fn(),
};

// Mock the repository factory functions
vi.mock('../../src/services/lessonRepository', () => ({
  LessonRepository: vi.fn(() => mockLessonRepository),
}));

vi.mock('../../src/services/projectRepository', () => ({
  ProjectRepository: vi.fn(() => mockProjectRepository),
}));

// Mock context with authenticated user
const mockContext = {
  user: {
    id: 'user-1',
    email: 'test@example.com',
    role: 'designer',
  },
  session: {
    access_token: 'mock-token',
  },
  req: {},
  res: {},
};

describe('Lessons Router - Bulk Reordering', () => {
  const mockProject = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Test Project',
    ownerId: '550e8400-e29b-41d4-a716-446655440001',
  };

  const mockLessons = [
    {
      id: '550e8400-e29b-41d4-a716-446655440010',
      title: 'First Lesson',
      projectId: '550e8400-e29b-41d4-a716-446655440000',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440020', 
      title: 'Second Lesson',
      projectId: '550e8400-e29b-41d4-a716-446655440000',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440030',
      title: 'Third Lesson', 
      projectId: '550e8400-e29b-41d4-a716-446655440000',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default successful mocks
    mockProjectRepository.getById.mockResolvedValue(mockProject);
    mockLessonRepository.getById.mockImplementation((id: string) => {
      return Promise.resolve(mockLessons.find(lesson => lesson.id === id));
    });
    mockLessonRepository.updateSequence.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('bulkUpdateSequence', () => {
    it('successfully updates sequence for bulk reordering', async () => {
      const input = {
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        lessonSequence: ['550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440030'],
        selectedLessons: ['550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440020'],
      };

      const caller = lessonsRouter.createCaller(mockContext);
      const result = await caller.bulkUpdateSequence(input);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Bulk lesson sequence updated successfully');
      expect(result.data).toEqual({
        updatedCount: 2,
        totalSequence: 3,
      });

      // Verify repository calls
      expect(mockProjectRepository.getById).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000', 'user-1');
      expect(mockLessonRepository.getById).toHaveBeenCalledTimes(3); // Once for each lesson
      expect(mockLessonRepository.updateSequence).toHaveBeenCalledWith({
        projectId: 'project-1',
        lessonSequence: ['lesson-2', 'lesson-1', 'lesson-3'],
      });
    });

    it('throws UNAUTHORIZED when user is not authenticated', async () => {
      const input = {
        projectId: 'project-1',
        lessonSequence: ['lesson-1', 'lesson-2'],
        selectedLessons: ['lesson-1'],
      };

      const unauthenticatedContext = { ...mockContext, user: null };
      const caller = lessonsRouter.createCaller(unauthenticatedContext);

      await expect(caller.bulkUpdateSequence(input)).rejects.toThrow(
        new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' })
      );

      expect(mockProjectRepository.getById).not.toHaveBeenCalled();
      expect(mockLessonRepository.updateSequence).not.toHaveBeenCalled();
    });

    it('throws FORBIDDEN when user has no access to project', async () => {
      mockProjectRepository.getById.mockResolvedValue(null);

      const input = {
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        lessonSequence: ['550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440020'],
        selectedLessons: ['550e8400-e29b-41d4-a716-446655440010'],
      };

      const caller = lessonsRouter.createCaller(mockContext);

      await expect(caller.bulkUpdateSequence(input)).rejects.toThrow(
        new TRPCError({ 
          code: 'FORBIDDEN', 
          message: 'No access to the specified project' 
        })
      );

      expect(mockProjectRepository.getById).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000', 'user-1');
      expect(mockLessonRepository.updateSequence).not.toHaveBeenCalled();
    });

    it('throws BAD_REQUEST when lesson does not belong to project', async () => {
      const wrongProjectLesson = {
        id: 'lesson-wrong',
        title: 'Wrong Project Lesson',
        projectId: 'other-project',
      };
      
      mockLessonRepository.getById.mockImplementation((id: string) => {
        if (id === 'lesson-wrong') return Promise.resolve(wrongProjectLesson);
        return Promise.resolve(mockLessons.find(lesson => lesson.id === id));
      });

      const input = {
        projectId: 'project-1',
        lessonSequence: ['lesson-1', 'lesson-wrong'],
        selectedLessons: ['lesson-1', 'lesson-wrong'],
      };

      const caller = lessonsRouter.createCaller(mockContext);

      await expect(caller.bulkUpdateSequence(input)).rejects.toThrow(
        new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Lesson lesson-wrong does not belong to project project-1',
        })
      );

      expect(mockLessonRepository.updateSequence).not.toHaveBeenCalled();
    });

    it('throws BAD_REQUEST when selected lesson is not in sequence', async () => {
      const input = {
        projectId: 'project-1',
        lessonSequence: ['lesson-1', 'lesson-2'],
        selectedLessons: ['lesson-1', 'lesson-3'], // lesson-3 not in sequence
      };

      const caller = lessonsRouter.createCaller(mockContext);

      await expect(caller.bulkUpdateSequence(input)).rejects.toThrow(
        new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Selected lesson lesson-3 is not in the lesson sequence',
        })
      );

      expect(mockLessonRepository.updateSequence).not.toHaveBeenCalled();
    });

    it('handles empty selected lessons array', async () => {
      const input = {
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        lessonSequence: ['550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440030'],
        selectedLessons: [], // Empty selection
      };

      const caller = lessonsRouter.createCaller(mockContext);
      const result = await caller.bulkUpdateSequence(input);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        updatedCount: 0,
        totalSequence: 3,
      });

      expect(mockLessonRepository.updateSequence).toHaveBeenCalledWith({
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        lessonSequence: ['550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440030'],
      });
    });

    it('handles repository errors gracefully', async () => {
      mockLessonRepository.updateSequence.mockRejectedValue(
        new Error('Database connection failed')
      );

      const input = {
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        lessonSequence: ['550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440020'],
        selectedLessons: ['550e8400-e29b-41d4-a716-446655440010'],
      };

      const caller = lessonsRouter.createCaller(mockContext);

      await expect(caller.bulkUpdateSequence(input)).rejects.toThrow(
        new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update bulk lesson sequence',
        })
      );
    });

    it('validates input schema correctly', async () => {
      const invalidInput = {
        projectId: 'not-a-uuid',
        lessonSequence: ['invalid-uuid'],
        selectedLessons: [],
      };

      const caller = lessonsRouter.createCaller(mockContext);

      // This should fail validation before reaching the handler
      await expect(caller.bulkUpdateSequence(invalidInput as any)).rejects.toThrow();
    });

    it('works with single lesson selection', async () => {
      const input = {
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        lessonSequence: ['550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440030'],
        selectedLessons: ['550e8400-e29b-41d4-a716-446655440010'], // Single lesson
      };

      const caller = lessonsRouter.createCaller(mockContext);
      const result = await caller.bulkUpdateSequence(input);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        updatedCount: 1,
        totalSequence: 3,
      });
    });

    it('maintains transaction consistency', async () => {
      // Verify that updateSequence is called with the complete lesson sequence
      // This ensures the database update is atomic
      const input = {
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        lessonSequence: ['550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440020'],
        selectedLessons: ['550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440030'],
      };

      const caller = lessonsRouter.createCaller(mockContext);
      await caller.bulkUpdateSequence(input);

      expect(mockLessonRepository.updateSequence).toHaveBeenCalledWith({
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        lessonSequence: ['550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440020'],
      });
      expect(mockLessonRepository.updateSequence).toHaveBeenCalledTimes(1);
    });
  });
});