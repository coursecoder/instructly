# Environment Variables Reference

This document provides a comprehensive guide to all environment variables used in the Instructly platform to prevent duplication and configuration errors.

## 📁 File Locations

### Primary Environment File
- **File**: `/home/coleens/dev/instructly/.env`
- **Purpose**: Main environment configuration for the entire monorepo
- **Scope**: Shared across all packages and applications

### Package-Specific Considerations
- **Frontend (apps/web)**: Uses `NEXT_PUBLIC_*` prefixed variables for client-side access
- **Backend (apps/api)**: Uses server-side variables without the `NEXT_PUBLIC_` prefix
- **Shared (packages/*)**: May reference environment variables through consuming applications

## 🔑 Supabase Configuration

### Variables Required for Database Operations

```bash
# Backend API Services (Server-side only)
SUPABASE_URL=https://qppymnoznycbzzgyankj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Frontend Client (Public - exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=https://qppymnoznycbzzgyankj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Usage Patterns

#### Backend Repository Services
All repository classes (e.g., `ProjectRepository`, `LessonRepository`) should follow this pattern:

```typescript
// ✅ CORRECT - Check for required variables
constructor() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables');
  }

  this.supabase = createClient<Database>(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
```

#### Frontend Client
For frontend Supabase clients, use the public variables:

```typescript
// ✅ CORRECT - Use NEXT_PUBLIC_ prefixed variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

## 🚫 Common Mistakes to Avoid

### 1. Variable Name Confusion
```bash
# ❌ WRONG - These don't exist
SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=...

# ✅ CORRECT - Use the exact names from .env
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 2. Missing Environment Check
```typescript
// ❌ WRONG - Will fail silently if variables are missing
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// ✅ CORRECT - Fail fast with clear error message
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}
```

### 3. Using Wrong Variables in Wrong Context
```typescript
// ❌ WRONG - Service role key exposed to browser
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ Security risk!
);

// ✅ CORRECT - Use anon key for client-side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

## 📋 Complete Variable Reference

### 🗄️ Database (Supabase)
| Variable | Scope | Purpose | Example |
|----------|-------|---------|---------|
| `SUPABASE_URL` | Server | Database connection URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Admin access for backend services | `eyJhbGciOiJ...` |
| `NEXT_PUBLIC_SUPABASE_URL` | Client | Public database URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Anonymous access key | `eyJhbGciOiJ...` |

### 🤖 AI Services (OpenAI)
| Variable | Scope | Purpose | Example |
|----------|-------|---------|---------|
| `OPENAI_API_KEY` | Server | OpenAI API access | `sk-...` |
| `USE_MOCK_AI` | Server | Development mock mode | `true/false` |

### 🔒 Authentication & Security
| Variable | Scope | Purpose | Example |
|----------|-------|---------|---------|
| `NEXTAUTH_SECRET` | Server | JWT signing secret | `32+ char string` |
| `NEXTAUTH_URL` | Server | Auth callback URL | `http://localhost:3000` |

### 🌐 API & Deployment
| Variable | Scope | Purpose | Example |
|----------|-------|---------|---------|
| `API_PORT` | Server | Backend API port | `3001` |
| `API_HOST` | Server | Backend bind address | `0.0.0.0` |
| `NEXT_PUBLIC_API_URL` | Client | API endpoint for frontend | `http://localhost:3001` |
| `NODE_ENV` | Both | Environment mode | `development/production` |

## 🔧 Development Setup

### New Developer Onboarding
1. Copy `.env.example` to `.env` (if example exists)
2. Request actual credentials from team lead
3. Verify all required variables are present:
   ```bash
   grep -E "SUPABASE_|OPENAI_|NEXTAUTH_" .env
   ```

### Environment Variable Validation
Add this check to your service constructors:

```typescript
export class YourRepository {
  constructor() {
    const requiredVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];
    
    const missing = requiredVars.filter(varName => !process.env[varName]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    // Initialize your service...
  }
}
```

## 🔄 When Adding New Variables

### 1. Update Primary .env File
Add the variable to `/home/coleens/dev/instructly/.env` with appropriate documentation:

```bash
# ==========================================
# YOUR NEW CATEGORY
# ==========================================
YOUR_NEW_VARIABLE=your_value
```

### 2. Update This Documentation
- Add the variable to the appropriate category table
- Include usage examples if complex
- Document any security considerations

### 3. Add Environment Checks
For critical variables, add validation in the consuming services:

```typescript
if (!process.env.YOUR_NEW_VARIABLE) {
  throw new Error('YOUR_NEW_VARIABLE is required');
}
```

## 🚨 Security Reminders

1. **Never commit .env files** to version control
2. **Use NEXT_PUBLIC_ prefix** only for variables that are safe to expose to browsers
3. **Service role keys** should never be used in client-side code
4. **Rotate secrets regularly** in production environments
5. **Use different credentials** for different environments (dev/staging/prod)

## 📞 Getting Help

If you encounter environment variable issues:

1. Check this document first
2. Verify the variable exists in `.env`
3. Ensure correct variable names (case-sensitive)
4. Check if you need server-side vs client-side variables
5. Confirm the variable is loaded by logging `process.env.VARIABLE_NAME`

For missing credentials, contact the development team lead.