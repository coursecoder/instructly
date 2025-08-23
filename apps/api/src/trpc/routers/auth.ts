import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../index';
import { signUpSchema, signInSchema, resetPasswordSchema, updateProfileSchema } from '../../services/auth';
import { TRPCError } from '@trpc/server';
import { recordAuthAttempt, logSecurityEvent } from '../../middleware/security';

export const authRouter = router({
  // Register new user
  register: publicProcedure
    .input(signUpSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await ctx.authService.signUp(input);
        return {
          user: result.user,
          session: result.session,
          emailConfirmationRequired: result.emailConfirmationRequired
        };
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Registration failed',
          cause: error
        });
      }
    }),

  // Sign in user
  login: publicProcedure
    .input(signInSchema)
    .mutation(async ({ input, ctx }) => {
      const clientIp = ctx.req.ip || 'unknown';
      const userAgent = ctx.req.headers['user-agent'];
      
      try {
        const result = await ctx.authService.signIn(input, clientIp);
        
        // Record successful authentication attempt
        await recordAuthAttempt(clientIp, input.email, true, userAgent);
        
        return {
          user: result.user,
          session: result.session
        };
      } catch (error) {
        // Record failed authentication attempt
        await recordAuthAttempt(clientIp, input.email, false, userAgent);
        
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: error instanceof Error ? error.message : 'Sign in failed',
          cause: error
        });
      }
    }),

  // Sign out user
  logout: protectedProcedure
    .mutation(async ({ ctx }) => {
      const clientIp = ctx.req.ip || 'unknown';
      const userAgent = ctx.req.headers['user-agent'];
      
      try {
        await ctx.authService.signOut(ctx.session.access_token);
        
        // Log successful logout
        await logSecurityEvent({
          event_type: 'logout',
          user_id: ctx.user.id,
          ip_address: clientIp,
          user_agent: userAgent
        });
        
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Sign out failed',
          cause: error
        });
      }
    }),

  // Get current user profile
  me: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const user = await ctx.authService.getUserById(ctx.user.id);
        return { user };
      } catch (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: error instanceof Error ? error.message : 'User not found',
          cause: error
        });
      }
    }),

  // Reset password
  resetPassword: publicProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await ctx.authService.resetPassword(input);
        return result;
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Password reset failed',
          cause: error
        });
      }
    }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await ctx.authService.updateProfile(ctx.user.id, input);
        return { user };
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Profile update failed',
          cause: error
        });
      }
    }),

  // Verify email
  verifyEmail: publicProcedure
    .input(z.object({
      token: z.string(),
      email: z.string().email()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await ctx.authService.verifyEmail(input.token, input.email);
        return result;
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Email verification failed',
          cause: error
        });
      }
    }),

  // Resend email verification
  resendVerification: publicProcedure
    .input(z.object({
      email: z.string().email()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await ctx.authService.resendEmailVerification(input.email);
        return result;
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Failed to resend verification email',
          cause: error
        });
      }
    }),

  // Export user data (GDPR compliance)
  exportData: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        const result = await ctx.authService.exportUserData(ctx.user.id);
        return result;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to export user data',
          cause: error
        });
      }
    }),

  // Delete user account (GDPR Right to be Forgotten)
  deleteAccount: protectedProcedure
    .input(z.object({
      confirmEmail: z.string().email()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Get current user to verify email
        const currentUser = await ctx.authService.getUserById(ctx.user.id);
        if (input.confirmEmail !== currentUser.email) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Email confirmation does not match your account email'
          });
        }

        const result = await ctx.authService.deleteUserAccount(ctx.user.id);
        return result;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete user account',
          cause: error
        });
      }
    })
});