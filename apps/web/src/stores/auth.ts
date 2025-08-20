import { create } from 'zustand';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../api/src/trpc/routers';
import type { 
  AuthUser, 
  SignUpData, 
  SignInData, 
  ResetPasswordData, 
  UpdateProfileData,
  AuthResponse 
} from '@instructly/shared/types';

// Session timeout configuration
const INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const WARNING_TIMEOUT = 10 * 60 * 1000; // 10 minutes warning before logout

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastActivity: number | null;
  sessionTimeoutId: NodeJS.Timeout | null;
  
  // Actions
  signUp: (data: SignUpData) => Promise<AuthResponse>;
  signIn: (data: SignInData) => Promise<void>;
  login: (data: SignInData) => Promise<void>; // Alias for signIn for callback page
  signOut: () => Promise<void>;
  resetPassword: (data: ResetPasswordData) => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  updateActivity: () => void;
  setupSessionTimeout: () => void;
  clearSessionTimeout: () => void;
}

// Create a singleton tRPC client for use in the store
const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3001/api/trpc'
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

// Helper to get tRPC client instance
function getTrpcClient() {
  return trpcClient;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      lastActivity: null,
      sessionTimeoutId: null,

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      clearError: () => {
        set({ error: null });
      },

      signUp: async (data: SignUpData): Promise<AuthResponse> => {
        set({ isLoading: true, error: null });

        try {
          const client = getTrpcClient();
          const response = await client.auth.register.mutate(data);

          // If email confirmation is required, don't set user state
          if (response.emailConfirmationRequired) {
            set({ isLoading: false });
            return {
              user: response.user as AuthUser,
              emailConfirmationRequired: true
            };
          }

          // If user is immediately signed in
          const user: AuthUser = {
            ...response.user,
            createdAt: new Date(response.user.created_at),
            lastLoginAt: response.user.last_login_at ? new Date(response.user.last_login_at) : undefined,
            updatedAt: new Date(response.user.updated_at),
          };

          // Store auth token if available
          if (response.session?.access_token) {
            localStorage.setItem('auth-token', response.session.access_token);
          }

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return {
            user,
            session: response.session
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Registration failed';
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      signIn: async (data: SignInData): Promise<void> => {
        set({ isLoading: true, error: null });

        try {
          const client = getTrpcClient();
          const response = await client.auth.login.mutate(data);

          const user: AuthUser = {
            ...response.user,
            createdAt: new Date(response.user.created_at),
            lastLoginAt: response.user.last_login_at ? new Date(response.user.last_login_at) : undefined,
            updatedAt: new Date(response.user.updated_at),
          };

          // Store auth token
          if (response.session?.access_token) {
            localStorage.setItem('auth-token', response.session.access_token);
          }

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            lastActivity: Date.now(),
          });

          // Set up session timeout after successful sign in
          get().setupSessionTimeout();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      signOut: async (): Promise<void> => {
        set({ isLoading: true, error: null });

        try {
          // Call logout endpoint
          const client = getTrpcClient();
          await client.auth.logout.mutate();
        } catch (error) {
          // Log error but don't prevent logout
          console.error('Logout API call failed:', error);
        } finally {
          // Clear session timeout
          get().clearSessionTimeout();
          
          // Clear local state regardless of API call success
          localStorage.removeItem('auth-token');
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            lastActivity: null,
            sessionTimeoutId: null,
          });
        }
      },

      resetPassword: async (data: ResetPasswordData): Promise<void> => {
        set({ isLoading: true, error: null });

        try {
          const client = getTrpcClient();
          await client.auth.resetPassword.mutate(data);

          set({ isLoading: false, error: null });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      updateProfile: async (data: UpdateProfileData): Promise<void> => {
        set({ isLoading: true, error: null });

        try {
          const client = getTrpcClient();
          const response = await client.auth.updateProfile.mutate(data);

          const updatedUser: AuthUser = {
            ...response.user,
            createdAt: new Date(response.user.created_at),
            lastLoginAt: response.user.last_login_at ? new Date(response.user.last_login_at) : undefined,
            updatedAt: new Date(response.user.updated_at),
          };

          set({
            user: updatedUser,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      getCurrentUser: async (): Promise<void> => {
        const token = localStorage.getItem('auth-token');
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const client = getTrpcClient();
          const response = await client.auth.me.query();

          const user: AuthUser = {
            ...response.user,
            createdAt: new Date(response.user.created_at),
            lastLoginAt: response.user.last_login_at ? new Date(response.user.last_login_at) : undefined,
            updatedAt: new Date(response.user.updated_at),
          };

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            lastActivity: Date.now(),
          });

          // Set up session timeout for existing session
          get().setupSessionTimeout();
        } catch (error) {
          // If token is invalid, clear it
          localStorage.removeItem('auth-token');
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      // Alias for signIn to maintain compatibility with callback page
      login: async (data: SignInData): Promise<void> => {
        return get().signIn(data);
      },

      updateActivity: () => {
        const now = Date.now();
        set({ lastActivity: now });
        
        // Reset the timeout
        const state = get();
        if (state.isAuthenticated) {
          state.clearSessionTimeout();
          state.setupSessionTimeout();
        }
      },

      setupSessionTimeout: () => {
        const state = get();
        if (state.sessionTimeoutId) {
          clearTimeout(state.sessionTimeoutId);
        }

        // Set up automatic logout after inactivity period
        const timeoutId = setTimeout(() => {
          console.log('Session timed out due to inactivity');
          const currentState = get();
          currentState.signOut();
        }, INACTIVITY_TIMEOUT);

        set({ sessionTimeoutId: timeoutId });
      },

      clearSessionTimeout: () => {
        const state = get();
        if (state.sessionTimeoutId) {
          clearTimeout(state.sessionTimeoutId);
          set({ sessionTimeoutId: null });
        }
      },
    }));