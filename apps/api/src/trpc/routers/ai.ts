import { router, protectedProcedure } from '../index';
import { TRPCError } from '@trpc/server';
import { topicAnalysisRequestSchema } from '@instructly/shared';

export const aiRouter = router({
  /**
   * Analyze topics using AI classification
   * Requires authentication and performs cost checking
   */
  analyzeTopics: protectedProcedure
    .input(topicAnalysisRequestSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Validate user exists and get user ID
        if (!ctx.user?.id) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User authentication required'
          });
        }

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
   * Get user's current monthly AI cost usage
   */
  getMonthlyCost: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        if (!ctx.user?.id) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User authentication required'
          });
        }

        const monthlyCost = await ctx.aiService.getUserMonthlyCost(ctx.user.id);
        const costCheck = await ctx.aiService.checkCostLimits(ctx.user.id);

        return {
          success: true,
          data: {
            currentCost: monthlyCost,
            limit: costCheck.limit,
            withinLimits: costCheck.withinLimits,
            percentageUsed: (monthlyCost / costCheck.limit) * 100
          },
          timestamp: new Date()
        };

      } catch (error) {
        console.error('Failed to get monthly cost:', {
          userId: ctx.user?.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve cost information'
        });
      }
    }),

  /**
   * Check AI service health and availability
   */
  healthCheck: protectedProcedure
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