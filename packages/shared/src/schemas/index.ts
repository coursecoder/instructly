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

// AI Topic Analysis validation schemas (moved up for lessonSchema reference)
export const instructionalDesignAnalysisSchema = z.object({
  contentType: z.string(),
  rationale: z.string(),
  recommendedMethods: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  modelUsed: z.enum(['gpt-5', 'gpt-3.5-turbo']),
});

export const topicSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  classification: z.enum(['facts', 'concepts', 'processes', 'procedures', 'principles']),
  aiAnalysis: instructionalDesignAnalysisSchema,
  generatedAt: z.date(),
});

export const topicAnalysisRequestSchema = z.object({
  topics: z.array(z.string().min(1, 'Topic cannot be empty').max(1000, 'Topic too long')).min(1, 'At least one topic required').max(10, 'Maximum 10 topics allowed'),
  analysisType: z.enum(['instructional_design', 'bloom_taxonomy', 'instructional_methods']).default('instructional_design'),
});

export const topicAnalysisResponseSchema = z.object({
  topics: z.array(topicSchema),
  totalCost: z.number().nonnegative(),
  processingTime: z.number().nonnegative(),
});

// Lesson validation schemas
export const lessonActivitySchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['presentation', 'discussion', 'exercise', 'case_study', 'role_play']),
  title: z.string().min(1).max(255),
  description: z.string(),
  duration: z.number().positive(),
  materials: z.array(z.string()),
  instructions: z.string(),
});

export const assessmentSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['quiz', 'assignment', 'practical', 'peer_review']),
  title: z.string().min(1).max(255),
  description: z.string(),
  criteria: z.array(z.string()),
  passingScore: z.number().min(0).max(100).optional(),
});

export const professionalDocSchema = z.object({
  facilitatorGuide: z.string().optional(),
  participantWorkbook: z.string().optional(),
  slideDeck: z.string().optional(),
  handouts: z.array(z.string()),
});

export const generationMetadataSchema = z.object({
  modelUsed: z.enum(['gpt-5', 'gpt-3.5-turbo']),
  generationTime: z.date(),
  costUsd: z.number().nonnegative(),
  tokenCount: z.number().nonnegative(),
  version: z.string(),
});

export const accessibilityFeatureSchema = z.object({
  type: z.enum(['alt_text', 'captions', 'transcript', 'keyboard_nav', 'screen_reader']),
  description: z.string(),
  implemented: z.boolean(),
});

export const lessonContentSchema = z.object({
  learningObjectives: z.array(z.string()),
  activities: z.array(lessonActivitySchema),
  assessments: z.array(assessmentSchema),
  instructorNotes: z.string(),
  participantMaterials: z.string(),
  professionalDocumentation: professionalDocSchema,
  generationMetadata: generationMetadataSchema,
  accessibilityFeatures: z.array(accessibilityFeatureSchema),
});

export const auditEntrySchema = z.object({
  timestamp: z.date(),
  action: z.string(),
  userId: z.string().uuid(),
  details: z.record(z.any()),
});

export const accessibilityViolationSchema = z.object({
  id: z.string().uuid(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  guideline: z.string(),
  description: z.string(),
  location: z.string(),
  remediation: z.string(),
});

export const accessibilityStatusSchema = z.object({
  complianceLevel: z.enum(['A', 'AA', 'AAA']),
  overallScore: z.number().min(0).max(100),
  violations: z.array(accessibilityViolationSchema),
  recommendations: z.array(z.string()),
  auditTrail: z.array(auditEntrySchema),
});

export const lessonSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string(),
  projectId: z.string().uuid(),
  topics: z.array(topicSchema),
  generatedContent: lessonContentSchema.optional(),
  status: z.enum(['draft', 'generating', 'generated', 'reviewed', 'approved', 'archived']),
  estimatedDuration: z.number().positive(),
  deliveryFormat: z.enum(['instructor_led', 'self_paced', 'hybrid', 'virtual_classroom']),
  accessibilityCompliance: accessibilityStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Project/Lesson CRUD operation schemas
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

export const bulkLessonSequenceUpdateSchema = z.object({
  projectId: z.string().uuid(),
  lessonSequence: z.array(z.string().uuid()),
  selectedLessons: z.array(z.string().uuid()),
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

// Authentication validation schemas
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

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255).optional(),
  organization: z.string().max(255).optional(),
  role: z.enum(['designer', 'manager', 'admin']).optional(),
  preferences: userPreferencesSchema.partial().optional(),
});

export const authResponseSchema = z.object({
  user: userSchema,
  session: z.any().optional(),
  emailConfirmationRequired: z.boolean().optional(),
});

export const authStateSchema = z.object({
  user: userSchema.nullable(),
  isAuthenticated: z.boolean(),
  isLoading: z.boolean(),
  error: z.string().nullable(),
});

export const aiUsageLogSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  lessonId: z.string().uuid().optional(),
  modelUsed: z.enum(['gpt-5', 'gpt-3.5-turbo']),
  operationType: z.string(),
  inputTokens: z.number().nonnegative(),
  outputTokens: z.number().nonnegative(),
  costUsd: z.number().nonnegative(),
  processingTimeMs: z.number().nonnegative().optional(),
  createdAt: z.date(),
});