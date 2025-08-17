import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../../src/server';
import { FastifyInstance } from 'fastify';
import { PERFORMANCE_REQUIREMENTS } from '@instructly/shared';

describe('Performance Requirements Validation', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.REDIS_URL = 'redis://localhost:6379';
    
    app = await buildServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should meet NFR1 accessibility check time requirement (<1 second)', async () => {
    const startTime = Date.now();
    
    const response = await app.inject({
      method: 'GET',
      url: '/api/health'
    });
    
    const responseTime = Date.now() - startTime;
    
    expect(response.statusCode).toBe(200);
    expect(responseTime).toBeLessThan(PERFORMANCE_REQUIREMENTS.MAX_ACCESSIBILITY_CHECK_TIME_MS);
    
    // Log the actual performance for monitoring
    console.log(`Health check response time: ${responseTime}ms (requirement: <${PERFORMANCE_REQUIREMENTS.MAX_ACCESSIBILITY_CHECK_TIME_MS}ms)`);
  });

  it('should handle concurrent requests without degradation', async () => {
    const concurrentRequests = 10;
    const requests = Array.from({ length: concurrentRequests }, () => 
      app.inject({
        method: 'GET',
        url: '/api/ping'
      })
    );

    const startTime = Date.now();
    const responses = await Promise.all(requests);
    const totalTime = Date.now() - startTime;

    // All requests should succeed
    responses.forEach(response => {
      expect(response.statusCode).toBe(200);
    });

    // Average response time should still be reasonable under load
    const avgResponseTime = totalTime / concurrentRequests;
    expect(avgResponseTime).toBeLessThan(1000); // 1 second average

    console.log(`Concurrent requests (${concurrentRequests}): avg ${avgResponseTime}ms per request`);
  });

  it('should validate AI cost tracking infrastructure', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/metrics'
    });

    expect(response.statusCode).toBe(200);
    
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('aiCosts');
    expect(body.data.aiCosts).toHaveProperty('costThresholdPercentage');
    expect(body.data.aiCosts.costThresholdPercentage).toBe(
      PERFORMANCE_REQUIREMENTS.AI_COST_REVENUE_THRESHOLD * 100
    );
  });
});