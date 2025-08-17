import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '../types/database';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  organization?: string;
  role: 'designer' | 'manager' | 'admin';
  preferences: {
    defaultAudience: string;
    preferredComplexity: 'beginner' | 'intermediate' | 'advanced';
    accessibilityStrictness: 'standard' | 'strict';
    aiGenerationStyle: 'concise' | 'detailed' | 'comprehensive';
  };
  created_at: string;
  last_login_at?: string;
  updated_at: string;
}

export interface AuthResult {
  success: true;
  user: AuthUser;
  session: any;
}

export interface AuthError {
  success: false;
  error: string;
}

export type AuthMiddlewareResult = AuthResult | AuthError;

/**
 * Authentication middleware for protected routes
 * Always use this for protected routes, never implement custom auth logic
 */
export async function authMiddleware(req: NextRequest): Promise<AuthMiddlewareResult> {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req, res });

  try {
    // Get session from request
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) {
      return {
        success: false,
        error: `Session validation failed: ${sessionError.message}`
      };
    }

    if (!session || !session.user) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    // Verify token is not expired
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      return {
        success: false,
        error: 'Session expired'
      };
    }

    // Fetch user profile with role information
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      return {
        success: false,
        error: `User profile not found: ${userError.message}`
      };
    }

    if (!user) {
      return {
        success: false,
        error: 'User profile not found'
      };
    }

    // Ensure user profile has required fields
    if (!user.email || !user.name || !user.role) {
      return {
        success: false,
        error: 'Incomplete user profile'
      };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organization: user.organization || undefined,
        role: user.role,
        preferences: (user.preferences as any) || {
          defaultAudience: '',
          preferredComplexity: 'intermediate',
          accessibilityStrictness: 'standard',
          aiGenerationStyle: 'detailed'
        },
        created_at: user.created_at,
        last_login_at: user.last_login_at || undefined,
        updated_at: user.updated_at
      },
      session
    };
  } catch (error) {
    return {
      success: false,
      error: `Authentication middleware error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Role-based authorization wrapper
 * Use to restrict access based on user roles
 */
export function requireRole(allowedRoles: Array<'designer' | 'manager' | 'admin'>) {
  return async (req: NextRequest): Promise<AuthMiddlewareResult> => {
    const authResult = await authMiddleware(req);
    
    if (!authResult.success) {
      return authResult;
    }

    if (!allowedRoles.includes(authResult.user.role)) {
      return {
        success: false,
        error: `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`
      };
    }

    return authResult;
  };
}

/**
 * Admin-only authorization
 */
export const requireAdmin = requireRole(['admin']);

/**
 * Manager or Admin authorization
 */
export const requireManagerOrAdmin = requireRole(['manager', 'admin']);

/**
 * Any authenticated user
 */
export const requireAuth = authMiddleware;