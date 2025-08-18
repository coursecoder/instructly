# High Level Architecture

## Technical Summary

Instructly employs a **cloud-native monorepo architecture** deployed on AWS, featuring a React TypeScript frontend with Node.js Express backend services. The system uses **microservices within monorepo** pattern, enabling shared code development while maintaining service independence for AI processing, accessibility compliance, and content generation. Key integration points include the **AI Processing Engine (GPT-5 primary with GPT-3.5 fallback and intelligent caching)**, real-time accessibility validation service, and enterprise authentication systems. This architecture achieves PRD goals through **enhanced cost-optimized AI integration (<30% revenue with improved economics)**, automated WCAG 2.1 compliance, and professional stakeholder interfaces that position instructional designers as credible experts rather than creative hobbyists.

## Platform and Infrastructure Choice

**Platform:** AWS Full Stack
**Key Services:** Lambda, API Gateway, RDS PostgreSQL, ElastiCache Redis, S3, CloudFront, Cognito, ECS Fargate
**Deployment Host and Regions:** us-east-1 (primary), us-west-2 (failover), eu-west-1 (EU compliance)

## Repository Structure

**Structure:** Monorepo with microservices
**Monorepo Tool:** Turborepo (optimal for TypeScript sharing and build caching)
**Package Organization:** Domain-driven packages with shared utilities, separate apps for web frontend and backend services

## High Level Architecture Diagram

```mermaid
graph TB
    User[👤 Instructional Designer] --> CDN[CloudFront CDN]
    CDN --> Frontend[React Frontend<br/>Vercel/S3]
    
    Frontend --> APIGateway[API Gateway<br/>Authentication & Rate Limiting]
    APIGateway --> AuthService[Cognito<br/>User Management]
    APIGateway --> CoreAPI[Core API<br/>Lambda/ECS]
    
    CoreAPI --> AIEngine[AI Processing Engine<br/>GPT-5 Primary + GPT-3.5 Fallback<br/>Intelligent Caching Strategy]
    CoreAPI --> AccessibilityEngine[Accessibility Engine<br/>WCAG Validation]
    CoreAPI --> ContentService[Content Generation<br/>Lesson Plans & Activities]
    
    CoreAPI --> Cache[Redis Cache<br/>AI Response Caching<br/>24hr TTL + Smart Invalidation]
    CoreAPI --> Database[(PostgreSQL<br/>User Data & Projects)]
    CoreAPI --> Storage[S3 Storage<br/>Generated Content)]
    
    AIEngine --> GPT5[OpenAI GPT-5 API<br/>$1.25/$10 per million tokens]
    AIEngine --> GPT3Fallback[GPT-3.5-turbo<br/>Simple Classifications]
    AccessibilityEngine --> ValidationLib[axe-core<br/>Accessibility Rules]
    
    CoreAPI --> Monitoring[CloudWatch<br/>Logs & Metrics<br/>AI Cost Tracking]
    Database --> Backup[RDS Backups<br/>Point-in-time Recovery]
```

## Architectural Patterns

- **Jamstack Architecture:** Static site generation with serverless APIs - _Rationale:_ Optimal performance and scalability for content-heavy applications with enterprise caching needs
- **Component-Based UI:** Reusable React components with TypeScript - _Rationale:_ Maintainability and type safety across large codebases, essential for accessibility compliance
- **Repository Pattern:** Abstract data access logic - _Rationale:_ Enables testing and future database migration flexibility for enterprise requirements
- **API Gateway Pattern:** Single entry point for all API calls - _Rationale:_ Centralized auth, rate limiting, and monitoring essential for enterprise security
- **Command Query Responsibility Segregation (CQRS):** Separate read/write operations for lesson plans - _Rationale:_ Optimizes performance for complex AI generation vs simple content retrieval
- **Circuit Breaker Pattern:** Resilient external API calls to OpenAI - _Rationale:_ Prevents cascade failures when AI services are unavailable, maintaining system reliability
- **Event-Driven Architecture:** Async processing for AI content generation - _Rationale:_ Enables responsive UI while handling long-running AI processing tasks
- **Intelligent AI Routing Pattern:** Route requests to optimal AI model based on complexity - _Rationale:_ GPT-5 for complex content generation, GPT-3.5 for simple classifications, maximizing quality while controlling costs

## AI Strategy Update (GPT-5 Integration)

**Primary Model:** GPT-5 at $1.25/$10 per million tokens
- Complex lesson plan generation
- instructional design framework analysis
- Professional documentation creation
- Accessibility content generation

**Fallback Model:** GPT-3.5-turbo for simple tasks
- Basic content classifications
- Quick validations
- Cache warming operations

**Cost Optimization Benefits:**
- 50% reduction in input token costs vs GPT-4o
- 45% fewer factual errors reducing regeneration needs
- Better instruction following reduces retry attempts
- Enhanced 400k context window reduces API calls for comprehensive analysis

**Quality Improvements for Instructional Design:**
- Significantly improved content generation quality
- Better adherence to instructional design frameworks
- Reduced hallucinations critical for professional credibility
- Enhanced instruction following for consistent instructional design framework classification

This updated AI strategy improves both cost economics and content quality, strengthening our competitive position while maintaining the <30% AI cost target.
