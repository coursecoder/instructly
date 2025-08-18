import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TRPCError } from '@trpc/server';

// Set environment variables before importing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.NEXT_PUBLIC_SITE_URL = 'https://test.com';

import { authRouter } from '../../src/trpc/routers/auth';
import { resetAuthService } from '../../src/services/auth';

// Mock context
const createMockContext = (user?: any, session?: any) => ({
  authService: {
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    updateProfile: vi.fn(),
    getUserById: vi.fn(),
    verifyEmail: vi.fn(),
    resendEmailVerification: vi.fn(),
    exportUserData: vi.fn(),
    deleteUserAccount: vi.fn()
  },
  user,
  session
});

describe('Auth Integration Tests', () => {
  let mockContext: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    resetAuthService(); // Reset singleton for each test
    mockContext = createMockContext();
  });

  describe('Registration Flow', () => {
    it('should register user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        name: 'Test User',
        organization: 'Test Corp',
        role: 'designer' as const
      };

      mockContext.authService.signUp.mockResolvedValueOnce({
        user: { id: 'user-123', ...userData },
        session: null,
        emailConfirmationRequired: true
      });

      const caller = authRouter.createCaller(mockContext);
      const result = await caller.register(userData);

      expect(result.emailConfirmationRequired).toBe(true);
      expect(mockContext.authService.signUp).toHaveBeenCalledWith(userData);
    });

    it('should handle registration errors', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User',
        role: 'designer' as const
      };

      mockContext.authService.signUp.mockRejectedValueOnce(
        new Error('Password security requirements not met')
      );

      const caller = authRouter.createCaller(mockContext);

      await expect(caller.register(userData)).rejects.toThrow(TRPCError);
    });
  });

  describe('Login Flow', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'StrongPass123!'
      };

      mockContext.authService.signIn.mockResolvedValueOnce({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
        session: { access_token: 'token-123' }
      });

      const caller = authRouter.createCaller(mockContext);
      const result = await caller.login(loginData);

      expect(result.user).toBeDefined();
      expect(result.session).toBeDefined();
      expect(mockContext.authService.signIn).toHaveBeenCalledWith(loginData);
    });

    it('should handle login rate limiting', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'StrongPass123!'
      };

      mockContext.authService.signIn.mockRejectedValueOnce(
        new Error('Too many login attempts. Please try again later.')
      );

      const caller = authRouter.createCaller(mockContext);

      await expect(caller.login(loginData)).rejects.toThrow(TRPCError);
    });
  });

  describe('Email Verification Flow', () => {
    it('should verify email successfully', async () => {
      const verificationData = {
        token: 'otp-123',
        email: 'test@example.com'
      };

      mockContext.authService.verifyEmail.mockResolvedValueOnce({
        user: { id: 'user-123' }
      });

      const caller = authRouter.createCaller(mockContext);
      const result = await caller.verifyEmail(verificationData);

      expect(result).toBeDefined();
      expect(mockContext.authService.verifyEmail).toHaveBeenCalledWith('otp-123', 'test@example.com');
    });

    it('should resend verification email', async () => {
      const resendData = {
        email: 'test@example.com'
      };

      mockContext.authService.resendEmailVerification.mockResolvedValueOnce({
        success: true,
        message: 'Verification email sent'
      });

      const caller = authRouter.createCaller(mockContext);
      const result = await caller.resendVerification(resendData);

      expect(result.success).toBe(true);
      expect(mockContext.authService.resendEmailVerification).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('Protected Routes', () => {
    it('should get current user profile', async () => {
      const protectedContext = createMockContext(
        { id: 'user-123', email: 'test@example.com' },
        { access_token: 'token-123' }
      );

      protectedContext.authService.getUserById.mockResolvedValueOnce({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User'
      });

      const caller = authRouter.createCaller(protectedContext);
      const result = await caller.me();

      expect(result.user).toBeDefined();
      expect(protectedContext.authService.getUserById).toHaveBeenCalledWith('user-123');
    });

    it('should update user profile', async () => {
      const protectedContext = createMockContext(
        { id: 'user-123', email: 'test@example.com' },
        { access_token: 'token-123' }
      );

      const updateData = {
        name: 'Updated Name',
        organization: 'New Corp'
      };

      protectedContext.authService.updateProfile.mockResolvedValueOnce({
        id: 'user-123',
        ...updateData
      });

      const caller = authRouter.createCaller(protectedContext);
      const result = await caller.updateProfile(updateData);

      expect(result.user).toBeDefined();
      expect(protectedContext.authService.updateProfile).toHaveBeenCalledWith('user-123', updateData);
    });

    it('should logout user', async () => {
      const protectedContext = createMockContext(
        { id: 'user-123', email: 'test@example.com' },
        { access_token: 'token-123' }
      );

      protectedContext.authService.signOut.mockResolvedValueOnce({ success: true });

      const caller = authRouter.createCaller(protectedContext);
      const result = await caller.logout();

      expect(result.success).toBe(true);
      expect(protectedContext.authService.signOut).toHaveBeenCalledWith('token-123');
    });
  });

  describe('GDPR Compliance Routes', () => {
    it('should export user data', async () => {
      const protectedContext = createMockContext(
        { id: 'user-123', email: 'test@example.com' },
        { access_token: 'token-123' }
      );

      const exportData = {
        exportDate: new Date().toISOString(),
        user: { id: 'user-123', email: 'test@example.com' },
        projects: [],
        aiUsage: [],
        auditLogs: [],
        sessions: []
      };

      protectedContext.authService.exportUserData.mockResolvedValueOnce(exportData);

      const caller = authRouter.createCaller(protectedContext);
      const result = await caller.exportData();

      expect(result.exportDate).toBeDefined();
      expect(result.user).toBeDefined();
      expect(protectedContext.authService.exportUserData).toHaveBeenCalledWith('user-123');
    });

    it('should delete user account with email confirmation', async () => {
      const protectedContext = createMockContext(
        { id: 'user-123', email: 'test@example.com' },
        { access_token: 'token-123' }
      );

      const deleteData = {
        confirmEmail: 'test@example.com'
      };

      // Mock getUserById to return current user
      protectedContext.authService.getUserById.mockResolvedValueOnce({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'designer'
      });

      protectedContext.authService.deleteUserAccount.mockResolvedValueOnce({
        success: true,
        message: 'User account and all associated data deleted'
      });

      const caller = authRouter.createCaller(protectedContext);
      const result = await caller.deleteAccount(deleteData);

      expect(result.success).toBe(true);
      expect(protectedContext.authService.deleteUserAccount).toHaveBeenCalledWith('user-123');
    });

    it('should reject account deletion with wrong email', async () => {
      const protectedContext = createMockContext(
        { id: 'user-123', email: 'test@example.com' },
        { access_token: 'token-123' }
      );

      const deleteData = {
        confirmEmail: 'wrong@example.com'
      };

      // Mock getUserById to return current user
      protectedContext.authService.getUserById.mockResolvedValueOnce({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'designer'
      });

      const caller = authRouter.createCaller(protectedContext);

      await expect(caller.deleteAccount(deleteData)).rejects.toThrow(TRPCError);
    });
  });

  describe('Password Reset Flow', () => {
    it('should initiate password reset', async () => {
      const resetData = {
        email: 'test@example.com'
      };

      mockContext.authService.resetPassword.mockResolvedValueOnce({
        success: true,
        message: 'Password reset email sent'
      });

      const caller = authRouter.createCaller(mockContext);
      const result = await caller.resetPassword(resetData);

      expect(result.success).toBe(true);
      expect(mockContext.authService.resetPassword).toHaveBeenCalledWith(resetData);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors appropriately', async () => {
      mockContext.authService.signIn.mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const caller = authRouter.createCaller(mockContext);

      await expect(caller.login({
        email: 'test@example.com',
        password: 'StrongPass123!'
      })).rejects.toThrow(TRPCError);
    });

    it('should handle invalid input data', async () => {
      const caller = authRouter.createCaller(mockContext);

      await expect(caller.login({
        email: 'invalid-email',
        password: ''
      })).rejects.toThrow();
    });
  });
});