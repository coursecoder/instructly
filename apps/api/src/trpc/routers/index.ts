import { router } from '../index';
import { authRouter } from './auth';
import { aiRouter } from './ai';

export const appRouter = router({
  auth: authRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;