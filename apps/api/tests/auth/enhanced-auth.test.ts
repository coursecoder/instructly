import { describe, it, expect, beforeEach, vi } from 'vitest';

// Set environment variables before importing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.NEXT_PUBLIC_SITE_URL = 'https://test.com';

import { AuthService, resetAuthService } from '../../src/services/auth';

// Mock Supabase with enhanced functionality
const mockChain = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ 
    data: { 
      id: 'user-123', 
      email: 'user@example.com', 
      name: 'Test User', 
      role: 'designer',
      organization: 'Test Org',
      preferences: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, 
    error: null 
  }),
  then: vi.fn().mockResolvedValue({ data: [], error: null })
};

const mockSupabase = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    verifyOtp: vi.fn(),
    resend: vi.fn(),
    admin: {
      deleteUser: vi.fn()
    }
  },
  from: vi.fn(() => mockChain),
  rpc: vi.fn().mockResolvedValue({ data: true, error: null })
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase)
}));

describe('Enhanced AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    resetAuthService(); // Reset singleton for each test
    
    // Reset mock implementation to default behavior
    mockSupabase.from.mockReturnValue(mockChain);
    mockSupabase.rpc.mockResolvedValue({ data: true, error: null });
    
    authService = new AuthService();
  });

  describe('Password Security Validation', () => {
    it('should validate strong passwords', () => {
      const result = authService.validatePasswordSecurity('StrongPass$2024');
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const result = authService.validatePasswordSecurity('password123');
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Password must contain at least one uppercase letter');
      expect(result.issues).toContain('Password must contain at least one special character (@$!%*?&)');
    });

    it('should reject common breached passwords', () => {
      const result = authService.validatePasswordSecurity('password');
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('This password is too common and has been found in security breaches');
    });

    it('should reject passwords containing email address', () => {
      const result = authService.validatePasswordSecurity('johndoe123!A', 'johndoe@example.com');
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Password should not contain your email address');
    });

    it('should reject passwords with repeated characters', () => {
      const result = authService.validatePasswordSecurity('Testaaaa123!');
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Password should not contain repeated characters (aaaa, 1111, etc.)');
    });

    it('should reject passwords with sequential characters', () => {
      const result = authService.validatePasswordSecurity('Test123abc!');
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Password should not contain sequential characters (123, abc, etc.)');
    });
  });

  describe('Rate Limiting', () => {
    it('should check rate limiting before login', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: true, error: null });
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
          session: { access_token: 'token-123' }
        },
        error: null
      });
      mockChain.single.mockResolvedValueOnce({
        data: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
        error: null
      });

      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'TestPass123!'
      }, '192.168.1.1');

      expect(mockSupabase.rpc).toHaveBeenCalledWith('check_rate_limit', {
        email_addr: 'test@example.com',
        ip_addr: '192.168.1.1'
      });
    }, 15000);

    it('should block login when rate limit exceeded', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: false, error: null });

      await expect(authService.signIn({
        email: 'test@example.com',
        password: 'TestPass123!'
      }, '192.168.1.1')).rejects.toThrow('Too many login attempts. Please try again later.');
    }, 15000);

    it('should record login attempts', async () => {
      mockChain.insert.mockResolvedValueOnce({ error: null });
      
      const result = await authService.recordLoginAttempt('test@example.com', '192.168.1.1', true);
      
      expect(mockChain.insert).toHaveBeenCalledWith({
        email: 'test@example.com',
        ip_address: '192.168.1.1',
        success: true
      });
    }, 15000);
  });

  describe('Session Management', () => {
    it('should create user session', async () => {
      mockChain.insert.mockResolvedValueOnce({ error: null });

      const result = await authService.createSession('user-123', 'token-123', '192.168.1.1', 'Mozilla/5.0');

      expect(mockChain.insert).toHaveBeenCalledWith({
        user_id: 'user-123',
        session_token: 'token-123',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        expires_at: expect.any(String)
      });
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should validate active session', async () => {
      const futureDate = new Date(Date.now() + 60000).toISOString();
      const recentDate = new Date(Date.now() - 30000).toISOString();

      mockChain.single.mockResolvedValueOnce({
        data: {
          user_id: 'user-123',
          expires_at: futureDate,
          last_activity_at: recentDate
        },
        error: null
      });

      const result = await authService.validateSession('token-123');

      expect(result.valid).toBe(true);
      expect(result.userId).toBe('user-123');
    }, 15000);

    it('should invalidate expired session', async () => {
      const pastDate = new Date(Date.now() - 60000).toISOString();

      mockChain.single.mockResolvedValueOnce({
        data: {
          user_id: 'user-123',
          expires_at: pastDate,
          last_activity_at: pastDate
        },
        error: null
      });

      const result = await authService.validateSession('token-123');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Session expired');
    }, 15000);

    it('should invalidate inactive session', async () => {
      const futureDate = new Date(Date.now() + 60000).toISOString();
      const oldDate = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(); // 3 hours ago

      mockChain.single.mockResolvedValueOnce({
        data: {
          user_id: 'user-123',
          expires_at: futureDate,
          last_activity_at: oldDate
        },
        error: null
      });

      const result = await authService.validateSession('token-123');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Session inactive too long');
    }, 15000);

    it('should destroy session', async () => {
      mockChain.eq.mockResolvedValueOnce({ error: null });

      await authService.destroySession('token-123');

      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('session_token', 'token-123');
    });

    it('should cleanup expired sessions', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ error: null });

      await authService.cleanupExpiredSessions();

      expect(mockSupabase.rpc).toHaveBeenCalledWith('cleanup_expired_sessions');
    });
  });

  describe('Email Verification', () => {
    it('should verify email with OTP', async () => {
      mockSupabase.auth.verifyOtp.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null
      });

      const result = await authService.verifyEmail('otp-123', 'test@example.com');

      expect(mockSupabase.auth.verifyOtp).toHaveBeenCalledWith({
        token: 'otp-123',
        type: 'email',
        email: 'test@example.com'
      });
    });

    it('should resend verification email', async () => {
      mockSupabase.auth.resend.mockResolvedValueOnce({ error: null });

      const result = await authService.resendEmailVerification('test@example.com');

      expect(mockSupabase.auth.resend).toHaveBeenCalledWith({
        type: 'signup',
        email: 'test@example.com',
        options: {
          emailRedirectTo: 'https://test.com/auth/callback'
        }
      });
      expect(result.success).toBe(true);
    });
  });

  describe('GDPR Compliance', () => {
    it('should export user data', async () => {
      // Mock user data query result
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockResolvedValue({ data: [], error: null });
      
      // Setup chain for multiple queries
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
                  error: null
                })
              })
            })
          };
        }
        return {
          select: selectMock,
          eq: eqMock
        };
      });

      const result = await authService.exportUserData('user-123');

      expect(result.exportDate).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.projects).toBeDefined();
      expect(result.aiUsage).toBeDefined();
      expect(result.auditLogs).toBeDefined();
      expect(result.sessions).toBeDefined();
    });

    it('should delete user account and all data', async () => {
      // Mock successful deletion for all queries
      const inMock = vi.fn().mockResolvedValue({ error: null });
      const eqMock = vi.fn().mockResolvedValue({ error: null });
      
      mockSupabase.from.mockImplementation(() => ({
        delete: vi.fn().mockReturnValue({
          eq: eqMock,
          in: inMock
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null })
        })
      }));
      
      mockSupabase.auth.admin.deleteUser.mockResolvedValueOnce({ error: null });

      const result = await authService.deleteUserAccount('user-123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('User account and all associated data deleted');
      expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith('user-123');
    });
  });

  describe('Enhanced Sign Up', () => {
    it('should reject sign up with weak password', async () => {
      const signUpData = {
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User',
        role: 'designer' as const
      };

      await expect(authService.signUp(signUpData)).rejects.toThrow();
    });

    it('should successfully sign up with strong password', async () => {
      const signUpData = {
        email: 'newuser@example.com',
        password: 'StrongPass$2024',
        name: 'Test User', 
        role: 'designer' as const
      };

      // Mock no existing user - first call should return null/error
      mockSupabase.from.mockImplementationOnce(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'No rows returned' } })
          })
        })
      }));
      
      // Mock successful auth creation
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: {
          user: { id: 'user-456', email: 'newuser@example.com' },
          session: null
        },
        error: null
      });

      // Mock successful user profile creation
      mockSupabase.from.mockImplementationOnce(() => ({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-456', email: 'newuser@example.com', name: 'Test User' },
              error: null
            })
          })
        })
      }));

      const result = await authService.signUp(signUpData);

      expect(result.emailConfirmationRequired).toBe(true);
      expect(result.user).toBeDefined();
    });
  });
});