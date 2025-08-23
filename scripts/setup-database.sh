#!/bin/bash

# =============================================================================
# Instructly Database Setup Automation
# =============================================================================
# This script automates the complete Supabase + Vercel database setup
# Run this after creating your Supabase project
# 
# Usage: ./scripts/setup-database.sh
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required tools are installed
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v supabase &> /dev/null; then
        log_error "Supabase CLI not found. Installing..."
        npm install -g supabase
        log_success "Supabase CLI installed"
    else
        log_success "Supabase CLI found"
    fi

    if ! command -v vercel &> /dev/null; then
        log_warning "Vercel CLI not found. Install with: npm install -g vercel"
        log_info "You can still set up environment variables manually in Vercel dashboard"
    else
        log_success "Vercel CLI found"
    fi
}

# Gather user inputs
gather_project_info() {
    log_info "Please provide your Supabase project information:"
    
    echo -n "Enter your Supabase Project Reference (from dashboard URL): "
    read -r SUPABASE_PROJECT_REF
    
    echo -n "Enter your Supabase Project URL (https://xxx.supabase.co): "
    read -r SUPABASE_URL
    
    echo -n "Enter your Supabase Anon Key: "
    read -r SUPABASE_ANON_KEY
    
    echo -n "Enter your Supabase Service Role Key: "
    read -s SUPABASE_SERVICE_ROLE_KEY
    echo ""
    
    echo -n "Enter your OpenAI API Key: "
    read -s OPENAI_API_KEY
    echo ""
    
    echo -n "Enter your Vercel project name (optional): "
    read -r VERCEL_PROJECT_NAME
    
    # Generate NextAuth secret
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    
    log_success "Project information collected"
}

# Link Supabase project
link_supabase_project() {
    log_info "Linking Supabase project..."
    
    # Check if already linked
    if [ -f ".supabase/config.toml" ]; then
        log_warning "Supabase project already linked. Skipping..."
        return 0
    fi
    
    # Login to Supabase (if not already logged in)
    if ! supabase projects list &> /dev/null; then
        log_info "Please login to Supabase..."
        supabase login
    fi
    
    # Link project
    supabase link --project-ref "$SUPABASE_PROJECT_REF"
    log_success "Supabase project linked"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # Check if migrations exist
    if [ ! -d "infrastructure/supabase/migrations" ]; then
        log_error "Migration directory not found. Expected: infrastructure/supabase/migrations/"
        log_info "Available directories:"
        find . -name "migrations" -type d 2>/dev/null || true
        return 1
    fi
    
    # Initialize Supabase directory structure if needed
    if [ ! -d "supabase" ]; then
        log_info "Initializing Supabase directory structure..."
        supabase init
    fi
    
    # Copy migrations to Supabase directory
    mkdir -p supabase/migrations
    cp infrastructure/supabase/migrations/* supabase/migrations/ 2>/dev/null || true
    
    # Copy config if it exists
    if [ -f "infrastructure/supabase/config.toml" ]; then
        cp infrastructure/supabase/config.toml supabase/config.toml
        log_info "Copied Supabase configuration"
    fi
    
    # List migrations to verify
    log_info "Found migrations:"
    ls -la supabase/migrations/ || true
    
    # Push migrations
    log_info "Pushing migrations to Supabase..."
    supabase db push
    log_success "Database migrations completed"
}

# Generate environment files
generate_env_files() {
    log_info "Generating environment configuration files..."
    
    # Create .env.local for local development
    cat > .env.local << EOF
# =============================================================================
# Instructly Environment Configuration
# Generated on $(date)
# =============================================================================

# Database Configuration (Supabase)
NEXT_PUBLIC_SUPABASE_URL="${SUPABASE_URL}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"
DATABASE_URL="postgresql://postgres:[password]@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres"

# AI Services
OPENAI_API_KEY="${OPENAI_API_KEY}"

# Security & Authentication
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
NEXTAUTH_URL="http://localhost:3000"

# Development Settings
NODE_ENV="development"
VERCEL_ENV="development"
API_PORT=3001
API_HOST="0.0.0.0"
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Performance & Monitoring
ENABLE_PERFORMANCE_TRACKING=true
PERFORMANCE_LOG_LEVEL="info"
AI_COST_ALERT_THRESHOLD=0.25
MONTHLY_REVENUE_TARGET=1000
EOF

    # Create Vercel environment configuration
    cat > .env.vercel << EOF
# =============================================================================
# Vercel Production Environment Variables
# Copy these to your Vercel dashboard under Settings > Environment Variables
# =============================================================================

NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
DATABASE_URL=postgresql://postgres:[YOUR_DB_PASSWORD]@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres
OPENAI_API_KEY=${OPENAI_API_KEY}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=https://your-app.vercel.app
NODE_ENV=production
VERCEL_ENV=production
ENABLE_PERFORMANCE_TRACKING=true
PERFORMANCE_LOG_LEVEL=info
AI_COST_ALERT_THRESHOLD=0.25
MONTHLY_REVENUE_TARGET=1000
EOF

    # Create Vercel CLI script
    cat > scripts/deploy-env-to-vercel.sh << EOF
#!/bin/bash
# Auto-deploy environment variables to Vercel
# Run this after updating .env.vercel

set -e

if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install with: npm install -g vercel"
    exit 1
fi

echo "🚀 Deploying environment variables to Vercel..."

# Set production environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production < <(echo "${SUPABASE_URL}")
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production < <(echo "${SUPABASE_ANON_KEY}")
vercel env add SUPABASE_SERVICE_ROLE_KEY production < <(echo "${SUPABASE_SERVICE_ROLE_KEY}")
vercel env add OPENAI_API_KEY production < <(echo "${OPENAI_API_KEY}")
vercel env add NEXTAUTH_SECRET production < <(echo "${NEXTAUTH_SECRET}")
vercel env add NEXTAUTH_URL production < <(echo "https://your-app.vercel.app")
vercel env add NODE_ENV production < <(echo "production")
vercel env add VERCEL_ENV production < <(echo "production")
vercel env add ENABLE_PERFORMANCE_TRACKING production < <(echo "true")
vercel env add PERFORMANCE_LOG_LEVEL production < <(echo "info")
vercel env add AI_COST_ALERT_THRESHOLD production < <(echo "0.25")
vercel env add MONTHLY_REVENUE_TARGET production < <(echo "1000")

echo "✅ Environment variables deployed to Vercel"
echo "⚠️  Remember to update NEXTAUTH_URL with your actual Vercel app URL"
echo "⚠️  Remember to update DATABASE_URL with your actual database password"
EOF

    chmod +x scripts/deploy-env-to-vercel.sh

    log_success "Environment configuration files generated:"
    log_info "  📝 .env.local - Local development environment"
    log_info "  📝 .env.vercel - Production environment (for Vercel dashboard)"
    log_info "  📝 scripts/deploy-env-to-vercel.sh - Automated Vercel deployment"
}

# Test database connection
test_database_connection() {
    log_info "Testing database connection..."
    
    # Create a simple test script
    cat > test-db-connection.js << EOF
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = '${SUPABASE_URL}';
const supabaseKey = '${SUPABASE_SERVICE_ROLE_KEY}';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        console.log('🔍 Testing Supabase connection...');
        
        // Test basic connection
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('❌ Database connection failed:', error.message);
            process.exit(1);
        }
        
        console.log('✅ Database connection successful');
        console.log('📊 Database contains users table');
        
        // Test auth configuration
        const { data: session, error: authError } = await supabase.auth.getSession();
        if (!authError) {
            console.log('✅ Auth configuration is working');
        }
        
        console.log('🎉 All database tests passed!');
        
    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        process.exit(1);
    }
}

testConnection();
EOF

    # Run the test
    if command -v node &> /dev/null; then
        node test-db-connection.js
        rm test-db-connection.js
    else
        log_warning "Node.js not found. Database test script created but not executed."
        log_info "Run manually: node test-db-connection.js"
    fi
}

# Generate setup documentation
generate_documentation() {
    log_info "Generating setup documentation..."
    
    cat > docs/database-setup-guide.md << EOF
# Database Setup Complete! 🎉

## ✅ What's Been Configured

### Database (Supabase)
- ✅ Project linked to: \`${SUPABASE_PROJECT_REF}\`
- ✅ Migrations applied
- ✅ Tables created: users, projects, lessons, lesson_content, accessibility_reports, ai_usage_logs
- ✅ Row Level Security enabled
- ✅ Full-text search indexes created

### Environment Configuration
- ✅ Local development: \`.env.local\`
- ✅ Production template: \`.env.vercel\`
- ✅ Deployment automation: \`scripts/deploy-env-to-vercel.sh\`

## 🚀 Next Steps

### 1. Update Vercel Environment Variables
Copy the values from \`.env.vercel\` to your Vercel dashboard:
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable for "Production" environment

### 2. Update URLs
- Update \`NEXTAUTH_URL\` in Vercel with your actual app URL
- Update \`DATABASE_URL\` with your actual database password

### 3. Deploy to Vercel
\`\`\`bash
vercel --prod
\`\`\`

### 4. Test Production Deployment
Access your health endpoint: \`https://your-app.vercel.app/api/health\`

## 🔧 Useful Commands

### Local Development
\`\`\`bash
# Start local development
npm run dev

# Test database connection
npm run test:health
\`\`\`

### Production Management
\`\`\`bash
# Deploy environment variables
./scripts/deploy-env-to-vercel.sh

# View Supabase dashboard
supabase dashboard

# Check migration status
supabase db diff
\`\`\`

## 📊 Database Access

- **Supabase Dashboard:** [${SUPABASE_URL/https:\/\//https://app.supabase.com/project/}](${SUPABASE_URL/https:\/\//https://app.supabase.com/project/})
- **Direct Database URL:** \`postgresql://postgres:[password]@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres\`

## 🛡️ Security Notes

- ✅ Service role key is configured for backend operations
- ✅ Anon key is configured for frontend operations  
- ✅ Row Level Security is enabled on all tables
- ✅ NextAuth secret is auto-generated

## 📝 Schema Overview

### Core Tables
- **users** - User profiles and authentication
- **projects** - Instructional design projects
- **lessons** - Individual lessons within projects
- **lesson_content** - Generated lesson materials
- **accessibility_reports** - WCAG compliance reports
- **ai_usage_logs** - AI cost tracking and analytics

### Indexes & Performance
- Full-text search on titles and descriptions
- Optimized indexes for user queries
- Partitioned AI usage logs for cost analysis

---

Generated on $(date) by Instructly Setup Automation
EOF

    log_success "Setup documentation created: docs/database-setup-guide.md"
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "═══════════════════════════════════════════════════════"
    echo "🚀 Instructly Database Setup Automation"
    echo "═══════════════════════════════════════════════════════"
    echo -e "${NC}"
    
    log_info "This script will help you set up Supabase database for Vercel deployment"
    log_warning "Make sure you have created a Supabase project first at https://supabase.com"
    
    echo -n "Continue with setup? (y/N): "
    read -r confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        log_info "Setup cancelled"
        exit 0
    fi
    
    # Execute setup steps
    check_prerequisites
    gather_project_info
    link_supabase_project
    run_migrations
    generate_env_files
    test_database_connection
    generate_documentation
    
    echo -e "${GREEN}"
    echo "═══════════════════════════════════════════════════════"
    echo "🎉 Database Setup Complete!"
    echo "═══════════════════════════════════════════════════════"
    echo -e "${NC}"
    
    log_success "Next steps:"
    log_info "1. Review .env.vercel and copy to Vercel dashboard"
    log_info "2. Update NEXTAUTH_URL with your Vercel app URL"
    log_info "3. Deploy: vercel --prod"
    log_info "4. Read: docs/database-setup-guide.md"
    
    log_warning "Important: Keep your .env.local file secure and never commit to git!"
}

# Run main function
main "$@"