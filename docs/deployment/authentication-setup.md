# Authentication System Deployment Guide

## Overview

This guide covers the deployment and configuration of Instructly's production authentication system, which includes JWT validation, security middleware, and comprehensive audit logging.

## Prerequisites

- Supabase project configured with authentication enabled
- OpenAI API key with appropriate usage limits
- Production environment variables properly configured
- SSL/TLS certificates for secure communication

## Environment Variables

### Required Production Variables

```bash
# Node Environment
NODE_ENV=production

# Server Configuration
API_PORT=3001
API_HOST=0.0.0.0

# Supabase Configuration (Critical - Server-side only)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key

# OpenAI Configuration (Critical - Server-side only)
OPENAI_API_KEY=sk-...your-openai-key

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### Security Requirements

1. **Service Role Key**: Must be kept server-side only, never exposed to client
2. **OpenAI API Key**: Must be kept server-side only, implement usage monitoring
3. **Anon Key**: Can be client-accessible but should be environment-specific

## Deployment Steps

### 1. Environment Validation

The system includes automatic environment validation on startup:

```bash
# The server will validate all required environment variables
# and perform security checks before starting
npm start
```

Expected startup output:
```
info: Performing environment and security validation...
info: API server running at http://0.0.0.0:3001
info: tRPC endpoints available at http://0.0.0.0:3001/trpc
info: Environment: production
```

### 2. Supabase Configuration

#### Database Schema
Ensure the following tables exist in your Supabase database:

```sql
-- Users table with authentication data
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  organization TEXT,
  role TEXT NOT NULL CHECK (role IN ('designer', 'manager', 'admin')),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- User sessions for enhanced security
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Login attempts for brute force protection
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address INET NOT NULL,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Row Level Security (RLS)
Enable RLS on all tables:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
```

### 3. Security Middleware Configuration

The system includes comprehensive security middleware:

#### Rate Limiting
- **General API**: 1000 requests per 15 minutes per IP
- **Authentication**: 100 requests per 15 minutes per IP
- **Brute Force**: 5 failed attempts per 15 minutes per IP/email

#### Audit Logging
All authentication events are logged with:
- Login success/failure
- Logout events
- Token validation failures
- Rate limit exceeded
- Brute force attempts

### 4. Health Checks and Monitoring

#### Health Endpoint
```bash
GET /health
```

Response includes:
- Server status
- Environment validation
- Database connectivity
- Security middleware status

#### Monitoring Recommendations

1. **Authentication Metrics**
   - Login success/failure rates
   - Unusual IP address patterns
   - Rate limiting triggers
   - Session timeout frequency

2. **Security Alerts**
   - Multiple failed login attempts from same IP
   - Unusual login patterns
   - API key usage spikes
   - Environment validation failures

### 5. Production Deployment Checklist

#### Pre-Deployment
- [ ] All environment variables configured and validated
- [ ] Supabase database schema deployed
- [ ] RLS policies configured
- [ ] SSL certificates installed
- [ ] Domain DNS configured

#### Deployment
- [ ] Deploy application code
- [ ] Run environment validation
- [ ] Test authentication flow end-to-end
- [ ] Verify security middleware functionality
- [ ] Check audit logging

#### Post-Deployment
- [ ] Monitor authentication metrics
- [ ] Verify rate limiting is working
- [ ] Test brute force protection
- [ ] Confirm audit logs are being written
- [ ] Set up monitoring alerts

## Security Best Practices

### Key Rotation
- Rotate Supabase service role key quarterly
- Rotate OpenAI API key quarterly
- Monitor key usage for unusual patterns

### Access Control
- Implement principle of least privilege
- Regular access reviews for admin accounts
- Multi-factor authentication for admin users

### Monitoring
- Set up alerts for authentication failures
- Monitor API usage for anomalies
- Regular security log reviews

## Troubleshooting

### Common Issues

#### 1. Environment Validation Failures
```bash
# Check environment variables
printenv | grep -E "(SUPABASE|OPENAI)"

# Validate manually
node -e "console.log(require('./src/config/environment').env)"
```

#### 2. Authentication Not Working
```bash
# Check Supabase connectivity
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     "https://your-project.supabase.co/rest/v1/"

# Test OpenAI connectivity
curl -H "Authorization: Bearer YOUR_OPENAI_KEY" \
     "https://api.openai.com/v1/models"
```

#### 3. Rate Limiting Issues
- Check if rate limits are appropriate for your traffic
- Review IP whitelisting for trusted sources
- Monitor rate limit logs for patterns

### Emergency Procedures

#### Disable Authentication (Emergency Only)
If authentication is causing issues, you can temporarily disable it:

1. Set environment variable: `EMERGENCY_DISABLE_AUTH=true`
2. Restart the service
3. **CRITICAL**: Re-enable as soon as possible

#### Key Compromise Response
1. Immediately rotate compromised keys
2. Review audit logs for unauthorized access
3. Force logout all users
4. Notify security team

## Contact Information

For deployment issues or security concerns:
- Technical Lead: [contact information]
- Security Team: [contact information]
- Emergency Escalation: [contact information]