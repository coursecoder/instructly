import { vi } from 'vitest';

// Mock Supabase client to prevent actual database connections during tests
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => ({
          data: [{ id: 'test-user-id' }],
          error: null,
        })),
        gte: vi.fn(() => ({
          data: [
            {
              cost_usd: 0.05,
              model_used: 'gpt-4',
              operation_type: 'chat',
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
          error: null,
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          data: [{ id: 'test-log-id' }],
          error: null,
        })),
      })),
    })),
  })),
}));

// Mock performance measurement to speed up tests
vi.mock('@instructly/shared', async () => {
  const actual = await vi.importActual('@instructly/shared');
  return {
    ...actual,
    measurePerformance: vi.fn(async (operation, maxTimeMs) => {
      const result = await operation();
      return {
        result,
        timeMs: 50, // Mock fast response time
        withinLimit: true,
      };
    }),
    createAppConfig: vi.fn(() => ({
      database: {
        url: 'postgresql://test:test@localhost:5432/test',
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
        supabaseServiceRoleKey: 'test-service-key',
      },
      ai: {
        openaiApiKey: 'test-openai-key',
      },
      cache: {
        redisUrl: 'redis://localhost:6379',
      },
      environment: 'development' as const,
    })),
  };
});