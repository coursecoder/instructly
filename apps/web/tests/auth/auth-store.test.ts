import { describe, it, expect, beforeEach, vi } from 'vitest';

// Hoisted functions to fix initialization order
let mockTrpcMutate: any;
let mockTrpcQuery: any;

vi.mock('@trpc/client', () => ({
  createTRPCProxyClient: () => ({
    auth: {
      register: { mutate: (...args: any[]) => mockTrpcMutate(...args) },
      login: { mutate: (...args: any[]) => mockTrpcMutate(...args) },
      logout: { mutate: (...args: any[]) => mockTrpcMutate(...args) },
      resetPassword: { mutate: (...args: any[]) => mockTrpcMutate(...args) },
      updateProfile: { mutate: (...args: any[]) => mockTrpcMutate(...args) },
      me: { query: (...args: any[]) => mockTrpcQuery(...args) },
    },
  }),
  httpBatchLink: () => ({ links: [] }),
}));

import { useAuthStore } from '../../src/stores/auth';

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

describe('useAuthStore', () => {
  beforeEach(() => {
    // Initialize mock functions
    mockTrpcMutate = vi.fn();
    mockTrpcQuery = vi.fn();
    
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Reset store state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  describe('signUp', () => {
    it('should sign up user successfully', async () => {
      const mockResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'designer',
          preferences: {},
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        session: {
          access_token: 'mock-token',
        },
        emailConfirmationRequired: false,
      };

      mockTrpcMutate.mockResolvedValueOnce(mockResponse);

      const store = useAuthStore.getState();
      const result = await store.signUp({
        email: 'test@example.com',
        password: 'TestPass123!',
        name: 'Test User',
        role: 'designer',
      });

      expect(mockTrpcMutate).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'TestPass123!',
        name: 'Test User',
        role: 'designer',
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth-token', 'mock-token');
      
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('test@example.com');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should handle email confirmation required', async () => {
      const mockResponse = {
        emailConfirmationRequired: true,
      };

      mockTrpcMutate.mockResolvedValueOnce(mockResponse);

      const store = useAuthStore.getState();
      const result = await store.signUp({
        email: 'test@example.com',
        password: 'TestPass123!',
        name: 'Test User',
        role: 'designer',
      });

      expect(result.emailConfirmationRequired).toBe(true);
      
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
    });

    it('should handle signup error', async () => {
      const error = new Error('User already exists');
      mockTrpcMutate.mockRejectedValueOnce(error);

      const store = useAuthStore.getState();
      
      await expect(store.signUp({
        email: 'test@example.com',
        password: 'TestPass123!',
        name: 'Test User',
        role: 'designer',
      })).rejects.toThrow('User already exists');

      const state = useAuthStore.getState();
      expect(state.error).toBe('User already exists');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('signIn', () => {
    it('should sign in user successfully', async () => {
      const mockResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'designer',
          preferences: {},
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        session: {
          access_token: 'mock-token',
        },
      };

      mockTrpcMutate.mockResolvedValueOnce(mockResponse);

      const store = useAuthStore.getState();
      await store.signIn({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockTrpcMutate).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth-token', 'mock-token');
      
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('test@example.com');
    });

    it('should handle signin error', async () => {
      const error = new Error('Invalid credentials');
      mockTrpcMutate.mockRejectedValueOnce(error);

      const store = useAuthStore.getState();
      
      await expect(store.signIn({
        email: 'test@example.com',
        password: 'wrong-password',
      })).rejects.toThrow('Invalid credentials');

      const state = useAuthStore.getState();
      expect(state.error).toBe('Invalid credentials');
    });
  });

  describe('signOut', () => {
    it('should sign out user successfully', async () => {
      // Set initial authenticated state
      useAuthStore.setState({
        user: { id: 'user-123' } as any,
        isAuthenticated: true,
      });

      mockTrpcMutate.mockResolvedValueOnce({ success: true });

      const store = useAuthStore.getState();
      await store.signOut();

      expect(mockTrpcMutate).toHaveBeenCalled();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth-token');
      
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
    });

    it('should clear local state even if API call fails', async () => {
      // Set initial authenticated state
      useAuthStore.setState({
        user: { id: 'user-123' } as any,
        isAuthenticated: true,
      });

      const error = new Error('Network error');
      mockTrpcMutate.mockRejectedValueOnce(error);

      const store = useAuthStore.getState();
      await store.signOut();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth-token');
      
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch current user when token exists', async () => {
      localStorageMock.getItem.mockReturnValue('mock-token');
      
      const mockResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'designer',
          preferences: {},
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      };

      mockTrpcQuery.mockResolvedValueOnce(mockResponse);

      const store = useAuthStore.getState();
      await store.getCurrentUser();

      expect(mockTrpcQuery).toHaveBeenCalled();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('test@example.com');
    });

    it('should clear auth state when no token exists', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const store = useAuthStore.getState();
      await store.getCurrentUser();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
    });

    it('should clear auth state when token is invalid', async () => {
      localStorageMock.getItem.mockReturnValue('invalid-token');
      
      const error = new Error('Invalid token');
      mockTrpcQuery.mockRejectedValueOnce(error);

      const store = useAuthStore.getState();
      await store.getCurrentUser();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth-token');
      
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
    });
  });

  describe('utility functions', () => {
    it('should clear error', () => {
      useAuthStore.setState({ error: 'Some error' });
      
      const store = useAuthStore.getState();
      store.clearError();

      const state = useAuthStore.getState();
      expect(state.error).toBe(null);
    });

    it('should set loading state', () => {
      const store = useAuthStore.getState();
      store.setLoading(true);

      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(true);
    });
  });
});