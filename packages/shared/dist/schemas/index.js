import { z } from 'zod';
// User validation schemas
export const userPreferencesSchema = z.object({
    defaultAudience: z.string().min(1),
    preferredComplexity: z.enum(['beginner', 'intermediate', 'advanced']),
    accessibilityStrictness: z.enum(['standard', 'strict']),
    aiGenerationStyle: z.enum(['concise', 'detailed', 'comprehensive']),
});
export const userSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().min(1).max(255),
    organization: z.string().max(255).optional(),
    role: z.enum(['designer', 'manager', 'admin']),
    preferences: userPreferencesSchema,
    createdAt: z.date(),
    lastLoginAt: z.date().optional(),
});
// Project validation schemas
export const brandingConfigSchema = z.object({
    primaryColor: z.string().optional(),
    logoUrl: z.string().url().optional(),
    organizationName: z.string().max(255).optional(),
});
export const projectSettingsSchema = z.object({
    brandingOptions: brandingConfigSchema,
    defaultAccessibilityLevel: z.enum(['AA', 'AAA']),
    approvalWorkflow: z.boolean(),
    stakeholderAccess: z.boolean(),
});
export const projectSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(255),
    description: z.string(),
    targetAudience: z.string().max(500),
    estimatedDuration: z.number().positive(),
    status: z.enum(['draft', 'in_progress', 'review', 'completed', 'archived']),
    ownerId: z.string().uuid(),
    collaborators: z.array(z.string().uuid()),
    settings: projectSettingsSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
});
// Health check validation schemas
export const healthCheckResponseSchema = z.object({
    status: z.enum(['healthy', 'degraded', 'unhealthy']),
    uptime: z.number().nonnegative(),
    version: z.string(),
    timestamp: z.date(),
    database: z.object({
        connected: z.boolean(),
        responseTimeMs: z.number().nonnegative(),
        activeConnections: z.number().nonnegative(),
    }),
    memory: z.object({
        used: z.number().nonnegative(),
        total: z.number().positive(),
        percentage: z.number().min(0).max(100),
    }),
    performance: z.object({
        avgResponseTimeMs: z.number().nonnegative(),
        activeUsers: z.number().nonnegative(),
        requestsPerMinute: z.number().nonnegative(),
    }),
});
// API response validation schemas
export const apiResponseSchema = z.object({
    success: z.boolean(),
    data: z.any().optional(),
    error: z.string().optional(),
    timestamp: z.date(),
});
export const apiErrorResponseSchema = z.object({
    success: z.literal(false),
    error: z.string(),
    code: z.string().optional(),
    timestamp: z.date(),
});
