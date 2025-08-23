// Load environment variables
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { createContext } from './trpc';
import { appRouter } from './trpc/routers';
import { securityPlugin } from './middleware/security';
import { env, performStartupValidation } from './config/environment';

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

export async function buildServer() {
  try {
    // Register security middleware first
    await fastify.register(securityPlugin);
    
    // CORS configuration
    await fastify.register(cors, {
      origin: [
        'http://localhost:3000', 
        'http://localhost:3001',
        'https://instructly-8p07tp9o6-coleens-projects-606beb08.vercel.app',
        /\.vercel\.app$/
      ],
      credentials: true,
    });

    // Register tRPC at both /trpc and /api/trpc for compatibility
    await fastify.register(fastifyTRPCPlugin, {
      prefix: '/trpc',
      trpcOptions: {
        router: appRouter,
        createContext,
      },
    });

    await fastify.register(fastifyTRPCPlugin, {
      prefix: '/api/trpc',
      trpcOptions: {
        router: appRouter,
        createContext,
      },
    });

    // Health check endpoint
    fastify.get('/health', async (request, reply) => {
      return { status: 'healthy', timestamp: new Date() };
    });

    return fastify;
  } catch (error) {
    fastify.log.error(error);
    throw error;
  }
}

async function start() {
  try {
    // Perform startup validation
    fastify.log.info('Performing environment and security validation...');
    const validationResult = await performStartupValidation();
    
    if (!validationResult.isValid) {
      fastify.log.error(`Startup validation failed: ${validationResult.errors.join(', ')}`);
      if (env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
    
    if (validationResult.warnings.length > 0) {
      fastify.log.warn(`Startup validation warnings: ${validationResult.warnings.join(', ')}`);
    }
    
    await buildServer();
    
    await fastify.listen({ port: env.API_PORT, host: env.API_HOST });
    fastify.log.info(`API server running at http://${env.API_HOST}:${env.API_PORT}`);
    fastify.log.info(`tRPC endpoints available at http://${env.API_HOST}:${env.API_PORT}/trpc`);
    fastify.log.info(`Environment: ${env.NODE_ENV}`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

// Start the server
start();