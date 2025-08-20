import { router } from '../index';
// import { authRouter } from './auth'; // Temporarily disabled for deployment
import { aiRouter } from './ai';
import { projectsRouter } from './projects';
import { lessonsRouter } from './lessons';

export const appRouter = router({
  // auth: authRouter, // Temporarily disabled for deployment
  ai: aiRouter,
  projects: projectsRouter,
  lessons: lessonsRouter,
});

export type AppRouter = typeof appRouter;