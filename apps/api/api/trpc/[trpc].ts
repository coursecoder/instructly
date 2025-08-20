import { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../../src/trpc/routers';
import { getAuthService } from '../../src/services/auth';
import { getAIService } from '../../src/services/aiService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Convert Vercel request to fetch request
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  
  const fetchRequest = new Request(url.toString(), {
    method: req.method,
    headers: req.headers as HeadersInit,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
  });

  const fetchResponse = await fetchRequestHandler({
    endpoint: '/api/trpc',
    req: fetchRequest,
    router: appRouter,
    createContext: async () => ({
      req: req as any,
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

  // Convert fetch response back to Vercel response
  const body = await fetchResponse.text();
  
  // Set headers
  fetchResponse.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  
  res.status(fetchResponse.status).send(body);
}