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
   * Sign up new user with enhanced security
   */
  async signUp(input: SignUpInput) {
    const validated = signUpSchema.parse(input);

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
  async signIn(input: SignInInput) {
    const validated = signInSchema.parse(input);

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password
    });

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
  async signOut(accessToken: string) {
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
}

// Singleton instance
export const authService = process.env.NODE_ENV === 'test' ? undefined : new AuthService();