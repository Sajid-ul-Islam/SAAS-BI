import crypto from 'node:crypto';
import { NormalizedOrderStatus } from '@prisma/client';
import { mapPathaoStatus } from './status-normalizer';
import { logger } from '@/lib/logger';

export interface PathaoWebhookPayload {
  consignment_id: string;
  order_status: string;
  merchant_order_id?: string;
  updated_at?: string;
}

export class PathaoConnector {
  mapStatus(raw: string): NormalizedOrderStatus {
    return mapPathaoStatus(raw);
  }

  verifyWebhookSignature(signature: string | null, rawBody: string, secret: string): boolean {
    if (!signature || !secret) return false;
    try {
      const hmac = crypto.createHmac('sha256', secret);
      const computed = hmac.update(rawBody).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
    } catch (e) {
      logger.error('Pathao signature verification error', e);
      return false;
    }
  }
}

export const pathaoConnector = new PathaoConnector();
