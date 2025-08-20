import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../api/src/trpc/routers';
import type { 
  Topic, 
  TopicAnalysisRequest, 
  TopicAnalysisResponse 
} from '@instructly/shared/types';

// Create vanilla tRPC client for use in stores (not React hooks)
const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3001/trpc'
        : 'https://instructly-api-czqc.vercel.app/api/trpc',
      headers() {
        const token = typeof window !== 'undefined' 
          ? localStorage.getItem('auth-token')
          : null;
          
        return token ? {
          authorization: `Bearer ${token}`,
        } : {};
      },
    }),
  ],
});

interface AIState {
  // Analysis state
  isAnalyzing: boolean;
  analysisResults: Topic[] | null;
  analysisError: string | null;
  lastAnalysisDate: Date | null;
  
  // Cost tracking
  monthlyCost: number;
  costLimit: number;
  withinCostLimits: boolean;
  costPercentageUsed: number;
  
  // Cache for analysis results
  analysisCache: Map<string, { results: Topic[]; timestamp: number }>;
  
  // Service health
  isServiceHealthy: boolean;
  lastHealthCheck: Date | null;
  
  // Actions
  analyzeTopics: (request: TopicAnalysisRequest) => Promise<TopicAnalysisResponse>;
  getMonthlyCost: () => Promise<void>;
  clearAnalysisResults: () => void;
  clearError: () => void;
  setAnalyzing: (analyzing: boolean) => void;
  checkServiceHealth: () => Promise<boolean>;
  getCachedAnalysis: (cacheKey: string) => Topic[] | null;
  setCachedAnalysis: (cacheKey: string, results: Topic[]) => void;
  clearCache: () => void;
}

// Cache TTL (24 hours)
const CACHE_TTL = 24 * 60 * 60 * 1000;

// Generate cache key for analysis request
const generateCacheKey = (request: TopicAnalysisRequest): string => {
  return `${request.analysisType}-${request.topics.sort().join('|')}`;
};

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAnalyzing: false,
      analysisResults: null,
      analysisError: null,
      lastAnalysisDate: null,
      
      monthlyCost: 0,
      costLimit: 50,
      withinCostLimits: true,
      costPercentageUsed: 0,
      
      analysisCache: new Map(),
      
      isServiceHealthy: true,
      lastHealthCheck: null,

      // Actions
      analyzeTopics: async (request: TopicAnalysisRequest): Promise<TopicAnalysisResponse> => {
        const { analysisCache } = get();
        
        try {
          set({ isAnalyzing: true, analysisError: null });

          // Check cache first
          const cacheKey = generateCacheKey(request);
          const cached = get().getCachedAnalysis(cacheKey);
          
          if (cached) {
            set({ 
              analysisResults: cached, 
              isAnalyzing: false,
              lastAnalysisDate: new Date()
            });
            
            return {
              topics: cached,
              totalCost: 0, // Cached results have no additional cost
              processingTime: 0
            };
          }

          // Make API call
          const response = await trpcClient.ai.analyzeTopics.mutate(request);
          
          if (response.success && response.data) {
            // Convert string dates to Date objects
            const results = response.data.topics.map(topic => ({
              ...topic,
              generatedAt: new Date(topic.generatedAt)
            }));
            
            set({ 
              analysisResults: results,
              isAnalyzing: false,
              lastAnalysisDate: new Date()
            });

            // Cache the results
            get().setCachedAnalysis(cacheKey, results);
            
            // Update cost information
            await get().getMonthlyCost();

            return {
              ...response.data,
              topics: results
            };
          } else {
            throw new Error('Analysis failed');
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          
          set({ 
            analysisError: errorMessage,
            isAnalyzing: false 
          });
          
          throw error;
        }
      },

      getMonthlyCost: async (): Promise<void> => {
        try {
          const response = await trpcClient.ai.getMonthlyCost.query();
          
          if (response.success && response.data) {
            set({
              monthlyCost: response.data.currentCost,
              costLimit: response.data.limit,
              withinCostLimits: response.data.withinLimits,
              costPercentageUsed: response.data.percentageUsed
            });
          }
        } catch (error) {
          console.error('Failed to get monthly cost:', error);
          // Don't throw here - cost tracking failure shouldn't break the UI
        }
      },

      clearAnalysisResults: (): void => {
        set({ 
          analysisResults: null, 
          analysisError: null,
          lastAnalysisDate: null
        });
      },

      clearError: (): void => {
        set({ analysisError: null });
      },

      setAnalyzing: (analyzing: boolean): void => {
        set({ isAnalyzing: analyzing });
      },

      checkServiceHealth: async (): Promise<boolean> => {
        try {
          const response = await trpcClient.ai.healthCheck.query();
          const isHealthy = response.success && response.data?.aiServiceAvailable === true;
          
          set({ 
            isServiceHealthy: isHealthy,
            lastHealthCheck: new Date()
          });
          
          return isHealthy;
        } catch (error) {
          set({ 
            isServiceHealthy: false,
            lastHealthCheck: new Date()
          });
          
          return false;
        }
      },

      getCachedAnalysis: (cacheKey: string): Topic[] | null => {
        const { analysisCache } = get();
        const cached = analysisCache.get(cacheKey);
        
        if (!cached) return null;
        
        // Check if cache is expired
        if (Date.now() - cached.timestamp > CACHE_TTL) {
          // Remove expired cache entry
          const newCache = new Map(analysisCache);
          newCache.delete(cacheKey);
          set({ analysisCache: newCache });
          return null;
        }
        
        return cached.results;
      },

      setCachedAnalysis: (cacheKey: string, results: Topic[]): void => {
        const { analysisCache } = get();
        const newCache = new Map(analysisCache);
        
        newCache.set(cacheKey, {
          results,
          timestamp: Date.now()
        });
        
        // Limit cache size to 50 entries
        if (newCache.size > 50) {
          const firstKey = newCache.keys().next().value;
          if (firstKey) {
            newCache.delete(firstKey);
          }
        }
        
        set({ analysisCache: newCache });
      },

      clearCache: (): void => {
        set({ analysisCache: new Map() });
      }
    }),
    {
      name: 'ai-store',
      // Only persist certain fields, not the entire state
      partialize: (state) => ({
        analysisCache: Array.from(state.analysisCache.entries()),
        monthlyCost: state.monthlyCost,
        costLimit: state.costLimit,
        withinCostLimits: state.withinCostLimits,
        costPercentageUsed: state.costPercentageUsed,
        lastAnalysisDate: state.lastAnalysisDate,
        isServiceHealthy: state.isServiceHealthy,
        lastHealthCheck: state.lastHealthCheck
      }),
      // Custom serialization for Map
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.analysisCache)) {
          state.analysisCache = new Map(state.analysisCache as any);
        }
      }
    }
  )
);