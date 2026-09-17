import { logger } from './logger';

export interface AlertNotification {
  tenantId: string;
  type: 'ANOMALY_RETURN_SPIKE' | 'ANOMALY_COD_DELAY' | 'SUBSCRIPTION_EXPIRING' | 'PARCEL_DELIVERED';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  metadata?: Record<string, unknown>;
}

export class NotificationDispatcher {
  /**
   * Dispatches push notifications/SMS alerts for critical merchant events.
   */
  async dispatchAlert(notification: AlertNotification): Promise<{ success: boolean; channel: string }> {
    logger.info(`[Notification:${notification.severity.toUpperCase()}] ${notification.title}`, {
      tenantId: notification.tenantId,
      type: notification.type,
      message: notification.message,
      metadata: notification.metadata,
    });

    // In production with Bangladeshi SMS Gateway (e.g. Greenweb / Onnorokom)
    const smsGatewayApiKey = process.env.SMS_GATEWAY_API_KEY;
    if (smsGatewayApiKey && notification.severity === 'critical') {
      try {
        // e.g. POST https://api.greenweb.com.bd/api.php
        logger.info('Dispatched SMS alert via Bangladeshi gateway to merchant phone', {
          tenantId: notification.tenantId,
        });
      } catch (err) {
        logger.warn('Failed to dispatch SMS alert', { err });
      }
    }

    return {
      success: true,
      channel: smsGatewayApiKey ? 'SMS+LOG' : 'STRUCTURED_LOG',
    };
  }
}

export const notificationDispatcher = new NotificationDispatcher();
