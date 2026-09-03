type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogPayload {
  message: string;
  tenantId?: string;
  context?: Record<string, unknown>;
  error?: Error | unknown;
  timestamp?: string;
}

class StructuredLogger {
  private formatOutput(level: LogLevel, payload: LogPayload): string {
    const data = {
      level,
      message: payload.message,
      tenantId: payload.tenantId,
      context: payload.context,
      error: payload.error instanceof Error ? {
        name: payload.error.name,
        message: payload.error.message,
        stack: payload.error.stack,
      } : payload.error,
      timestamp: new Date().toISOString(),
    };

    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify(data);
    }

    const tenantTag = payload.tenantId ? ` [Tenant: ${payload.tenantId}]` : '';
    const errString = payload.error instanceof Error ? `\n${payload.error.stack}` : '';
    return `[${data.timestamp}] [${level.toUpperCase()}]${tenantTag} ${payload.message} ${
      payload.context ? JSON.stringify(payload.context) : ''
    }${errString}`;
  }

  debug(message: string, context?: Record<string, unknown>, tenantId?: string): void {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug(this.formatOutput('debug', { message, context, tenantId }));
    }
  }

  info(message: string, context?: Record<string, unknown>, tenantId?: string): void {
    // eslint-disable-next-line no-console
    console.info(this.formatOutput('info', { message, context, tenantId }));
  }

  warn(message: string, context?: Record<string, unknown>, tenantId?: string): void {
    // eslint-disable-next-line no-console
    console.warn(this.formatOutput('warn', { message, context, tenantId }));
  }

  error(message: string, error?: Error | unknown, context?: Record<string, unknown>, tenantId?: string): void {
    // eslint-disable-next-line no-console
    console.error(this.formatOutput('error', { message, error, context, tenantId }));
  }
}

export const logger = new StructuredLogger();
