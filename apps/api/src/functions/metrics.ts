import { FastifyPluginAsync } from 'fastify';
import { createClient } from '@supabase/supabase-js';

// Metrics plugin for AI cost tracking and performance monitoring
export const metricsRoutes: FastifyPluginAsync = async (fastify) => {
  // Initialize Supabase client for metrics storage
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
  
  // AI cost tracking endpoint
  fastify.get('/metrics', async (request, reply) => {
    try {
      // Get AI usage metrics from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: aiUsage, error: aiError } = await supabase
        .from('ai_usage_logs')
        .select('cost_usd, model_used, operation_type, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      if (aiError && aiError.code !== 'PGRST116') { // Table doesn't exist yet is OK
        throw new Error(`Failed to fetch AI usage: ${aiError.message}`);
      }
      
      // Calculate cost metrics
      const totalCost = (aiUsage || []).reduce((sum, log) => sum + (log.cost_usd || 0), 0);
      const costByModel = (aiUsage || []).reduce((acc, log) => {
        acc[log.model_used] = (acc[log.model_used] || 0) + (log.cost_usd || 0);
        return acc;
      }, {} as Record<string, number>);
      
      // System metrics
      const systemMetrics = {
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memoryUsage: process.memoryUsage(),
      };
      
      const metricsResponse = {
        aiCosts: {
          totalLast30Days: totalCost,
          costByModel,
          costThresholdPercentage: 30, // 30% of revenue
        },
        system: systemMetrics,
        timestamp: new Date(),
      };
      
      reply.send({
        success: true,
        data: metricsResponse,
        timestamp: new Date()
      });
      
    } catch (error) {
      fastify.log.error({ error }, 'Metrics fetch failed');
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch metrics',
        timestamp: new Date()
      });
    }
  });
};