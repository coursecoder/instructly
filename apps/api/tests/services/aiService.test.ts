import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getAIService, resetAIService } from '../../src/services/aiService';
import type { TopicAnalysisRequest } from '@instructly/shared/types';

// Mock OpenAI
const mockCreate = vi.fn();
const mockOpenAI = {
  chat: {
    completions: {
      create: mockCreate
    }
  }
};

vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => mockOpenAI)
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
              { cost_usd: 0.03 },
              { cost_usd: 0.02 }
            ],
            error: null
          })
        }))
      }))
    }))
  }))
}));

describe('AIService', () => {
  let aiService: any;

  beforeEach(() => {
    // Reset environment variables
    process.env.OPENAI_API_KEY = 'test-api-key';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    
    // Reset service instance
    resetAIService();
    aiService = getAIService();
  });

  afterEach(() => {
    vi.clearAllMocks();
    resetAIService();
  });

  describe('constructor', () => {
    it('should throw error if OpenAI API key is missing', () => {
      delete process.env.OPENAI_API_KEY;
      resetAIService();
      
      expect(() => getAIService()).toThrow('OPENAI_API_KEY environment variable is required');
    });

    it('should throw error if Supabase configuration is missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      resetAIService();
      
      expect(() => getAIService()).toThrow('Supabase configuration missing');
    });

    it('should initialize successfully with proper environment variables', () => {
      expect(() => getAIService()).not.toThrow();
    });
  });

  describe('analyzeTopics', () => {
    it('should successfully analyze topics and return formatted results', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              classification: 'concepts',
              contentType: 'abstract theoretical framework',
              rationale: 'This topic involves understanding abstract principles and theoretical concepts.',
              recommendedMethods: ['conceptual mapping', 'case studies', 'guided discovery'],
              confidence: 0.92
            })
          }
        }],
        usage: {
          prompt_tokens: 150,
          completion_tokens: 80
        }
      };

      mockCreate.mockResolvedValue(mockResponse);

      const request: TopicAnalysisRequest = {
        topics: ['Object-oriented programming concepts'],
        analysisType: 'instructional_design'
      };

      const result = await aiService.analyzeTopics(request, 'test-user-id');

      expect(result).toEqual({
        topics: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            content: 'Object-oriented programming concepts',
            classification: 'concepts',
            aiAnalysis: {
              contentType: 'abstract theoretical framework',
              rationale: 'This topic involves understanding abstract principles and theoretical concepts.',
              recommendedMethods: ['conceptual mapping', 'case studies', 'guided discovery'],
              confidence: 0.92,
              modelUsed: 'gpt-3.5-turbo'
            },
            generatedAt: expect.any(Date)
          })
        ]),
        totalCost: expect.any(Number),
        processingTime: expect.any(Number)
      });

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('instructional designer')
          }),
          expect.objectContaining({
            role: 'user',
            content: 'Analyze this topic: "Object-oriented programming concepts"'
          })
        ]),
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      });
    });

    it('should use GPT-5 for complex topics', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              classification: 'principles',
              contentType: 'complex decision-making framework',
              rationale: 'This involves sophisticated analysis and evaluation.',
              recommendedMethods: ['problem-based learning', 'simulation'],
              confidence: 0.88
            })
          }
        }],
        usage: {
          prompt_tokens: 200,
          completion_tokens: 120
        }
      };

      mockCreate.mockResolvedValue(mockResponse);

      const request: TopicAnalysisRequest = {
        topics: ['Advanced strategic framework design and analysis methodology for enterprise-level decision making'],
        analysisType: 'instructional_design'
      };

      await aiService.analyzeTopics(request, 'test-user-id');

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o' // GPT-5 proxy
        })
      );
    });

    it('should handle multiple topics in batch', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              classification: 'facts',
              contentType: 'specific information',
              rationale: 'Factual information to be memorized.',
              recommendedMethods: ['flashcards', 'repetition'],
              confidence: 0.95
            })
          }
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50
        }
      };

      mockCreate.mockResolvedValue(mockResponse);

      const request: TopicAnalysisRequest = {
        topics: ['Python syntax', 'JavaScript variables', 'SQL commands'],
        analysisType: 'instructional_design'
      };

      const result = await aiService.analyzeTopics(request, 'test-user-id');

      expect(result.topics).toHaveLength(3);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(3);
    });

    it('should return cached results when available', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              classification: 'procedures',
              contentType: 'step-by-step process',
              rationale: 'Sequential steps to follow.',
              recommendedMethods: ['demonstration', 'practice'],
              confidence: 0.90
            })
          }
        }],
        usage: {
          prompt_tokens: 120,
          completion_tokens: 60
        }
      };

      mockCreate.mockResolvedValue(mockResponse);

      const request: TopicAnalysisRequest = {
        topics: ['How to set up a development environment'],
        analysisType: 'instructional_design'
      };

      // First call
      const result1 = await aiService.analyzeTopics(request, 'test-user-id');
      
      // Second call should use cache
      const result2 = await aiService.analyzeTopics(request, 'test-user-id');

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
      expect(result1.topics[0].content).toBe(result2.topics[0].content);
    });

    it('should handle OpenAI API errors gracefully', async () => {
      mockCreate.mockRejectedValue(new Error('OpenAI API error'));

      const request: TopicAnalysisRequest = {
        topics: ['Test topic'],
        analysisType: 'instructional_design'
      };

      await expect(aiService.analyzeTopics(request, 'test-user-id'))
        .rejects.toThrow('AI analysis failed: OpenAI API error');
    });

    it('should log AI usage for cost tracking', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              classification: 'concepts',
              contentType: 'abstract idea',
              rationale: 'Conceptual understanding required.',
              recommendedMethods: ['examples', 'analogies'],
              confidence: 0.85
            })
          }
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50
        }
      };

      mockCreate.mockResolvedValue(mockResponse);

      const request: TopicAnalysisRequest = {
        topics: ['Test concept'],
        analysisType: 'instructional_design'
      };

      await aiService.analyzeTopics(request, 'test-user-id');

      // Verify that Supabase insert was called for logging
      expect(aiService.supabase.from).toHaveBeenCalledWith('ai_usage_logs');
    });
  });

  describe('getUserMonthlyCost', () => {
    it('should calculate total monthly cost correctly', async () => {
      const result = await aiService.getUserMonthlyCost('test-user-id');

      expect(result).toBe(0.10); // 0.05 + 0.03 + 0.02
    });

    it('should return 0 if database query fails', async () => {
      // Mock database error
      aiService.supabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          }))
        }))
      }));

      const result = await aiService.getUserMonthlyCost('test-user-id');

      expect(result).toBe(0);
    });
  });

  describe('checkCostLimits', () => {
    it('should return cost limit status correctly', async () => {
      const result = await aiService.checkCostLimits('test-user-id');

      expect(result).toEqual({
        withinLimits: true,
        currentCost: 0.10,
        limit: 50
      });
    });

    it('should detect when user exceeds cost limits', async () => {
      // Mock high cost usage
      aiService.supabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn().mockResolvedValue({
              data: [
                { cost_usd: 25 },
                { cost_usd: 15 },
                { cost_usd: 15 }
              ],
              error: null
            })
          }))
        }))
      }));

      const result = await aiService.checkCostLimits('test-user-id');

      expect(result).toEqual({
        withinLimits: false,
        currentCost: 55,
        limit: 50
      });
    });
  });

  describe('model selection', () => {
    it('should select GPT-3.5-turbo for simple topics', () => {
      const result = aiService.selectModel('Python variables');
      expect(result).toBe('gpt-3.5-turbo');
    });

    it('should select GPT-5 for complex analysis topics', () => {
      const result = aiService.selectModel('Advanced strategic framework analysis methodology');
      expect(result).toBe('gpt-5');
    });

    it('should select GPT-5 for topics with complexity indicators', () => {
      const result = aiService.selectModel('How to evaluate learning outcomes');
      expect(result).toBe('gpt-5');
    });
  });

  describe('cost calculation', () => {
    it('should calculate GPT-3.5-turbo costs correctly', () => {
      const cost = aiService.calculateCost('gpt-3.5-turbo', 1000, 500);
      expect(cost).toBeCloseTo(0.0005 + 0.00075); // Input + Output tokens
    });

    it('should calculate GPT-5 costs correctly', () => {
      const cost = aiService.calculateCost('gpt-5', 1000, 500);
      expect(cost).toBeCloseTo(0.02 + 0.03); // Input + Output tokens
    });
  });
});