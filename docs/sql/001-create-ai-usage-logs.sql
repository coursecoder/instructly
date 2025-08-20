-- AI Topic Analysis Feature Database Setup
-- Create ai_usage_logs table for cost tracking and compliance

-- AI Cost Tracking
CREATE TABLE IF NOT EXISTS ai_usage_logs (
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

-- Index for Performance
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id_created_at ON ai_usage_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_cost_tracking ON ai_usage_logs(user_id, created_at DESC);

-- Insert sample AI usage log for development/testing (if users table exists)
INSERT INTO ai_usage_logs (user_id, model_used, operation_type, input_tokens, output_tokens, cost_usd, processing_time_ms)
SELECT 
    u.id,
    'gpt-3.5-turbo',
    'topic_analysis',
    150,
    250,
    0.0005,
    172
FROM users u 
LIMIT 1
ON CONFLICT DO NOTHING;

-- Grant necessary permissions (adjust for your setup)
GRANT SELECT, INSERT ON ai_usage_logs TO service_role;