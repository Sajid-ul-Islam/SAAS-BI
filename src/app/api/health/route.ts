import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  nodeVersion: string;
  services: {
    database: {
      status: 'connected' | 'disconnected';
      latencyMs: number;
      error?: string | null;
    };
    cache: {
      mode: 'upstash' | 'redis' | 'memory';
      operational: boolean;
    };
  };
  system: {
    memory: {
      rssMb: number;
      heapTotalMb: number;
      heapUsedMb: number;
      externalMb: number;
    };
  };
}

/**
 * GET /api/health
 * Production healthcheck & telemetry endpoint.
 * Probes database connectivity, cache status, and memory metrics.
 */
export async function GET() {
  const mem = process.memoryUsage();
  let dbStatus: 'connected' | 'disconnected' = 'connected';
  let dbLatencyMs = 0;
  let dbError: string | null = null;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1 as alive`;
    dbLatencyMs = Date.now() - dbStart;
  } catch (err: unknown) {
    dbStatus = 'disconnected';
    dbError = err instanceof Error ? err.message : 'Database connectivity check failed';
  }

  const isHealthy = dbStatus === 'connected';

  const healthData: HealthCheckResponse = {
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV ?? 'development',
    nodeVersion: process.version,
    services: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        error: dbError,
      },
      cache: {
        mode: cacheService.getMode(),
        operational: true,
      },
    },
    system: {
      memory: {
        rssMb: Math.round((mem.rss / (1024 * 1024)) * 100) / 100,
        heapTotalMb: Math.round((mem.heapTotal / (1024 * 1024)) * 100) / 100,
        heapUsedMb: Math.round((mem.heapUsed / (1024 * 1024)) * 100) / 100,
        externalMb: Math.round((mem.external / (1024 * 1024)) * 100) / 100,
      },
    },
  };

  return NextResponse.json(healthData, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    },
  });
}
