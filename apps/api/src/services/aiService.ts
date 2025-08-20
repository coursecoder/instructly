import OpenAI from 'openai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import type { Database } from '../types/database';
import { 
  TopicAnalysisRequest, 
  Topic, 
  TopicAnalysisResponse, 
  InstructionalDesignAnalysis
} from '@instructly/shared';

// Cost tracking constants (based on OpenAI pricing)
const MODEL_COSTS = {
  'gpt-5': {
    input: 0.02 / 1000,   // $0.02 per 1K input tokens
    output: 0.06 / 1000,  // $0.06 per 1K output tokens
  },
  'gpt-3.5-turbo': {
    input: 0.0005 / 1000, // $0.0005 per 1K input tokens
    output: 0.0015 / 1000, // $0.0015 per 1K output tokens
  }
} as const;

// Cache configuration
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Instructional design framework prompt for GPT analysis
const INSTRUCTIONAL_DESIGN_PROMPT = `You are an expert instructional designer. Analyze the provided topic and classify it according to instructional design framework categories:

1. **FACTS**: Specific information, data points, names, dates, or concrete details that learners need to memorize or recall
2. **CONCEPTS**: Abstract ideas, categories, theories, or principles that require understanding and recognition
3. **PROCESSES**: Natural phenomena, systems, or sequences that learners need to understand how they work
4. **PROCEDURES**: Step-by-step methods, techniques, or skills that learners need to perform
5. **PRINCIPLES**: Rules, guidelines, best practices, or complex reasoning that guide decision-making

For the given topic, provide:
- Primary classification (facts/concepts/processes/procedures/principles)
- Detailed rationale explaining your classification decision
- Recommended instructional methods based on the content type
- Confidence score (0.0-1.0) for your classification

Respond in this exact JSON format:
{
  "classification": "facts|concepts|processes|procedures|principles",
  "contentType": "brief description of the content type",
  "rationale": "detailed explanation of why this classification was chosen",
  "recommendedMethods": ["method1", "method2", "method3"],
  "confidence": 0.95
}`;

export class AIService {
  private openai: OpenAI;
  private supabase: SupabaseClient<Database>;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor() {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    this.openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    this.supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Analyze multiple topics using AI classification
   */
  async analyzeTopics(request: TopicAnalysisRequest, userId: string): Promise<TopicAnalysisResponse> {
    const startTime = Date.now();
    const topics: Topic[] = [];
    let totalCost = 0;

    try {
      for (const topicContent of request.topics) {
        // Check cache first
        const cacheKey = this.generateCacheKey(topicContent, request.analysisType);
        const cached = this.getFromCache(cacheKey);
        
        if (cached) {
          topics.push(cached);
          continue;
        }

        // Analyze topic with AI
        const analysis = await this.analyzeTopicWithAI(topicContent, request.analysisType, userId);
        
        const topic: Topic = {
          id: crypto.randomUUID(),
          content: topicContent,
          classification: analysis.classification,
          aiAnalysis: {
            contentType: analysis.contentType,
            rationale: analysis.rationale,
            recommendedMethods: analysis.recommendedMethods,
            confidence: analysis.confidence,
            modelUsed: analysis.modelUsed
          },
          generatedAt: new Date()
        };

        topics.push(topic);
        totalCost += analysis.cost;

        // Cache the result
        this.setCache(cacheKey, topic);
      }

      const processingTime = Date.now() - startTime;

      return {
        topics,
        totalCost,
        processingTime
      };

    } catch (error) {
      console.error('AI analysis failed:', error);
      throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze a single topic using AI
   */
  private async analyzeTopicWithAI(
    topic: string, 
    analysisType: string, 
    userId: string
  ): Promise<InstructionalDesignAnalysis & { classification: 'facts' | 'concepts' | 'processes' | 'procedures' | 'principles'; cost: number }> {
    
    // Determine which model to use based on complexity
    const model = this.selectModel(topic);
    
    try {
      // Check if we should use mock mode (for development when API quota is exceeded)
      const useMockMode = process.env.NODE_ENV === 'development' && 
        (process.env.USE_MOCK_AI === 'true' || !process.env.OPENAI_API_KEY);
      
      if (useMockMode) {
        console.info(`[AI Service] Using mock mode for topic analysis: "${topic.slice(0, 50)}..."`); 
        // Generate realistic mock response
        const mockResponse = this.generateMockAnalysis(topic);
        const cost = MODEL_COSTS[model].input * 150 + MODEL_COSTS[model].output * 250; // Estimated tokens
        return { ...mockResponse, cost };
      }

      const completion = await this.openai.chat.completions.create({
        model: model === 'gpt-5' ? 'gpt-4o' : model, // Use GPT-4o as GPT-5 proxy
        messages: [
          {
            role: 'system',
            content: INSTRUCTIONAL_DESIGN_PROMPT
          },
          {
            role: 'user',
            content: `Analyze this topic: "${topic}"`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from AI model');
      }

      // Parse and validate AI response
      const aiResult = JSON.parse(response);
      
      // Calculate cost
      const inputTokens = completion.usage?.prompt_tokens || 0;
      const outputTokens = completion.usage?.completion_tokens || 0;
      const cost = this.calculateCost(model, inputTokens, outputTokens);

      // Log usage for cost tracking
      await this.logAIUsage(userId, model, 'topic_analysis', inputTokens, outputTokens, cost);

      return {
        classification: aiResult.classification,
        contentType: aiResult.contentType,
        rationale: aiResult.rationale,
        recommendedMethods: aiResult.recommendedMethods,
        confidence: aiResult.confidence,
        modelUsed: model,
        cost
      };

    } catch (error) {
      console.error('OpenAI API call failed:', error);
      
      // Fallback to simpler model if GPT-5 fails
      if (model === 'gpt-5') {
        return this.analyzeTopicWithAI(topic, analysisType, userId);
      }
      
      throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate mock analysis for development/demo purposes
   */
  private generateMockAnalysis(topic: string): InstructionalDesignAnalysis & { classification: 'facts' | 'concepts' | 'processes' | 'procedures' | 'principles' } {
    const lowerTopic = topic.toLowerCase();
    
    // Determine classification based on topic keywords
    let classification: 'facts' | 'concepts' | 'processes' | 'procedures' | 'principles';
    let contentType: string;
    let rationale: string;
    let recommendedMethods: string[];
    let confidence: number;
    
    if (lowerTopic.includes('syntax') || lowerTopic.includes('command') || lowerTopic.includes('specific') || lowerTopic.includes('data')) {
      classification = 'facts';
      contentType = 'Specific factual information';
      rationale = 'This topic involves specific commands, syntax, or data points that learners need to memorize and recall accurately. It represents concrete, factual information rather than abstract concepts.';
      recommendedMethods = ['Flashcards', 'Repetitive practice', 'Reference guides', 'Mnemonics'];
      confidence = 0.92;
    } else if (lowerTopic.includes('concept') || lowerTopic.includes('theory') || lowerTopic.includes('principle') || lowerTopic.includes('understanding')) {
      classification = 'concepts';
      contentType = 'Abstract conceptual understanding';
      rationale = 'This topic represents an abstract idea or concept that requires learners to understand underlying principles and be able to recognize and apply the concept in various contexts.';
      recommendedMethods = ['Concept mapping', 'Examples and non-examples', 'Case studies', 'Analogies'];
      confidence = 0.89;
    } else if (lowerTopic.includes('process') || lowerTopic.includes('flow') || lowerTopic.includes('workflow') || lowerTopic.includes('how')) {
      classification = 'processes';
      contentType = 'Sequential process understanding';
      rationale = 'This topic involves understanding a sequence of events or a systematic workflow that learners need to comprehend as a complete process rather than individual steps.';
      recommendedMethods = ['Process diagrams', 'Flowcharts', 'Simulation', 'Sequential explanations'];
      confidence = 0.87;
    } else if (lowerTopic.includes('procedure') || lowerTopic.includes('step') || lowerTopic.includes('method') || lowerTopic.includes('technique')) {
      classification = 'procedures';
      contentType = 'Step-by-step procedural knowledge';
      rationale = 'This topic involves specific procedures or methods that learners need to execute following precise steps in a particular sequence.';
      recommendedMethods = ['Step-by-step tutorials', 'Hands-on practice', 'Checklists', 'Guided practice'];
      confidence = 0.91;
    } else {
      classification = 'principles';
      contentType = 'Guiding principles and best practices';
      rationale = 'This topic involves higher-order principles or guidelines that require learners to understand when and how to apply them in various situations and contexts.';
      recommendedMethods = ['Case-based learning', 'Problem-solving scenarios', 'Decision trees', 'Expert modeling'];
      confidence = 0.85;
    }
    
    return {
      classification,
      contentType,
      rationale,
      recommendedMethods,
      confidence,
      modelUsed: 'gpt-5'
    };
  }

  /**
   * Select appropriate AI model based on topic complexity
   */
  private selectModel(topic: string): 'gpt-5' | 'gpt-3.5-turbo' {
    // Simple heuristics for model selection
    const complexityIndicators = [
      'analyze', 'compare', 'evaluate', 'synthesize', 'design', 'create',
      'theory', 'framework', 'methodology', 'strategy', 'philosophy'
    ];
    
    const hasComplexity = complexityIndicators.some(indicator => 
      topic.toLowerCase().includes(indicator)
    );
    
    // Use GPT-5 for complex analysis, GPT-3.5-turbo for simple classification
    return hasComplexity || topic.length > 100 ? 'gpt-5' : 'gpt-3.5-turbo';
  }

  /**
   * Calculate cost based on model and token usage
   */
  private calculateCost(model: 'gpt-5' | 'gpt-3.5-turbo', inputTokens: number, outputTokens: number): number {
    const costs = MODEL_COSTS[model];
    return (inputTokens * costs.input) + (outputTokens * costs.output);
  }

  /**
   * Log AI usage for cost tracking and compliance
   */
  private async logAIUsage(
    userId: string, 
    model: 'gpt-5' | 'gpt-3.5-turbo',
    operation: string,
    inputTokens: number,
    outputTokens: number,
    cost: number
  ): Promise<void> {
    try {
      await this.supabase
        .from('ai_usage_logs')
        .insert({
          id: crypto.randomUUID(),
          user_id: userId,
          model_used: model,
          operation_type: operation,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          cost_usd: cost,
          processing_time_ms: Date.now(),
          created_at: new Date().toISOString()
        });
    } catch (error) {
      // Enhanced error handling for missing table scenario
      if ((error as Error).message?.includes("ai_usage_logs")) {
        console.warn('[AI Service] ai_usage_logs table not found - skipping usage logging. Run database migrations to enable cost tracking.');
      } else {
        console.error('Failed to log AI usage:', error);
      }
      // Don't throw here - logging failure shouldn't break the main operation
    }
  }

  /**
   * Generate cache key for topic analysis
   */
  private generateCacheKey(topic: string, analysisType: string): string {
    const hash = crypto.createHash('sha256')
      .update(`${topic}-${analysisType}`)
      .digest('hex');
    return `ai:analysis:${hash}:${analysisType}`;
  }

  /**
   * Get result from cache if not expired
   */
  private getFromCache(key: string): Topic | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set result in cache
   */
  private setCache(key: string, data: Topic): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Get user's monthly AI cost usage
   */
  async getUserMonthlyCost(userId: string): Promise<number> {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await this.supabase
        .from('ai_usage_logs')
        .select('cost_usd')
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString());

      if (error) {
        // Enhanced error handling for missing table scenario
        if (error.message?.includes("ai_usage_logs")) {
          console.warn('[AI Service] ai_usage_logs table not found - returning $0. Run database migrations to enable cost tracking.');
          return 0;
        }
        console.error('Failed to get user monthly cost:', error);
        return 0;
      }

      return data?.reduce((total, log) => total + (log.cost_usd || 0), 0) || 0;
    } catch (error) {
      console.error('Error calculating monthly AI cost:', error);
      return 0;
    }
  }

  /**
   * Check if user is within cost limits
   */
  async checkCostLimits(userId: string): Promise<{ withinLimits: boolean; currentCost: number; limit: number }> {
    const currentCost = await this.getUserMonthlyCost(userId);
    const limit = 50; // $50 monthly limit per user
    
    return {
      withinLimits: currentCost < limit,
      currentCost,
      limit
    };
  }
}

// Singleton pattern for service management
let _aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!_aiServiceInstance) {
    _aiServiceInstance = new AIService();
  }
  return _aiServiceInstance;
}

export function resetAIService(): void {
  _aiServiceInstance = null;
}

// Export for backward compatibility, but prefer getAIService() for better testing
export default AIService;