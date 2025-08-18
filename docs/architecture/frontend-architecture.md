# Frontend Architecture

Based on the detailed frontend specification document and the chosen tech stack, here's the frontend-specific architecture:

## Alternative Architecture Analysis

**Architecture Selection Rationale:** After evaluating multiple frontend approaches, the **Next.js + tRPC + Zustand** architecture was selected as optimal for Instructly's unique requirements.

**Key Alternatives Considered:**

1. **Vite SPA + TanStack Query:** Superior development speed but lacks SEO capabilities critical for stakeholder presentations
2. **Remix Full-Stack:** Excellent progressive enhancement but weaker static generation for professional presentation modes  
3. **Micro-Frontend (Module Federation):** Enables team autonomy but adds unnecessary complexity for 2-5 developer team size

**Decision Matrix Results:**
- **Enterprise Presentation Quality:** Next.js SSG provides instant-loading stakeholder presentations (5/5 vs 2/5 for SPA)
- **Type Safety for AI Integration:** tRPC end-to-end TypeScript prevents costly AI runtime errors (5/5 vs 3/5 for OpenAPI)
- **Professional Credibility:** Static generation + SEO supports "credible expert" positioning vs "PowerPoint creators"
- **Development Velocity:** Optimal balance for startup timeline with enterprise requirements

## Component Architecture

### Component Organization
```
apps/web/src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components (Button, Input, Card)
│   ├── ai/              # AI-specific components
│   │   ├── ClassificationPanel.tsx
│   │   ├── GenerationProgress.tsx
│   │   └── ConfidenceIndicator.tsx
│   ├── accessibility/   # Accessibility-specific components
│   │   ├── ComplianceStatus.tsx
│   │   ├── ViolationsList.tsx
│   │   └── AuditReport.tsx
│   ├── lesson/          # Lesson-specific components
│   │   ├── LessonBuilder.tsx
│   │   ├── TopicAnalyzer.tsx
│   │   └── ContentGenerator.tsx
│   └── stakeholder/     # Stakeholder interface components
│       ├── PresentationView.tsx
│       ├── CommentSystem.tsx
│       └── ApprovalWorkflow.tsx
├── pages/               # Next.js pages/routes
├── hooks/               # Custom React hooks
├── services/            # API client services
├── stores/              # Zustand state stores
├── styles/              # Global styles and themes
└── utils/               # Frontend utilities
```

### Component Template (Following Frontend Spec Design System)
```typescript
import React from 'react';
import { cn } from '@/utils/cn';

interface AIClassificationPanelProps {
  analysis: InstructionalDesignAnalysis;
  onAccept: () => void;
  onModify: () => void;
  isLoading?: boolean;
  className?: string;
}

export const AIClassificationPanel: React.FC<AIClassificationPanelProps> = ({
  analysis,
  onAccept,
  onModify,
  isLoading = false,
  className
}) => {
  const [showReasoning, setShowReasoning] = React.useState(false);

  return (
    <div className={cn(
      "bg-white rounded-lg shadow-sm border border-gray-200 p-6",
      "transition-all duration-200 hover:shadow-md",
      className
    )}>
      {/* Header with confidence score */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Content Classification
        </h3>
        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
          {Math.round(analysis.confidence * 100)}% Confidence
        </div>
      </div>

      {/* Primary classification */}
      <div className="mb-4">
        <div className="text-2xl font-bold text-blue-600 mb-2">
          {analysis.contentType}
        </div>
        <p className="text-gray-600 text-sm">
          Based on established instructional design frameworks
        </p>
      </div>

      {/* Expandable reasoning section */}
      <button
        onClick={() => setShowReasoning(!showReasoning)}
        className="w-full text-left text-blue-600 hover:text-blue-800 transition-colors mb-4"
        aria-expanded={showReasoning}
      >
        {showReasoning ? '▼' : '▶'} View Reasoning
      </button>

      {showReasoning && (
        <div className="bg-gray-50 rounded-md p-4 mb-4">
          <p className="text-sm text-gray-700">{analysis.rationale}</p>
        </div>
      )}

      {/* Action buttons with proper accessibility */}
      <div className="flex gap-3">
        <button
          onClick={onAccept}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md transition-colors min-h-[44px]"
          aria-label="Accept AI classification"
        >
          Accept Classification
        </button>
        <button
          onClick={onModify}
          disabled={isLoading}
          className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md transition-colors min-h-[44px]"
          aria-label="Modify classification manually"
        >
          Modify
        </button>
      </div>
    </div>
  );
};
```

## State Management Architecture

### State Structure
```typescript
// Core application state using Zustand
interface AppState {
  // User and authentication
  user: User | null;
  isAuthenticated: boolean;
  
  // Current project context
  currentProject: Project | null;
  currentLesson: Lesson | null;
  
  // AI generation state
  aiGeneration: {
    isGenerating: boolean;
    progress: number;
    currentStep: string;
    error: string | null;
  };
  
  // Accessibility compliance state
  accessibility: {
    currentReport: AccessibilityReport | null;
    isValidating: boolean;
    violations: AccessibilityViolation[];
  };
  
  // UI state
  ui: {
    sidebarCollapsed: boolean;
    currentMode: 'working' | 'presentation';
    theme: 'light' | 'dark';
  };
}
```

### State Management Patterns
- **Optimistic Updates:** For user interactions that are likely to succeed (saving preferences, UI changes)
- **Real-time Sync:** Supabase real-time subscriptions for collaborative editing
- **AI Response Caching:** Store AI results in state with TTL to avoid redundant API calls
- **Progressive Loading:** Break large data sets into manageable chunks with pagination
- **Error Boundaries:** Graceful error handling with user-friendly recovery options

## Routing Architecture

### Route Organization
```
/                           # Landing page
/auth/                     # Authentication routes
  ├── login
  ├── register
  └── reset-password
/dashboard                 # Main dashboard
/projects/                 # Project management
  ├── [projectId]         # Project overview
  ├── [projectId]/lessons/[lessonId]  # Lesson builder
  └── new                 # Create new project
/lessons/                  # Lesson-specific routes
  ├── [lessonId]/builder  # Lesson creation workflow
  ├── [lessonId]/preview  # Stakeholder preview
  └── [lessonId]/export   # Export options
/compliance/               # Accessibility compliance
  ├── reports
  └── audit
/settings/                 # User settings
/help                      # Documentation and help
```

## Frontend Services Layer

### API Client Setup
```typescript
import { createTRPCNext } from '@trpc/next';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../api/src/router';

export const trpc = createTRPCNext<AppRouter>({
  config({ ctx }) {
    return {
      links: [
        httpBatchLink({
          url: '/api/trpc',
          headers() {
            if (ctx?.req) {
              // Server-side: forward headers
              return {
                ...ctx.req.headers,
                'x-ssr': '1',
              };
            }
            return {};
          },
        }),
      ],
      queryClientConfig: {
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: (failureCount, error) => {
              // Don't retry on authentication errors
              if (error.message?.includes('UNAUTHORIZED')) {
                return false;
              }
              return failureCount < 3;
            },
          },
        },
      },
    };
  },
  ssr: true,
});
```
