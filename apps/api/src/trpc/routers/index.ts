import { router } from '../index';
import { authRouter } from './auth';
import { aiRouter } from './ai';
import { projectsRouter } from './projects';
import { lessonsRouter } from './lessons';

export const appRouter = router({
  auth: authRouter,
  ai: aiRouter,
  projects: projectsRouter,
  lessons: lessonsRouter,
});

export type AppRouter = typeof appRouter;