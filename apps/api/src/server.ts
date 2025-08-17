import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { createAppConfig } from '@instructly/shared';
import { healthRoutes } from './functions/health';
import { metricsRoutes } from './functions/metrics';

// Create Fastify instance with logging
const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

async function buildServer() {
  try {
    // Load configuration
    createAppConfig();
    
    // Security middleware
    await fastify.register(helmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    });
    
    // CORS configuration for enterprise deployment
    await fastify.register(cors, {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://instructly.com', 'https://instructly-staging.vercel.app']
        : true,
      credentials: true,
    });
    
    // Rate limiting for scalability (NFR2: 1000+ users)
    await fastify.register(rateLimit, {
      max: 100, // requests per minute
      timeWindow: '1 minute',
      allowList: ['127.0.0.1'],
    });
    
    // Health check routes (AC: 4)
    await fastify.register(healthRoutes, { prefix: '/api' });
    
    // Metrics routes for AI cost tracking (NFR5)
    await fastify.register(metricsRoutes, { prefix: '/api' });
    
    // Global error handler following coding standards
    fastify.setErrorHandler((error, request, reply) => {
      fastify.log.error(error);
      
      const statusCode = error.statusCode || 500;
      const message = statusCode === 500 ? 'Internal Server Error' : error.message;
      
      reply.status(statusCode).send({
        success: false,
        error: message,
        timestamp: new Date(),
      });
    });
    
    return fastify;
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

// Start server
const start = async () => {
  try {
    const server = await buildServer();
    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';
    
    await server.listen({ port, host });
    server.log.info(`Server listening on http://${host}:${port}`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

export { buildServer };