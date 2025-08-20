import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { User, HealthCheckResponse } from '@instructly/shared';

// App state interface
interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  
  // System state
  systemHealth: HealthCheckResponse | null;
  lastHealthCheck: Date | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setSystemHealth: (health: HealthCheckResponse) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Create Zustand store with proper TypeScript typing
export const useAppStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    user: null,
    isAuthenticated: false,
    systemHealth: null,
    lastHealthCheck: null,
    isLoading: false,
    error: null,
    
    // Actions
    setUser: (user) => set((state) => ({
      user,
      isAuthenticated: !!user,
    })),
    
    setSystemHealth: (health) => set({
      systemHealth: health,
      lastHealthCheck: new Date(),
    }),
    
    setLoading: (loading) => set({ isLoading: loading }),
    
    setError: (error) => set({ 
      error,
      isLoading: false,
    }),
    
    clearError: () => set({ error: null }),
  }))
);

// Selectors for better performance and reusability
export const useUser = () => useAppStore((state) => state.user);
export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated);
export const useSystemHealth = () => useAppStore((state) => state.systemHealth);
export const useAppLoading = () => useAppStore((state) => state.isLoading);
export const useAppError = () => useAppStore((state) => state.error);

// Actions for easier access
export const { setUser, setSystemHealth, setLoading, setError, clearError } = useAppStore.getState();

// Export domain-specific stores
export { useProjectStore } from './projectStore';
export { useLessonStore } from './lessonStore';
export { useAIStore } from './aiStore';