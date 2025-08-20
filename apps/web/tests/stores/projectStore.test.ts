import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { useProjectStore } from '../../src/stores/projectStore';
import type { Project } from '@instructly/shared/types';

// Mock tRPC client (using vi.hoisted to avoid hoisting issues)
const mockTRPCClient = vi.hoisted(() => ({
  projects: {
    getUserProjects: {
      query: vi.fn(),
    },
    create: {
      mutate: vi.fn(),
    },
    update: {
      mutate: vi.fn(),
    },
    delete: {
      mutate: vi.fn(),
    },
  },
}));

vi.mock('@trpc/client', () => ({
  createTRPCProxyClient: vi.fn(() => mockTRPCClient),
  httpBatchLink: vi.fn(() => ({})),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Project Store', () => {
  const mockProjects: Project[] = [
    {
      id: '1',
      title: 'React Training Program',
      description: 'Comprehensive React training',
      targetAudience: 'Developers',
      estimatedDuration: 480,
      status: 'in_progress',
      ownerId: 'user-1',
      collaborators: [],
      settings: {
        brandingOptions: { organizationName: 'Test Org' },
        defaultAccessibilityLevel: 'AA',
        approvalWorkflow: false,
        stakeholderAccess: false,
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      title: 'Vue.js Basics',
      description: 'Introduction to Vue',
      targetAudience: 'Frontend Developers',
      estimatedDuration: 240,
      status: 'completed',
      ownerId: 'user-1',
      collaborators: [],
      settings: {
        brandingOptions: { organizationName: 'Test Org' },
        defaultAccessibilityLevel: 'AA',
        approvalWorkflow: false,
        stakeholderAccess: false,
      },
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
  ];

  beforeEach(() => {
    // Reset store state
    useProjectStore.setState({
      projects: [],
      currentProject: null,
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      error: null,
      optimisticUpdates: new Map(),
      lastSync: null,
    });

    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchProjects', () => {
    it('fetches projects successfully', async () => {
      mockTRPCClient.projects.getUserProjects.query.mockResolvedValue(mockProjects);

      const { fetchProjects } = useProjectStore.getState();
      await fetchProjects();

      const state = useProjectStore.getState();
      expect(state.projects).toEqual(mockProjects);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.lastSync).toBeInstanceOf(Date);
    });

    it('handles fetch error', async () => {
      const errorMessage = 'Failed to fetch projects';
      mockTRPCClient.projects.getUserProjects.query.mockRejectedValue(new Error(errorMessage));

      const { fetchProjects } = useProjectStore.getState();
      
      await expect(fetchProjects()).rejects.toThrow(errorMessage);

      const state = useProjectStore.getState();
      expect(state.projects).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it('sets loading state during fetch', async () => {
      let resolvePromise: (value: Project[]) => void;
      const fetchPromise = new Promise<Project[]>((resolve) => {
        resolvePromise = resolve;
      });
      
      mockTRPCClient.projects.getUserProjects.query.mockReturnValue(fetchPromise);

      const { fetchProjects } = useProjectStore.getState();
      const fetchCall = fetchProjects();

      // Should be loading
      expect(useProjectStore.getState().isLoading).toBe(true);

      resolvePromise!(mockProjects);
      await fetchCall;

      // Should no longer be loading
      expect(useProjectStore.getState().isLoading).toBe(false);
    });
  });

  describe('createProject', () => {
    const newProjectData = {
      title: 'New Project',
      description: 'New project description',
      targetAudience: 'Students',
      estimatedDuration: 360,
      status: 'draft' as Project['status'],
      ownerId: 'user-1',
      collaborators: [],
      settings: {
        brandingOptions: {},
        defaultAccessibilityLevel: 'AA' as const,
        approvalWorkflow: false,
        stakeholderAccess: false,
      },
    };

    const createdProject: Project = {
      ...newProjectData,
      id: '3',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('creates project successfully', async () => {
      mockTRPCClient.projects.create.mutate.mockResolvedValue(createdProject);

      const { createProject } = useProjectStore.getState();
      const result = await createProject(newProjectData);

      expect(result).toEqual(createdProject);

      const state = useProjectStore.getState();
      expect(state.projects).toContain(createdProject);
      expect(state.isCreating).toBe(false);
      expect(state.error).toBe(null);
    });

    it('handles create error', async () => {
      const errorMessage = 'Failed to create project';
      mockTRPCClient.projects.create.mutate.mockRejectedValue(new Error(errorMessage));

      const { createProject } = useProjectStore.getState();
      
      await expect(createProject(newProjectData)).rejects.toThrow(errorMessage);

      const state = useProjectStore.getState();
      expect(state.projects).toEqual([]);
      expect(state.isCreating).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('updateProject', () => {
    beforeEach(() => {
      useProjectStore.setState({ projects: mockProjects });
    });

    it('updates project successfully', async () => {
      const updates = { title: 'Updated Title' };
      const updatedProject = { ...mockProjects[0], ...updates };
      
      mockTRPCClient.projects.update.mutate.mockResolvedValue(updatedProject);

      const { updateProject } = useProjectStore.getState();
      const result = await updateProject('1', updates);

      expect(result).toEqual(updatedProject);

      const state = useProjectStore.getState();
      const project = state.projects.find(p => p.id === '1');
      expect(project?.title).toBe('Updated Title');
      expect(state.isUpdating).toBe(false);
      expect(state.error).toBe(null);
    });

    it('handles update error and rolls back optimistic update', async () => {
      const updates = { title: 'Updated Title' };
      const errorMessage = 'Failed to update project';
      
      mockTRPCClient.projects.update.mutate.mockRejectedValue(new Error(errorMessage));

      const { updateProject } = useProjectStore.getState();
      
      await expect(updateProject('1', updates)).rejects.toThrow(errorMessage);

      const state = useProjectStore.getState();
      const project = state.projects.find(p => p.id === '1');
      expect(project?.title).toBe(mockProjects[0].title); // Should be rolled back
      expect(state.isUpdating).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('deleteProject', () => {
    beforeEach(() => {
      useProjectStore.setState({ projects: mockProjects, currentProject: mockProjects[0] });
    });

    it('deletes project successfully', async () => {
      mockTRPCClient.projects.delete.mutate.mockResolvedValue(undefined);

      const { deleteProject } = useProjectStore.getState();
      await deleteProject('1');

      const state = useProjectStore.getState();
      expect(state.projects.find(p => p.id === '1')).toBeUndefined();
      expect(state.currentProject).toBe(null); // Should clear current project if deleted
      expect(state.isDeleting).toBe(false);
      expect(state.error).toBe(null);
    });

    it('handles delete error and rolls back optimistic delete', async () => {
      const errorMessage = 'Failed to delete project';
      mockTRPCClient.projects.delete.mutate.mockRejectedValue(new Error(errorMessage));

      const { deleteProject } = useProjectStore.getState();
      
      await expect(deleteProject('1')).rejects.toThrow(errorMessage);

      const state = useProjectStore.getState();
      expect(state.projects.find(p => p.id === '1')).toBeDefined(); // Should be restored
      expect(state.isDeleting).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('utility functions', () => {
    beforeEach(() => {
      useProjectStore.setState({ projects: mockProjects });
    });

    it('gets project by ID', () => {
      const { getProjectById } = useProjectStore.getState();
      const project = getProjectById('1');
      
      expect(project).toEqual(mockProjects[0]);
    });

    it('returns undefined for non-existent project ID', () => {
      const { getProjectById } = useProjectStore.getState();
      const project = getProjectById('non-existent');
      
      expect(project).toBeUndefined();
    });

    it('calculates project statistics correctly', () => {
      const { getProjectStats } = useProjectStore.getState();
      const stats = getProjectStats();
      
      expect(stats.total).toBe(2);
      expect(stats.byStatus.in_progress).toBe(1);
      expect(stats.byStatus.completed).toBe(1);
      expect(stats.byStatus.draft).toBe(0);
      expect(stats.totalDuration).toBe(720); // 480 + 240
    });
  });

  describe('optimistic updates', () => {
    beforeEach(() => {
      useProjectStore.setState({ projects: mockProjects });
    });

    it('applies optimistic update', () => {
      const { setOptimisticUpdate } = useProjectStore.getState();
      setOptimisticUpdate('1', { title: 'Optimistic Title' });

      const state = useProjectStore.getState();
      const project = state.projects.find(p => p.id === '1');
      expect(project?.title).toBe('Optimistic Title');
      expect(state.optimisticUpdates.has('1')).toBe(true);
    });

    it('clears optimistic update', () => {
      const { setOptimisticUpdate, clearOptimisticUpdate } = useProjectStore.getState();
      
      setOptimisticUpdate('1', { title: 'Optimistic Title' });
      clearOptimisticUpdate('1');

      const state = useProjectStore.getState();
      expect(state.optimisticUpdates.has('1')).toBe(false);
    });
  });

  describe('current project management', () => {
    it('sets current project', () => {
      const { setCurrentProject } = useProjectStore.getState();
      setCurrentProject(mockProjects[0]);

      const state = useProjectStore.getState();
      expect(state.currentProject).toEqual(mockProjects[0]);
    });

    it('clears current project', () => {
      useProjectStore.setState({ currentProject: mockProjects[0] });
      
      const { setCurrentProject } = useProjectStore.getState();
      setCurrentProject(null);

      const state = useProjectStore.getState();
      expect(state.currentProject).toBe(null);
    });
  });

  describe('error handling', () => {
    it('sets error', () => {
      const { setError } = useProjectStore.getState();
      setError('Test error');

      const state = useProjectStore.getState();
      expect(state.error).toBe('Test error');
    });

    it('clears error', () => {
      useProjectStore.setState({ error: 'Test error' });
      
      const { clearError } = useProjectStore.getState();
      clearError();

      const state = useProjectStore.getState();
      expect(state.error).toBe(null);
    });
  });
});