-- Enhanced Authentication Security Migration
-- Addresses Story 1.2 Database User Schema and Security requirements

-- Additional RLS policies for users table
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert during registration" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Enhanced RLS policies for user data access and audit trails
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

CREATE POLICY "Managers can view designers in their organization" ON users FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users manager
        WHERE manager.id = auth.uid() 
        AND manager.role = 'manager'
        AND manager.organization = users.organization
    )
);

-- Projects: Enhanced policies for collaborative access
CREATE POLICY "Users can create projects" ON projects FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Project owners can update their projects" ON projects FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Project owners can delete their projects" ON projects FOR DELETE USING (auth.uid() = owner_id);

-- Lessons: Access control based on project ownership and collaboration
CREATE POLICY "Lesson access through project ownership" ON lessons FOR ALL USING (
    EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = lessons.project_id 
        AND (projects.owner_id = auth.uid() OR auth.uid() = ANY(projects.collaborators))
    )
);

-- Lesson content: Same access pattern as lessons
CREATE POLICY "Lesson content access through project ownership" ON lesson_content FOR ALL USING (
    EXISTS (
        SELECT 1 FROM lessons 
        JOIN projects ON projects.id = lessons.project_id
        WHERE lessons.id = lesson_content.lesson_id 
        AND (projects.owner_id = auth.uid() OR auth.uid() = ANY(projects.collaborators))
    )
);

-- Accessibility reports: Same access pattern as lessons
CREATE POLICY "Accessibility reports access through project ownership" ON accessibility_reports FOR ALL USING (
    EXISTS (
        SELECT 1 FROM lessons 
        JOIN projects ON projects.id = lessons.project_id
        WHERE lessons.id = accessibility_reports.lesson_id 
        AND (projects.owner_id = auth.uid() OR auth.uid() = ANY(projects.collaborators))
    )
);

-- AI usage logs: Users can only see their own usage
CREATE POLICY "Users can view own AI usage" ON ai_usage_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert AI usage logs" ON ai_usage_logs FOR INSERT WITH CHECK (true);

-- Admins can view all AI usage for cost monitoring (NFR5)
CREATE POLICY "Admins can view all AI usage" ON ai_usage_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

-- Session tracking table for security requirements (AC: 5)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for session lookups and cleanup
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- RLS for session tracking
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage sessions" ON user_sessions FOR ALL WITH CHECK (true);

-- Audit log table for GDPR compliance (AC: 6)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for audit log queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_logs_table_operation ON audit_logs(table_name, operation, created_at);

-- RLS for audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own audit logs" ON audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all audit logs" ON audit_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

-- Function to clean up expired sessions (for automatic logout)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log user data changes for GDPR compliance
CREATE OR REPLACE FUNCTION log_user_data_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log changes to users table for now
    IF TG_TABLE_NAME = 'users' THEN
        INSERT INTO audit_logs (user_id, table_name, operation, old_data, new_data)
        VALUES (
            COALESCE(NEW.id, OLD.id),
            TG_TABLE_NAME,
            TG_OP,
            CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
            CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for audit logging on users table
CREATE TRIGGER users_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION log_user_data_changes();

-- Password complexity requirements (enforced at application level)
-- This is documented here for reference but enforced in the auth service

-- Rate limiting table for brute force protection
CREATE TABLE login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    ip_address INET NOT NULL,
    success BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for rate limiting queries
CREATE INDEX idx_login_attempts_email_created ON login_attempts(email, created_at);
CREATE INDEX idx_login_attempts_ip_created ON login_attempts(ip_address, created_at);

-- RLS for login attempts
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "System can manage login attempts" ON login_attempts FOR ALL WITH CHECK (true);

-- Function to check rate limiting
CREATE OR REPLACE FUNCTION check_rate_limit(email_addr VARCHAR(255), ip_addr INET)
RETURNS BOOLEAN AS $$
DECLARE
    email_attempts INTEGER;
    ip_attempts INTEGER;
BEGIN
    -- Count failed attempts in last 15 minutes for email
    SELECT COUNT(*) INTO email_attempts
    FROM login_attempts
    WHERE email = email_addr 
    AND success = false 
    AND created_at > NOW() - INTERVAL '15 minutes';
    
    -- Count failed attempts in last 15 minutes for IP
    SELECT COUNT(*) INTO ip_attempts
    FROM login_attempts
    WHERE ip_address = ip_addr 
    AND success = false 
    AND created_at > NOW() - INTERVAL '15 minutes';
    
    -- Return false if rate limit exceeded (5 attempts per email or 10 per IP)
    RETURN email_attempts < 5 AND ip_attempts < 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up old login attempts (keep 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts()
RETURNS void AS $$
BEGIN
    DELETE FROM login_attempts WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;