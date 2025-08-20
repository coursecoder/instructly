import { FastifyPluginAsync } from 'fastify';
import { createClient } from '@supabase/supabase-js';

// Health check plugin
export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  // Initialize Supabase client for database health check
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
  
  // Store for performance tracking
  const serverStartTime = Date.now();
  
  // Health check endpoint
  fastify.get('/health', async (request, reply) => {
    const startTime = Date.now();
    
    try {
      // Check database connection
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      const databaseHealth = {
        connected: !error,
        responseTimeMs: Date.now() - startTime,
        activeConnections: 1
      };
      
      // Get basic system info
      const memoryUsage = process.memoryUsage();
      const uptime = Date.now() - serverStartTime;
      
      const healthStatus = {
        status: databaseHealth.connected ? 'healthy' : 'degraded',
        uptime: Math.floor(uptime / 1000), // seconds
        version: '1.3.0',
        timestamp: new Date(),
        database: databaseHealth,
        memory: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
        }
      };
      
      return reply.send({
        success: true,
        data: healthStatus,
        timestamp: new Date()
      });
      
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Health check failed',
        timestamp: new Date()
      });
    }
  });
  
  // Simple ping endpoint
  fastify.get('/ping', async (request, reply) => {
    return reply.send({ 
      pong: true, 
      timestamp: new Date(),
      uptime: Math.floor((Date.now() - serverStartTime) / 1000)
    });
  });
};