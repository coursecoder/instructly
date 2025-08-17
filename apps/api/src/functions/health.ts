import { FastifyPluginAsync } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import { 
  HealthCheckResponse, 
  createApiSuccess, 
  createApiError, 
  getSystemMemoryUsage, 
  measurePerformance,
  PERFORMANCE_REQUIREMENTS,
  createAppConfig 
} from '@instructly/shared';

// Health check plugin
export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  const config = createAppConfig();
  
  // Initialize Supabase client for database health check
  const supabase = createClient(
    config.database.supabaseUrl,
    config.database.supabaseAnonKey
  );
  
  // Store for performance tracking
  const serverStartTime = Date.now();
  let requestCount = 0;
  let totalResponseTime = 0;
  const activeUsers = new Set<string>();
  
  // Enhanced middleware to track performance metrics
  fastify.addHook('onRequest', async (request) => {
    requestCount++;
    const userAgent = request.headers['user-agent'] || 'unknown';
    activeUsers.add(userAgent);
    
    // Clean up old user agents every 1000 requests to prevent memory leaks
    if (requestCount % 1000 === 0) {
      activeUsers.clear();
    }
    
    // Track request start time for response time calculation
    (request as any).startTime = Date.now();
  });
  
  fastify.addHook('onSend', async (request) => {
    const startTime = (request as any).startTime as number | undefined;
    const responseTime = Date.now() - (startTime || Date.now());
    totalResponseTime += responseTime;
    
    // Log slow requests for performance monitoring
    if (responseTime > 1000) {
      fastify.log.warn(`Slow request detected: ${request.method} ${request.url} took ${responseTime}ms`);
    }
  });
  
  // Health check endpoint (AC: 4)
  fastify.get('/health', async (request, reply) => {
    try {
      // Database connectivity check with response time measurement
      const dbCheck = await measurePerformance(
        async () => {
          const { error } = await supabase
            .from('users')
            .select('id')
            .limit(1);
          
          if (error && error.code !== 'PGRST116') { // Table doesn't exist yet is OK
            throw new Error(`Database connection failed: ${error.message}`);
          }
          
          return true;
        },
        PERFORMANCE_REQUIREMENTS.MAX_ACCESSIBILITY_CHECK_TIME_MS
      );
      
      // Memory usage metrics for scalability monitoring
      const memoryUsage = getSystemMemoryUsage();
      
      // Performance metrics calculation
      const uptime = Date.now() - serverStartTime;
      const avgResponseTime = requestCount > 0 ? totalResponseTime / requestCount : 0;
      const requestsPerMinute = requestCount / (uptime / 60000);
      
      // Determine overall health status
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (!dbCheck.result || dbCheck.timeMs > 1000) {
        status = 'degraded';
      }
      
      if (memoryUsage.percentage > 90 || avgResponseTime > 5000) {
        status = 'unhealthy';
      }
      
      const healthResponse: HealthCheckResponse = {
        status,
        uptime: Math.floor(uptime / 1000), // seconds
        version: process.env.npm_package_version || '0.1.0',
        timestamp: new Date(),
        database: {
          connected: dbCheck.result,
          responseTimeMs: dbCheck.timeMs,
          activeConnections: 1, // Simplified for now
        },
        memory: memoryUsage,
        performance: {
          avgResponseTimeMs: Math.round(avgResponseTime),
          activeUsers: activeUsers.size,
          requestsPerMinute: Math.round(requestsPerMinute),
        },
      };
      
      // Log performance alerts
      if (avgResponseTime > PERFORMANCE_REQUIREMENTS.MAX_LESSON_GENERATION_TIME_MS) {
        fastify.log.warn(`Average response time ${avgResponseTime}ms exceeds NFR1 requirement`);
      }
      
      if (activeUsers.size > PERFORMANCE_REQUIREMENTS.MAX_CONCURRENT_USERS * 0.8) {
        fastify.log.warn(`Active users ${activeUsers.size} approaching NFR2 limit`);
      }
      
      const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
      reply.status(statusCode).send(createApiSuccess(healthResponse));
      
    } catch (error) {
      fastify.log.error({ error }, 'Health check failed');
      reply.status(503).send(createApiError('Health check failed'));
    }
  });
  
  // Simple ping endpoint for basic availability
  fastify.get('/ping', async (request, reply) => {
    reply.send({ pong: true, timestamp: new Date() });
  });
};