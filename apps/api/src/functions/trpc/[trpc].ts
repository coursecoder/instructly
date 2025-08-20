import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../../trpc/routers';
import { getAuthService } from '../../services/auth';
import { getAIService } from '../../services/aiService';

export default async function handler(req: Request) {
  // Determine endpoint from URL
  const url = new URL(req.url);
  const endpoint = url.pathname.startsWith('/api/trpc') ? '/api/trpc' : '/trpc';
  
  return fetchRequestHandler({
    endpoint,
    req,
    router: appRouter,
    createContext: async () => ({
      req: req as any, // Simplified for fetch adapter
      user: null,
      session: null, 
      authService: getAuthService(),
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