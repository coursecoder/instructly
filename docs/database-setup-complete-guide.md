# 🚀 Complete Database Setup Guide for Vercel

This guide provides everything you need to set up Supabase database for your Instructly application deployment on Vercel.

## 📋 Quick Start (Automated Setup)

### Option 1: Full Automation
```bash
# Run the complete setup automation
./scripts/setup-database.sh
```

### Option 2: Step-by-Step with Tools
```bash
# 1. Configure environment variables
node scripts/configure-vercel-env.js

# 2. Validate configuration
node scripts/validate-database.js

# 3. Deploy to Vercel (if CLI installed)
./scripts/deploy-env-to-vercel.sh
```

---

## 🏗️ Manual Setup Instructions

### Step 1: Create Supabase Project

1. **Go to [supabase.com](https://supabase.com)** and create account/sign in
2. **Click "New Project"**
3. **Configure Project:**
   - **Name:** `instructly-production`
   - **Database Password:** Generate strong password (save this!)
   - **Region:** Choose closest to users
   - **Plan:** Start with Free tier

4. **Save these values from dashboard:**
   - Project URL: `https://xxx.supabase.co`
   - Anon key (public)
   - Service role key (private)

### Step 2: Initialize Database Schema

```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

Your schema includes:
- ✅ `users` - User profiles and authentication
- ✅ `projects` - Instructional design projects  
- ✅ `lessons` - Individual lessons
- ✅ `lesson_content` - Generated materials
- ✅ `accessibility_reports` - WCAG compliance
- ✅ `ai_usage_logs` - Cost tracking

### Step 3: Configure Vercel Environment

**In Vercel Dashboard → Settings → Environment Variables:**

| Variable | Value | Environment |
|----------|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | Production |
| `DATABASE_URL` | `postgresql://postgres:password@db.xxx.supabase.co:5432/postgres` | Production |
| `OPENAI_API_KEY` | Your OpenAI key | Production |
| `NEXTAUTH_SECRET` | Generate 32-char secret | Production |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Production |
| `NODE_ENV` | `production` | Production |
| `VERCEL_ENV` | `production` | Production |

---

## 🛠️ Available Automation Tools

### 1. Complete Setup Script
**File:** `scripts/setup-database.sh`

**What it does:**
- ✅ Checks prerequisites (Supabase CLI, Vercel CLI)
- ✅ Links Supabase project
- ✅ Runs database migrations
- ✅ Generates environment files
- ✅ Tests database connectivity
- ✅ Creates documentation

**Usage:**
```bash
chmod +x scripts/setup-database.sh
./scripts/setup-database.sh
```

### 2. Environment Configuration Tool
**File:** `scripts/configure-vercel-env.js`

**What it does:**
- ✅ Interactive configuration collection
- ✅ Input validation and security checks
- ✅ Generates `.env.local` and `.env.vercel`
- ✅ Creates Vercel deployment script
- ✅ Secure handling of API keys

**Usage:**
```bash
node scripts/configure-vercel-env.js
```

### 3. Database Validation Tool
**File:** `scripts/validate-database.js`

**What it does:**
- ✅ Tests database connectivity
- ✅ Validates schema and tables
- ✅ Checks authentication configuration
- ✅ Tests Row Level Security
- ✅ Performance benchmarking
- ✅ Generates detailed report

**Usage:**
```bash
# Test local environment
node scripts/validate-database.js local

# Test production environment  
node scripts/validate-database.js production

# Auto-detect environment
node scripts/validate-database.js
```

---

## 📊 Validation & Testing

### Health Endpoint Testing
```bash
# Local development
curl http://localhost:3001/api/health

# Production deployment
curl https://your-app.vercel.app/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "2.0.0",
    "services": {
      "database": {
        "status": "healthy",
        "responseTime": 45,
        "connection": true
      },
      "openai": {
        "status": "healthy", 
        "responseTime": 20,
        "apiKey": true
      },
      "supabase": {
        "status": "healthy",
        "responseTime": 30,
        "auth": true
      }
    },
    "environment": "production"
  }
}
```

### Comprehensive Database Tests
```bash
# Run full validation suite
node scripts/validate-database.js

# View detailed report
cat database-validation-report.json
```

---

## 🔐 Security Configuration

### Row Level Security (RLS)

Your database includes enterprise-grade security:

```sql
-- Example RLS policies (already applied)
CREATE POLICY "Users can view own profile" ON users 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Projects visible to owner and collaborators" ON projects 
  FOR SELECT USING (
    auth.uid() = owner_id OR 
    auth.uid() = ANY(collaborators)
  );
```

### Environment Security

✅ **Service Role Key:** Backend operations only  
✅ **Anon Key:** Frontend operations only  
✅ **NextAuth Secret:** Session encryption  
✅ **Database Password:** Encrypted connection  

### Best Practices

- 🔒 Never commit `.env.local` to git
- 🔒 Use environment-specific keys
- 🔒 Rotate keys regularly in production
- 🔒 Monitor database access logs

---

## 🚀 Deployment Workflow

### Development to Production

1. **Local Development:**
   ```bash
   # Use .env.local
   npm run dev
   ```

2. **Test Configuration:**
   ```bash
   node scripts/validate-database.js local
   ```

3. **Deploy to Vercel:**
   ```bash
   # Set environment variables
   ./scripts/deploy-env-to-vercel.sh
   
   # Deploy application
   vercel --prod
   ```

4. **Validate Production:**
   ```bash
   node scripts/validate-database.js production
   curl https://your-app.vercel.app/api/health
   ```

---

## 📈 Performance & Monitoring

### Database Performance

Your setup includes optimized indexes:
- 🚀 Full-text search on content
- 🚀 User-specific queries
- 🚀 AI usage analytics
- 🚀 Project collaboration

### Cost Monitoring

AI usage tracking table automatically logs:
- Model usage (GPT-4, GPT-3.5)
- Token consumption
- Cost per operation
- User attribution

Query your costs:
```sql
SELECT 
  DATE(created_at) as date,
  SUM(cost_usd) as daily_cost,
  COUNT(*) as operations
FROM ai_usage_logs 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 🛠️ Troubleshooting

### Common Issues

#### "Module not found" errors
```bash
# Ensure dependencies are installed
cd apps/api && npm install
cd apps/web && npm install
```

#### Database connection fails
```bash
# Validate environment variables
node scripts/validate-database.js

# Check Supabase project status
supabase status
```

#### Row Level Security blocks queries
```bash
# Check RLS policies in Supabase dashboard
# Ensure proper authentication context
```

#### Performance issues
```bash
# Check database indexes
# Monitor response times in validation
node scripts/validate-database.js
```

### Debug Commands

```bash
# View Supabase project info
supabase projects list

# Check migration status  
supabase db diff

# Reset local environment
rm .env.local && node scripts/configure-vercel-env.js

# View Vercel environment variables
vercel env ls
```

---

## 📚 Additional Resources

### Documentation

- **Architecture:** `docs/architecture/database-schema.md`
- **API Reference:** `docs/api-reference.md`
- **Environment Setup:** `docs/env-configuration-summary.md`

### Supabase Dashboard

- **Project Dashboard:** `https://app.supabase.com/project/YOUR_PROJECT_REF`
- **Database Editor:** Query and edit data
- **Auth Management:** User administration
- **Real-time Logs:** Monitor queries

### Vercel Dashboard

- **Project Settings:** Environment variables
- **Deployment Logs:** Build and runtime logs  
- **Analytics:** Performance monitoring
- **Functions:** Serverless function logs

---

## ✅ Setup Checklist

### Pre-Deployment
- [ ] Supabase project created
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Local development tested
- [ ] Database validation passed

### Deployment
- [ ] Vercel environment variables set
- [ ] Application deployed (`vercel --prod`)
- [ ] Health endpoint responding
- [ ] Database connectivity confirmed
- [ ] Authentication working

### Post-Deployment
- [ ] Production validation completed
- [ ] Performance benchmarks acceptable
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] Documentation updated

---

## 🎉 Success!

If you've completed this guide, your Instructly application should be:

✅ **Connected** to Supabase PostgreSQL database  
✅ **Deployed** on Vercel with proper environment  
✅ **Secured** with Row Level Security and authentication  
✅ **Monitored** with health checks and validation  
✅ **Optimized** with indexes and performance tuning  

**Next Steps:**
1. Test the application functionality
2. Set up monitoring and alerts  
3. Configure backup strategies
4. Plan for scaling and optimization

---

*Generated by Instructly Database Setup Automation*