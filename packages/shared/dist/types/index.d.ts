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
export interface Project {
    id: string;
    title: string;
    description: string;
    targetAudience: string;
    estimatedDuration: number;
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
export interface Lesson {
    id: string;
    title: string;
    description: string;
    projectId: string;
    topics: Topic[];
    generatedContent?: LessonContent;
    status: 'draft' | 'generating' | 'generated' | 'reviewed' | 'approved' | 'archived';
    estimatedDuration: number;
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
    duration: number;
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
    overallScore: number;
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
    confidence: number;
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
//# sourceMappingURL=index.d.ts.map