# Coding Standards

## Critical Fullstack Rules

- **Type Sharing:** Always define types in packages/shared and import from there - prevents frontend/backend type mismatches
- **API Calls:** Never make direct HTTP calls - use the tRPC client for type safety and error handling
- **Environment Variables:** Access only through config objects in packages/shared, never process.env directly
- **Error Handling:** All API routes must use the standard error handler for consistent error responses
- **State Updates:** Never mutate state directly - use proper Zustand patterns with immer for complex updates
- **Authentication:** Always use the authMiddleware for protected routes, never implement custom auth logic
- **Database Queries:** Use the repository pattern with Supabase client, never write raw SQL in business logic
- **AI Interactions:** All OpenAI calls must go through the AI service layer with proper caching and cost tracking

## Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `UserProfile.tsx` |
| Hooks | camelCase with 'use' | - | `useAuth.ts` |
| API Routes | - | kebab-case | `/api/user-profile` |
| Database Tables | - | snake_case | `user_profiles` |
| Functions | camelCase | camelCase | `generateContent()` |
| Constants | SCREAMING_SNAKE_CASE | SCREAMING_SNAKE_CASE | `MAX_RETRIES` |
