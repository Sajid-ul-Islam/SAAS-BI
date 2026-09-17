import { logger } from './logger';

export interface ErrorContext {
  tenantId?: string;
  userId?: string;
  source?: string;
  route?: string;
  metadata?: Record<string, unknown>;
}

export class ErrorTracker {
  /**
   * Captures an exception with rich tenant context and structured logging.
   * Drop-in Sentry integration point for production deployment.
   */
  static captureException(error: unknown, context: ErrorContext = {}): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('Tracked system exception', {
      message: errorMessage,
      stack: errorStack,
      tenantId: context.tenantId,
      userId: context.userId,
      source: context.source ?? 'application',
      route: context.route,
      metadata: context.metadata,
      timestamp: new Date().toISOString(),
    });
  }

  static captureMessage(message: string, level: 'info' | 'warn' | 'error' = 'info', context: ErrorContext = {}): void {
    logger[level](message, {
      tenantId: context.tenantId,
      userId: context.userId,
      source: context.source,
      metadata: context.metadata,
    });
  }
}
