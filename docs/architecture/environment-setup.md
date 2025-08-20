# Environment Setup & Configuration

This document outlines the standardized approach for environment variable management in the Instructly platform.

## 📁 Environment Variable Organization

### Single Source of Truth
All environment variables are defined in:
```
/home/coleens/dev/instructly/.env
```

This file serves as the single source of truth for all environment configuration across the entire monorepo.

### Variable Categories

#### Database (Supabase)
- **Server-side**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Client-side**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### AI Services
- `OPENAI_API_KEY` - OpenAI API access for instructional design analysis
- `USE_MOCK_AI` - Development mode toggle for API quota management

#### Authentication & Security
- `NEXTAUTH_SECRET` - JWT signing secret for authentication
- `NEXTAUTH_URL` - Authentication callback URL

## 🏗️ Repository Service Pattern

All database repository classes must follow this standardized pattern:

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

export class YourRepository {
  private supabase: SupabaseClient<Database>;

  constructor() {
    // Environment variables defined in /home/coleens/dev/instructly/.env
    // For reference, see docs/SUPABASE_QUICK_REFERENCE.md
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables');
    }

    this.supabase = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  // Repository methods...
}
```

## ✅ Validation Requirements

### 1. Environment Variable Checks
Every repository service **must** include environment variable validation that:
- Checks for required variables before creating Supabase client
- Throws descriptive error messages
- Fails fast to prevent silent configuration errors

### 2. Variable Naming Conventions
- **Server-side**: Direct variable names (e.g., `SUPABASE_URL`)
- **Client-side**: `NEXT_PUBLIC_` prefix (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
- **Case-sensitive**: Use exact spelling as defined in `.env`

### 3. Security Boundaries
- **Never** expose service role keys to client-side code
- **Always** use anonymous keys for frontend Supabase clients
- **Validate** all environment variables at service initialization

## 📚 Documentation References

### Quick Reference
- **[SUPABASE_QUICK_REFERENCE.md](../SUPABASE_QUICK_REFERENCE.md)** - Copy-paste templates and common mistakes
- **[ENVIRONMENT_VARIABLES.md](../ENVIRONMENT_VARIABLES.md)** - Complete variable reference and usage guide

### When to Update Documentation
1. **Adding new environment variables** - Update both reference docs
2. **Creating new repository services** - Follow the standardized pattern
3. **Encountering configuration issues** - Update common mistakes section

## 🔄 Development Workflow

### New Service Creation
1. Copy the repository service template above
2. Replace `YourRepository` with your service name
3. Import required types from `@instructly/shared`
4. Implement your service methods
5. Add reference comment pointing to documentation

### Environment Setup for New Developers
1. Ensure `.env` file exists in project root
2. Verify all required variables are present
3. Test service initialization to confirm configuration
4. Reference documentation for troubleshooting

## 🎯 Benefits of This Approach

1. **Consistency**: All services follow the same initialization pattern
2. **Fail Fast**: Clear error messages when configuration is missing
3. **Documentation**: Self-documenting code with reference links
4. **Security**: Proper separation of server/client environment variables
5. **Maintainability**: Single source of truth for all configuration

This standardized approach prevents the duplication and configuration issues that can occur in complex monorepo environments.