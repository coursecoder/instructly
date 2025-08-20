import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../src/trpc/routers';
import { getAuthService } from '../src/services/auth-stub';
import { getAIService } from '../src/services/aiService';

export default async function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: '/trpc',
    req,
    router: appRouter,
    createContext: async () => ({
      req: req as any, // Simplified for fetch adapter
      user: null,
      session: null, 
      authService: getAuthService() as any,
      aiService: getAIService(),
    }),
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`
            );
          }
        : undefined,
  });
}