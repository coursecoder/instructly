import { initTRPC, TRPCError } from '@trpc/server';
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { getAuthService } from '../services/auth';
import { getAIService } from '../services/aiService';
import { z } from 'zod';

// Create context for tRPC procedures (Fastify)
export async function createContext({ req }: CreateFastifyContextOptions) {
  const authHeader = req.headers.authorization;
  let user = null;
  let session = null;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      // Use Supabase client to verify JWT token with comprehensive validation
      const authService = getAuthService();
      const supabaseClient = authService.createRequestClient();
      
      // Verify JWT token and get user
      const { data: { user: authUser }, error } = await supabaseClient.auth.getUser(token);
      
      if (error || !authUser) {
        console.error('Token validation failed:', error?.message);
      } else {
        // Additional validation: check token expiration
        const { data: userSession, error: sessionError } = await supabaseClient.auth.getSession();
        
        if (sessionError || !userSession) {
          console.error('Session validation failed:', sessionError?.message);
        } else {
          // Verify session is not expired
          const now = Math.floor(Date.now() / 1000);
          if (userSession.session?.expires_at && userSession.session.expires_at < now) {
            console.error('Session expired');
          } else {
            user = { id: authUser.id };
            session = { access_token: token };
          }
        }
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
    authService: getAuthService(),
    aiService: getAIService()
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

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