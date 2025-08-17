# API Specification

Based on our tech stack choice of **REST + tRPC**, the API design provides tRPC router definitions that enable end-to-end type safety while maintaining RESTful principles for external integrations.

## tRPC Router Definitions

```typescript
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';

// Main application router
export const appRouter = router({
  // Authentication & User Management
  auth: router({
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(8)
      }))
      .mutation(async ({ input, ctx }) => {
        return await ctx.auth.signIn(input);
      }),

    me: protectedProcedure
      .query(async ({ ctx }) => {
        return await ctx.db.user.findUnique({
          where: { id: ctx.user.id }
        });
      })
  }),

  // AI Processing & Analysis
  ai: router({
    analyzeTopics: protectedProcedure
      .input(z.object({
        topics: z.array(z.string()).min(1).max(10),
        analysisType: z.enum(['clark_mayer', 'bloom_taxonomy', 'instructional_methods']).default('clark_mayer')
      }))
      .mutation(async ({ input, ctx }) => {
        // Route to GPT-5 or GPT-3.5 based on complexity
        return await ctx.services.ai.batchAnalyzeTopics(input, ctx.user.id);
      }),

    generateContent: protectedProcedure
      .input(z.object({
        lessonId: z.string().uuid(),
        options: z.object({
          complexity: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
          verbosity: z.enum(['low', 'medium', 'high']).default('medium'),
          includeActivities: z.boolean().default(true),
          includeAssessments: z.boolean().default(true)
        }).optional()
      }))
      .mutation(async ({ input, ctx }) => {
        // Async GPT-5 content generation
        return await ctx.services.ai.generateLessonContent(input, ctx.user.id);
      })
  }),

  // Accessibility Compliance
  accessibility: router({
    validateContent: protectedProcedure
      .input(z.object({
        lessonId: z.string().uuid(),
        complianceLevel: z.enum(['A', 'AA', 'AAA']).default('AA')
      }))
      .mutation(async ({ input, ctx }) => {
        return await ctx.services.accessibility.validateLesson(input, ctx.user.id);
      })
  })
});

export type AppRouter = typeof appRouter;
```
