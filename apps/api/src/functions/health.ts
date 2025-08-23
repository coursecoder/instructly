import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime: number;
      connection: boolean;
    };
    openai: {
      status: 'healthy' | 'unhealthy';
      responseTime: number;
      apiKey: boolean;
    };
    supabase: {
      status: 'healthy' | 'unhealthy';
      responseTime: number;
      auth: boolean;
    };
  };
  environment: 'development' | 'staging' | 'production';
}

async function checkDatabase(): Promise<HealthCheckResponse['services']['database']> {
  const startTime = Date.now();
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    return {
      status: error ? 'unhealthy' : 'healthy',
      responseTime: Date.now() - startTime,
      connection: !error
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      connection: false
    };
  }
}

async function checkOpenAI(): Promise<HealthCheckResponse['services']['openai']> {
  const startTime = Date.now();
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        apiKey: false
      };
    }

    // Simple API key validation (check format)
    const isValidFormat = apiKey.startsWith('sk-') && apiKey.length > 40;
    
    return {
      status: isValidFormat ? 'healthy' : 'unhealthy',
      responseTime: Date.now() - startTime,
      apiKey: isValidFormat
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      apiKey: false
    };
  }
}

async function checkSupabase(): Promise<HealthCheckResponse['services']['supabase']> {
  const startTime = Date.now();
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !serviceKey) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        auth: false
      };
    }

    const supabase = createClient(url, serviceKey);
    
    // Test auth configuration
    const { error } = await supabase.auth.getSession();
    
    return {
      status: 'healthy',
      responseTime: Date.now() - startTime,
      auth: true
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      auth: false
    };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Run all health checks in parallel
    const [database, openai, supabase] = await Promise.all([
      checkDatabase(),
      checkOpenAI(),
      checkSupabase()
    ]);

    const services = { database, openai, supabase };
    
    // Determine overall health status
    const unhealthyServices = Object.values(services).filter(service => service.status === 'unhealthy').length;
    let overallStatus: HealthCheckResponse['status'];
    
    if (unhealthyServices === 0) {
      overallStatus = 'healthy';
    } else if (unhealthyServices <= 1) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }

    const environment = (process.env.NODE_ENV === 'production') ? 'production' :
                       (process.env.NODE_ENV === 'staging') ? 'staging' : 'development';

    const healthStatus: HealthCheckResponse = {
      status: overallStatus,
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      services,
      environment
    };

    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    res.status(statusCode).json({
      success: overallStatus !== 'unhealthy',
      data: healthStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
}