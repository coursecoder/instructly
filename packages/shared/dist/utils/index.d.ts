import { ENV_KEYS } from '../constants';
export declare const getEnvVar: (key: keyof typeof ENV_KEYS, defaultValue?: string) => string;
export interface AppConfig {
    database: {
        url: string;
        supabaseUrl: string;
        supabaseAnonKey: string;
        supabaseServiceRoleKey: string;
    };
    ai: {
        openaiApiKey: string;
    };
    cache: {
        redisUrl: string;
    };
    environment: 'development' | 'staging' | 'production';
}
export declare const createAppConfig: () => AppConfig;
export declare const measurePerformance: <T>(operation: () => Promise<T>, maxTimeMs: number) => Promise<{
    result: T;
    timeMs: number;
    withinLimit: boolean;
}>;
export declare const getSystemMemoryUsage: () => {
    used: number;
    total: number;
    percentage: number;
};
export declare const createApiError: (message: string, code?: string) => {
    success: false;
    error: string;
    code: string | undefined;
    timestamp: Date;
};
export declare const createApiSuccess: <T>(data: T) => {
    success: true;
    data: T;
    timestamp: Date;
};
//# sourceMappingURL=index.d.ts.map