import { z } from 'zod';

// Environment variable validation schema
const environmentSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Server configuration
  API_PORT: z.string().regex(/^\d+$/, 'API_PORT must be a number').transform(Number).default('3001'),
  API_HOST: z.string().default('0.0.0.0'),
  
  // Supabase configuration (server-side only)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  
  // OpenAI configuration (server-side only)
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  
  // Site configuration
  NEXT_PUBLIC_SITE_URL: z.string().url('Invalid site URL').optional(),
  
  // Optional configuration
  DATABASE_URL: z.string().url('Invalid database URL').optional(),
  REDIS_URL: z.string().url('Invalid Redis URL').optional(),
});

export type Environment = z.infer<typeof environmentSchema>;

// Security validation for environment variables
export interface SecurityAudit {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Validate and parse environment variables
 */
export function validateEnvironment(): { config: Environment; audit: SecurityAudit } {
  const audit: SecurityAudit = {
    isValid: true,
    errors: [],
    warnings: [],
    recommendations: []
  };

  let config: Environment;

  try {
    config = environmentSchema.parse(process.env);
  } catch (error) {
    audit.isValid = false;
    if (error instanceof z.ZodError) {
      audit.errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
    } else {
      audit.errors = ['Unknown validation error'];
    }
    // Return default config on validation failure
    config = environmentSchema.parse({});
  }

  // Security audit checks
  performSecurityAudit(config, audit);

  return { config, audit };
}

/**
 * Perform security audit on environment configuration
 */
function performSecurityAudit(config: Environment, audit: SecurityAudit): void {
  // Check for production security requirements
  if (config.NODE_ENV === 'production') {
    // Ensure all critical keys are present and not default values
    if (!config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_SERVICE_ROLE_KEY.length < 50) {
      audit.errors.push('Production requires valid Supabase service role key');
      audit.isValid = false;
    }

    if (!config.OPENAI_API_KEY || config.OPENAI_API_KEY.startsWith('sk-') === false) {
      audit.errors.push('Production requires valid OpenAI API key');
      audit.isValid = false;
    }

    if (!config.NEXT_PUBLIC_SITE_URL) {
      audit.warnings.push('NEXT_PUBLIC_SITE_URL not set - may affect redirects');
    }

    // Security recommendations for production
    audit.recommendations.push('Ensure all secrets are rotated regularly');
    audit.recommendations.push('Monitor for API key usage and set up alerts');
    audit.recommendations.push('Implement secret management service for production');
  }

  // Check for development security warnings
  if (config.NODE_ENV === 'development') {
    if (config.OPENAI_API_KEY && !config.OPENAI_API_KEY.startsWith('sk-')) {
      audit.warnings.push('OpenAI API key format appears invalid');
    }

    audit.recommendations.push('Use .env.local for development secrets');
    audit.recommendations.push('Never commit API keys to version control');
  }

  // Check for common security issues
  checkForCommonSecurityIssues(config, audit);
}

/**
 * Check for common security configuration issues
 */
function checkForCommonSecurityIssues(config: Environment, audit: SecurityAudit): void {
  // Skip security checks in test environment
  if (config.NODE_ENV === 'test') {
    return;
  }

  // Check for weak or demo keys
  const dangerousPatterns = [
    'demo', 'test', 'example', 'placeholder', 'changeme', 
    'password', 'secret', 'key123', 'temp'
  ];

  const sensitiveKeys = [
    config.SUPABASE_SERVICE_ROLE_KEY,
    config.OPENAI_API_KEY
  ];

  sensitiveKeys.forEach((key, index) => {
    if (key) {
      const keyName = ['SUPABASE_SERVICE_ROLE_KEY', 'OPENAI_API_KEY'][index];
      const lowerKey = key.toLowerCase();
      
      if (dangerousPatterns.some(pattern => lowerKey.includes(pattern))) {
        audit.errors.push(`${keyName} appears to contain demo/placeholder values`);
        audit.isValid = false;
      }

      if (key.length < 20) {
        audit.warnings.push(`${keyName} appears to be too short`);
      }
    }
  });

  // Check CORS origins for production
  if (config.NODE_ENV === 'production') {
    audit.recommendations.push('Verify CORS origins are properly configured for production domains');
    audit.recommendations.push('Ensure no development URLs in production CORS settings');
  }

  // Check Supabase URL consistency
  if (config.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const url = new URL(config.NEXT_PUBLIC_SUPABASE_URL);
      if (!url.hostname.includes('supabase')) {
        audit.warnings.push('Supabase URL does not appear to be from Supabase');
      }
    } catch {
      audit.errors.push('Invalid Supabase URL format');
      audit.isValid = false;
    }
  }
}

/**
 * Runtime environment validation with startup checks
 */
export async function performStartupValidation(): Promise<SecurityAudit> {
  const { config, audit } = validateEnvironment();

  // Additional runtime checks
  try {
    // Test Supabase connection
    await testSupabaseConnection(config);
    
    // Test OpenAI API connection
    await testOpenAIConnection(config);
    
    audit.recommendations.push('All external service connections verified');
  } catch (error) {
    audit.errors.push(`Startup validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    audit.isValid = false;
  }

  return audit;
}

/**
 * Test Supabase connection
 */
async function testSupabaseConnection(config: Environment): Promise<void> {
  // Skip connection tests in test environment
  if (config.NODE_ENV === 'test') {
    return;
  }

  try {
    const response = await fetch(`${config.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': config.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${config.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Supabase connection failed: ${response.status}`);
    }
  } catch (error) {
    throw new Error(`Supabase connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Test OpenAI API connection
 */
async function testOpenAIConnection(config: Environment): Promise<void> {
  // Skip connection tests in test environment
  if (config.NODE_ENV === 'test') {
    return;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${config.OPENAI_API_KEY}`
      }
    });

    if (response.status === 401) {
      throw new Error('OpenAI API key is invalid');
    }

    if (!response.ok) {
      throw new Error(`OpenAI API connection failed: ${response.status}`);
    }
  } catch (error) {
    throw new Error(`OpenAI connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get validated environment configuration
 * Throws error if validation fails in production
 */
export function getEnvironmentConfig(): Environment {
  const { config, audit } = validateEnvironment();

  if (!audit.isValid) {
    const errorMessage = `Environment validation failed:\n${audit.errors.join('\n')}`;
    
    if (config.NODE_ENV === 'production') {
      throw new Error(errorMessage);
    } else {
      console.warn(errorMessage);
      if (audit.warnings.length > 0) {
        console.warn(`Warnings:\n${audit.warnings.join('\n')}`);
      }
    }
  }

  if (audit.warnings.length > 0) {
    console.warn(`Environment warnings:\n${audit.warnings.join('\n')}`);
  }

  if (audit.recommendations.length > 0) {
    console.info(`Security recommendations:\n${audit.recommendations.join('\n')}`);
  }

  return config;
}

// Export the validated configuration
export const env = getEnvironmentConfig();