import { z } from 'zod';

// User types based on Dev Notes database schema
export interface User {
  id: string;
  email: string;
  name: string;
  organization?: string;
  role: 'designer' | 'manager' | 'admin';
  preferences: UserPreferences;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface UserPreferences {
  defaultAudience: string;
  preferredComplexity: 'beginner' | 'intermediate' | 'advanced';
  accessibilityStrictness: 'standard' | 'strict';
  aiGenerationStyle: 'concise' | 'detailed' | 'comprehensive';
}

// Project types based on Dev Notes database schema
export interface Project {
  id: string;
  title: string;
  description: string;
  targetAudience: string;
  estimatedDuration: number; // minutes
  status: 'draft' | 'in_progress' | 'review' | 'completed' | 'archived';
  ownerId: string;
  collaborators: string[];
  settings: ProjectSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectSettings {
  brandingOptions: BrandingConfig;
  defaultAccessibilityLevel: 'AA' | 'AAA';
  approvalWorkflow: boolean;
  stakeholderAccess: boolean;
}

export interface BrandingConfig {
  primaryColor?: string;
  logoUrl?: string;
  organizationName?: string;
}

// Lesson types based on Dev Notes database schema
export interface Lesson {
  id: string;
  title: string;
  description: string;
  projectId: string;
  topics: Topic[];
  generatedContent?: LessonContent;
  status: 'draft' | 'generating' | 'generated' | 'reviewed' | 'approved';
  estimatedDuration: number; // minutes
  deliveryFormat: 'instructor_led' | 'self_paced' | 'hybrid' | 'virtual_classroom';
  accessibilityCompliance: AccessibilityStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonContent {
  learningObjectives: string[];
  activities: LessonActivity[];
  assessments: Assessment[];
  instructorNotes: string;
  participantMaterials: string;
  professionalDocumentation: ProfessionalDoc;
  generationMetadata: GenerationMetadata;
  accessibilityFeatures: AccessibilityFeature[];
}

export interface LessonActivity {
  id: string;
  type: 'presentation' | 'discussion' | 'exercise' | 'case_study' | 'role_play';
  title: string;
  description: string;
  duration: number; // minutes
  materials: string[];
  instructions: string;
}

export interface Assessment {
  id: string;
  type: 'quiz' | 'assignment' | 'practical' | 'peer_review';
  title: string;
  description: string;
  criteria: string[];
  passingScore?: number;
}

export interface ProfessionalDoc {
  facilitatorGuide?: string;
  participantWorkbook?: string;
  slideDeck?: string;
  handouts: string[];
}

export interface GenerationMetadata {
  modelUsed: 'gpt-5' | 'gpt-3.5-turbo';
  generationTime: Date;
  costUsd: number;
  tokenCount: number;
  version: string;
}

export interface AccessibilityStatus {
  complianceLevel: 'A' | 'AA' | 'AAA';
  overallScore: number; // 0-100
  violations: AccessibilityViolation[];
  recommendations: string[];
  auditTrail: AuditEntry[];
}

export interface AccessibilityViolation {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  guideline: string;
  description: string;
  location: string;
  remediation: string;
}

export interface AccessibilityFeature {
  type: 'alt_text' | 'captions' | 'transcript' | 'keyboard_nav' | 'screen_reader';
  description: string;
  implemented: boolean;
}

export interface AuditEntry {
  timestamp: Date;
  action: string;
  userId: string;
  details: Record<string, any>;
}

// AI Usage Logging for cost tracking (NFR5)
export interface AIUsageLog {
  id: string;
  userId: string;
  lessonId?: string;
  modelUsed: 'gpt-5' | 'gpt-3.5-turbo';
  operationType: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  processingTimeMs?: number;
  createdAt: Date;
}

// AI Topic Analysis types
export interface Topic {
  id: string;
  content: string;
  classification: 'facts' | 'concepts' | 'processes' | 'procedures' | 'principles';
  aiAnalysis: InstructionalDesignAnalysis;
  generatedAt: Date;
}

export interface InstructionalDesignAnalysis {
  contentType: string;
  rationale: string;
  recommendedMethods: string[];
  confidence: number; // 0-1 score
  modelUsed: 'gpt-5' | 'gpt-3.5-turbo';
}

export interface TopicAnalysisRequest {
  topics: string[];
  analysisType: 'instructional_design' | 'bloom_taxonomy' | 'instructional_methods';
}

export interface TopicAnalysisResponse {
  topics: Topic[];
  totalCost: number;
  processingTime: number;
}

// Performance constants
export const PERFORMANCE_REQUIREMENTS = {
  API_RESPONSE_TIME_MS: 500,
  AI_PROCESSING_TIME_MS: 10000,
  DATABASE_QUERY_TIME_MS: 100,
  CONCURRENT_USERS: 100,
  UPTIME_PERCENTAGE: 99.9
} as const;

// Validation schemas
export const topicAnalysisRequestSchema = z.object({
  topics: z.array(z.string().min(1, 'Topic cannot be empty').max(1000, 'Topic too long')).min(1, 'At least one topic required').max(10, 'Maximum 10 topics allowed'),
  analysisType: z.enum(['instructional_design', 'bloom_taxonomy', 'instructional_methods']).default('instructional_design'),
});

// Additional schemas needed by the routers (moved up for proper ordering)
export const projectSettingsSchema = z.object({
  brandingOptions: z.object({
    primaryColor: z.string().optional(),
    logoUrl: z.string().url().optional(),
    organizationName: z.string().max(255).optional(),
  }),
  defaultAccessibilityLevel: z.enum(['AA', 'AAA']),
  approvalWorkflow: z.boolean(),
  stakeholderAccess: z.boolean(),
});

export const createProjectSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional().default(''),
  targetAudience: z.string().max(500),
  estimatedDuration: z.number().positive(),
  settings: projectSettingsSchema.optional(),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  id: z.string().uuid(),
});

export const createLessonSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional().default(''),
  projectId: z.string().uuid(),
  estimatedDuration: z.number().positive(),
  deliveryFormat: z.enum(['instructor_led', 'self_paced', 'hybrid', 'virtual_classroom']),
});

export const updateLessonSchema = createLessonSchema.partial().extend({
  id: z.string().uuid(),
});

export const lessonSequenceUpdateSchema = z.object({
  projectId: z.string().uuid(),
  lessonSequence: z.array(z.string().uuid()),
});

export const topicSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  classification: z.enum(['facts', 'concepts', 'processes', 'procedures', 'principles']),
  aiAnalysis: z.object({
    contentType: z.string(),
    rationale: z.string(),
    recommendedMethods: z.array(z.string()),
    confidence: z.number().min(0).max(1),
    modelUsed: z.enum(['gpt-5', 'gpt-3.5-turbo']),
  }),
  generatedAt: z.date(),
});

export const accessibilityStatusSchema = z.object({
  complianceLevel: z.enum(['A', 'AA', 'AAA']),
  overallScore: z.number().min(0).max(100),
  violations: z.array(z.object({
    id: z.string().uuid(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    guideline: z.string(),
    description: z.string(),
    location: z.string(),
    remediation: z.string(),
  })),
  recommendations: z.array(z.string()),
  auditTrail: z.array(z.object({
    timestamp: z.date(),
    action: z.string(),
    userId: z.string().uuid(),
    details: z.record(z.any()),
  })),
});

// Authentication schemas
export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  organization: z.string().max(255).optional(),
  role: z.enum(['designer', 'manager', 'admin']).default('designer'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255).optional(),
  organization: z.string().max(255).optional(),
  role: z.enum(['designer', 'manager', 'admin']).optional(),
  preferences: z.object({
    defaultAudience: z.string().min(1),
    preferredComplexity: z.enum(['beginner', 'intermediate', 'advanced']),
    accessibilityStrictness: z.enum(['standard', 'strict']),
    aiGenerationStyle: z.enum(['concise', 'detailed', 'comprehensive']),
  }).partial().optional(),
});