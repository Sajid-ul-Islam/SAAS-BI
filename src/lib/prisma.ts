import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'info' },
      { emit: 'event', level: 'warn' },
    ],
  });

  // Attach structured logging to Prisma events
  client.$on('error', (e) => {
    logger.error(`[Prisma:Error] ${e.message}`, e);
  });

  client.$on('warn', (e) => {
    logger.warn(`[Prisma:Warn] ${e.message}`);
  });

  if (process.env.NODE_ENV === 'development') {
    client.$on('query', (e) => {
      logger.debug(`[Prisma:Query] ${e.query} - ${e.duration}ms`);
    });
  }

  return client;
}

export const prisma = global.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export default prisma;
