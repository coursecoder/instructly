# Authentication API Documentation

## Overview

The Instructly Authentication API provides secure user authentication, session management, and user profile operations using Supabase Auth with enhanced security features.

## Base URL

```
Production: https://api.instructly.app/trpc
Development: http://localhost:3001/trpc
```

## Authentication Flow

### 1. User Registration

**Endpoint**: `auth.register`
**Method**: Mutation
**Authentication**: None required

```typescript
// Request
{
  email: string;
  password: string;
  name: string;
  organization?: string;
  role?: 'designer' | 'manager' | 'admin';
}

// Response
{
  user: {
    id: string;
    email: string;
    name: string;
    organization?: string;
    role: 'designer' | 'manager' | 'admin';
    preferences: UserPreferences;
    created_at: string;
    updated_at: string;
  };
  session?: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
  emailConfirmationRequired: boolean;
}
```

**Password Requirements**:
- Minimum 8 characters
- Must contain uppercase, lowercase, number, and special character
- Cannot contain sequential characters (123, abc, etc.)
- Cannot contain repeated characters (aaaa, 1111, etc.)
- Cannot be a common weak password
- Cannot contain user's email address

### 2. User Login

**Endpoint**: `auth.login`
**Method**: Mutation
**Authentication**: None required
**Rate Limit**: 100 requests per 15 minutes per IP
**Brute Force Protection**: 5 failed attempts per 15 minutes per IP/email

```typescript
// Request
{
  email: string;
  password: string;
}

// Response
{
  user: {
    id: string;
    email: string;
    name: string;
    organization?: string;
    role: 'designer' | 'manager' | 'admin';
    preferences: UserPreferences;
    last_login_at?: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}
```

### 3. User Logout

**Endpoint**: `auth.logout`
**Method**: Mutation
**Authentication**: Required (Bearer token)

```typescript
// Request
{} // No parameters required

// Response
{
  success: boolean;
}
```

### 4. Get Current User

**Endpoint**: `auth.me`
**Method**: Query
**Authentication**: Required (Bearer token)

```typescript
// Response
{
  user: {
    id: string;
    email: string;
    name: string;
    organization?: string;
    role: 'designer' | 'manager' | 'admin';
    preferences: UserPreferences;
    created_at: string;
    updated_at: string;
    last_login_at?: string;
  };
}
```

## Password Management

### 1. Reset Password

**Endpoint**: `auth.resetPassword`
**Method**: Mutation
**Authentication**: None required

```typescript
// Request
{
  email: string;
}

// Response
{
  success: boolean;
  message: string;
}
```

### 2. Update Profile

**Endpoint**: `auth.updateProfile`
**Method**: Mutation
**Authentication**: Required (Bearer token)

```typescript
// Request
{
  name?: string;
  organization?: string;
  role?: 'designer' | 'manager' | 'admin';
  preferences?: {
    defaultAudience?: string;
    preferredComplexity?: 'beginner' | 'intermediate' | 'advanced';
    accessibilityStrictness?: 'standard' | 'strict';
    aiGenerationStyle?: 'concise' | 'detailed' | 'comprehensive';
  };
}

// Response
{
  user: UserProfile;
}
```

## Email Verification

### 1. Verify Email

**Endpoint**: `auth.verifyEmail`
**Method**: Mutation
**Authentication**: None required

```typescript
// Request
{
  token: string;
  email: string;
}

// Response
{
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: UserProfile;
}
```

### 2. Resend Verification

**Endpoint**: `auth.resendVerification`
**Method**: Mutation
**Authentication**: None required

```typescript
// Request
{
  email: string;
}

// Response
{
  success: boolean;
  message: string;
}
```

## GDPR Compliance

### 1. Export User Data

**Endpoint**: `auth.exportData`
**Method**: Mutation
**Authentication**: Required (Bearer token)

```typescript
// Response
{
  exportDate: string;
  user: UserProfile;
  projects: Project[];
  aiUsage: AIUsageLog[];
  auditLogs: AuditLog[];
  sessions: SessionData[];
}
```

### 2. Delete Account

**Endpoint**: `auth.deleteAccount`
**Method**: Mutation
**Authentication**: Required (Bearer token)

```typescript
// Request
{
  confirmEmail: string; // Must match user's email
}

// Response
{
  success: boolean;
  message: string;
}
```

## Authentication Headers

All authenticated requests must include the Authorization header:

```
Authorization: Bearer <access_token>
```

## Error Responses

### Common Error Codes

```typescript
// 400 Bad Request
{
  error: {
    code: 'BAD_REQUEST';
    message: string;
    issues?: ValidationIssue[];
  }
}

// 401 Unauthorized
{
  error: {
    code: 'UNAUTHORIZED';
    message: 'Authentication required' | 'Invalid credentials' | 'Session expired';
  }
}

// 403 Forbidden
{
  error: {
    code: 'FORBIDDEN';
    message: 'Insufficient permissions';
  }
}

// 429 Too Many Requests
{
  error: {
    code: 'TOO_MANY_REQUESTS';
    message: 'Rate limit exceeded. Please try again later.';
    retryAfter: number; // seconds
  }
}

// 500 Internal Server Error
{
  error: {
    code: 'INTERNAL_SERVER_ERROR';
    message: 'Authentication service temporarily unavailable';
  }
}
```

### Validation Errors

```typescript
{
  error: {
    code: 'BAD_REQUEST';
    message: 'Validation failed';
    issues: [
      {
        path: ['email'];
        message: 'Invalid email address';
      },
      {
        path: ['password'];
        message: 'Password must be at least 8 characters';
      }
    ];
  }
}
```

## Security Features

### Rate Limiting

- **General API**: 1000 requests per 15 minutes per IP
- **Authentication endpoints**: 100 requests per 15 minutes per IP
- **Brute force protection**: 5 failed attempts per 15 minutes per IP/email

### Session Management

- **Token expiration**: 24 hours
- **Inactivity timeout**: 2 hours
- **Automatic cleanup**: Expired sessions removed automatically
- **Session validation**: Each request validates token freshness

### Audit Logging

All authentication events are logged including:
- Login attempts (success/failure)
- Logout events
- Token validation failures
- Rate limit violations
- Brute force attempts

## Code Examples

### JavaScript/TypeScript

```typescript
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './server/routers';

const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'https://api.instructly.app/trpc',
      headers: () => {
        const token = localStorage.getItem('auth_token');
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});

// Register user
try {
  const result = await client.auth.register.mutate({
    email: 'user@example.com',
    password: 'SecurePassword123!',
    name: 'John Doe',
    role: 'designer'
  });
  
  if (result.session) {
    localStorage.setItem('auth_token', result.session.access_token);
  }
} catch (error) {
  console.error('Registration failed:', error);
}

// Login user
try {
  const result = await client.auth.login.mutate({
    email: 'user@example.com',
    password: 'SecurePassword123!'
  });
  
  localStorage.setItem('auth_token', result.session.access_token);
} catch (error) {
  console.error('Login failed:', error);
}

// Get current user
try {
  const result = await client.auth.me.query();
  console.log('Current user:', result.user);
} catch (error) {
  console.error('Not authenticated:', error);
}
```

### cURL Examples

```bash
# Register user
curl -X POST https://api.instructly.app/trpc/auth.register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "name": "John Doe",
    "role": "designer"
  }'

# Login user
curl -X POST https://api.instructly.app/trpc/auth.login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'

# Get current user (requires auth token)
curl -X GET https://api.instructly.app/trpc/auth.me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Testing

### Test Endpoints

Development environment includes test utilities:

```bash
# Health check
GET /health

# Authentication health
GET /trpc/ai.healthCheck
```

### Mock Data

For testing purposes, use these test credentials in development:

```typescript
// Test user accounts (development only)
const testUsers = [
  { email: 'designer@test.com', password: 'TestPass123!', role: 'designer' },
  { email: 'manager@test.com', password: 'TestPass123!', role: 'manager' },
  { email: 'admin@test.com', password: 'TestPass123!', role: 'admin' }
];
```

## Support

For API support or issues:
- **Technical Documentation**: [Internal wiki link]
- **API Issues**: [Support ticket system]
- **Security Concerns**: security@instructly.app
- **Emergency**: [Emergency contact information]