import { vi } from 'vitest';

export const mockAuthMethods = {
  register: { mutate: vi.fn() },
  login: { mutate: vi.fn() },
  logout: { mutate: vi.fn() },
  resetPassword: { mutate: vi.fn() },
  updateProfile: { mutate: vi.fn() },
  me: { query: vi.fn() },
};

export const createTRPCProxyClient = vi.fn(() => ({
  auth: mockAuthMethods,
}));

export const httpBatchLink = vi.fn(() => ({ links: [] }));