-- Initial database schema for Instructly platform
-- Based on Dev Notes database schema requirements

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users and Authentication (GDPR/SOC 2 foundation)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    organization VARCHAR(255),
    role VARCHAR(50) NOT NULL CHECK (role IN ('designer', 'manager', 'admin')),
    preferences JSONB NOT NULL DEFAULT '{"defaultAudience": "", "preferredComplexity": "intermediate", "accessibilityStrictness": "standard", "aiGenerationStyle": "detailed"}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects (collaborative features and audit trail capabilities)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_audience VARCHAR(500),
    estimated_duration INTEGER NOT NULL, -- minutes
    status VARCHAR(50) NOT NULL CHECK (status IN ('draft', 'in_progress', 'review', 'completed', 'archived')),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    collaborators UUID[] DEFAULT '{}',
    settings JSONB NOT NULL DEFAULT '{"brandingOptions": {}, "defaultAccessibilityLevel": "AA", "approvalWorkflow": false, "stakeholderAccess": false}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lessons (placeholder for future epics)
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Generated Lesson Content (placeholder for future epics)
CREATE TABLE lesson_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Accessibility Reports (placeholder for future epics)
CREATE TABLE accessibility_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    compliance_level VARCHAR(10) NOT NULL CHECK (compliance_level IN ('A', 'AA', 'AAA')),
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    violations JSONB NOT NULL DEFAULT '[]',
    recommendations JSONB NOT NULL DEFAULT '[]',
    audit_trail JSONB NOT NULL DEFAULT '[]',
    report_format VARCHAR(50) NOT NULL CHECK (report_format IN ('section_508', 'wcag_2_1', 'enterprise_summary')),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Cost Tracking (NFR5: 30% revenue threshold)
CREATE TABLE ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Indexes for Performance (NFR2: 1000+ concurrent users)
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at);

CREATE INDEX idx_lessons_project_id ON lessons(project_id);
CREATE INDEX idx_lessons_status ON lessons(status);
CREATE INDEX idx_lessons_created_at ON lessons(created_at);

CREATE INDEX idx_accessibility_reports_lesson_id ON accessibility_reports(lesson_id);
CREATE INDEX idx_accessibility_reports_generated_at ON accessibility_reports(generated_at);

CREATE INDEX idx_ai_usage_user_id_created_at ON ai_usage_logs(user_id, created_at);
CREATE INDEX idx_ai_usage_cost ON ai_usage_logs(cost_usd, created_at);
CREATE INDEX idx_ai_usage_model ON ai_usage_logs(model_used, created_at);

-- Full-text Search for Content (enterprise search capabilities)
CREATE INDEX idx_users_name_search ON users USING gin(to_tsvector('english', name));
CREATE INDEX idx_projects_title_search ON projects USING gin(to_tsvector('english', title));
CREATE INDEX idx_projects_description_search ON projects USING gin(to_tsvector('english', description));
CREATE INDEX idx_lessons_title_search ON lessons USING gin(to_tsvector('english', title));

-- Row Level Security (RLS) for enterprise security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessibility_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (will be expanded in authentication epic)
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Projects visible to owner and collaborators" ON projects FOR SELECT USING (
    auth.uid() = owner_id OR 
    auth.uid() = ANY(collaborators)
);

-- Audit triggers for compliance (SOC 2 requirements)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_content_updated_at BEFORE UPDATE ON lesson_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create initial admin user for testing (will be removed in production)
INSERT INTO users (email, name, role, preferences) VALUES (
    'admin@instructly.com',
    'Admin User',
    'admin',
    '{"defaultAudience": "Enterprise", "preferredComplexity": "advanced", "accessibilityStrictness": "strict", "aiGenerationStyle": "comprehensive"}'
);

-- Create sample project for testing
INSERT INTO projects (title, description, target_audience, estimated_duration, status, owner_id, settings) VALUES (
    'Sample Instructional Design Project',
    'A demonstration project showing the platform capabilities',
    'Learning & Development Teams',
    120,
    'draft',
    (SELECT id FROM users WHERE email = 'admin@instructly.com'),
    '{"brandingOptions": {"organizationName": "Instructly Demo"}, "defaultAccessibilityLevel": "AA", "approvalWorkflow": true, "stakeholderAccess": true}'
);