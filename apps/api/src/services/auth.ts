import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { Database } from '../types/database';

// Validation schemas for auth operations
export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain uppercase, lowercase, number, and special character'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  organization: z.string().optional(),
  role: z.enum(['designer', 'manager', 'admin']).default('designer')
});

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  organization: z.string().optional(),
  role: z.enum(['designer', 'manager', 'admin']).optional(),
  preferences: z.object({
    defaultAudience: z.string().optional(),
    preferredComplexity: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    accessibilityStrictness: z.enum(['standard', 'strict']).optional(),
    aiGenerationStyle: z.enum(['concise', 'detailed', 'comprehensive']).optional()
  }).optional()
});

// Session management configuration
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

// Common weak passwords for breach detection
const COMMON_WEAK_PASSWORDS = [
  'password', 'password123', '123456', 'qwerty', 'admin', 'letmein', 
  'welcome', 'monkey', '1234567890', 'abc123', 'password1', '12345678',
  'football', 'iloveyou', 'admin123', 'welcome123', 'master', 'superman'
];

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export class AuthService {
  private supabase: SupabaseClient<Database>;

  constructor() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables');
    }

    // Use service role for backend operations
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  /**
   * Create middleware client for request-based operations
   */
  createMiddlewareClient(req: NextRequest, res: NextResponse) {
    return createMiddlewareClient<Database>({ req, res });
  }

  /**
   * Validate password strength and check for common breaches
   */
  validatePasswordSecurity(password: string, email?: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check minimum length
    if (password.length < 8) {
      issues.push('Password must be at least 8 characters long');
    }

    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
      issues.push('Password must contain at least one uppercase letter');
    }

    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
      issues.push('Password must contain at least one lowercase letter');
    }

    // Check for number
    if (!/\d/.test(password)) {
      issues.push('Password must contain at least one number');
    }

    // Check for special character
    if (!/[@$!%*?&]/.test(password)) {
      issues.push('Password must contain at least one special character (@$!%*?&)');
    }

    // Check against common weak passwords
    const lowercasePassword = password.toLowerCase();
    if (COMMON_WEAK_PASSWORDS.includes(lowercasePassword)) {
      issues.push('This password is too common and has been found in security breaches');
    }

    // Check if password contains email (if provided)
    if (email) {
      const emailPrefix = email.split('@')[0].toLowerCase();
      if (lowercasePassword.includes(emailPrefix) && emailPrefix.length > 3) {
        issues.push('Password should not contain your email address');
      }
    }

    // Check for sequential or repeated characters
    if (/(.)\1{3,}/.test(password)) {
      issues.push('Password should not contain repeated characters (aaaa, 1111, etc.)');
    }

    if (/(?:012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) {
      issues.push('Password should not contain sequential characters (123, abc, etc.)');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Sign up new user with enhanced security
   */
  async signUp(input: SignUpInput) {
    const validated = signUpSchema.parse(input);

    // Additional password security validation
    const passwordValidation = this.validatePasswordSecurity(validated.password, validated.email);
    if (!passwordValidation.valid) {
      throw new Error(`Password security requirements not met: ${passwordValidation.issues.join(', ')}`);
    }

    // Check for existing user
    const { data: existingUser } = await this.supabase
      .from('users')
      .select('email')
      .eq('email', validated.email)
      .single();

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create auth user
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email: validated.email,
      password: validated.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: {
          name: validated.name,
          organization: validated.organization,
          role: validated.role
        }
      }
    });

    if (authError) {
      throw new Error(`Sign up failed: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('Failed to create user account');
    }

    // Create user profile in database
    const { data: userData, error: userError } = await this.supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: validated.email,
        name: validated.name,
        organization: validated.organization,
        role: validated.role,
        preferences: {
          defaultAudience: '',
          preferredComplexity: 'intermediate',
          accessibilityStrictness: 'standard',
          aiGenerationStyle: 'detailed'
        }
      })
      .select()
      .single();

    if (userError) {
      // Clean up auth user if profile creation fails
      await this.supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to create user profile: ${userError.message}`);
    }

    return {
      user: userData,
      session: authData.session,
      emailConfirmationRequired: !authData.session
    };
  }

  /**
   * Sign in user with rate limiting protection
   */
  async signIn(input: SignInInput, ipAddress: string = '') {
    const validated = signInSchema.parse(input);

    // Check rate limiting first
    const rateLimitPassed = await this.checkRateLimit(validated.email, ipAddress);
    if (!rateLimitPassed) {
      // Record failed attempt
      await this.recordLoginAttempt(validated.email, ipAddress, false);
      throw new Error('Too many login attempts. Please try again later.');
    }

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password
    });

    // Record login attempt
    const success = !error && !!data.user && !!data.session;
    await this.recordLoginAttempt(validated.email, ipAddress, success);

    if (error) {
      throw new Error(`Sign in failed: ${error.message}`);
    }

    if (!data.user || !data.session) {
      throw new Error('Invalid credentials');
    }

    // Update last login time
    await this.supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', data.user.id);

    // Create session record for tracking
    await this.createSession(
      data.user.id, 
      data.session.access_token, 
      ipAddress
    );

    // Get full user profile
    const { data: userProfile, error: profileError } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      throw new Error(`Failed to load user profile: ${profileError.message}`);
    }

    return {
      user: userProfile,
      session: data.session
    };
  }

  /**
   * Sign out user
   */
  async signOut(_accessToken: string) {
    const { error } = await this.supabase.auth.signOut();
    
    if (error) {
      throw new Error(`Sign out failed: ${error.message}`);
    }

    return { success: true };
  }

  /**
   * Reset password via email
   */
  async resetPassword(input: ResetPasswordInput) {
    const validated = resetPasswordSchema.parse(input);

    const { error } = await this.supabase.auth.resetPasswordForEmail(
      validated.email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`
      }
    );

    if (error) {
      throw new Error(`Password reset failed: ${error.message}`);
    }

    return { success: true, message: 'Password reset email sent' };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, input: UpdateProfileInput) {
    const validated = updateProfileSchema.parse(input);

    const { data, error } = await this.supabase
      .from('users')
      .update({
        ...validated,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Profile update failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }

    return data;
  }

  /**
   * Verify email confirmation
   */
  async verifyEmail(token: string, email: string) {
    const { data, error } = await this.supabase.auth.verifyOtp({
      token,
      type: 'email',
      email
    });

    if (error) {
      throw new Error(`Email verification failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(email: string) {
    const { error } = await this.supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      }
    });

    if (error) {
      throw new Error(`Failed to resend verification email: ${error.message}`);
    }

    return { success: true, message: 'Verification email sent' };
  }

  /**
   * Create a user session record
   */
  async createSession(userId: string, sessionToken: string, ipAddress?: string, userAgent?: string) {
    const expiresAt = new Date(Date.now() + SESSION_DURATION);

    const { error } = await this.supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        session_token: sessionToken,
        ip_address: ipAddress,
        user_agent: userAgent,
        expires_at: expiresAt.toISOString()
      });

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }

    return { expiresAt };
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionToken: string) {
    const { error } = await this.supabase
      .from('user_sessions')
      .update({
        last_activity_at: new Date().toISOString()
      })
      .eq('session_token', sessionToken);

    if (error) {
      throw new Error(`Failed to update session activity: ${error.message}`);
    }
  }

  /**
   * Check if session is valid and not expired
   */
  async validateSession(sessionToken: string) {
    const { data, error } = await this.supabase
      .from('user_sessions')
      .select('user_id, expires_at, last_activity_at')
      .eq('session_token', sessionToken)
      .single();

    if (error || !data) {
      return { valid: false, reason: 'Session not found' };
    }

    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    const lastActivity = new Date(data.last_activity_at);

    // Check if session has expired
    if (now > expiresAt) {
      await this.destroySession(sessionToken);
      return { valid: false, reason: 'Session expired' };
    }

    // Check if session has been inactive too long
    if (now.getTime() - lastActivity.getTime() > INACTIVITY_TIMEOUT) {
      await this.destroySession(sessionToken);
      return { valid: false, reason: 'Session inactive too long' };
    }

    // Update last activity
    await this.updateSessionActivity(sessionToken);

    return { valid: true, userId: data.user_id };
  }

  /**
   * Destroy a session
   */
  async destroySession(sessionToken: string) {
    const { error } = await this.supabase
      .from('user_sessions')
      .delete()
      .eq('session_token', sessionToken);

    if (error) {
      throw new Error(`Failed to destroy session: ${error.message}`);
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions() {
    const { error } = await this.supabase.rpc('cleanup_expired_sessions');

    if (error) {
      throw new Error(`Failed to cleanup expired sessions: ${error.message}`);
    }
  }

  /**
   * Record login attempt for rate limiting
   */
  async recordLoginAttempt(email: string, ipAddress: string, success: boolean) {
    const { error } = await this.supabase
      .from('login_attempts')
      .insert({
        email,
        ip_address: ipAddress,
        success
      });

    if (error) {
      throw new Error(`Failed to record login attempt: ${error.message}`);
    }
  }

  /**
   * Check rate limiting for login attempts
   */
  async checkRateLimit(email: string, ipAddress: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .rpc('check_rate_limit', { email_addr: email, ip_addr: ipAddress });

    if (error) {
      throw new Error(`Failed to check rate limit: ${error.message}`);
    }

    return data as boolean;
  }

  /**
   * Export user data for GDPR compliance
   */
  async exportUserData(userId: string) {
    // Get user profile
    const { data: user, error: userError } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      throw new Error(`Failed to get user data: ${userError.message}`);
    }

    // Get user's projects
    const { data: projects, error: projectsError } = await this.supabase
      .from('projects')
      .select('*')
      .eq('owner_id', userId);

    if (projectsError) {
      throw new Error(`Failed to get user projects: ${projectsError.message}`);
    }

    // Get user's AI usage logs
    const { data: aiUsage, error: aiError } = await this.supabase
      .from('ai_usage_logs')
      .select('*')
      .eq('user_id', userId);

    if (aiError) {
      throw new Error(`Failed to get AI usage data: ${aiError.message}`);
    }

    // Get user's audit logs
    const { data: auditLogs, error: auditError } = await this.supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId);

    if (auditError) {
      throw new Error(`Failed to get audit logs: ${auditError.message}`);
    }

    // Get user's sessions
    const { data: sessions, error: sessionsError } = await this.supabase
      .from('user_sessions')
      .select('session_token, ip_address, user_agent, created_at, last_activity_at, expires_at')
      .eq('user_id', userId);

    if (sessionsError) {
      throw new Error(`Failed to get session data: ${sessionsError.message}`);
    }

    return {
      exportDate: new Date().toISOString(),
      user,
      projects,
      aiUsage,
      auditLogs,
      sessions
    };
  }

  /**
   * Delete user account and all associated data (GDPR Right to be Forgotten)
   */
  async deleteUserAccount(userId: string) {
    // This will cascade delete all associated data due to foreign key constraints
    // Order of deletion matters for referential integrity

    // Delete lessons and content first (they reference projects)
    const { error: lessonsError } = await this.supabase
      .from('lessons')
      .delete()
      .in('project_id', 
        await this.supabase
          .from('projects')
          .select('id')
          .eq('owner_id', userId)
          .then(({ data }) => data?.map(p => p.id) || [])
      );

    if (lessonsError) {
      throw new Error(`Failed to delete user lessons: ${lessonsError.message}`);
    }

    // Delete projects
    const { error: projectsError } = await this.supabase
      .from('projects')
      .delete()
      .eq('owner_id', userId);

    if (projectsError) {
      throw new Error(`Failed to delete user projects: ${projectsError.message}`);
    }

    // Delete AI usage logs
    const { error: aiError } = await this.supabase
      .from('ai_usage_logs')
      .delete()
      .eq('user_id', userId);

    if (aiError) {
      throw new Error(`Failed to delete AI usage logs: ${aiError.message}`);
    }

    // Delete audit logs
    const { error: auditError } = await this.supabase
      .from('audit_logs')
      .delete()
      .eq('user_id', userId);

    if (auditError) {
      throw new Error(`Failed to delete audit logs: ${auditError.message}`);
    }

    // Delete sessions
    const { error: sessionsError } = await this.supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', userId);

    if (sessionsError) {
      throw new Error(`Failed to delete user sessions: ${sessionsError.message}`);
    }

    // Delete from Supabase Auth
    const { error: authError } = await this.supabase.auth.admin.deleteUser(userId);

    if (authError) {
      throw new Error(`Failed to delete auth user: ${authError.message}`);
    }

    // Finally delete user profile (this will also trigger audit log via trigger)
    const { error: userError } = await this.supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (userError) {
      throw new Error(`Failed to delete user profile: ${userError.message}`);
    }

    return { success: true, message: 'User account and all associated data deleted' };
  }
}

// Factory function for creating auth service instances
let _authServiceInstance: AuthService | null = null;

export function getAuthService(): AuthService {
  if (!_authServiceInstance) {
    _authServiceInstance = new AuthService();
  }
  return _authServiceInstance;
}

// Reset function for testing
export function resetAuthService(): void {
  _authServiceInstance = null;
}

// Legacy singleton export for backward compatibility (only created when needed)
// Use getAuthService() instead for better testing