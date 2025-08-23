/// <reference types="vitest" />
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/test-setup.ts'],
    testTimeout: 10000, // 10 seconds timeout
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
      ],
    },
    env: {
      // Test environment variables to prevent database connection issues
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key-very-long-string-for-testing-purposes-only',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-key-very-long-string-for-testing-purposes-only',
      OPENAI_API_KEY: 'sk-test-openai-key-very-long-string-for-testing-purposes-only',
      REDIS_URL: 'redis://localhost:6379',
      NODE_ENV: 'test',
      API_PORT: '3001',
      API_HOST: '0.0.0.0',
      NEXT_PUBLIC_SITE_URL: 'https://test.instructly.app',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@instructly/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
});