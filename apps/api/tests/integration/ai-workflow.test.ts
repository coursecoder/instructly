import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getAIService, resetAIService } from '../../src/services/aiService';
import { createTRPCContext } from '../../src/trpc/index';
import { appRouter } from '../../src/trpc/routers';
import type { TopicAnalysisRequest } from '@instructly/shared/types';

// Mock OpenAI for integration tests
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  classification: 'concepts',
                  contentType: 'programming concepts',
                  rationale: 'This topic involves understanding programming concepts and abstractions.',
                  recommendedMethods: ['hands-on coding', 'examples and non-examples', 'guided practice'],
                  confidence: 0.89
                })
              }
            }],
            usage: {
              prompt_tokens: 120,
              completion_tokens: 65
            }
          })
        }
      }
    }))
  };
});

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn().mockResolvedValue({
            data: [
              { cost_usd: 0.05 },
              { cost_usd: 0.03 }
            ],
            error: null
          })
        }))
      }))
    }))
  }))
}));

describe('AI Workflow Integration Tests', () => {
  let caller: any;

  beforeEach(async () => {
    // Set up environment
    process.env.OPENAI_API_KEY = 'test-api-key';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

    // Reset service
    resetAIService();

    // Create mock context with authenticated user
    const mockContext = {
      req: {} as any,
      user: { id: 'test-user-123' },
      session: { access_token: 'test-token' },
      authService: {} as any,
      aiService: getAIService()
    };

    // Create tRPC caller
    caller = appRouter.createCaller(mockContext);
  });

  afterEach(() => {
    vi.clearAllMocks();
    resetAIService();
  });

  describe('Complete Topic Analysis Workflow', () => {
    it('should successfully complete end-to-end topic analysis', async () => {
      const request: TopicAnalysisRequest = {
        topics: ['JavaScript variables and data types'],
        analysisType: 'instructional_design'
      };

      const result = await caller.ai.analyzeTopics(request);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.topics).toHaveLength(1);

      const topic = result.data.topics[0];
      expect(topic).toMatchObject({
        id: expect.any(String),
        content: 'JavaScript variables and data types',
        classification: 'concepts',
        aiAnalysis: {
          contentType: 'programming concepts',
          rationale: expect.any(String),
          recommendedMethods: expect.arrayContaining([
            expect.any(String)
          ]),
          confidence: expect.any(Number),
          modelUsed: expect.any(String)
        },
        generatedAt: expect.any(Date)
      });

      expect(topic.aiAnalysis.confidence).toBeGreaterThan(0);
      expect(topic.aiAnalysis.confidence).toBeLessThanOrEqual(1);
      expect(topic.aiAnalysis.recommendedMethods.length).toBeGreaterThan(0);
    });

    it('should handle batch analysis of multiple topics', async () => {
      const request: TopicAnalysisRequest = {
        topics: [
          'Python syntax basics',
          'Object-oriented programming principles',
          'Database normalization'
        ],
        analysisType: 'instructional_design'
      };

      const result = await caller.ai.analyzeTopics(request);

      expect(result.success).toBe(true);
      expect(result.data.topics).toHaveLength(3);
      expect(result.data.totalCost).toBeGreaterThan(0);
      expect(result.data.processingTime).toBeGreaterThan(0);

      // Each topic should have required properties
      result.data.topics.forEach((topic, index) => {
        expect(topic.content).toBe(request.topics[index]);
        expect(topic.id).toBeDefined();
        expect(topic.classification).toMatch(/^(facts|concepts|processes|procedures|principles)$/);
        expect(topic.aiAnalysis).toBeDefined();
      });
    });

    it('should track and return cost information', async () => {
      // First get baseline cost
      const initialCost = await caller.ai.getMonthlyCost();
      expect(initialCost.success).toBe(true);
      expect(initialCost.data.currentCost).toBe(0.08); // 0.05 + 0.03 from mock

      // Perform analysis
      const request: TopicAnalysisRequest = {
        topics: ['Test topic for cost tracking'],
        analysisType: 'instructional_design'
      };

      const analysisResult = await caller.ai.analyzeTopics(request);
      expect(analysisResult.success).toBe(true);
      expect(analysisResult.data.totalCost).toBeGreaterThan(0);

      // Cost should be calculated correctly
      const expectedCost = (120 * 0.0005 / 1000) + (65 * 0.0015 / 1000); // GPT-3.5-turbo pricing
      expect(analysisResult.data.totalCost).toBeCloseTo(expectedCost, 6);
    });

    it('should enforce cost limits', async () => {
      // Mock high cost usage
      const aiService = getAIService();
      vi.spyOn(aiService, 'checkCostLimits').mockResolvedValue({
        withinLimits: false,
        currentCost: 55,
        limit: 50
      });

      const request: TopicAnalysisRequest = {
        topics: ['Test topic'],
        analysisType: 'instructional_design'
      };

      await expect(caller.ai.analyzeTopics(request))
        .rejects.toThrow('Monthly AI cost limit exceeded');
    });

    it('should provide health check information', async () => {
      const result = await caller.ai.healthCheck();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        aiServiceAvailable: true,
        timestamp: expect.any(Date),
        status: 'healthy'
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle OpenAI API failures gracefully', async () => {
      // Mock OpenAI failure
      const aiService = getAIService();
      vi.spyOn(aiService, 'analyzeTopics').mockRejectedValue(new Error('OpenAI API error'));

      const request: TopicAnalysisRequest = {
        topics: ['Test topic'],
        analysisType: 'instructional_design'
      };

      await expect(caller.ai.analyzeTopics(request))
        .rejects.toThrow('Failed to analyze topics');
    });

    it('should handle rate limiting errors', async () => {
      // Mock rate limiting
      const aiService = getAIService();
      vi.spyOn(aiService, 'analyzeTopics').mockRejectedValue(new Error('rate limit exceeded'));

      const request: TopicAnalysisRequest = {
        topics: ['Test topic'],
        analysisType: 'instructional_design'
      };

      await expect(caller.ai.analyzeTopics(request))
        .rejects.toThrow('AI service rate limit exceeded');
    });

    it('should require authentication for all endpoints', async () => {
      // Create unauthenticated context
      const unauthenticatedContext = {
        req: {} as any,
        user: null,
        session: null,
        authService: {} as any,
        aiService: getAIService()
      };

      const unauthenticatedCaller = appRouter.createCaller(unauthenticatedContext);

      await expect(unauthenticatedCaller.ai.analyzeTopics({
        topics: ['Test topic'],
        analysisType: 'instructional_design'
      })).rejects.toThrow('Authentication required');

      await expect(unauthenticatedCaller.ai.getMonthlyCost())
        .rejects.toThrow('Authentication required');

      await expect(unauthenticatedCaller.ai.healthCheck())
        .rejects.toThrow('Authentication required');
    });
  });

  describe('Input Validation Integration', () => {
    it('should validate topic analysis request input', async () => {
      // Empty topics array
      await expect(caller.ai.analyzeTopics({
        topics: [],
        analysisType: 'instructional_design'
      })).rejects.toThrow();

      // Too many topics
      const tooManyTopics = Array.from({ length: 11 }, (_, i) => `Topic ${i + 1}`);
      await expect(caller.ai.analyzeTopics({
        topics: tooManyTopics,
        analysisType: 'instructional_design'
      })).rejects.toThrow();

      // Invalid analysis type
      await expect(caller.ai.analyzeTopics({
        topics: ['Valid topic'],
        analysisType: 'invalid_type' as any
      })).rejects.toThrow();

      // Topic too long
      await expect(caller.ai.analyzeTopics({
        topics: ['x'.repeat(1001)],
        analysisType: 'instructional_design'
      })).rejects.toThrow();
    });
  });

  describe('Caching Integration', () => {
    it('should use cache for repeated requests', async () => {
      const request: TopicAnalysisRequest = {
        topics: ['Cached topic test'],
        analysisType: 'instructional_design'
      };

      // First request
      const result1 = await caller.ai.analyzeTopics(request);
      expect(result1.success).toBe(true);

      // Second request should use cache (lower cost)
      const result2 = await caller.ai.analyzeTopics(request);
      expect(result2.success).toBe(true);
      expect(result2.data.totalCost).toBe(0); // Cached results have no additional cost

      // Results should be the same
      expect(result1.data.topics[0].content).toBe(result2.data.topics[0].content);
    });
  });

  describe('Model Selection Integration', () => {
    it('should select appropriate model based on topic complexity', async () => {
      // Simple topic should use GPT-3.5-turbo
      const simpleRequest: TopicAnalysisRequest = {
        topics: ['Basic math'],
        analysisType: 'instructional_design'
      };

      const simpleResult = await caller.ai.analyzeTopics(simpleRequest);
      expect(simpleResult.data.topics[0].aiAnalysis.modelUsed).toBe('gpt-3.5-turbo');

      // Complex topic should use GPT-5 (mocked as GPT-4o)
      const complexRequest: TopicAnalysisRequest = {
        topics: ['Advanced strategic framework design and analysis methodology for enterprise decision-making'],
        analysisType: 'instructional_design'
      };

      const complexResult = await caller.ai.analyzeTopics(complexRequest);
      expect(complexResult.data.topics[0].aiAnalysis.modelUsed).toBe('gpt-5');
    });
  });

  describe('Performance Integration', () => {
    it('should complete analysis within reasonable time', async () => {
      const startTime = Date.now();

      const request: TopicAnalysisRequest = {
        topics: ['Performance test topic'],
        analysisType: 'instructional_design'
      };

      const result = await caller.ai.analyzeTopics(request);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.data.processingTime).toBeGreaterThan(0);
    });
  });
});