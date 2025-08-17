export declare const PERFORMANCE_REQUIREMENTS: {
    readonly MAX_LESSON_GENERATION_TIME_MS: 3000;
    readonly MAX_ACCESSIBILITY_CHECK_TIME_MS: 1000;
    readonly MAX_CONCURRENT_USERS: 1000;
    readonly AI_COST_REVENUE_THRESHOLD: 0.3;
};
export declare const DATABASE_CONFIG: {
    readonly CONNECTION_TIMEOUT_MS: 5000;
    readonly QUERY_TIMEOUT_MS: 10000;
    readonly MAX_CONNECTIONS: 100;
};
export declare const API_CONFIG: {
    readonly DEFAULT_TIMEOUT_MS: 30000;
    readonly MAX_RETRY_ATTEMPTS: 3;
    readonly RATE_LIMIT_REQUESTS_PER_MINUTE: 100;
};
export declare const USER_ROLES: {
    readonly DESIGNER: "designer";
    readonly MANAGER: "manager";
    readonly ADMIN: "admin";
};
export declare const PROJECT_STATUS: {
    readonly DRAFT: "draft";
    readonly IN_PROGRESS: "in_progress";
    readonly REVIEW: "review";
    readonly COMPLETED: "completed";
    readonly ARCHIVED: "archived";
};
export declare const ENV_KEYS: {
    readonly DATABASE_URL: "DATABASE_URL";
    readonly SUPABASE_URL: "SUPABASE_URL";
    readonly SUPABASE_ANON_KEY: "SUPABASE_ANON_KEY";
    readonly SUPABASE_SERVICE_ROLE_KEY: "SUPABASE_SERVICE_ROLE_KEY";
    readonly OPENAI_API_KEY: "OPENAI_API_KEY";
    readonly REDIS_URL: "REDIS_URL";
    readonly VERCEL_ENV: "VERCEL_ENV";
};
//# sourceMappingURL=index.d.ts.map