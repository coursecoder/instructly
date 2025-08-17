# Database Schema

Based on the PostgreSQL choice and data models, here's the concrete database schema:

```sql
-- Users and Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    organization VARCHAR(255),
    role VARCHAR(50) NOT NULL CHECK (role IN ('designer', 'manager', 'admin')),
    preferences JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_audience VARCHAR(500),
    estimated_duration INTEGER NOT NULL, -- minutes
    status VARCHAR(50) NOT NULL CHECK (status IN ('draft', 'in_progress', 'review', 'completed', 'archived')),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    collaborators UUID[] DEFAULT '{}',
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lessons
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('draft', 'generating', 'generated', 'reviewed', 'approved')),
    estimated_duration INTEGER NOT NULL, -- minutes
    delivery_format VARCHAR(50) NOT NULL CHECK (delivery_format IN ('instructor_led', 'self_paced', 'hybrid', 'virtual_classroom')),
    topics JSONB NOT NULL DEFAULT '[]',
    accessibility_compliance JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Generated Lesson Content
CREATE TABLE lesson_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE UNIQUE,
    learning_objectives JSONB NOT NULL DEFAULT '[]',
    activities JSONB NOT NULL DEFAULT '[]',
    assessments JSONB NOT NULL DEFAULT '[]',
    instructor_notes TEXT,
    participant_materials TEXT,
    professional_documentation JSONB DEFAULT '{}',
    generation_metadata JSONB NOT NULL DEFAULT '{}',
    accessibility_features JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Accessibility Reports
CREATE TABLE accessibility_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    compliance_level VARCHAR(10) NOT NULL CHECK (compliance_level IN ('A', 'AA', 'AAA')),
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    violations JSONB NOT NULL DEFAULT '[]',
    recommendations JSONB NOT NULL DEFAULT '[]',
    audit_trail JSONB NOT NULL DEFAULT '[]',
    report_format VARCHAR(50) NOT NULL CHECK (report_format IN ('section_508', 'wcag_2_1', 'enterprise_summary')),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Cost Tracking
CREATE TABLE ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    lesson_id UUID REFERENCES lessons(id),
    model_used VARCHAR(50) NOT NULL,
    operation_type VARCHAR(100) NOT NULL,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    cost_usd DECIMAL(10,6) NOT NULL,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_lessons_project_id ON lessons(project_id);
CREATE INDEX idx_lessons_status ON lessons(status);
CREATE INDEX idx_accessibility_reports_lesson_id ON accessibility_reports(lesson_id);
CREATE INDEX idx_ai_usage_user_id_created_at ON ai_usage_logs(user_id, created_at);

-- Full-text Search for Content
CREATE INDEX idx_lessons_title_search ON lessons USING gin(to_tsvector('english', title));
CREATE INDEX idx_projects_title_search ON projects USING gin(to_tsvector('english', title));
```
