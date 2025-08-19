import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTRPCMsw } from 'msw-trpc';
import { setupServer } from 'msw/node';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../src/trpc/routers';
import { getAIService, resetAIService } from '../../src/services/aiService';

// Mock AI Service
vi.mock('../../src/services/aiService', () => ({
  getAIService: vi.fn(),
  resetAIService: vi.fn()
}));

const mockAIService = {
  analyzeTopics: vi.fn(),
  getUserMonthlyCost: vi.fn(),
  checkCostLimits: vi.fn()
};

const trpcMsw = createTRPCMsw<AppRouter>();

const server = setupServer(
  trpcMsw.ai.analyzeTopics.mutation(async (req, res, ctx) => {
    const { input } = req;
    
    if (!input.topics || input.topics.length === 0) {
      return res(ctx.status(400), ctx.json({
        success: false,
        error: 'At least one topic required'
      }));
    }

    return res(ctx.json({
      success: true,
      data: {
        topics: input.topics.map((topic, index) => ({
          id: `topic-${index}`,
          content: topic,
          classification: 'concepts' as const,
          aiAnalysis: {
            contentType: 'test analysis',
            rationale: 'test rationale',
            recommendedMethods: ['method1', 'method2'],
            confidence: 0.9,
            modelUsed: 'gpt-3.5-turbo' as const
          },
          generatedAt: new Date()
        })),
        totalCost: 0.05,
        processingTime: 1500
      },
      timestamp: new Date()
    }));
  }),

  trpcMsw.ai.getMonthlyCost.query(async (req, res, ctx) => {
    return res(ctx.json({
      success: true,
      data: {
        currentCost: 5.50,
        limit: 50,
        withinLimits: true,
        percentageUsed: 11
      },
      timestamp: new Date()
    }));
  }),

  trpcMsw.ai.healthCheck.query(async (req, res, ctx) => {
    return res(ctx.json({
      success: true,
      data: {
        aiServiceAvailable: true,
        timestamp: new Date(),
        status: 'healthy'
      }
    }));
  })
);

describe('AI tRPC Router', () => {
  let client: ReturnType<typeof createTRPCClient<AppRouter>>;

  beforeEach(() => {
    server.listen();
    
    // Mock getAIService to return our mock
    vi.mocked(getAIService).mockReturnValue(mockAIService as any);
    
    client = createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: 'http://localhost:3000/api/trpc',
          headers: {
            authorization: 'Bearer test-token'
          }
        })
      ]
    });

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    server.resetHandlers();
    server.close();
  });

  describe('analyzeTopics', () => {
    it('should successfully analyze topics', async () => {
      mockAIService.checkCostLimits.mockResolvedValue({
        withinLimits: true,
        currentCost: 5,
        limit: 50
      });

      mockAIService.analyzeTopics.mockResolvedValue({
        topics: [{
          id: 'test-topic-1',
          content: 'JavaScript fundamentals',
          classification: 'concepts',
          aiAnalysis: {
            contentType: 'programming concepts',
            rationale: 'This involves understanding programming concepts',
            recommendedMethods: ['hands-on coding', 'examples'],
            confidence: 0.92,
            modelUsed: 'gpt-3.5-turbo'
          },
          generatedAt: new Date()
        }],
        totalCost: 0.03,
        processingTime: 1200
      });

      const result = await client.ai.analyzeTopics.mutate({
        topics: ['JavaScript fundamentals'],
        analysisType: 'instructional_design'
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.topics).toHaveLength(1);
      expect(result.data.topics[0].content).toBe('JavaScript fundamentals');
    });

    it('should reject requests with no topics', async () => {
      await expect(
        client.ai.analyzeTopics.mutate({
          topics: [],
          analysisType: 'instructional_design'
        })
      ).rejects.toThrow();
    });

    it('should reject requests exceeding topic limit', async () => {
      const tooManyTopics = Array.from({ length: 11 }, (_, i) => `Topic ${i + 1}`);
      
      await expect(
        client.ai.analyzeTopics.mutate({
          topics: tooManyTopics,
          analysisType: 'instructional_design'
        })
      ).rejects.toThrow();
    });

    it('should handle cost limit exceeded', async () => {
      mockAIService.checkCostLimits.mockResolvedValue({
        withinLimits: false,
        currentCost: 55,
        limit: 50
      });

      await expect(
        client.ai.analyzeTopics.mutate({
          topics: ['Test topic'],
          analysisType: 'instructional_design'
        })
      ).rejects.toThrow('Monthly AI cost limit exceeded');
    });

    it('should handle AI service errors gracefully', async () => {
      mockAIService.checkCostLimits.mockResolvedValue({
        withinLimits: true,
        currentCost: 5,
        limit: 50
      });

      mockAIService.analyzeTopics.mockRejectedValue(new Error('OpenAI API error'));

      await expect(
        client.ai.analyzeTopics.mutate({
          topics: ['Test topic'],
          analysisType: 'instructional_design'
        })
      ).rejects.toThrow();
    });

    it('should handle rate limiting errors', async () => {
      mockAIService.checkCostLimits.mockResolvedValue({
        withinLimits: true,
        currentCost: 5,
        limit: 50
      });

      mockAIService.analyzeTopics.mockRejectedValue(new Error('rate limit exceeded'));

      await expect(
        client.ai.analyzeTopics.mutate({
          topics: ['Test topic'],
          analysisType: 'instructional_design'
        })
      ).rejects.toThrow();
    });
  });

  describe('getMonthlyCost', () => {
    it('should return user monthly cost information', async () => {
      mockAIService.getUserMonthlyCost.mockResolvedValue(5.50);
      mockAIService.checkCostLimits.mockResolvedValue({
        withinLimits: true,
        currentCost: 5.50,
        limit: 50
      });

      const result = await client.ai.getMonthlyCost.query();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        currentCost: 5.50,
        limit: 50,
        withinLimits: true,
        percentageUsed: 11
      });
    });

    it('should handle database errors gracefully', async () => {
      mockAIService.getUserMonthlyCost.mockRejectedValue(new Error('Database error'));

      await expect(
        client.ai.getMonthlyCost.query()
      ).rejects.toThrow();
    });
  });

  describe('healthCheck', () => {
    it('should return service health status', async () => {
      // Mock environment variable
      process.env.OPENAI_API_KEY = 'test-key';

      const result = await client.ai.healthCheck.query();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        aiServiceAvailable: true,
        timestamp: expect.any(Date),
        status: 'healthy'
      });
    });

    it('should detect misconfigured service', async () => {
      // Remove environment variable
      delete process.env.OPENAI_API_KEY;

      const result = await client.ai.healthCheck.query();

      expect(result.success).toBe(true);
      expect(result.data.aiServiceAvailable).toBe(false);
      expect(result.data.status).toBe('misconfigured');
    });

    it('should handle health check errors', async () => {
      // Restore environment variable for this test
      process.env.OPENAI_API_KEY = 'test-key';

      // The health check itself shouldn't throw, but should return unhealthy status
      const result = await client.ai.healthCheck.query();
      
      // Should still return a result even if there are internal errors
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('authentication', () => {
    it('should require authentication for all endpoints', async () => {
      // Create client without auth header
      const unauthenticatedClient = createTRPCClient<AppRouter>({
        links: [
          httpBatchLink({
            url: 'http://localhost:3000/api/trpc'
            // No authorization header
          })
        ]
      });

      await expect(
        unauthenticatedClient.ai.analyzeTopics.mutate({
          topics: ['Test topic'],
          analysisType: 'instructional_design'
        })
      ).rejects.toThrow('UNAUTHORIZED');

      await expect(
        unauthenticatedClient.ai.getMonthlyCost.query()
      ).rejects.toThrow('UNAUTHORIZED');

      await expect(
        unauthenticatedClient.ai.healthCheck.query()
      ).rejects.toThrow('UNAUTHORIZED');
    });
  });

  describe('input validation', () => {
    it('should validate topic analysis request schema', async () => {
      // Invalid analysis type
      await expect(
        client.ai.analyzeTopics.mutate({
          topics: ['Valid topic'],
          analysisType: 'invalid_type' as any
        })
      ).rejects.toThrow();

      // Topic too long
      await expect(
        client.ai.analyzeTopics.mutate({
          topics: ['x'.repeat(1001)], // Exceeds 1000 character limit
          analysisType: 'instructional_design'
        })
      ).rejects.toThrow();

      // Empty topic string
      await expect(
        client.ai.analyzeTopics.mutate({
          topics: [''], // Empty string
          analysisType: 'instructional_design'
        })
      ).rejects.toThrow();
    });
  });
});