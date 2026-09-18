import { logger } from './logger';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  template?: 'TEAM_INVITE' | 'PAYMENT_RECEIPT' | 'ANOMALY_ALERT' | 'PASSWORD_RESET';
  data?: Record<string, string | number>;
}

export interface EmailDispatchResult {
  success: boolean;
  messageId: string;
  provider: 'resend' | 'mock';
  html?: string;
}

/**
 * Generate a responsive, branded HTML email template for Team Invitations.
 */
export function renderTeamInviteHtml(params: {
  inviterName: string;
  tenantName: string;
  role: string;
  inviteUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Join ${params.tenantName} on SaaS BI</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #0f172a; padding: 32px 24px; text-align: center; }
    .logo { color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; text-decoration: none; }
    .logo-badge { background: #6366f1; color: #ffffff; font-size: 11px; padding: 2px 8px; border-radius: 4px; vertical-align: middle; margin-left: 6px; font-weight: 600; }
    .content { padding: 36px 32px; color: #334155; }
    .title { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; }
    .lead { font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin-bottom: 28px; }
    .card-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
    .card-row:last-child { margin-bottom: 0; }
    .card-label { color: #64748b; font-weight: 500; }
    .card-value { color: #0f172a; font-weight: 600; }
    .btn-container { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background: #6366f1; color: #ffffff !important; font-size: 15px; font-weight: 600; text-decoration: none; padding: 12px 32px; border-radius: 8px; box-shadow: 0 2px 4px rgba(99, 102, 241, 0.25); }
    .footer { padding: 24px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
    .footer a { color: #6366f1; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">SaaS BI <span class="logo-badge">BD Logistics</span></div>
    </div>
    <div class="content">
      <h1 class="title">You've been invited to join ${params.tenantName}</h1>
      <p class="lead">
        <strong>${params.inviterName}</strong> has invited you to collaborate as an <strong>${params.role}</strong> on their multi-carrier e-commerce analytics workspace.
      </p>
      <div class="card">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Organization:</td>
            <td style="padding: 6px 0; text-align: right; color: #0f172a; font-weight: 600; font-size: 14px;">${params.tenantName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Assigned Role:</td>
            <td style="padding: 6px 0; text-align: right; color: #6366f1; font-weight: 600; font-size: 14px;">${params.role}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Invited By:</td>
            <td style="padding: 6px 0; text-align: right; color: #0f172a; font-weight: 500; font-size: 14px;">${params.inviterName}</td>
          </tr>
        </table>
      </div>
      <div class="btn-container">
        <a href="${params.inviteUrl}" class="btn" target="_blank">Accept Invitation</a>
      </div>
      <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">
        This invitation link will expire in 7 days. If you were not expecting this invitation, you can safely disregard this email.
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} SaaS BI Bangladesh. Real-Time Logistics Intelligence.<br>
      Dhaka, Bangladesh &bull; <a href="https://saas-bi.com.bd">saas-bi.com.bd</a>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate a responsive, branded HTML email template for SSLCommerz Payment Receipts.
 */
export function renderPaymentReceiptHtml(params: {
  tenantName: string;
  amountBDT: number;
  planTier: string;
  tranId: string;
  date?: string;
}): string {
  const formattedDate = params.date ?? new Date().toLocaleDateString('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt - SaaS BI</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #0f172a; padding: 32px 24px; text-align: center; }
    .logo { color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .badge-paid { display: inline-block; background: #10b981; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px; margin-top: 12px; }
    .content { padding: 36px 32px; color: #334155; }
    .title { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; text-align: center; }
    .receipt-id { text-align: center; color: #64748b; font-size: 13px; margin-bottom: 24px; }
    .receipt-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .receipt-table th { text-align: left; padding: 10px 12px; background: #f1f5f9; color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .receipt-table td { padding: 14px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #1e293b; }
    .total-row td { font-weight: 700; font-size: 16px; color: #0f172a; border-top: 2px solid #0f172a; border-bottom: none; }
    .btn-container { text-align: center; margin: 28px 0 12px 0; }
    .btn { display: inline-block; background: #0f172a; color: #ffffff !important; font-size: 14px; font-weight: 600; text-decoration: none; padding: 10px 24px; border-radius: 6px; }
    .footer { padding: 24px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">SaaS BI</div>
      <div class="badge-paid">Payment Received</div>
    </div>
    <div class="content">
      <h1 class="title">৳${params.amountBDT.toLocaleString('en-BD')} Paid</h1>
      <div class="receipt-id">Transaction ID: ${params.tranId} &bull; ${formattedDate}</div>
      
      <table class="receipt-table">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: right;">Amount (BDT)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>SaaS BI ${params.planTier} Plan</strong><br>
              <span style="font-size: 12px; color: #64748b;">Merchant: ${params.tenantName} (1-Month Subscription)</span>
            </td>
            <td style="text-align: right; font-weight: 600;">৳${params.amountBDT.toLocaleString('en-BD')}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Payment Gateway (SSLCommerz)</td>
            <td style="text-align: right; color: #64748b;">Included</td>
          </tr>
          <tr class="total-row">
            <td>Total Paid</td>
            <td style="text-align: right;">৳${params.amountBDT.toLocaleString('en-BD')}</td>
          </tr>
        </tbody>
      </table>

      <div class="btn-container">
        <a href="https://saas-bi.com.bd/dashboard/settings" class="btn" target="_blank">Manage Subscription</a>
      </div>
      
      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 20px;">
        This receipt acts as formal confirmation of your subscription payment. Thank you for building with SaaS BI.
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} SaaS BI Bangladesh &bull; SSLCommerz Verified Merchant
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate a responsive, branded HTML email template for Critical Anomaly Alerts.
 */
export function renderAnomalyAlertHtml(params: {
  tenantName: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  details?: Record<string, string | number>;
  dashboardUrl?: string;
}): string {
  const bannerBg = params.severity === 'critical' ? '#ef4444' : '#f59e0b';
  const badgeLabel = params.severity.toUpperCase();
  const dashboardLink = params.dashboardUrl ?? 'https://saas-bi.com.bd/dashboard/ai';

  const detailRows = params.details
    ? Object.entries(params.details)
        .map(
          ([k, v]) => `
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px; font-family: monospace;">${k}:</td>
            <td style="padding: 6px 0; text-align: right; color: #0f172a; font-weight: 600; font-size: 13px;">${v}</td>
          </tr>`
        )
        .join('')
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.title} - SaaS BI Alert</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .banner { background: ${bannerBg}; color: #ffffff; padding: 12px 24px; text-align: center; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; }
    .header { background: #0f172a; padding: 24px; text-align: center; }
    .logo { color: #ffffff; font-size: 20px; font-weight: 700; }
    .content { padding: 32px; color: #334155; }
    .title { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; }
    .message-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 14px 16px; border-radius: 4px; margin-bottom: 20px; font-size: 14px; color: #991b1b; }
    .details-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
    .btn { display: inline-block; background: #0f172a; color: #ffffff !important; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 6px; }
    .footer { padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="banner">LOGISTICS ALERT: ${badgeLabel}</div>
    <div class="header">
      <div class="logo">SaaS BI Logistics Anomaly Guard</div>
    </div>
    <div class="content">
      <h1 class="title">${params.title}</h1>
      <div class="message-box">
        <strong>Detected Anomaly:</strong> ${params.message}
      </div>

      ${
        detailRows
          ? `<div class="details-box">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${detailRows}
          </table>
        </div>`
          : ''
      }

      <div style="text-align: center; margin: 28px 0;">
        <a href="${dashboardLink}" class="btn" target="_blank">Investigate in AI Dashboard</a>
      </div>
      <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0;">
        Store: <strong>${params.tenantName}</strong> &bull; Generated by SaaS BI Automated Anomaly Engine
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} SaaS BI Bangladesh. AI-Powered Courier Intelligence.
    </div>
  </div>
</body>
</html>`;
}

export class EmailService {
  /**
   * Dispatches transactional emails to merchants and team members.
   * If RESEND_API_KEY is configured, sends via Resend REST API; otherwise logs mock simulation.
   */
  async sendEmail(options: SendEmailOptions): Promise<EmailDispatchResult> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const fromAddress = options.from ?? process.env.EMAIL_FROM ?? 'SaaS BI <noreply@saas-bi.com.bd>';

    logger.info(`[EmailService] Dispatching email to ${options.to}`, {
      to: options.to,
      subject: options.subject,
      template: options.template,
      messageId,
    });

    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: options.to,
            subject: options.subject,
            html: options.html ?? `<p>${options.subject}</p>`,
            text: options.text,
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          logger.error('Resend API returned non-OK status', { status: response.status, errBody });
        } else {
          logger.info('Dispatched email via Resend API', { messageId });
          return { success: true, messageId, provider: 'resend', html: options.html };
        }
      } catch (err) {
        logger.error('Failed to dispatch email via Resend provider', { err });
      }
    }

    // In development, testing, or fallback mode, return mock dispatch
    logger.info('Simulated email dispatch in development mode', {
      to: options.to,
      subject: options.subject,
      template: options.template,
      payload: options.data,
    });

    return { success: true, messageId, provider: 'mock', html: options.html };
  }

  async sendTeamInviteEmail(params: {
    to: string;
    inviterName: string;
    tenantName: string;
    role: string;
    inviteUrl: string;
  }): Promise<EmailDispatchResult> {
    const html = renderTeamInviteHtml(params);
    return this.sendEmail({
      to: params.to,
      subject: `Invitation to join ${params.tenantName} on SaaS BI`,
      template: 'TEAM_INVITE',
      html,
      text: `${params.inviterName} invited you to join ${params.tenantName} as ${params.role}. Accept: ${params.inviteUrl}`,
      data: params,
    });
  }

  async sendPaymentReceiptEmail(params: {
    to: string;
    tenantName: string;
    amountBDT: number;
    planTier: string;
    tranId: string;
    date?: string;
  }): Promise<EmailDispatchResult> {
    const html = renderPaymentReceiptHtml(params);
    return this.sendEmail({
      to: params.to,
      subject: `Payment Receipt: ৳${params.amountBDT} for ${params.tenantName}`,
      template: 'PAYMENT_RECEIPT',
      html,
      text: `Receipt for ${params.tenantName}: ৳${params.amountBDT} for ${params.planTier} Plan (Trans: ${params.tranId})`,
      data: {
        tenantName: params.tenantName,
        amountBDT: params.amountBDT,
        planTier: params.planTier,
        tranId: params.tranId,
      },
    });
  }

  async sendAnomalyAlertEmail(params: {
    to: string;
    tenantName: string;
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
    details?: Record<string, string | number>;
    dashboardUrl?: string;
  }): Promise<EmailDispatchResult> {
    const html = renderAnomalyAlertHtml(params);
    return this.sendEmail({
      to: params.to,
      subject: `[${params.severity.toUpperCase()}] ${params.title} - ${params.tenantName}`,
      template: 'ANOMALY_ALERT',
      html,
      text: `[${params.severity.toUpperCase()}] ${params.title}\n\n${params.message}`,
      data: {
        tenantName: params.tenantName,
        severity: params.severity,
        title: params.title,
      },
    });
  }
}

export const emailService = new EmailService();
export const emailDispatcher = emailService;
