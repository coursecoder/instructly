'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../../api/src/trpc/routers';

// Create tRPC React client
const trpcReact = createTRPCReact<AppRouter>();

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
      },
    },
  }));

  const [trpcClient] = useState(() =>
    trpcReact.createClient({
      links: [
        httpBatchLink({
          url: process.env.NODE_ENV === 'development' 
            ? 'http://localhost:3001/api/trpc'
            : '/api/trpc',
          headers() {
            const token = typeof window !== 'undefined' 
              ? localStorage.getItem('auth-token')
              : null;
              
            return token ? {
              authorization: `Bearer ${token}`,
            } : {};
          },
        }),
      ],
    })
  );

  return (
    <trpcReact.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpcReact.Provider>
  );
}