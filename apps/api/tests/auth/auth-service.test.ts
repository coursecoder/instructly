import { describe, it, expect, beforeEach, vi } from 'vitest';

// Set environment variables before importing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.NEXT_PUBLIC_SITE_URL = 'https://test.com';

import { AuthService } from '../../src/services/auth';

// Mock Supabase
const mockChain = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn()
};

const mockSupabase = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    verifyOtp: vi.fn(),
    admin: {
      deleteUser: vi.fn()
    }
  },
  from: vi.fn(() => mockChain)
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase)
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signUp', () => {
    it('should successfully sign up a new user', async () => {
      const authService = new AuthService();
      
      const signUpData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        name: 'Test User',
        organization: 'Test Org',
        role: 'designer' as const
      };

      const mockAuthUser = {
        id: 'user-123',
        email: 'test@example.com'
      };

      const mockUserProfile = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        organization: 'Test Org',
        role: 'designer',
        preferences: {
          defaultAudience: '',
          preferredComplexity: 'intermediate',
          accessibilityStrictness: 'standard',
          aiGenerationStyle: 'detailed'
        }
      };

      // Mock existing user check (no existing user)
      mockChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'No rows found' }
      });

      // Mock auth signup
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: mockAuthUser, session: null },
        error: null
      });

      // Mock user profile creation
      mockChain.single.mockResolvedValueOnce({
        data: mockUserProfile,
        error: null
      });

      const result = await authService.signUp(signUpData);

      expect(result).toEqual({
        user: mockUserProfile,
        session: null,
        emailConfirmationRequired: true
      });

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          emailRedirectTo: 'https://test.com/auth/callback',
          data: {
            name: signUpData.name,
            organization: signUpData.organization,
            role: signUpData.role
          }
        }
      });
    });

    it('should throw error if user already exists', async () => {
      const authService = new AuthService();
      
      const signUpData = {
        email: 'existing@example.com',
        password: 'TestPass123!',
        name: 'Test User',
        role: 'designer' as const
      };

      // Mock existing user found
      mockChain.single.mockResolvedValueOnce({
        data: { email: 'existing@example.com' },
        error: null
      });

      await expect(authService.signUp(signUpData))
        .rejects
        .toThrow('User with this email already exists');
    });

    it('should validate password strength', async () => {
      const authService = new AuthService();
      
      const signUpData = {
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User',
        role: 'designer' as const
      };

      await expect(authService.signUp(signUpData))
        .rejects
        .toThrow();
    });
  });

  describe('signIn', () => {
    it('should successfully sign in a user', async () => {
      const authService = new AuthService();
      
      const signInData = {
        email: 'test@example.com',
        password: 'TestPass123!'
      };

      const mockSession = {
        access_token: 'token-123',
        user: { id: 'user-123' }
      };

      const mockUserProfile = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'designer'
      };

      // Mock auth signin
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: { id: 'user-123' }, session: mockSession },
        error: null
      });

      // Mock last login update
      mockChain.eq.mockReturnThis();

      // Mock user profile fetch
      mockChain.single.mockResolvedValueOnce({
        data: mockUserProfile,
        error: null
      });

      const result = await authService.signIn(signInData);

      expect(result).toEqual({
        user: mockUserProfile,
        session: mockSession
      });

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: signInData.email,
        password: signInData.password
      });
    });

    it('should throw error for invalid credentials', async () => {
      const authService = new AuthService();
      
      const signInData = {
        email: 'test@example.com',
        password: 'wrong-password'
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      });

      await expect(authService.signIn(signInData))
        .rejects
        .toThrow('Sign in failed: Invalid credentials');
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      const authService = new AuthService();
      const resetData = { email: 'test@example.com' };

      mockSupabase.auth.resetPasswordForEmail.mockResolvedValueOnce({
        error: null
      });

      const result = await authService.resetPassword(resetData);

      expect(result).toEqual({
        success: true,
        message: 'Password reset email sent'
      });

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        resetData.email,
        { redirectTo: 'https://test.com/auth/reset-password' }
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const authService = new AuthService();
      const updateData = {
        name: 'Updated Name',
        organization: 'New Org'
      };

      const mockUpdatedProfile = {
        id: 'user-123',
        name: 'Updated Name',
        organization: 'New Org'
      };

      mockChain.single.mockResolvedValueOnce({
        data: mockUpdatedProfile,
        error: null
      });

      const result = await authService.updateProfile('user-123', updateData);

      expect(result).toEqual(mockUpdatedProfile);
    });
  });
});