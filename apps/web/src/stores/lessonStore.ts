import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../api/src/trpc/routers';
import type { Lesson, Topic } from '@instructly/shared/types';

// Helper function to convert API response dates to proper Date objects
const convertLessonDates = (lesson: any): Lesson => ({
  ...lesson,
  createdAt: new Date(lesson.createdAt),
  updatedAt: new Date(lesson.updatedAt),
  topics: lesson.topics?.map((topic: any) => ({
    ...topic,
    generatedAt: new Date(topic.generatedAt)
  })) || [],
  generatedContent: lesson.generatedContent ? {
    ...lesson.generatedContent,
    generationMetadata: {
      ...lesson.generatedContent.generationMetadata,
      generationTime: new Date(lesson.generatedContent.generationMetadata.generationTime)
    }
  } : undefined,
  accessibilityCompliance: lesson.accessibilityCompliance ? {
    ...lesson.accessibilityCompliance,
    auditTrail: lesson.accessibilityCompliance.auditTrail?.map((entry: any) => ({
      ...entry,
      timestamp: new Date(entry.timestamp)
    })) || []
  } : {
    complianceLevel: 'AA' as const,
    overallScore: 0,
    violations: [],
    recommendations: [],
    auditTrail: []
  }
});

// Create vanilla tRPC client for use in stores (not React hooks)
const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3001/trpc'
        : 'https://instructly-api-czqc-iora8y4ru-coleens-projects-606beb08.vercel.app/api/trpc',
      headers() {
        const token = typeof window !== 'undefined' 
          ? localStorage.getItem('auth-token')
          : null;
          
        return token ? {
          authorization: `Bearer ${token}`,
        } : {};
      },
    }),
  ],
});

interface LessonState {
  // Lesson data
  lessons: Lesson[];
  lessonsByProject: Map<string, Lesson[]>;
  currentLesson: Lesson | null;
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isReordering: boolean;
  
  // Bulk operations
  isBulkOperating: boolean;
  bulkOperationProgress: number;
  
  // Error handling
  error: string | null;
  
  // Cache for optimistic updates
  optimisticUpdates: Map<string, Partial<Lesson>>;
  
  // Selection state
  selectedLessonIds: string[];
  
  // Last sync timestamp per project
  lastSyncByProject: Map<string, Date>;
  
  // Actions
  fetchLessonsForProject: (projectId: string) => Promise<void>;
  createLesson: (lessonData: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Lesson>;
  updateLesson: (id: string, updates: Partial<Lesson>) => Promise<Lesson>;
  deleteLesson: (id: string) => Promise<void>;
  reorderLessons: (projectId: string, lessonIds: string[]) => Promise<void>;
  
  // Bulk operations
  bulkDuplicateLessons: (lessonIds: string[]) => Promise<void>;
  bulkMoveLessons: (lessonIds: string[], targetProjectId: string) => Promise<void>;
  bulkArchiveLessons: (lessonIds: string[]) => Promise<void>;
  bulkDeleteLessons: (lessonIds: string[]) => Promise<void>;
  
  // Selection management
  selectLesson: (id: string) => void;
  deselectLesson: (id: string) => void;
  toggleLessonSelection: (id: string) => void;
  selectAllLessons: (projectId: string) => void;
  clearSelection: () => void;
  
  // Current lesson management
  setCurrentLesson: (lesson: Lesson | null) => void;
  
  // Topic management
  addTopicsToLesson: (lessonId: string, topics: Topic[]) => Promise<void>;
  removeTopicFromLesson: (lessonId: string, topicId: string) => Promise<void>;
  
  // Optimistic updates
  setOptimisticUpdate: (id: string, updates: Partial<Lesson>) => void;
  clearOptimisticUpdate: (id: string) => void;
  
  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Utility
  getLessonById: (id: string) => Lesson | undefined;
  getLessonsForProject: (projectId: string) => Lesson[];
  getLessonStats: (projectId?: string) => {
    total: number;
    byStatus: Record<Lesson['status'], number>;
    totalDuration: number;
    totalTopics: number;
  };
}

export const useLessonStore = create<LessonState>()(
  persist(
    (set, get) => ({
      // Initial state
      lessons: [],
      lessonsByProject: new Map(),
      currentLesson: null,
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      isReordering: false,
      isBulkOperating: false,
      bulkOperationProgress: 0,
      error: null,
      optimisticUpdates: new Map(),
      selectedLessonIds: [],
      lastSyncByProject: new Map(),

      // Actions
      fetchLessonsForProject: async (projectId) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await trpcClient.lessons.getByProject.query({ projectId });
          const rawLessons = Array.isArray(response) ? response : response.data || [];
          
          // Convert string dates to Date objects
          const lessons = rawLessons.map(convertLessonDates);
          
          set(state => {
            const newLessonsByProject = new Map(state.lessonsByProject);
            newLessonsByProject.set(projectId, lessons);
            
            const newLastSync = new Map(state.lastSyncByProject);
            newLastSync.set(projectId, new Date());
            
            // Update global lessons array
            const otherLessons = state.lessons.filter(l => l.projectId !== projectId);
            const allLessons = [...otherLessons, ...lessons];
            
            return {
              lessons: allLessons,
              lessonsByProject: newLessonsByProject,
              lastSyncByProject: newLastSync,
              isLoading: false,
              error: null,
            };
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch lessons';
          set({ 
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      createLesson: async (lessonData) => {
        set({ isCreating: true, error: null });
        
        try {
          const response = await trpcClient.lessons.create.mutate(lessonData);
          const rawLesson = response.data || response;
          
          // Convert string dates to Date objects
          const newLesson = convertLessonDates(rawLesson);
          
          set(state => {
            const newLessonsByProject = new Map(state.lessonsByProject);
            const projectLessons = newLessonsByProject.get(lessonData.projectId) || [];
            newLessonsByProject.set(lessonData.projectId, [...projectLessons, newLesson]);
            
            return {
              lessons: [...state.lessons, newLesson],
              lessonsByProject: newLessonsByProject,
              isCreating: false,
              error: null,
            };
          });
          
          return newLesson;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create lesson';
          set({ 
            isCreating: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      updateLesson: async (id, updates) => {
        set({ isUpdating: true, error: null });
        
        // Optimistic update
        const { setOptimisticUpdate } = get();
        setOptimisticUpdate(id, updates);
        
        try {
          const response = await trpcClient.lessons.update.mutate({ id, ...updates });
          const updatedLesson = convertLessonDates(response.data || response);
          
          set(state => {
            const newLessons = state.lessons.map(lesson => 
              lesson.id === id ? updatedLesson : lesson
            );
            
            // Update project-specific lessons
            const newLessonsByProject = new Map(state.lessonsByProject);
            for (const [projectId, projectLessons] of newLessonsByProject.entries()) {
              const updatedProjectLessons = projectLessons.map(lesson => 
                lesson.id === id ? updatedLesson : lesson
              );
              newLessonsByProject.set(projectId, updatedProjectLessons);
            }
            
            return {
              lessons: newLessons,
              lessonsByProject: newLessonsByProject,
              currentLesson: state.currentLesson?.id === id ? updatedLesson : state.currentLesson,
              isUpdating: false,
              error: null,
            };
          });
          
          // Clear optimistic update
          const { clearOptimisticUpdate } = get();
          clearOptimisticUpdate(id);
          
          return updatedLesson;
        } catch (error) {
          // Rollback optimistic update
          const { clearOptimisticUpdate } = get();
          clearOptimisticUpdate(id);
          
          const errorMessage = error instanceof Error ? error.message : 'Failed to update lesson';
          set({ 
            isUpdating: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      deleteLesson: async (id) => {
        set({ isDeleting: true, error: null });
        
        // Store original lesson for rollback
        const { lessons } = get();
        const originalLesson = lessons.find(l => l.id === id);
        
        // Optimistic delete
        set(state => {
          const newLessons = state.lessons.filter(lesson => lesson.id !== id);
          
          const newLessonsByProject = new Map(state.lessonsByProject);
          for (const [projectId, projectLessons] of newLessonsByProject.entries()) {
            const filteredLessons = projectLessons.filter(lesson => lesson.id !== id);
            newLessonsByProject.set(projectId, filteredLessons);
          }
          
          return {
            lessons: newLessons,
            lessonsByProject: newLessonsByProject,
            currentLesson: state.currentLesson?.id === id ? null : state.currentLesson,
            selectedLessonIds: state.selectedLessonIds.filter(lessonId => lessonId !== id),
          };
        });
        
        try {
          await trpcClient.lessons.delete.mutate({ id });
          
          set({ 
            isDeleting: false,
            error: null,
          });
        } catch (error) {
          // Rollback optimistic delete
          if (originalLesson) {
            set(state => {
              const newLessonsByProject = new Map(state.lessonsByProject);
              const projectLessons = newLessonsByProject.get(originalLesson.projectId) || [];
              newLessonsByProject.set(originalLesson.projectId, [...projectLessons, originalLesson]);
              
              return {
                lessons: [...state.lessons, originalLesson],
                lessonsByProject: newLessonsByProject,
              };
            });
          }
          
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete lesson';
          set({ 
            isDeleting: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      reorderLessons: async (projectId, lessonIds) => {
        set({ isReordering: true, error: null });
        
        try {
          await trpcClient.lessons.updateSequence.mutate({ projectId, lessonSequence: lessonIds });
          
          // Update local state to reflect new order
          set(state => {
            const projectLessons = state.lessonsByProject.get(projectId) || [];
            const reorderedLessons = lessonIds.map(id => 
              projectLessons.find(lesson => lesson.id === id)
            ).filter(Boolean) as Lesson[];
            
            const newLessonsByProject = new Map(state.lessonsByProject);
            newLessonsByProject.set(projectId, reorderedLessons);
            
            // Update global lessons array
            const otherLessons = state.lessons.filter(l => l.projectId !== projectId);
            const allLessons = [...otherLessons, ...reorderedLessons];
            
            return {
              lessons: allLessons,
              lessonsByProject: newLessonsByProject,
              isReordering: false,
              error: null,
            };
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to reorder lessons';
          set({ 
            isReordering: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      // Bulk operations
      bulkDuplicateLessons: async (lessonIds) => {
        set({ isBulkOperating: true, bulkOperationProgress: 0, error: null });
        
        try {
          // TODO: Implement proper bulk duplicate functionality
          // For now, throw an error as this needs proper implementation
          throw new Error('Bulk duplicate not yet implemented');
          
          // Refresh lessons for affected projects
          const { lessons } = get();
          const affectedProjectIds = [...new Set(
            lessons.filter(l => lessonIds.includes(l.id)).map(l => l.projectId)
          )];
          
          for (const projectId of affectedProjectIds) {
            await get().fetchLessonsForProject(projectId);
          }
          
          set({ 
            isBulkOperating: false,
            bulkOperationProgress: 100,
            selectedLessonIds: [],
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate lessons';
          set({ 
            isBulkOperating: false,
            bulkOperationProgress: 0,
            error: errorMessage,
          });
          throw error;
        }
      },

      bulkMoveLessons: async (lessonIds, targetProjectId) => {
        set({ isBulkOperating: true, bulkOperationProgress: 0, error: null });
        
        try {
          // TODO: Implement proper bulk move functionality
          // For now, throw an error as this needs proper implementation
          throw new Error('Bulk move not yet implemented');
          
          // Refresh lessons for affected projects
          const { lessons } = get();
          const sourceProjectIds = [...new Set(
            lessons.filter(l => lessonIds.includes(l.id)).map(l => l.projectId)
          )];
          const affectedProjectIds = [...new Set([...sourceProjectIds, targetProjectId])];
          
          for (const projectId of affectedProjectIds) {
            await get().fetchLessonsForProject(projectId);
          }
          
          set({ 
            isBulkOperating: false,
            bulkOperationProgress: 100,
            selectedLessonIds: [],
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to move lessons';
          set({ 
            isBulkOperating: false,
            bulkOperationProgress: 0,
            error: errorMessage,
          });
          throw error;
        }
      },

      bulkArchiveLessons: async (lessonIds) => {
        set({ isBulkOperating: true, bulkOperationProgress: 0, error: null });
        
        try {
          // TODO: Implement proper bulk archive functionality
          // For now, throw an error as this needs proper implementation
          throw new Error('Bulk archive not yet implemented');
          
          // Update lessons status to archived
          set(state => {
            const newLessons = state.lessons.map(lesson => 
              lessonIds.includes(lesson.id) 
                ? { ...lesson, status: 'approved' as Lesson['status'] }
                : lesson
            );
            
            const newLessonsByProject = new Map(state.lessonsByProject);
            for (const [projectId, projectLessons] of newLessonsByProject.entries()) {
              const updatedProjectLessons = projectLessons.map(lesson => 
                lessonIds.includes(lesson.id) 
                  ? { ...lesson, status: 'approved' as Lesson['status'] }
                  : lesson
              );
              newLessonsByProject.set(projectId, updatedProjectLessons);
            }
            
            return {
              lessons: newLessons,
              lessonsByProject: newLessonsByProject,
              isBulkOperating: false,
              bulkOperationProgress: 100,
              selectedLessonIds: [],
              error: null,
            };
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to archive lessons';
          set({ 
            isBulkOperating: false,
            bulkOperationProgress: 0,
            error: errorMessage,
          });
          throw error;
        }
      },

      bulkDeleteLessons: async (lessonIds) => {
        set({ isBulkOperating: true, bulkOperationProgress: 0, error: null });
        
        // Store original lessons for rollback
        const { lessons } = get();
        const originalLessons = lessons.filter(l => lessonIds.includes(l.id));
        
        // Optimistic delete
        set(state => {
          const newLessons = state.lessons.filter(lesson => !lessonIds.includes(lesson.id));
          
          const newLessonsByProject = new Map(state.lessonsByProject);
          for (const [projectId, projectLessons] of newLessonsByProject.entries()) {
            const filteredLessons = projectLessons.filter(lesson => !lessonIds.includes(lesson.id));
            newLessonsByProject.set(projectId, filteredLessons);
          }
          
          return {
            lessons: newLessons,
            lessonsByProject: newLessonsByProject,
            selectedLessonIds: state.selectedLessonIds.filter(id => !lessonIds.includes(id)),
          };
        });
        
        try {
          // TODO: Implement proper bulk delete functionality
          // For now, throw an error as this needs proper implementation
          throw new Error('Bulk delete not yet implemented');
          
          set({ 
            isBulkOperating: false,
            bulkOperationProgress: 100,
            error: null,
          });
        } catch (error) {
          // Rollback optimistic delete
          set(state => {
            const newLessonsByProject = new Map(state.lessonsByProject);
            originalLessons.forEach(lesson => {
              const projectLessons = newLessonsByProject.get(lesson.projectId) || [];
              newLessonsByProject.set(lesson.projectId, [...projectLessons, lesson]);
            });
            
            return {
              lessons: [...state.lessons, ...originalLessons],
              lessonsByProject: newLessonsByProject,
            };
          });
          
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete lessons';
          set({ 
            isBulkOperating: false,
            bulkOperationProgress: 0,
            error: errorMessage,
          });
          throw error;
        }
      },

      // Selection management
      selectLesson: (id) => {
        set(state => ({
          selectedLessonIds: state.selectedLessonIds.includes(id) 
            ? state.selectedLessonIds 
            : [...state.selectedLessonIds, id]
        }));
      },

      deselectLesson: (id) => {
        set(state => ({
          selectedLessonIds: state.selectedLessonIds.filter(lessonId => lessonId !== id)
        }));
      },

      toggleLessonSelection: (id) => {
        set(state => ({
          selectedLessonIds: state.selectedLessonIds.includes(id)
            ? state.selectedLessonIds.filter(lessonId => lessonId !== id)
            : [...state.selectedLessonIds, id]
        }));
      },

      selectAllLessons: (projectId) => {
        const { lessonsByProject } = get();
        const projectLessons = lessonsByProject.get(projectId) || [];
        const projectLessonIds = projectLessons.map(lesson => lesson.id);
        
        set({ selectedLessonIds: projectLessonIds });
      },

      clearSelection: () => {
        set({ selectedLessonIds: [] });
      },

      setCurrentLesson: (lesson) => {
        set({ currentLesson: lesson });
      },

      // Topic management
      addTopicsToLesson: async (lessonId, topics) => {
        const { updateLesson } = get();
        const lesson = get().getLessonById(lessonId);
        
        if (lesson) {
          await updateLesson(lessonId, {
            topics: [...lesson.topics, ...topics],
            status: 'generating',
          });
        }
      },

      removeTopicFromLesson: async (lessonId, topicId) => {
        const { updateLesson } = get();
        const lesson = get().getLessonById(lessonId);
        
        if (lesson) {
          await updateLesson(lessonId, {
            topics: lesson.topics.filter(topic => topic.id !== topicId),
          });
        }
      },

      setOptimisticUpdate: (id, updates) => {
        set(state => {
          const newOptimisticUpdates = new Map(state.optimisticUpdates);
          newOptimisticUpdates.set(id, { 
            ...newOptimisticUpdates.get(id),
            ...updates 
          });
          
          return {
            optimisticUpdates: newOptimisticUpdates,
            lessons: state.lessons.map(lesson => 
              lesson.id === id 
                ? { ...lesson, ...newOptimisticUpdates.get(id) }
                : lesson
            ),
          };
        });
      },

      clearOptimisticUpdate: (id) => {
        set(state => {
          const newOptimisticUpdates = new Map(state.optimisticUpdates);
          newOptimisticUpdates.delete(id);
          
          return {
            optimisticUpdates: newOptimisticUpdates,
          };
        });
      },

      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      getLessonById: (id) => {
        const { lessons } = get();
        return lessons.find(lesson => lesson.id === id);
      },

      getLessonsForProject: (projectId) => {
        const { lessonsByProject } = get();
        return lessonsByProject.get(projectId) || [];
      },

      getLessonStats: (projectId) => {
        const { lessons, lessonsByProject } = get();
        const targetLessons = projectId 
          ? lessonsByProject.get(projectId) || []
          : lessons;
        
        const stats = {
          total: targetLessons.length,
          byStatus: {
            draft: 0,
            generating: 0,
            generated: 0,
            reviewed: 0,
            approved: 0,
          } as Record<Lesson['status'], number>,
          totalDuration: 0,
          totalTopics: 0,
        };
        
        targetLessons.forEach(lesson => {
          stats.byStatus[lesson.status]++;
          stats.totalDuration += lesson.estimatedDuration;
          stats.totalTopics += lesson.topics.length;
        });
        
        return stats;
      },
    }),
    {
      name: 'lesson-store',
      partialize: (state) => ({
        lessons: state.lessons,
        lessonsByProject: Array.from(state.lessonsByProject.entries()),
        currentLesson: state.currentLesson,
        selectedLessonIds: state.selectedLessonIds,
        lastSyncByProject: Array.from(state.lastSyncByProject.entries()),
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert arrays back to Maps
          state.lessonsByProject = new Map(state.lessonsByProject as any);
          state.lastSyncByProject = new Map(state.lastSyncByProject as any);
          state.optimisticUpdates = new Map();
        }
      },
    }
  )
);