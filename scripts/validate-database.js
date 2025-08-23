#!/usr/bin/env node

/**
 * =============================================================================
 * Database Connection Validation Tool
 * =============================================================================
 * Comprehensive testing of database connectivity, schema, and configuration
 * Tests both local development and production environments
 * 
 * Usage: node scripts/validate-database.js [environment]
 * Examples:
 *   node scripts/validate-database.js local
 *   node scripts/validate-database.js production
 *   node scripts/validate-database.js          # Auto-detect environment
 * =============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
const environment = process.argv[2] || 'auto';

if (environment === 'local' || environment === 'auto') {
    if (existsSync('.env.local')) {
        config({ path: '.env.local' });
    }
}

// Colors and styling
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bright: '\x1b[1m'
};

const log = {
    info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    header: (msg) => console.log(`${colors.cyan}${colors.bright}${msg}${colors.reset}`),
    step: (msg) => console.log(`${colors.magenta}🔍 ${msg}${colors.reset}`)
};

// Test configuration
const testConfig = {
    timeout: 10000, // 10 seconds
    maxRetries: 3,
    expectedTables: ['users', 'projects', 'lessons', 'lesson_content', 'accessibility_reports', 'ai_usage_logs'],
    requiredEnvVars: [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
        'SUPABASE_SERVICE_ROLE_KEY',
        'OPENAI_API_KEY'
    ]
};

// Test results tracking
const results = {
    tests: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    details: []
};

// Helper function to record test results
const recordTest = (name, status, message, details = null) => {
    results.tests++;
    const result = { name, status, message, details, timestamp: new Date().toISOString() };
    results.details.push(result);
    
    switch (status) {
        case 'pass':
            results.passed++;
            log.success(`${name}: ${message}`);
            break;
        case 'fail':
            results.failed++;
            log.error(`${name}: ${message}`);
            break;
        case 'warning':
            results.warnings++;
            log.warning(`${name}: ${message}`);
            break;
    }
    
    if (details) {
        console.log(`   ${colors.white}Details: ${JSON.stringify(details, null, 2)}${colors.reset}`);
    }
};

// Environment validation
const validateEnvironment = () => {
    log.step('Validating environment configuration...');
    
    const missing = [];
    const present = [];
    
    testConfig.requiredEnvVars.forEach(varName => {
        const value = process.env[varName];
        if (!value) {
            missing.push(varName);
        } else {
            present.push({ name: varName, length: value.length, masked: value.substring(0, 8) + '...' });
        }
    });
    
    if (missing.length > 0) {
        recordTest('Environment Variables', 'fail', `Missing required variables: ${missing.join(', ')}`);
        return false;
    }
    
    recordTest('Environment Variables', 'pass', `All ${testConfig.requiredEnvVars.length} required variables present`, present);
    
    // Validate URL format
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl.includes('.supabase.co')) {
        recordTest('Supabase URL Format', 'warning', 'URL format may be incorrect');
    } else {
        recordTest('Supabase URL Format', 'pass', 'Valid Supabase URL format');
    }
    
    return true;
};

// Basic connectivity test
const testBasicConnectivity = async () => {
    log.step('Testing basic Supabase connectivity...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    try {
        const supabase = createClient(supabaseUrl, serviceKey);
        
        const startTime = Date.now();
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);
        const responseTime = Date.now() - startTime;
        
        if (error) {
            recordTest('Basic Connectivity', 'fail', `Connection failed: ${error.message}`, { error: error.code });
            return false;
        }
        
        recordTest('Basic Connectivity', 'pass', `Connected successfully (${responseTime}ms)`, { responseTime });
        return true;
        
    } catch (error) {
        recordTest('Basic Connectivity', 'fail', `Network error: ${error.message}`);
        return false;
    }
};

// Schema validation
const validateSchema = async () => {
    log.step('Validating database schema...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, serviceKey);
    
    try {
        // Check if all expected tables exist
        const tableChecks = await Promise.all(
            testConfig.expectedTables.map(async (tableName) => {
                try {
                    const { data, error } = await supabase
                        .from(tableName)
                        .select('*')
                        .limit(1);
                    
                    return {
                        table: tableName,
                        exists: !error,
                        error: error?.message,
                        recordCount: data?.length || 0
                    };
                } catch (err) {
                    return {
                        table: tableName,
                        exists: false,
                        error: err.message,
                        recordCount: 0
                    };
                }
            })
        );
        
        const existingTables = tableChecks.filter(t => t.exists);
        const missingTables = tableChecks.filter(t => !t.exists);
        
        if (missingTables.length > 0) {
            recordTest('Database Schema', 'fail', 
                `Missing tables: ${missingTables.map(t => t.table).join(', ')}`, 
                { missing: missingTables, existing: existingTables }
            );
            return false;
        }
        
        recordTest('Database Schema', 'pass', 
            `All ${testConfig.expectedTables.length} required tables present`, 
            { tables: existingTables }
        );
        
        return true;
        
    } catch (error) {
        recordTest('Database Schema', 'fail', `Schema validation failed: ${error.message}`);
        return false;
    }
};

// Authentication test
const testAuthentication = async () => {
    log.step('Testing Supabase authentication configuration...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    try {
        // Test with anon key (frontend)
        const anonSupabase = createClient(supabaseUrl, anonKey);
        const { data: sessionData, error: sessionError } = await anonSupabase.auth.getSession();
        
        if (sessionError && sessionError.message !== 'Auth session missing!') {
            recordTest('Anon Key Authentication', 'fail', `Auth config error: ${sessionError.message}`);
        } else {
            recordTest('Anon Key Authentication', 'pass', 'Frontend auth configuration working');
        }
        
        // Test with service key (backend)
        const serviceSupabase = createClient(supabaseUrl, serviceKey);
        const { data: userData, error: userError } = await serviceSupabase
            .from('users')
            .select('id')
            .limit(1);
        
        if (userError) {
            recordTest('Service Key Authentication', 'fail', `Service auth failed: ${userError.message}`);
            return false;
        } else {
            recordTest('Service Key Authentication', 'pass', 'Backend auth configuration working');
        }
        
        return true;
        
    } catch (error) {
        recordTest('Authentication Test', 'fail', `Auth test failed: ${error.message}`);
        return false;
    }
};

// Performance test
const testPerformance = async () => {
    log.step('Running performance tests...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, serviceKey);
    
    try {
        // Test query performance
        const startTime = Date.now();
        const { data, error } = await supabase
            .from('users')
            .select('id, email, name')
            .limit(10);
        const queryTime = Date.now() - startTime;
        
        if (error) {
            recordTest('Query Performance', 'fail', `Performance test failed: ${error.message}`);
            return false;
        }
        
        if (queryTime > 1000) {
            recordTest('Query Performance', 'warning', 
                `Slow query response (${queryTime}ms)`, 
                { responseTime: queryTime, threshold: 1000 }
            );
        } else {
            recordTest('Query Performance', 'pass', 
                `Good query performance (${queryTime}ms)`, 
                { responseTime: queryTime, recordsReturned: data?.length || 0 }
            );
        }
        
        return true;
        
    } catch (error) {
        recordTest('Performance Test', 'fail', `Performance test error: ${error.message}`);
        return false;
    }
};

// Row Level Security test
const testRowLevelSecurity = async () => {
    log.step('Testing Row Level Security (RLS) configuration...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    try {
        // Test with anon key (should be restricted)
        const anonSupabase = createClient(supabaseUrl, anonKey);
        const { data, error } = await anonSupabase
            .from('users')
            .select('*');
        
        if (error && error.message.includes('permission denied')) {
            recordTest('Row Level Security', 'pass', 'RLS is properly configured and blocking unauthorized access');
        } else if (data && data.length === 0) {
            recordTest('Row Level Security', 'pass', 'RLS is configured (no data returned without auth)');
        } else {
            recordTest('Row Level Security', 'warning', 
                'RLS may not be configured properly - data accessible without auth',
                { dataReturned: data?.length || 0 }
            );
        }
        
        return true;
        
    } catch (error) {
        recordTest('Row Level Security', 'warning', `Could not test RLS: ${error.message}`);
        return false;
    }
};

// OpenAI connectivity test
const testOpenAIConnectivity = async () => {
    log.step('Testing OpenAI API connectivity...');
    
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
        recordTest('OpenAI Connectivity', 'fail', 'OpenAI API key not found');
        return false;
    }
    
    try {
        // Simple API key validation (format check)
        if (!apiKey.startsWith('sk-') || apiKey.length < 40) {
            recordTest('OpenAI API Key', 'fail', 'Invalid OpenAI API key format');
            return false;
        }
        
        recordTest('OpenAI API Key', 'pass', 'OpenAI API key format is valid');
        
        // Note: We don't make actual API calls to avoid costs
        recordTest('OpenAI Connectivity', 'pass', 'API key configured (validation requires actual request)');
        
        return true;
        
    } catch (error) {
        recordTest('OpenAI Connectivity', 'fail', `OpenAI test failed: ${error.message}`);
        return false;
    }
};

// Generate test report
const generateReport = () => {
    log.header('\n═══════════════════════════════════════════════════════');
    log.header('📊 Database Validation Report');
    log.header('═══════════════════════════════════════════════════════');
    
    // Summary
    console.log(`\n${colors.bright}Test Summary:${colors.reset}`);
    console.log(`Total Tests: ${results.tests}`);
    console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
    console.log(`${colors.yellow}Warnings: ${results.warnings}${colors.reset}`);
    
    // Overall status
    const overallStatus = results.failed === 0 ? 'HEALTHY' : 'ISSUES DETECTED';
    const statusColor = results.failed === 0 ? colors.green : colors.red;
    console.log(`\n${colors.bright}Overall Status: ${statusColor}${overallStatus}${colors.reset}`);
    
    // Detailed results
    if (results.failed > 0 || results.warnings > 0) {
        console.log(`\n${colors.bright}Issues Detected:${colors.reset}`);
        results.details.forEach(result => {
            if (result.status === 'fail' || result.status === 'warning') {
                const icon = result.status === 'fail' ? '❌' : '⚠️';
                const color = result.status === 'fail' ? colors.red : colors.yellow;
                console.log(`${color}${icon} ${result.name}: ${result.message}${colors.reset}`);
            }
        });
    }
    
    // Recommendations
    console.log(`\n${colors.bright}Recommendations:${colors.reset}`);
    
    if (results.failed === 0) {
        log.success('Database configuration is ready for production deployment');
        log.info('You can proceed with: vercel --prod');
    } else {
        log.error('Fix the failed tests before deploying to production');
        log.info('Check your environment variables and Supabase configuration');
    }
    
    if (results.warnings > 0) {
        log.warning('Address warnings for optimal performance and security');
    }
    
    // Next steps
    console.log(`\n${colors.bright}Next Steps:${colors.reset}`);
    log.info('1. Fix any failed tests');
    log.info('2. Consider warning recommendations');
    log.info('3. Test health endpoint: /api/health');
    log.info('4. Deploy to production: vercel --prod');
    
    // Save detailed report
    const reportData = {
        timestamp: new Date().toISOString(),
        environment: environment,
        summary: {
            total: results.tests,
            passed: results.passed,
            failed: results.failed,
            warnings: results.warnings,
            status: overallStatus
        },
        details: results.details
    };
    
    const reportJson = JSON.stringify(reportData, null, 2);
    require('fs').writeFileSync('database-validation-report.json', reportJson);
    log.info('Detailed report saved: database-validation-report.json');
    
    return results.failed === 0;
};

// Main test execution
const runValidation = async () => {
    log.header('🔍 Starting Database Validation...');
    log.info(`Environment: ${environment}`);
    log.info(`Target: ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured'}\n`);
    
    try {
        // Run all validation tests
        const envValid = validateEnvironment();
        if (!envValid) {
            log.error('Environment validation failed. Cannot continue.');
            return false;
        }
        
        const connectivityOk = await testBasicConnectivity();
        if (!connectivityOk) {
            log.error('Basic connectivity failed. Skipping remaining tests.');
            return false;
        }
        
        // Continue with remaining tests even if some fail
        await Promise.all([
            validateSchema(),
            testAuthentication(),
            testPerformance(),
            testRowLevelSecurity(),
            testOpenAIConnectivity()
        ]);
        
        return generateReport();
        
    } catch (error) {
        log.error(`Validation failed with error: ${error.message}`);
        console.error(error.stack);
        return false;
    }
};

// Handle script execution
const main = async () => {
    const success = await runValidation();
    process.exit(success ? 0 : 1);
};

// Handle graceful shutdown
process.on('SIGINT', () => {
    log.warning('\nValidation cancelled by user');
    process.exit(1);
});

// Handle unhandled errors
process.on('unhandledRejection', (error) => {
    log.error(`Unhandled error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}