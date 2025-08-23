#!/usr/bin/env node

/**
 * =============================================================================
 * Vercel Environment Configuration Tool
 * =============================================================================
 * Interactive tool to configure environment variables for Vercel deployment
 * Validates inputs and generates ready-to-use configuration
 * 
 * Usage: node scripts/configure-vercel-env.js
 * =============================================================================
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createInterface } from 'readline';
import { randomBytes } from 'crypto';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

const log = {
    info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    header: (msg) => console.log(`${colors.cyan}${msg}${colors.reset}`)
};

// Input validation functions
const validators = {
    supabaseUrl: (url) => {
        const pattern = /^https:\/\/[a-z0-9]+\.supabase\.co$/;
        return pattern.test(url) ? null : 'Must be a valid Supabase URL (https://xxx.supabase.co)';
    },
    
    supabaseKey: (key) => {
        if (!key || key.length < 30) return 'Key must be at least 30 characters';
        if (!key.startsWith('eyJ')) return 'Invalid Supabase key format';
        return null;
    },
    
    openaiKey: (key) => {
        if (!key || !key.startsWith('sk-')) return 'Must start with sk-';
        if (key.length < 40) return 'Key appears too short';
        return null;
    },
    
    vercelUrl: (url) => {
        const pattern = /^https:\/\/[a-z0-9-]+\.vercel\.app$/;
        return pattern.test(url) ? null : 'Must be a valid Vercel app URL (https://your-app.vercel.app)';
    }
};

// Create readline interface
const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

// Promisify readline question
const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

// Secure input for sensitive data
const secureQuestion = async (prompt) => {
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    
    let input = '';
    return new Promise((resolve) => {
        const onData = (char) => {
            char = char.toString();
            
            switch (char) {
                case '\n':
                case '\r':
                case '\u0004': // Ctrl+D
                    process.stdin.setRawMode(false);
                    process.stdin.removeListener('data', onData);
                    console.log(''); // New line
                    resolve(input);
                    break;
                case '\u0003': // Ctrl+C
                    process.exit();
                    break;
                case '\u007f': // Backspace
                    if (input.length > 0) {
                        input = input.slice(0, -1);
                        process.stdout.write('\b \b');
                    }
                    break;
                default:
                    input += char;
                    process.stdout.write('*');
                    break;
            }
        };
        
        process.stdin.on('data', onData);
    });
};

// Load existing configuration if available
const loadExistingConfig = () => {
    const configs = {};
    
    // Try to load from .env.local
    if (existsSync('.env.local')) {
        try {
            const content = readFileSync('.env.local', 'utf8');
            const lines = content.split('\n');
            
            lines.forEach(line => {
                if (line.includes('=') && !line.startsWith('#')) {
                    const [key, ...valueParts] = line.split('=');
                    const value = valueParts.join('=').replace(/"/g, '');
                    configs[key.trim()] = value.trim();
                }
            });
            
            log.info('Found existing configuration in .env.local');
        } catch (error) {
            log.warning('Could not read existing .env.local file');
        }
    }
    
    return configs;
};

// Main configuration collection
const collectConfiguration = async () => {
    const existing = loadExistingConfig();
    const config = {};
    
    log.header('\n═══════════════════════════════════════════════════════');
    log.header('🚀 Vercel Environment Configuration Tool');
    log.header('═══════════════════════════════════════════════════════\n');
    
    log.info('This tool will help you configure environment variables for Vercel deployment');
    log.info('Press Ctrl+C to exit at any time\n');
    
    // Supabase URL
    const defaultUrl = existing.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseUrlPrompt = `Supabase URL ${defaultUrl ? `(current: ${defaultUrl})` : ''}: `;
    let supabaseUrl = await question(supabaseUrlPrompt);
    
    if (!supabaseUrl && defaultUrl) {
        supabaseUrl = defaultUrl;
        log.success('Using existing Supabase URL');
    } else {
        const urlError = validators.supabaseUrl(supabaseUrl);
        if (urlError) {
            log.error(urlError);
            process.exit(1);
        }
    }
    config.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
    
    // Extract project reference from URL
    const projectRef = supabaseUrl.split('//')[1].split('.')[0];
    config.PROJECT_REF = projectRef;
    
    // Supabase Anon Key
    const defaultAnonKey = existing.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const anonKeyPrompt = `Supabase Anon Key ${defaultAnonKey ? '(using existing)' : ''}: `;
    let anonKey = defaultAnonKey ? defaultAnonKey : await secureQuestion(anonKeyPrompt);
    
    if (!defaultAnonKey) {
        const anonKeyError = validators.supabaseKey(anonKey);
        if (anonKeyError) {
            log.error(anonKeyError);
            process.exit(1);
        }
    }
    config.NEXT_PUBLIC_SUPABASE_ANON_KEY = anonKey;
    
    // Supabase Service Role Key
    const defaultServiceKey = existing.SUPABASE_SERVICE_ROLE_KEY || '';
    const serviceKeyPrompt = `Supabase Service Role Key ${defaultServiceKey ? '(using existing)' : ''}: `;
    let serviceKey = defaultServiceKey ? defaultServiceKey : await secureQuestion(serviceKeyPrompt);
    
    if (!defaultServiceKey) {
        const serviceKeyError = validators.supabaseKey(serviceKey);
        if (serviceKeyError) {
            log.error(serviceKeyError);
            process.exit(1);
        }
    }
    config.SUPABASE_SERVICE_ROLE_KEY = serviceKey;
    
    // OpenAI API Key
    const defaultOpenAI = existing.OPENAI_API_KEY || '';
    const openaiPrompt = `OpenAI API Key ${defaultOpenAI ? '(using existing)' : ''}: `;
    let openaiKey = defaultOpenAI ? defaultOpenAI : await secureQuestion(openaiPrompt);
    
    if (!defaultOpenAI) {
        const openaiError = validators.openaiKey(openaiKey);
        if (openaiError) {
            log.error(openaiError);
            process.exit(1);
        }
    }
    config.OPENAI_API_KEY = openaiKey;
    
    // Vercel App URL
    const vercelUrlPrompt = 'Your Vercel App URL (https://your-app.vercel.app): ';
    const vercelUrl = await question(vercelUrlPrompt);
    
    const vercelUrlError = validators.vercelUrl(vercelUrl);
    if (vercelUrlError) {
        log.error(vercelUrlError);
        process.exit(1);
    }
    config.NEXTAUTH_URL = vercelUrl;
    
    // Generate NextAuth secret if not exists
    const existingSecret = existing.NEXTAUTH_SECRET;
    config.NEXTAUTH_SECRET = existingSecret || randomBytes(32).toString('base64');
    
    if (!existingSecret) {
        log.success('Generated new NextAuth secret');
    }
    
    // Database URL construction
    const dbPassword = await secureQuestion('Database Password (from Supabase dashboard): ');
    config.DATABASE_URL = `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`;
    
    return config;
};

// Generate configuration files
const generateFiles = (config) => {
    log.info('\nGenerating configuration files...');
    
    // Vercel environment variables (production)
    const vercelEnv = `# =============================================================================
# Vercel Production Environment Variables
# Generated on ${new Date().toISOString()}
# =============================================================================
# Copy these to your Vercel dashboard under Settings > Environment Variables
# Set environment to "Production" for each variable
# =============================================================================

NEXT_PUBLIC_SUPABASE_URL=${config.NEXT_PUBLIC_SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${config.NEXT_PUBLIC_SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${config.SUPABASE_SERVICE_ROLE_KEY}
DATABASE_URL=${config.DATABASE_URL}
OPENAI_API_KEY=${config.OPENAI_API_KEY}
NEXTAUTH_SECRET=${config.NEXTAUTH_SECRET}
NEXTAUTH_URL=${config.NEXTAUTH_URL}
NODE_ENV=production
VERCEL_ENV=production
ENABLE_PERFORMANCE_TRACKING=true
PERFORMANCE_LOG_LEVEL=info
AI_COST_ALERT_THRESHOLD=0.25
MONTHLY_REVENUE_TARGET=1000`;

    writeFileSync('.env.vercel', vercelEnv);
    log.success('Created .env.vercel for Vercel dashboard');
    
    // Local development environment
    const localEnv = `# =============================================================================
# Local Development Environment
# Generated on ${new Date().toISOString()}
# =============================================================================

# Database Configuration (Supabase)
NEXT_PUBLIC_SUPABASE_URL=${config.NEXT_PUBLIC_SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${config.NEXT_PUBLIC_SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${config.SUPABASE_SERVICE_ROLE_KEY}
DATABASE_URL=${config.DATABASE_URL}

# AI Services
OPENAI_API_KEY=${config.OPENAI_API_KEY}

# Security & Authentication
NEXTAUTH_SECRET=${config.NEXTAUTH_SECRET}
NEXTAUTH_URL=http://localhost:3000

# Development Settings
NODE_ENV=development
VERCEL_ENV=development
API_PORT=3001
API_HOST=0.0.0.0
NEXT_PUBLIC_API_URL=http://localhost:3001

# Performance & Monitoring
ENABLE_PERFORMANCE_TRACKING=true
PERFORMANCE_LOG_LEVEL=debug
AI_COST_ALERT_THRESHOLD=0.25
MONTHLY_REVENUE_TARGET=1000`;

    writeFileSync('.env.local', localEnv);
    log.success('Created .env.local for local development');
    
    // Vercel CLI deployment script
    const deployScript = `#!/bin/bash
# =============================================================================
# Automated Vercel Environment Variable Deployment
# Generated on ${new Date().toISOString()}
# =============================================================================

set -e

if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install with: npm install -g vercel"
    exit 1
fi

echo "🚀 Deploying environment variables to Vercel..."

# Deploy to production environment
vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "${config.NEXT_PUBLIC_SUPABASE_URL}"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "${config.NEXT_PUBLIC_SUPABASE_ANON_KEY}"
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "${config.SUPABASE_SERVICE_ROLE_KEY}"
vercel env add DATABASE_URL production <<< "${config.DATABASE_URL}"
vercel env add OPENAI_API_KEY production <<< "${config.OPENAI_API_KEY}"
vercel env add NEXTAUTH_SECRET production <<< "${config.NEXTAUTH_SECRET}"
vercel env add NEXTAUTH_URL production <<< "${config.NEXTAUTH_URL}"
vercel env add NODE_ENV production <<< "production"
vercel env add VERCEL_ENV production <<< "production"
vercel env add ENABLE_PERFORMANCE_TRACKING production <<< "true"
vercel env add PERFORMANCE_LOG_LEVEL production <<< "info"
vercel env add AI_COST_ALERT_THRESHOLD production <<< "0.25"
vercel env add MONTHLY_REVENUE_TARGET production <<< "1000"

echo "✅ Environment variables deployed to Vercel production"
echo "🚀 Ready for deployment: vercel --prod"`;

    writeFileSync('scripts/deploy-env-to-vercel.sh', deployScript);
    writeFileSync('scripts/deploy-env-to-vercel.sh', deployScript);
    
    log.success('Created scripts/deploy-env-to-vercel.sh');
    
    // Configuration summary
    const summary = `# Environment Configuration Summary

## ✅ Generated Files

1. **\`.env.local\`** - Local development environment
2. **\`.env.vercel\`** - Production environment template  
3. **\`scripts/deploy-env-to-vercel.sh\`** - Automated deployment script

## 🚀 Next Steps

### Option 1: Manual Vercel Configuration
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Copy each line from \`.env.vercel\` and add as "Production" variables

### Option 2: Automated Deployment (if Vercel CLI installed)
\`\`\`bash
chmod +x scripts/deploy-env-to-vercel.sh
./scripts/deploy-env-to-vercel.sh
\`\`\`

### Verify Configuration
\`\`\`bash
# Test local development
npm run dev

# Deploy to production
vercel --prod

# Test production health endpoint
curl https://${config.NEXTAUTH_URL.replace('https://', '')}/api/health
\`\`\`

## 🔐 Security Notes

- ✅ All sensitive keys are configured
- ✅ NextAuth secret generated (${config.NEXTAUTH_SECRET.length} characters)
- ✅ Database URL includes password
- ⚠️  Keep \`.env.local\` secure - never commit to git
- ⚠️  Verify Vercel environment variables are set to "Production" only

## 📊 Configuration Details

- **Project:** ${config.PROJECT_REF}
- **Database:** Supabase PostgreSQL
- **Auth:** NextAuth with Supabase
- **AI:** OpenAI GPT integration
- **Deployment:** Vercel with environment variables

Generated on ${new Date().toLocaleString()}`;

    writeFileSync('docs/env-configuration-summary.md', summary);
    log.success('Created docs/env-configuration-summary.md');
};

// Main execution
const main = async () => {
    try {
        const config = await collectConfiguration();
        
        log.info('\n📋 Configuration Summary:');
        log.info(`Supabase Project: ${config.PROJECT_REF}`);
        log.info(`Vercel App: ${config.NEXTAUTH_URL}`);
        log.info(`Environment: Production + Development`);
        
        const proceed = await question('\nGenerate configuration files? (y/N): ');
        if (!proceed.toLowerCase().startsWith('y')) {
            log.warning('Configuration cancelled');
            process.exit(0);
        }
        
        generateFiles(config);
        
        log.header('\n═══════════════════════════════════════════════════════');
        log.header('🎉 Environment Configuration Complete!');
        log.header('═══════════════════════════════════════════════════════');
        
        log.success('Files generated:');
        log.info('  📄 .env.local - Local development');
        log.info('  📄 .env.vercel - Production template');
        log.info('  📄 scripts/deploy-env-to-vercel.sh - Auto deployment');
        log.info('  📄 docs/env-configuration-summary.md - Documentation');
        
        log.warning('\nNext steps:');
        log.info('1. Copy .env.vercel to Vercel dashboard');
        log.info('2. Deploy: vercel --prod');
        log.info('3. Test: /api/health endpoint');
        
    } catch (error) {
        log.error(`Configuration failed: ${error.message}`);
        process.exit(1);
    } finally {
        rl.close();
    }
};

// Handle process termination gracefully
process.on('SIGINT', () => {
    log.warning('\nConfiguration cancelled by user');
    rl.close();
    process.exit(0);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}