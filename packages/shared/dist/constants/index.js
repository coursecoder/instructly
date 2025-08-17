// Performance constants based on PRD requirements
export const PERFORMANCE_REQUIREMENTS = {
    MAX_LESSON_GENERATION_TIME_MS: 3000, // NFR1: 3 seconds
    MAX_ACCESSIBILITY_CHECK_TIME_MS: 1000, // NFR1: 1 second
    MAX_CONCURRENT_USERS: 1000, // NFR2: 1000+ users
    AI_COST_REVENUE_THRESHOLD: 0.3, // NFR5: 30% of revenue
};
// Database configuration
export const DATABASE_CONFIG = {
    CONNECTION_TIMEOUT_MS: 5000,
    QUERY_TIMEOUT_MS: 10000,
    MAX_CONNECTIONS: 100,
};
// API configuration
export const API_CONFIG = {
    DEFAULT_TIMEOUT_MS: 30000,
    MAX_RETRY_ATTEMPTS: 3,
    RATE_LIMIT_REQUESTS_PER_MINUTE: 100,
};
// User roles and permissions
export const USER_ROLES = {
    DESIGNER: 'designer',
    MANAGER: 'manager',
    ADMIN: 'admin',
};
export const PROJECT_STATUS = {
    DRAFT: 'draft',
    IN_PROGRESS: 'in_progress',
    REVIEW: 'review',
    COMPLETED: 'completed',
    ARCHIVED: 'archived',
};
// Environment variables keys (for config objects)
export const ENV_KEYS = {
    DATABASE_URL: 'DATABASE_URL',
    SUPABASE_URL: 'SUPABASE_URL',
    SUPABASE_ANON_KEY: 'SUPABASE_ANON_KEY',
    SUPABASE_SERVICE_ROLE_KEY: 'SUPABASE_SERVICE_ROLE_KEY',
    OPENAI_API_KEY: 'OPENAI_API_KEY',
    REDIS_URL: 'REDIS_URL',
    VERCEL_ENV: 'VERCEL_ENV',
};
