// Load environment variables
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { createContext } from './trpc';
import { appRouter } from './trpc/routers';

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
    // CORS configuration
    await fastify.register(cors, {
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
    });

    // Register tRPC
    await fastify.register(fastifyTRPCPlugin, {
      prefix: '/trpc',
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
    await buildServer();
    
    const port = parseInt(process.env.API_PORT || '3001', 10);
    const host = process.env.API_HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    fastify.log.info(`API server running at http://${host}:${port}`);
    fastify.log.info(`tRPC endpoints available at http://${host}:${port}/trpc`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

// Start the server
start();