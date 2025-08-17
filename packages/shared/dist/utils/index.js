// Environment variable access (never use process.env directly per coding standards)
export const getEnvVar = (key, defaultValue) => {
    const value = process.env[key];
    if (!value && !defaultValue) {
        throw new Error(`Environment variable ${key} is required but not set. Please check your .env configuration.`);
    }
    return value || defaultValue;
};
export const createAppConfig = () => ({
    database: {
        url: getEnvVar('DATABASE_URL'),
        supabaseUrl: getEnvVar('SUPABASE_URL'),
        supabaseAnonKey: getEnvVar('SUPABASE_ANON_KEY'),
        supabaseServiceRoleKey: getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
    },
    ai: {
        openaiApiKey: getEnvVar('OPENAI_API_KEY'),
    },
    cache: {
        redisUrl: getEnvVar('REDIS_URL'),
    },
    environment: getEnvVar('VERCEL_ENV', 'development'),
});
// Performance measurement utilities
export const measurePerformance = async (operation, maxTimeMs) => {
    const startTime = Date.now();
    const result = await operation();
    const timeMs = Date.now() - startTime;
    return {
        result,
        timeMs,
        withinLimit: timeMs <= maxTimeMs,
    };
};
// Health check utilities
export const getSystemMemoryUsage = () => {
    if (typeof process !== 'undefined' && process.memoryUsage) {
        const usage = process.memoryUsage();
        return {
            used: usage.heapUsed,
            total: usage.heapTotal,
            percentage: Math.round((usage.heapUsed / usage.heapTotal) * 100),
        };
    }
    // Fallback for edge environments
    return {
        used: 0,
        total: 1,
        percentage: 0,
    };
};
// Error handling utilities
export const createApiError = (message, code) => ({
    success: false,
    error: message,
    code,
    timestamp: new Date(),
});
export const createApiSuccess = (data) => ({
    success: true,
    data,
    timestamp: new Date(),
});
