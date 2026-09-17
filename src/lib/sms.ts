import { logger } from './logger';

/**
 * Normalizes raw Bangladeshi phone numbers to international standard 8801XXXXXXXXX.
 */
export function normalizeBangladeshiPhone(raw: string): string | null {
  if (!raw) return null;
  // Strip all non-digits
  const digits = raw.replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('01')) {
    return `88${digits}`;
  }
  if (digits.length === 13 && digits.startsWith('8801')) {
    return digits;
  }
  if (digits.length === 10 && digits.startsWith('1')) {
    return `880${digits}`;
  }

  // If valid 11-digit mobile starting with 013, 014, 015, 016, 017, 018, 019
  return null;
}

export interface SendSmsParams {
  recipient: string;
  message: string;
  tenantId?: string;
}

export interface SmsSendResult {
  success: boolean;
  provider: 'GREENWEB' | 'ONNOROKOM' | 'MOCK';
  messageId: string;
  normalizedRecipient: string;
  response?: unknown;
}

export class SmsService {
  /**
   * Dispatches SMS message using configured provider or development mock.
   */
  async sendSms(params: SendSmsParams): Promise<SmsSendResult> {
    const normalized = normalizeBangladeshiPhone(params.recipient);
    if (!normalized) {
      logger.warn('Invalid Bangladeshi phone number for SMS dispatch', {
        raw: params.recipient,
      });
      return {
        success: false,
        provider: 'MOCK',
        messageId: '',
        normalizedRecipient: params.recipient,
      };
    }

    const greenwebToken = process.env.GREENWEB_SMS_TOKEN;
    const onnorokomApiKey = process.env.ONNOROKOM_SMS_API_KEY;

    // 1. Greenweb SMS Gateway
    if (greenwebToken) {
      try {
        const url = new URL('https://api.greenweb.com.bd/api.php');
        url.searchParams.set('token', greenwebToken);
        url.searchParams.set('to', normalized);
        url.searchParams.set('message', params.message);

        const res = await fetch(url.toString(), { method: 'POST' });
        const text = await res.text();
        const success = text.toLowerCase().includes('ok') || text.toLowerCase().includes('success');

        logger.info('Dispatched SMS via Greenweb', {
          recipient: normalized,
          success,
        });

        return {
          success,
          provider: 'GREENWEB',
          messageId: `gw_${Date.now()}`,
          normalizedRecipient: normalized,
          response: text,
        };
      } catch (err) {
        logger.error('Greenweb SMS dispatch error', { err });
      }
    }

    // 2. Onnorokom SMS Gateway
    if (onnorokomApiKey) {
      try {
        const res = await fetch('https://api2.onnorokomsms.com/HttpSendSms.ashx', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            apiKey: onnorokomApiKey,
            messageText: params.message,
            numberList: normalized,
            smsType: 'TEXT',
            maskName: '',
            campaignName: 'SAAS_BI',
          }).toString(),
        });
        const text = await res.text();
        const success = text.includes('1900'); // Onnorokom success status code

        logger.info('Dispatched SMS via Onnorokom', {
          recipient: normalized,
          success,
        });

        return {
          success,
          provider: 'ONNOROKOM',
          messageId: `onno_${Date.now()}`,
          normalizedRecipient: normalized,
          response: text,
        };
      } catch (err) {
        logger.error('Onnorokom SMS dispatch error', { err });
      }
    }

    // 3. Development / Test Mock
    logger.info('Simulated SMS dispatch in development/test environment', {
      recipient: normalized,
      message: params.message,
      tenantId: params.tenantId,
    });

    return {
      success: true,
      provider: 'MOCK',
      messageId: `mock_sms_${Date.now()}`,
      normalizedRecipient: normalized,
    };
  }
}

export const smsService = new SmsService();
