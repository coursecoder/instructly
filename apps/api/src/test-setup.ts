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
              model_used: 'gpt-5',
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

// Mock for tests - no additional shared mocking needed