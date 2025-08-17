# Tech Stack

This is the **DEFINITIVE technology selection** for the entire project. All development must use these exact versions and tools.

## Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.3+ | Type-safe frontend development | Essential for AI integration reliability and shared types with backend |
| Frontend Framework | Next.js | 14.0+ | React framework with SSR/SSG | Professional performance, SEO for stakeholder sharing, Vercel optimization |
| UI Component Library | Tailwind CSS + Headless UI | 3.3+ / 1.7+ | Utility-first styling with accessible components | WCAG AA compliance built-in, professional design system foundation |
| State Management | Zustand | 4.4+ | Lightweight global state | Simpler than Redux, perfect for AI response caching and user preferences |
| Backend Language | TypeScript | 5.3+ | Type-safe backend development | Shared types with frontend, reduced integration errors |
| Backend Framework | Node.js + Fastify | 20.x LTS / 4.24+ | High-performance API framework | Superior performance over Express, excellent TypeScript support |
| API Style | REST + tRPC | - / 10.45+ | RESTful APIs with type-safe client calls | REST for external integrations, tRPC for internal type-safety |
| Database | PostgreSQL (Supabase) | 15+ | Relational database with real-time features | Complex lesson relationships, built-in auth, real-time collaboration |
| Cache | Redis (Upstash) | 7.2+ | AI response and session caching | Essential for <30% AI cost requirement, edge-compatible |
| File Storage | AWS S3 | - | Document and asset storage | Enterprise compliance, CDN integration, audit trails |
| Authentication | Supabase Auth | - | User authentication and authorization | Enterprise SSO support, GDPR compliant, role-based access |
| Frontend Testing | Vitest + Testing Library | 1.0+ / 14.0+ | Fast unit and integration testing | Better performance than Jest, excellent TypeScript support |
| Backend Testing | Vitest + Supertest | 1.0+ / 6.3+ | API endpoint testing | Consistent tooling with frontend, fast execution |
| E2E Testing | Playwright | 1.40+ | End-to-end user workflow testing | AI interaction flows, accessibility testing, cross-browser |
| Build Tool | Vite | 5.0+ | Fast development and production builds | Superior performance, excellent TypeScript/React support |
| Bundler | Rollup (via Vite) | - | Production bundling with tree-shaking | Optimal bundle sizes for professional performance |
| IaC Tool | Terraform | 1.6+ | Infrastructure as Code for AWS resources | Version control for infrastructure, enterprise compliance |
| CI/CD | GitHub Actions | - | Automated testing and deployment | Tight integration with monorepo, Vercel deployment |
| Monitoring | Vercel Analytics + Sentry | - / 7.80+ | Performance and error monitoring | Professional metrics for stakeholder reporting |
| Logging | Pino | 8.16+ | Structured JSON logging | High performance, excellent for serverless environments |
| CSS Framework | Tailwind CSS | 3.3+ | Utility-first CSS framework | Professional design system, accessibility utilities, consistent spacing |

## Timeline Impact Analysis

**Development Velocity Assessment:**

**Immediate Setup Phase (Weeks 1-2):**
- **✅ Accelerators:** Next.js + Vercel setup can be completed in hours, Supabase provides instant database and auth
- **⚠️ Complexity:** tRPC setup adds 2-3 days of initial configuration but pays dividends in type safety
- **⚠️ Learning Curve:** Team needs Fastify familiarity (vs Express) - estimated 3-5 days onboarding

**Epic 1 Implementation (Weeks 3-6):**
- **✅ Shared Types:** TypeScript monorepo enables parallel frontend/backend development without integration delays
- **✅ Testing Speed:** Vitest provides 3-5x faster test execution than Jest, reducing feedback loops
- **❌ AI Integration Complexity:** OpenAI + Redis caching architecture adds 1-2 weeks to MVP timeline

**Epic 2-3 Implementation (Weeks 7-14):**
- **✅ Component Reuse:** Tailwind + Headless UI accelerates professional UI development by 40-60%
- **✅ Real-time Features:** Supabase real-time reduces collaborative editing implementation by 2-3 weeks
- **⚠️ Compliance Integration:** WCAG automation requires custom tooling development - 2-3 week investment

**Production Deployment (Weeks 15-16):**
- **✅ Zero-Config Deployment:** Vercel eliminates infrastructure setup time completely
- **✅ Terraform AWS:** 3-5 day setup but provides long-term enterprise compliance foundation
- **❌ Performance Optimization:** Edge function tuning for AI workloads may require 1-2 weeks iteration

**Net Timeline Impact:** Technology choices add **1-2 weeks** to initial setup but save **3-4 weeks** during feature development through improved developer experience and reduced debugging time.
