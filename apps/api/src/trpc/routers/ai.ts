import { router, publicProcedure, protectedProcedure } from '../index';
import { TRPCError } from '@trpc/server';
import { topicAnalysisRequestSchema } from '../../types/shared';

export const aiRouter = router({
  /**
   * Get monthly cost for authenticated user
   */
  getMonthlyCost: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const monthlyCost = await ctx.aiService.getUserMonthlyCost(ctx.user.id);
        const costCheck = await ctx.aiService.checkCostLimits(ctx.user.id);

        return {
          success: true,
          data: {
            currentCost: monthlyCost,
            limit: costCheck.limit,
            withinLimits: costCheck.withinLimits,
            percentageUsed: costCheck.limit > 0 ? (monthlyCost / costCheck.limit) * 100 : 0
          }
        };
      } catch (error) {
        return {
          success: false,
          error: 'Failed to get monthly cost',
          data: {
            currentCost: 0,
            limit: 50,
            withinLimits: true,
            percentageUsed: 0
          }
        };
      }
    }),

  /**
   * Analyze topics using AI classification
   */
  analyzeTopics: protectedProcedure
    .input(topicAnalysisRequestSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Check cost limits before processing
        const costCheck = await ctx.aiService.checkCostLimits(ctx.user.id);
        if (!costCheck.withinLimits) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Monthly AI cost limit exceeded. Current usage: $${costCheck.currentCost.toFixed(2)}, Limit: $${costCheck.limit.toFixed(2)}`
          });
        }

        // Perform AI analysis
        const result = await ctx.aiService.analyzeTopics(input, ctx.user.id);

        return {
          success: true,
          data: result,
          timestamp: new Date()
        };

      } catch (error) {
        // Log error for monitoring
        console.error('AI analysis failed:', {
          userId: ctx.user?.id,
          input,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        // Handle specific error types
        if (error instanceof TRPCError) {
          throw error;
        }

        // Handle rate limiting errors
        if (error instanceof Error && error.message.includes('rate limit')) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'AI service rate limit exceeded. Please try again later.'
          });
        }

        // Handle AI service errors with graceful degradation
        if (error instanceof Error && error.message.includes('OpenAI')) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'AI analysis service is temporarily unavailable. Please try again later.'
          });
        }

        // Generic error handling
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to analyze topics. Please try again.'
        });
      }
    }),


  /**
   * Check AI service health and availability
   */
  healthCheck: publicProcedure
    .query(async () => {
      try {
        // Simple health check - verify OpenAI API key is configured
        const isConfigured = !!process.env.OPENAI_API_KEY;
        
        return {
          success: true,
          data: {
            aiServiceAvailable: isConfigured,
            timestamp: new Date(),
            status: isConfigured ? 'healthy' : 'misconfigured'
          }
        };

      } catch (error) {
        console.error('AI health check failed:', error);
        
        return {
          success: false,
          data: {
            aiServiceAvailable: false,
            timestamp: new Date(),
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        };
      }
    })
});

export type AIRouter = typeof aiRouter;