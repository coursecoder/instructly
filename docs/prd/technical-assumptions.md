# Technical Assumptions

## Repository Structure: Monorepo

Given bootstrap/self-funded constraints and need for rapid iteration, a monorepo approach enables shared code, unified testing, and simplified deployment while maintaining separation between frontend, backend, and AI processing modules.

## Service Architecture

Microservices within Monorepo - Hybrid approach balancing development efficiency with scalability needs. Core services include: AI Processing Engine, Accessibility Compliance Checker, User Management, Content Generation, and LMS Integration APIs. This allows independent scaling of AI-intensive components while maintaining development simplicity.

## Testing Requirements

Unit + Integration - Focus on unit tests for AI prompt engineering and integration tests for accessibility compliance accuracy. Given the 90% compliance requirement, automated testing of WCAG validation is critical. Manual testing convenience methods needed for stakeholder demonstration scenarios.

## Additional Technical Assumptions and Requests

- **Frontend Technology:** React with TypeScript for robust accessibility support required for WCAG AA compliance, extensive component libraries for professional UI, and strong TypeScript integration for maintainable enterprise code
- **Backend Technology:** Node.js with Express/Fastify for AI integration requirements, excellent API performance, and rapid development iteration
- **Database Strategy:** PostgreSQL for structured lesson plan data and audit trails + Redis for caching AI responses (critical for 30% cost constraint) and user sessions
- **AI Infrastructure:** OpenAI GPT-4 with intelligent caching, GPT-3.5 for classification tasks, aggressive caching strategy and prompt optimization to maintain <30% cost ratio
- **Hosting & Deployment:** AWS with auto-scaling for cloud-native architecture supporting 1000+ concurrent users, SOC 2 compliance requirements, and global CDN for performance
- **Cost Control Focus:** Every technical choice optimized for sustainable unit economics given AI token constraints
- **Enterprise Compliance:** Architecture supports SOC 2, GDPR, and accessibility audit requirements from foundation
- **AI Optimization:** Multi-model strategy and caching essential for meeting both performance and cost requirements
