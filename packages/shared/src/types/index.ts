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

// Health check and metrics types for monitoring endpoints
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  version: string;
  timestamp: Date;
  database: DatabaseHealth;
  memory: MemoryUsage;
  performance: PerformanceMetrics;
}

export interface DatabaseHealth {
  connected: boolean;
  responseTimeMs: number;
  activeConnections: number;
}

export interface MemoryUsage {
  used: number;
  total: number;
  percentage: number;
}

export interface PerformanceMetrics {
  avgResponseTimeMs: number;
  activeUsers: number;
  requestsPerMinute: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  timestamp: Date;
}

// Authentication types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  organization?: string;
  role: 'designer' | 'manager' | 'admin';
  preferences: UserPreferences;
  createdAt: Date;
  lastLoginAt?: Date;
  updatedAt: Date;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  organization?: string;
  role?: 'designer' | 'manager' | 'admin';
}

export interface SignInData {
  email: string;
  password: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface UpdateProfileData {
  name?: string;
  organization?: string;
  role?: 'designer' | 'manager' | 'admin';
  preferences?: Partial<UserPreferences>;
}

export interface AuthResponse {
  user: AuthUser;
  session?: any;
  emailConfirmationRequired?: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
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