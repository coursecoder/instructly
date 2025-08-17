import { z } from 'zod';
export declare const userPreferencesSchema: z.ZodObject<{
    defaultAudience: z.ZodString;
    preferredComplexity: z.ZodEnum<["beginner", "intermediate", "advanced"]>;
    accessibilityStrictness: z.ZodEnum<["standard", "strict"]>;
    aiGenerationStyle: z.ZodEnum<["concise", "detailed", "comprehensive"]>;
}, "strip", z.ZodTypeAny, {
    defaultAudience: string;
    preferredComplexity: "beginner" | "intermediate" | "advanced";
    accessibilityStrictness: "standard" | "strict";
    aiGenerationStyle: "concise" | "detailed" | "comprehensive";
}, {
    defaultAudience: string;
    preferredComplexity: "beginner" | "intermediate" | "advanced";
    accessibilityStrictness: "standard" | "strict";
    aiGenerationStyle: "concise" | "detailed" | "comprehensive";
}>;
export declare const userSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodString;
    organization: z.ZodOptional<z.ZodString>;
    role: z.ZodEnum<["designer", "manager", "admin"]>;
    preferences: z.ZodObject<{
        defaultAudience: z.ZodString;
        preferredComplexity: z.ZodEnum<["beginner", "intermediate", "advanced"]>;
        accessibilityStrictness: z.ZodEnum<["standard", "strict"]>;
        aiGenerationStyle: z.ZodEnum<["concise", "detailed", "comprehensive"]>;
    }, "strip", z.ZodTypeAny, {
        defaultAudience: string;
        preferredComplexity: "beginner" | "intermediate" | "advanced";
        accessibilityStrictness: "standard" | "strict";
        aiGenerationStyle: "concise" | "detailed" | "comprehensive";
    }, {
        defaultAudience: string;
        preferredComplexity: "beginner" | "intermediate" | "advanced";
        accessibilityStrictness: "standard" | "strict";
        aiGenerationStyle: "concise" | "detailed" | "comprehensive";
    }>;
    createdAt: z.ZodDate;
    lastLoginAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    id: string;
    email: string;
    name: string;
    role: "designer" | "manager" | "admin";
    preferences: {
        defaultAudience: string;
        preferredComplexity: "beginner" | "intermediate" | "advanced";
        accessibilityStrictness: "standard" | "strict";
        aiGenerationStyle: "concise" | "detailed" | "comprehensive";
    };
    createdAt: Date;
    organization?: string | undefined;
    lastLoginAt?: Date | undefined;
}, {
    id: string;
    email: string;
    name: string;
    role: "designer" | "manager" | "admin";
    preferences: {
        defaultAudience: string;
        preferredComplexity: "beginner" | "intermediate" | "advanced";
        accessibilityStrictness: "standard" | "strict";
        aiGenerationStyle: "concise" | "detailed" | "comprehensive";
    };
    createdAt: Date;
    organization?: string | undefined;
    lastLoginAt?: Date | undefined;
}>;
export declare const brandingConfigSchema: z.ZodObject<{
    primaryColor: z.ZodOptional<z.ZodString>;
    logoUrl: z.ZodOptional<z.ZodString>;
    organizationName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    primaryColor?: string | undefined;
    logoUrl?: string | undefined;
    organizationName?: string | undefined;
}, {
    primaryColor?: string | undefined;
    logoUrl?: string | undefined;
    organizationName?: string | undefined;
}>;
export declare const projectSettingsSchema: z.ZodObject<{
    brandingOptions: z.ZodObject<{
        primaryColor: z.ZodOptional<z.ZodString>;
        logoUrl: z.ZodOptional<z.ZodString>;
        organizationName: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        primaryColor?: string | undefined;
        logoUrl?: string | undefined;
        organizationName?: string | undefined;
    }, {
        primaryColor?: string | undefined;
        logoUrl?: string | undefined;
        organizationName?: string | undefined;
    }>;
    defaultAccessibilityLevel: z.ZodEnum<["AA", "AAA"]>;
    approvalWorkflow: z.ZodBoolean;
    stakeholderAccess: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    brandingOptions: {
        primaryColor?: string | undefined;
        logoUrl?: string | undefined;
        organizationName?: string | undefined;
    };
    defaultAccessibilityLevel: "AA" | "AAA";
    approvalWorkflow: boolean;
    stakeholderAccess: boolean;
}, {
    brandingOptions: {
        primaryColor?: string | undefined;
        logoUrl?: string | undefined;
        organizationName?: string | undefined;
    };
    defaultAccessibilityLevel: "AA" | "AAA";
    approvalWorkflow: boolean;
    stakeholderAccess: boolean;
}>;
export declare const projectSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    targetAudience: z.ZodString;
    estimatedDuration: z.ZodNumber;
    status: z.ZodEnum<["draft", "in_progress", "review", "completed", "archived"]>;
    ownerId: z.ZodString;
    collaborators: z.ZodArray<z.ZodString, "many">;
    settings: z.ZodObject<{
        brandingOptions: z.ZodObject<{
            primaryColor: z.ZodOptional<z.ZodString>;
            logoUrl: z.ZodOptional<z.ZodString>;
            organizationName: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            primaryColor?: string | undefined;
            logoUrl?: string | undefined;
            organizationName?: string | undefined;
        }, {
            primaryColor?: string | undefined;
            logoUrl?: string | undefined;
            organizationName?: string | undefined;
        }>;
        defaultAccessibilityLevel: z.ZodEnum<["AA", "AAA"]>;
        approvalWorkflow: z.ZodBoolean;
        stakeholderAccess: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        brandingOptions: {
            primaryColor?: string | undefined;
            logoUrl?: string | undefined;
            organizationName?: string | undefined;
        };
        defaultAccessibilityLevel: "AA" | "AAA";
        approvalWorkflow: boolean;
        stakeholderAccess: boolean;
    }, {
        brandingOptions: {
            primaryColor?: string | undefined;
            logoUrl?: string | undefined;
            organizationName?: string | undefined;
        };
        defaultAccessibilityLevel: "AA" | "AAA";
        approvalWorkflow: boolean;
        stakeholderAccess: boolean;
    }>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    status: "draft" | "in_progress" | "review" | "completed" | "archived";
    id: string;
    createdAt: Date;
    title: string;
    description: string;
    targetAudience: string;
    estimatedDuration: number;
    ownerId: string;
    collaborators: string[];
    settings: {
        brandingOptions: {
            primaryColor?: string | undefined;
            logoUrl?: string | undefined;
            organizationName?: string | undefined;
        };
        defaultAccessibilityLevel: "AA" | "AAA";
        approvalWorkflow: boolean;
        stakeholderAccess: boolean;
    };
    updatedAt: Date;
}, {
    status: "draft" | "in_progress" | "review" | "completed" | "archived";
    id: string;
    createdAt: Date;
    title: string;
    description: string;
    targetAudience: string;
    estimatedDuration: number;
    ownerId: string;
    collaborators: string[];
    settings: {
        brandingOptions: {
            primaryColor?: string | undefined;
            logoUrl?: string | undefined;
            organizationName?: string | undefined;
        };
        defaultAccessibilityLevel: "AA" | "AAA";
        approvalWorkflow: boolean;
        stakeholderAccess: boolean;
    };
    updatedAt: Date;
}>;
export declare const healthCheckResponseSchema: z.ZodObject<{
    status: z.ZodEnum<["healthy", "degraded", "unhealthy"]>;
    uptime: z.ZodNumber;
    version: z.ZodString;
    timestamp: z.ZodDate;
    database: z.ZodObject<{
        connected: z.ZodBoolean;
        responseTimeMs: z.ZodNumber;
        activeConnections: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        connected: boolean;
        responseTimeMs: number;
        activeConnections: number;
    }, {
        connected: boolean;
        responseTimeMs: number;
        activeConnections: number;
    }>;
    memory: z.ZodObject<{
        used: z.ZodNumber;
        total: z.ZodNumber;
        percentage: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        used: number;
        total: number;
        percentage: number;
    }, {
        used: number;
        total: number;
        percentage: number;
    }>;
    performance: z.ZodObject<{
        avgResponseTimeMs: z.ZodNumber;
        activeUsers: z.ZodNumber;
        requestsPerMinute: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        avgResponseTimeMs: number;
        activeUsers: number;
        requestsPerMinute: number;
    }, {
        avgResponseTimeMs: number;
        activeUsers: number;
        requestsPerMinute: number;
    }>;
}, "strip", z.ZodTypeAny, {
    status: "healthy" | "degraded" | "unhealthy";
    uptime: number;
    version: string;
    timestamp: Date;
    database: {
        connected: boolean;
        responseTimeMs: number;
        activeConnections: number;
    };
    memory: {
        used: number;
        total: number;
        percentage: number;
    };
    performance: {
        avgResponseTimeMs: number;
        activeUsers: number;
        requestsPerMinute: number;
    };
}, {
    status: "healthy" | "degraded" | "unhealthy";
    uptime: number;
    version: string;
    timestamp: Date;
    database: {
        connected: boolean;
        responseTimeMs: number;
        activeConnections: number;
    };
    memory: {
        used: number;
        total: number;
        percentage: number;
    };
    performance: {
        avgResponseTimeMs: number;
        activeUsers: number;
        requestsPerMinute: number;
    };
}>;
export declare const apiResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodAny>;
    error: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    timestamp: Date;
    success: boolean;
    data?: any;
    error?: string | undefined;
}, {
    timestamp: Date;
    success: boolean;
    data?: any;
    error?: string | undefined;
}>;
export declare const apiErrorResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<false>;
    error: z.ZodString;
    code: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    timestamp: Date;
    success: false;
    error: string;
    code?: string | undefined;
}, {
    timestamp: Date;
    success: false;
    error: string;
    code?: string | undefined;
}>;
//# sourceMappingURL=index.d.ts.map