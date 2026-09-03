import crypto from 'node:crypto';
import { NormalizedOrderStatus } from '@prisma/client';
import { mapRedxStatus } from './status-normalizer';
import { logger } from '@/lib/logger';

export interface RedxWebhookPayload {
  tracking_id: string;
  status: string;
  customer_phone?: string;
  timestamp?: string;
}

export class RedxConnector {
  mapStatus(raw: string): NormalizedOrderStatus {
    return mapRedxStatus(raw);
  }

  verifyWebhookSignature(signature: string | null, rawBody: string, secret: string): boolean {
    if (!signature || !secret) return false;
    try {
      const hmac = crypto.createHmac('sha256', secret);
      const computed = hmac.update(rawBody).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
    } catch (e) {
      logger.error('RedX signature verification error', e);
      return false;
    }
  }
}

export const redxConnector = new RedxConnector();
