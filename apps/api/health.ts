import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    // Initialize Supabase client for database health check
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // Check database connection
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    const databaseHealth = {
      connected: !error,
      responseTimeMs: Date.now() - startTime,
      activeConnections: 1
    };

    const healthStatus = {
      status: databaseHealth.connected ? 'healthy' : 'degraded',
      version: '1.3.0',
      timestamp: new Date().toISOString(),
      database: databaseHealth,
      memory: process.memoryUsage()
    };

    res.status(200).json({
      success: true,
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