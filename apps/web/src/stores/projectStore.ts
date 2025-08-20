import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../api/src/trpc/routers';
import type { Project, Lesson } from '@instructly/shared/types';

// Create vanilla tRPC client for use in stores (not React hooks)
const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3001/trpc'
        : 'https://instructly-api-czqc.vercel.app/api/trpc',
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

interface ProjectState {
  // Project data
  projects: Project[];
  currentProject: Project | null;
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Error handling
  error: string | null;
  
  // Cache for optimistic updates
  optimisticUpdates: Map<string, Partial<Project>>;
  
  // Last sync timestamp
  lastSync: Date | null;
  
  // Actions
  fetchProjects: () => Promise<void>;
  createProject: (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  
  // Optimistic updates
  setOptimisticUpdate: (id: string, updates: Partial<Project>) => void;
  clearOptimisticUpdate: (id: string) => void;
  
  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Utility
  getProjectById: (id: string) => Project | undefined;
  getProjectStats: () => {
    total: number;
    byStatus: Record<Project['status'], number>;
    totalDuration: number;
  };
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      // Initial state
      projects: [],
      currentProject: null,
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      error: null,
      optimisticUpdates: new Map(),
      lastSync: null,

      // Actions
      fetchProjects: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await trpcClient.projects.getUserProjects.query();
          const rawProjects = Array.isArray(response) ? response : response.data || [];
          
          // Convert string dates to Date objects
          const projects = rawProjects.map((project: any) => ({
            ...project,
            createdAt: new Date(project.createdAt),
            updatedAt: new Date(project.updatedAt)
          }));
          
          set({ 
            projects,
            isLoading: false,
            lastSync: new Date(),
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch projects';
          set({ 
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      createProject: async (projectData) => {
        set({ isCreating: true, error: null });
        
        try {
          const response = await trpcClient.projects.create.mutate(projectData);
          const rawProject = response.data || response;
          
          // Convert string dates to Date objects
          const newProject = {
            ...rawProject,
            createdAt: new Date(rawProject.createdAt),
            updatedAt: new Date(rawProject.updatedAt)
          };
          
          set(state => ({
            projects: [...state.projects, newProject],
            isCreating: false,
            error: null,
          }));
          
          return newProject;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
          set({ 
            isCreating: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      updateProject: async (id, updates) => {
        set({ isUpdating: true, error: null });
        
        // Optimistic update
        const { setOptimisticUpdate } = get();
        setOptimisticUpdate(id, updates);
        
        try {
          const response = await trpcClient.projects.update.mutate({ id, ...updates });
          const rawProject = response.data || response;
          
          // Convert string dates to Date objects
          const updatedProject = {
            ...rawProject,
            createdAt: new Date(rawProject.createdAt),
            updatedAt: new Date(rawProject.updatedAt)
          };
          
          set(state => ({
            projects: state.projects.map(project => 
              project.id === id ? updatedProject : project
            ),
            currentProject: state.currentProject?.id === id ? updatedProject : state.currentProject,
            isUpdating: false,
            error: null,
          }));
          
          // Clear optimistic update
          const { clearOptimisticUpdate } = get();
          clearOptimisticUpdate(id);
          
          return updatedProject;
        } catch (error) {
          // Rollback optimistic update
          const { clearOptimisticUpdate } = get();
          clearOptimisticUpdate(id);
          
          const errorMessage = error instanceof Error ? error.message : 'Failed to update project';
          set({ 
            isUpdating: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      deleteProject: async (id) => {
        set({ isDeleting: true, error: null });
        
        // Store original project for rollback
        const { projects } = get();
        const originalProject = projects.find(p => p.id === id);
        
        // Optimistic delete
        set(state => ({
          projects: state.projects.filter(project => project.id !== id),
          currentProject: state.currentProject?.id === id ? null : state.currentProject,
        }));
        
        try {
          await trpcClient.projects.delete.mutate({ id });
          
          set({ 
            isDeleting: false,
            error: null,
          });
        } catch (error) {
          // Rollback optimistic delete
          if (originalProject) {
            set(state => ({
              projects: [...state.projects, originalProject],
            }));
          }
          
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete project';
          set({ 
            isDeleting: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      setCurrentProject: (project) => {
        set({ currentProject: project });
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
            projects: state.projects.map(project => 
              project.id === id 
                ? { ...project, ...newOptimisticUpdates.get(id) }
                : project
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

      getProjectById: (id) => {
        const { projects } = get();
        return projects.find(project => project.id === id);
      },

      getProjectStats: () => {
        const { projects } = get();
        
        const stats = {
          total: projects.length,
          byStatus: {
            draft: 0,
            in_progress: 0,
            review: 0,
            completed: 0,
            archived: 0,
          } as Record<Project['status'], number>,
          totalDuration: 0,
        };
        
        projects.forEach(project => {
          stats.byStatus[project.status]++;
          stats.totalDuration += project.estimatedDuration;
        });
        
        return stats;
      },
    }),
    {
      name: 'project-store',
      partialize: (state) => ({
        projects: state.projects,
        currentProject: state.currentProject,
        lastSync: state.lastSync,
      }),
    }
  )
);