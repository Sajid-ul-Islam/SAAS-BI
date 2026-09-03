import crypto from 'node:crypto';
import { NormalizedOrderStatus } from '@prisma/client';
import { mapSteadfastStatus } from './status-normalizer';
import { logger } from '@/lib/logger';

export interface SteadfastWebhookPayload {
  consignment_id: number | string;
  invoice: string;
  status: string;
  cod_amount?: number;
  updated_at?: string;
}

export class SteadfastConnector {
  mapStatus(raw: string): NormalizedOrderStatus {
    return mapSteadfastStatus(raw);
  }

  verifyWebhookSignature(signature: string | null, rawBody: string, secret: string): boolean {
    if (!signature || !secret) return false;
    try {
      const hmac = crypto.createHmac('sha256', secret);
      const computed = hmac.update(rawBody).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
    } catch (e) {
      logger.error('Steadfast signature verification error', e);
      return false;
    }
  }
}

export const steadfastConnector = new SteadfastConnector();
