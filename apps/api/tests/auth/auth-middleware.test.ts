import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { authMiddleware, requireRole } from '../../src/middleware/auth';

// Mock Supabase auth helpers
const mockSupabase = {
  auth: {
    getSession: vi.fn()
  },
  from: vi.fn(() => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
    };
    return chain;
  })
};

vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createMiddlewareClient: vi.fn(() => mockSupabase)
}));

describe('authMiddleware', () => {
  let mockChain: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset the chain mock for each test
    mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
    };
    
    mockSupabase.from.mockReturnValue(mockChain);
  });

  it('should authenticate valid user with session', async () => {
    const mockSession = {
      user: { id: 'user-123' },
      expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'designer',
      organization: 'Test Org',
      preferences: {
        defaultAudience: 'developers',
        preferredComplexity: 'intermediate',
        accessibilityStrictness: 'standard',
        aiGenerationStyle: 'detailed'
      },
      created_at: '2024-01-01T00:00:00Z',
      last_login_at: '2024-01-01T12:00:00Z',
      updated_at: '2024-01-01T12:00:00Z'
    };

    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null
    });

    mockChain.single.mockResolvedValueOnce({
      data: mockUser,
      error: null
    });

    const req = new NextRequest('http://localhost/api/test');
    const result = await authMiddleware(req);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.user.id).toBe('user-123');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.role).toBe('designer');
    }
  });

  it('should reject request without session', async () => {
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: null },
      error: null
    });

    const req = new NextRequest('http://localhost/api/test');
    const result = await authMiddleware(req);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Authentication required');
    }
  });

  it('should reject expired session', async () => {
    const mockSession = {
      user: { id: 'user-123' },
      expires_at: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago (expired)
    };

    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null
    });

    const req = new NextRequest('http://localhost/api/test');
    const result = await authMiddleware(req);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Session expired');
    }
  });

  it('should reject when user profile not found', async () => {
    const mockSession = {
      user: { id: 'user-123' },
      expires_at: Math.floor(Date.now() / 1000) + 3600
    };

    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null
    });

    mockChain.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'User not found' }
    });

    const req = new NextRequest('http://localhost/api/test');
    const result = await authMiddleware(req);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('User profile not found');
    }
  });

  it('should handle session validation errors', async () => {
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: null },
      error: { message: 'Session validation failed' }
    });

    const req = new NextRequest('http://localhost/api/test');
    const result = await authMiddleware(req);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Session validation failed');
    }
  });
});

describe('requireRole', () => {
  let mockChain: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset the chain mock for each test
    mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
    };
    
    mockSupabase.from.mockReturnValue(mockChain);
  });

  it('should allow access for users with required role', async () => {
    const mockSession = {
      user: { id: 'user-123' },
      expires_at: Math.floor(Date.now() / 1000) + 3600
    };

    const mockUser = {
      id: 'user-123',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      organization: null,
      preferences: {},
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T12:00:00Z'
    };

    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null
    });

    mockChain.single.mockResolvedValueOnce({
      data: mockUser,
      error: null
    });

    const req = new NextRequest('http://localhost/api/admin');
    const adminGuard = requireRole(['admin']);
    const result = await adminGuard(req);

    expect(result.success).toBe(true);
  });

  it('should deny access for users without required role', async () => {
    const mockSession = {
      user: { id: 'user-123' },
      expires_at: Math.floor(Date.now() / 1000) + 3600
    };

    const mockUser = {
      id: 'user-123',
      email: 'designer@example.com',
      name: 'Designer User',
      role: 'designer',
      organization: null,
      preferences: {},
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T12:00:00Z'
    };

    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null
    });

    mockChain.single.mockResolvedValueOnce({
      data: mockUser,
      error: null
    });

    const req = new NextRequest('http://localhost/api/admin');
    const adminGuard = requireRole(['admin']);
    const result = await adminGuard(req);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Insufficient permissions');
    }
  });

  it('should allow access for multiple allowed roles', async () => {
    const mockSession = {
      user: { id: 'user-123' },
      expires_at: Math.floor(Date.now() / 1000) + 3600
    };

    const mockUser = {
      id: 'user-123',
      email: 'manager@example.com',
      name: 'Manager User',
      role: 'manager',
      organization: null,
      preferences: {},
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T12:00:00Z'
    };

    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null
    });

    mockChain.single.mockResolvedValueOnce({
      data: mockUser,
      error: null
    });

    const req = new NextRequest('http://localhost/api/management');
    const managementGuard = requireRole(['manager', 'admin']);
    const result = await managementGuard(req);

    expect(result.success).toBe(true);
  });
});