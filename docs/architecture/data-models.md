# Data Models

Based on the PRD requirements and Epic analysis, the core data models that will be shared between frontend and backend support the project → lessons → topics hierarchy with AI-generated content and accessibility compliance tracking.

## User

**Purpose:** Represents instructional designers and their organizational context for personalized AI recommendations and enterprise compliance tracking.

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  organization?: string;
  role: 'designer' | 'manager' | 'admin';
  preferences: UserPreferences;
  createdAt: Date;
  lastLoginAt: Date;
}

interface UserPreferences {
  defaultAudience: string;
  preferredComplexity: 'beginner' | 'intermediate' | 'advanced';
  accessibilityStrictness: 'standard' | 'strict';
  aiGenerationStyle: 'concise' | 'detailed' | 'comprehensive';
}
```

**Relationships:**
- One-to-many with Projects (user owns multiple projects)
- One-to-many with AccessibilityReports (user generates compliance reports)

## Project

**Purpose:** Top-level container for related lessons, enabling enterprise project management and stakeholder collaboration workflows.

```typescript
interface Project {
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

interface ProjectSettings {
  brandingOptions: BrandingConfig;
  defaultAccessibilityLevel: 'AA' | 'AAA';
  approvalWorkflow: boolean;
  stakeholderAccess: boolean;
}
```

**Relationships:**
- Many-to-one with User (project belongs to user)
- One-to-many with Lessons (project contains multiple lessons)
- One-to-many with StakeholderShares (project shared with stakeholders)

## Lesson

**Purpose:** Individual learning unit within a project, containing AI-generated content optimized for specific instructional objectives and delivery formats.

```typescript
interface Lesson {
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

interface Topic {
  id: string;
  content: string;
  classification: 'facts' | 'concepts' | 'processes' | 'procedures' | 'principles';
  aiAnalysis: ClarkMayerAnalysis;
  generatedAt: Date;
}

interface ClarkMayerAnalysis {
  contentType: string;
  rationale: string;
  recommendedMethods: string[];
  confidence: number; // 0-1 score
  modelUsed: 'gpt-5' | 'gpt-3.5-turbo';
}
```

**Relationships:**
- Many-to-one with Project (lesson belongs to project)
- One-to-one with LessonContent (lesson has generated content)
- One-to-many with AccessibilityReports (lesson generates compliance reports)

## LessonContent

**Purpose:** AI-generated instructional materials optimized for professional presentation and accessibility compliance.

```typescript
interface LessonContent {
  id: string;
  lessonId: string;
  learningObjectives: LearningObjective[];
  activities: Activity[];
  assessments: Assessment[];
  instructorNotes: string;
  participantMaterials: string;
  professionalDocumentation: InstructionalDesignChart;
  generationMetadata: GenerationMetadata;
  accessibilityFeatures: AccessibilityFeatures;
}

interface LearningObjective {
  id: string;
  text: string;
  bloomsTaxonomyLevel: string;
  assessmentAlignment: string[];
  measurable: boolean;
}

interface Activity {
  id: string;
  title: string;
  description: string;
  type: 'hands_on' | 'discussion' | 'reflection' | 'group_work' | 'case_study';
  estimatedTime: number;
  materials: string[];
  instructions: string[];
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
}
```

**Relationships:**
- One-to-one with Lesson (content belongs to lesson)
- One-to-many with AccessibilityReports (content generates compliance validation)

## AccessibilityReport

**Purpose:** Automated WCAG 2.1 compliance documentation for enterprise audit requirements and legal compliance verification.

```typescript
interface AccessibilityReport {
  id: string;
  lessonId: string;
  complianceLevel: 'A' | 'AA' | 'AAA';
  overallScore: number; // 0-100 percentage
  violations: AccessibilityViolation[];
  recommendations: string[];
  auditTrail: AuditEntry[];
  generatedAt: Date;
  reportFormat: 'section_508' | 'wcag_2_1' | 'enterprise_summary';
}

interface AccessibilityViolation {
  ruleId: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  location: string;
  remediation: string;
  autoFixAvailable: boolean;
}
```

**Relationships:**
- Many-to-one with Lesson (multiple reports per lesson over time)
- Many-to-one with User (user generates compliance reports)
