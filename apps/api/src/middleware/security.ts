import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { getAuthService } from '../services/auth';

// Rate limiting configuration
const RATE_LIMITS = {
  authentication: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes per IP
  },
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes  
    maxRequests: 1000, // 1000 requests per 15 minutes per IP
  },
  brute_force: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxFailedAttempts: 5, // 5 failed attempts per IP/email combo
  }
};

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const bruteForceStore = new Map<string, { attempts: number; resetTime: number; blockedUntil?: number }>();

interface SecurityEvent {
  event_type: 'login_success' | 'login_failure' | 'logout' | 'token_validation_failed' | 'rate_limit_exceeded' | 'brute_force_attempt';
  user_id?: string;
  ip_address: string;
  user_agent?: string;
  additional_data?: Record<string, any>;
}

/**
 * Log security events for audit compliance
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  try {
    const authService = getAuthService();
    const timestamp = new Date().toISOString();
    
    // In production, this would write to a dedicated audit log table
    // For now, using console.log with structured format
    console.log(JSON.stringify({
      timestamp,
      level: 'AUDIT',
      ...event
    }));

    // TODO: Implement database audit logging when audit_logs table is ready
    // await authService.logAuditEvent({
    //   event_type: event.event_type,
    //   user_id: event.user_id,
    //   ip_address: event.ip_address,
    //   user_agent: event.user_agent,
    //   additional_data: event.additional_data,
    //   timestamp
    // });

  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

/**
 * Rate limiting middleware
 */
export function createRateLimitMiddleware(limitType: 'authentication' | 'general') {
  const config = RATE_LIMITS[limitType];
  
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const clientIp = getClientIp(request);
    const key = `${limitType}:${clientIp}`;
    const now = Date.now();
    
    const current = rateLimitStore.get(key);
    
    if (!current || now > current.resetTime) {
      // Reset or initialize counter
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return;
    }
    
    if (current.count >= config.maxRequests) {
      await logSecurityEvent({
        event_type: 'rate_limit_exceeded',
        ip_address: clientIp,
        user_agent: request.headers['user-agent'],
        additional_data: {
          limit_type: limitType,
          attempts: current.count
        }
      });
      
      reply.status(429).send({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      });
      return;
    }
    
    // Increment counter
    current.count++;
    rateLimitStore.set(key, current);
  };
}

/**
 * Brute force protection middleware for authentication endpoints
 */
export async function bruteForceProtection(request: FastifyRequest, reply: FastifyReply) {
  const clientIp = getClientIp(request);
  const body = request.body as any;
  const email = body?.email;
  
  if (!email) return; // Skip if no email provided
  
  const key = `brute_force:${clientIp}:${email}`;
  const now = Date.now();
  
  const current = bruteForceStore.get(key);
  
  if (current) {
    // Check if IP/email combo is currently blocked
    if (current.blockedUntil && now < current.blockedUntil) {
      await logSecurityEvent({
        event_type: 'brute_force_attempt',
        ip_address: clientIp,
        user_agent: request.headers['user-agent'],
        additional_data: {
          email,
          blocked_until: new Date(current.blockedUntil).toISOString()
        }
      });
      
      reply.status(429).send({
        error: 'Account Temporarily Locked',
        message: 'Too many failed login attempts. Please try again later.',
        retryAfter: Math.ceil((current.blockedUntil - now) / 1000)
      });
      return;
    }
    
    // Reset counter if window has expired
    if (now > current.resetTime) {
      bruteForceStore.delete(key);
    }
  }
}

/**
 * Record authentication attempt for brute force tracking
 */
export async function recordAuthAttempt(
  clientIp: string, 
  email: string, 
  success: boolean, 
  userAgent?: string
): Promise<void> {
  const key = `brute_force:${clientIp}:${email}`;
  const now = Date.now();
  
  if (success) {
    // Clear any existing failed attempts on successful login
    bruteForceStore.delete(key);
    await logSecurityEvent({
      event_type: 'login_success',
      ip_address: clientIp,
      user_agent: userAgent,
      additional_data: { email }
    });
  } else {
    // Track failed attempt
    const current = bruteForceStore.get(key) || { 
      attempts: 0, 
      resetTime: now + RATE_LIMITS.brute_force.windowMs 
    };
    
    current.attempts++;
    
    // Block if too many failed attempts
    if (current.attempts >= RATE_LIMITS.brute_force.maxFailedAttempts) {
      current.blockedUntil = now + (30 * 60 * 1000); // Block for 30 minutes
    }
    
    bruteForceStore.set(key, current);
    
    await logSecurityEvent({
      event_type: 'login_failure',
      ip_address: clientIp,
      user_agent: userAgent,
      additional_data: { 
        email, 
        attempt_count: current.attempts,
        blocked: !!current.blockedUntil
      }
    });
  }
}

/**
 * Session timeout management middleware
 */
export async function sessionTimeoutMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return; // No token, skip timeout check
  }
  
  const token = authHeader.substring(7);
  const clientIp = getClientIp(request);
  
  try {
    const authService = getAuthService();
    const sessionValid = await authService.validateSession(token);
    
    if (!sessionValid.valid) {
      await logSecurityEvent({
        event_type: 'token_validation_failed',
        ip_address: clientIp,
        user_agent: request.headers['user-agent'],
        additional_data: { 
          reason: sessionValid.reason,
          token_preview: token.substring(0, 10) + '...'
        }
      });
      
      reply.status(401).send({
        error: 'Invalid Session',
        message: sessionValid.reason || 'Session validation failed'
      });
      return;
    }
    
  } catch (error) {
    console.error('Session validation error:', error);
    reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Session validation failed'
    });
    return;
  }
}

/**
 * Cleanup expired rate limit and brute force entries
 */
export function cleanupSecurityStore(): void {
  const now = Date.now();
  
  // Cleanup rate limit store
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
  
  // Cleanup brute force store
  for (const [key, value] of bruteForceStore.entries()) {
    if (now > value.resetTime && (!value.blockedUntil || now > value.blockedUntil)) {
      bruteForceStore.delete(key);
    }
  }
}

/**
 * Get client IP address from request
 */
function getClientIp(request: FastifyRequest): string {
  const forwarded = request.headers['x-forwarded-for'];
  const realIp = request.headers['x-real-ip'];
  
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  
  if (typeof realIp === 'string') {
    return realIp;
  }
  
  return request.ip || 'unknown';
}

/**
 * Fastify plugin to register all security middleware
 */
export async function securityPlugin(fastify: FastifyInstance) {
  // Register general rate limiting for all routes
  fastify.addHook('preHandler', createRateLimitMiddleware('general'));
  
  // Register authentication-specific rate limiting for auth routes
  fastify.addHook('preHandler', async (request, reply) => {
    if (request.url.includes('/auth/') || request.url.includes('login') || request.url.includes('register')) {
      await createRateLimitMiddleware('authentication')(request, reply);
    }
  });
  
  // Register brute force protection for authentication routes
  fastify.addHook('preHandler', async (request, reply) => {
    if (request.method === 'POST' && (request.url.includes('/auth/') || request.url.includes('login'))) {
      await bruteForceProtection(request, reply);
    }
  });
  
  // Register session timeout middleware for protected routes
  fastify.addHook('preHandler', sessionTimeoutMiddleware);
  
  // Setup cleanup interval (every 5 minutes)
  const cleanupInterval = setInterval(cleanupSecurityStore, 5 * 60 * 1000);
  
  // Cleanup on server shutdown
  fastify.addHook('onClose', async () => {
    clearInterval(cleanupInterval);
  });
  
  fastify.log.info('Security middleware registered successfully');
}

export { RATE_LIMITS };