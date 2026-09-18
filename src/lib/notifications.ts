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

    // In production with Bangladeshi SMS Gateway (e.g. Greenweb / Onnorokom) and Email
    const alertPhone = process.env.MERCHANT_ALERT_PHONE ?? '01711000000';
    const alertEmail = process.env.MERCHANT_ALERT_EMAIL ?? 'merchant@dhakafashion.com';

    if (notification.severity === 'critical') {
      const { smsService } = await import('./sms');
      const { emailDispatcher } = await import('./email');

      const [smsRes] = await Promise.all([
        smsService.sendSms({
          recipient: alertPhone,
          message: `[SaaS BI Urgent] ${notification.title}: ${notification.message.substring(0, 100)}`,
          tenantId: notification.tenantId,
        }),
        emailDispatcher.sendAnomalyAlertEmail({
          to: alertEmail,
          tenantName: 'Dhaka Fashion Hub',
          title: notification.title,
          message: notification.message,
          severity: 'critical',
        }),
      ]);

      return {
        success: true,
        channel: `MULTI_CHANNEL:SMS_${smsRes.provider}+EMAIL`,
      };
    }

    return {
      success: true,
      channel: 'STRUCTURED_LOG',
    };
  }
}

export const notificationDispatcher = new NotificationDispatcher();
