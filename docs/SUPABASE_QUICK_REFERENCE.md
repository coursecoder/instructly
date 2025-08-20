# Supabase Environment Variables - Quick Reference

## 🎯 TL;DR - Copy & Paste Templates

### Backend Repository Service Template
```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

export class YourRepository {
  private supabase: SupabaseClient<Database>;

  constructor() {
    // ✅ ALWAYS include this check
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables');
    }

    this.supabase = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
}
```

### Frontend Client Template
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

## 🔑 Variable Names (Exact Spelling)

### Backend (Server-side)
```bash
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

### Frontend (Client-side)
```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## ❌ Common Mistakes

### Wrong Variable Names
```bash
# ❌ These don't exist
SUPABASE_ANON_KEY
SUPABASE_PUBLIC_KEY
NEXT_PUBLIC_SUPABASE_SERVICE_KEY

# ✅ Use these exact names
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Missing Environment Check
```typescript
// ❌ Will fail silently
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// ✅ Fail fast with clear error
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}
```

## 🏠 Where Variables Are Defined

**Single Source of Truth**: `/home/coleens/dev/instructly/.env`

All variables are defined in this file and shared across the monorepo.

## 🚨 Security Rules

1. **NEVER** use `SUPABASE_SERVICE_ROLE_KEY` in frontend code
2. **ALWAYS** use `NEXT_PUBLIC_SUPABASE_ANON_KEY` for client-side
3. **ALWAYS** include environment variable validation in repository constructors

## 🔗 Full Documentation

See [docs/ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for complete reference.