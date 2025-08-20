import { createTRPCNext } from '@trpc/next';
import { httpBatchLink } from '@trpc/client';

function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // browser should use the API server directly
    return process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3001' 
      : 'https://instructly-api-czqc-iora8y4ru-coleens-projects-606beb08.vercel.app';
  }
  if (process.env.VERCEL_URL)
    // reference for vercel.com
    return `https://${process.env.VERCEL_URL}`;
  if (process.env.RENDER_INTERNAL_HOSTNAME)
    // reference for render.com
    return `http://${process.env.RENDER_INTERNAL_HOSTNAME}:${process.env.PORT}`;
  // assume localhost API server
  return `http://localhost:3001`;
}

import type { AppRouter } from '../../../api/src/trpc/routers';

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        httpBatchLink({
          /**
           * If you want to use SSR, you need to use the server's full URL
           * @link https://trpc.io/docs/ssr
           **/
          url: `${getBaseUrl()}/trpc`,
          
          // You can pass any HTTP headers you wish here
          async headers() {
            const token = typeof window !== 'undefined' 
              ? localStorage.getItem('auth-token')
              : null;
              
            return token ? {
              authorization: `Bearer ${token}`,
            } : {};
          },
        }),
      ],
    };
  },
  /**
   * @link https://trpc.io/docs/ssr
   **/
  ssr: false,
});