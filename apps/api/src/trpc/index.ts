import { initTRPC, TRPCError } from '@trpc/server';
import { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { NextRequest } from 'next/server';
import { getAuthService } from '../services/auth';
import { z } from 'zod';

// Create context for tRPC procedures
export async function createTRPCContext({ req }: CreateNextContextOptions) {
  const authHeader = req.headers.authorization;
  let user = null;
  let session = null;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      // TODO: Implement proper JWT token validation
      // This is a placeholder - in production should verify JWT signature
      if (token && token.length > 0) {
        // For now, assume valid token means authenticated user
        // In production, decode JWT and get user ID from token
        user = { id: 'authenticated-user' };
        session = { access_token: token };
      }
    } catch (error) {
      // Invalid token - user remains null
      console.error('Token validation failed:', error);
    }
  }

  return {
    req,
    user,
    session,
    authService: getAuthService()
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof z.ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Base router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure that requires authentication
export const protectedProcedure = t.procedure.use(
  t.middleware(({ ctx, next }) => {
    if (!ctx.user || !ctx.session) {
      throw new TRPCError({ 
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
        session: ctx.session,
      },
    });
  })
);