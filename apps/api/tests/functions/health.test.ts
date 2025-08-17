import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../../src/server';
import { FastifyInstance } from 'fastify';

describe('Health Check API', () => {
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

  it('should return health status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/health'
    });

    expect(response.statusCode).toBe(200);
    
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('status');
    expect(body.data).toHaveProperty('uptime');
    expect(body.data).toHaveProperty('version');
    expect(body.data).toHaveProperty('timestamp');
    expect(body.data).toHaveProperty('database');
    expect(body.data).toHaveProperty('memory');
    expect(body.data).toHaveProperty('performance');
  });

  it('should include database health information', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/health'
    });

    const body = JSON.parse(response.body);
    const database = body.data.database;
    
    expect(database).toHaveProperty('connected');
    expect(database).toHaveProperty('responseTimeMs');
    expect(database).toHaveProperty('activeConnections');
    expect(typeof database.responseTimeMs).toBe('number');
  });

  it('should include performance metrics', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/health'
    });

    const body = JSON.parse(response.body);
    const performance = body.data.performance;
    
    expect(performance).toHaveProperty('avgResponseTimeMs');
    expect(performance).toHaveProperty('activeUsers');
    expect(performance).toHaveProperty('requestsPerMinute');
    expect(typeof performance.avgResponseTimeMs).toBe('number');
  });

  it('should respond within performance requirements (NFR1)', async () => {
    const startTime = Date.now();
    
    const response = await app.inject({
      method: 'GET',
      url: '/api/health'
    });
    
    const responseTime = Date.now() - startTime;
    
    expect(response.statusCode).toBe(200);
    expect(responseTime).toBeLessThan(1000); // NFR1: < 1 second for health checks
  });

  it('should handle ping endpoint', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/ping'
    });

    expect(response.statusCode).toBe(200);
    
    const body = JSON.parse(response.body);
    expect(body.pong).toBe(true);
    expect(body).toHaveProperty('timestamp');
  });
});