import { FastifyPluginAsync } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import { 
  createApiSuccess, 
  createApiError, 
  PERFORMANCE_REQUIREMENTS,
  createAppConfig 
} from '@instructly/shared';

// Metrics plugin for AI cost tracking and performance monitoring
export const metricsRoutes: FastifyPluginAsync = async (fastify) => {
  const config = createAppConfig();
  
  // Initialize Supabase client for metrics storage
  const supabase = createClient(
    config.database.supabaseUrl,
    config.database.supabaseServiceRoleKey // Use service role for admin operations
  );
  
  // AI cost tracking endpoint (NFR5: 30% revenue threshold)
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
      
      // Performance metrics
      const performanceMetrics = {
        maxGenerationTimeMs: PERFORMANCE_REQUIREMENTS.MAX_LESSON_GENERATION_TIME_MS,
        maxAccessibilityCheckTimeMs: PERFORMANCE_REQUIREMENTS.MAX_ACCESSIBILITY_CHECK_TIME_MS,
        maxConcurrentUsers: PERFORMANCE_REQUIREMENTS.MAX_CONCURRENT_USERS,
        aiCostThreshold: PERFORMANCE_REQUIREMENTS.AI_COST_REVENUE_THRESHOLD,
      };
      
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
          costThresholdPercentage: PERFORMANCE_REQUIREMENTS.AI_COST_REVENUE_THRESHOLD * 100,
        },
        performance: performanceMetrics,
        system: systemMetrics,
        timestamp: new Date(),
      };
      
      // Log cost alerts if approaching threshold
      if (totalCost > 100) { // Arbitrary revenue base for demo
        const costPercentage = totalCost / 333.33; // Assuming $333.33 monthly revenue for 30% = $100
        if (costPercentage > PERFORMANCE_REQUIREMENTS.AI_COST_REVENUE_THRESHOLD * 0.8) {
          fastify.log.warn(`AI costs at ${(costPercentage * 100).toFixed(1)}% of revenue threshold`);
        }
      }
      
      reply.send(createApiSuccess(metricsResponse));
      
    } catch (error) {
      fastify.log.error({ error }, 'Metrics fetch failed');
      reply.status(500).send(createApiError('Failed to fetch metrics'));
    }
  });
  
  // Endpoint to log AI usage (for future AI integrations)
  fastify.post('/metrics/ai-usage', async (request, reply) => {
    try {
      const body = request.body as any;
      
      // Validate AI usage log structure
      const requiredFields = ['userId', 'modelUsed', 'operationType', 'inputTokens', 'outputTokens', 'costUsd'];
      for (const field of requiredFields) {
        if (!(field in body)) {
          return reply.status(400).send(createApiError(`Missing required field: ${field}`));
        }
      }
      
      const { data, error } = await supabase
        .from('ai_usage_logs')
        .insert([{
          user_id: body.userId,
          lesson_id: body.lessonId || null,
          model_used: body.modelUsed,
          operation_type: body.operationType,
          input_tokens: body.inputTokens,
          output_tokens: body.outputTokens,
          cost_usd: body.costUsd,
          processing_time_ms: body.processingTimeMs || null,
          created_at: new Date().toISOString(),
        }])
        .select();
      
      if (error) {
        throw new Error(`Failed to log AI usage: ${error.message}`);
      }
      
      reply.status(201).send(createApiSuccess({ logged: true, id: data?.[0]?.id }));
      
    } catch (error) {
      fastify.log.error({ error }, 'AI usage logging failed');
      reply.status(500).send(createApiError('Failed to log AI usage'));
    }
  });
  
  // Concurrent user tracking endpoint
  fastify.post('/metrics/user-activity', async (request, reply) => {
    try {
      // This would typically integrate with Redis for real-time tracking
      // For now, we'll just acknowledge the activity
      
      const body = request.body as any;
      const { userId, action } = body as { userId: string; action: 'login' | 'logout' | 'active' };
      
      fastify.log.info(`User activity: ${userId} - ${action}`);
      
      reply.send(createApiSuccess({ 
        acknowledged: true, 
        userId, 
        action, 
        timestamp: new Date() 
      }));
      
    } catch (error) {
      fastify.log.error({ error }, 'User activity tracking failed');
      reply.status(500).send(createApiError('Failed to track user activity'));
    }
  });
};