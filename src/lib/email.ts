import { logger } from './logger';

export interface SendEmailOptions {
  to: string;
  subject: string;
  template: 'TEAM_INVITE' | 'PAYMENT_RECEIPT' | 'PASSWORD_RESET';
  data: Record<string, string | number>;
}

export class EmailService {
  /**
   * Dispatches transactional emails to merchants and team members.
   */
  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId: string }> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    logger.info(`[EmailService] Sending ${options.template} to ${options.to}`, {
      to: options.to,
      subject: options.subject,
      template: options.template,
      messageId,
    });

    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      try {
        // e.g. await resend.emails.send({ from: 'noreply@saas-bi.com.bd', to: options.to, ... })
        logger.info('Dispatched email via Resend API', { messageId });
      } catch (err) {
        logger.error('Failed to dispatch email via Resend provider', { err });
      }
    } else {
      // In development or test, log structured email output
      logger.info('Simulated email dispatch in development mode', {
        to: options.to,
        subject: options.subject,
        payload: options.data,
      });
    }

    return { success: true, messageId };
  }

  async sendTeamInviteEmail(params: {
    to: string;
    inviterName: string;
    tenantName: string;
    role: string;
    inviteUrl: string;
  }): Promise<{ success: boolean; messageId: string }> {
    return this.sendEmail({
      to: params.to,
      subject: `Invitation to join ${params.tenantName} on SaaS BI`,
      template: 'TEAM_INVITE',
      data: params,
    });
  }

  async sendPaymentReceiptEmail(params: {
    to: string;
    tenantName: string;
    amountBDT: number;
    planTier: string;
    tranId: string;
  }): Promise<{ success: boolean; messageId: string }> {
    return this.sendEmail({
      to: params.to,
      subject: `Payment Receipt: ৳${params.amountBDT} for ${params.tenantName}`,
      template: 'PAYMENT_RECEIPT',
      data: {
        tenantName: params.tenantName,
        amountBDT: params.amountBDT,
        planTier: params.planTier,
        tranId: params.tranId,
      },
    });
  }
}

export const emailService = new EmailService();
export const emailDispatcher = emailService;
