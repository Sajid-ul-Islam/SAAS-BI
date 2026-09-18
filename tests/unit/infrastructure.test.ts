import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cacheService } from '../../src/lib/cache';
import { smsService, normalizeBangladeshiPhone } from '../../src/lib/sms';
import {
  emailService,
  renderTeamInviteHtml,
  renderPaymentReceiptHtml,
  renderAnomalyAlertHtml,
} from '../../src/lib/email';
import { GET } from '../../src/app/api/health/route';
import { prisma } from '../../src/lib/prisma';

describe('INFRA-701: Distributed Cache Service', () => {
  beforeEach(async () => {
    await cacheService.clear();
  });

  it('sets and retrieves values from in-memory cache', async () => {
    await cacheService.set('test_key', { hello: 'world' }, 60);
    const cached = await cacheService.get<{ hello: string }>('test_key');
    expect(cached).toEqual({ hello: 'world' });
  });

  it('returns null for missing or expired keys', async () => {
    const missing = await cacheService.get('non_existent_key');
    expect(missing).toBeNull();

    // Test expiration with 0 TTL (already expired)
    await cacheService.set('expiring_key', 'value', 0);
    const expired = await cacheService.get('expiring_key');
    expect(expired).toBeNull();
  });

  it('deletes keys and clears entire cache', async () => {
    await cacheService.set('key_a', 123, 60);
    await cacheService.set('key_b', 456, 60);

    await cacheService.delete('key_a');
    expect(await cacheService.get('key_a')).toBeNull();
    expect(await cacheService.get('key_b')).toBe(456);

    await cacheService.clear();
    expect(await cacheService.get('key_b')).toBeNull();
  });
});

describe('INFRA-702: Bangladeshi SMS Gateway Client', () => {
  it('normalizes local 11-digit numbers to standard 880 format', () => {
    expect(normalizeBangladeshiPhone('01711223344')).toBe('8801711223344');
    expect(normalizeBangladeshiPhone('+8801812345678')).toBe('8801812345678');
    expect(normalizeBangladeshiPhone('8801912345678')).toBe('8801912345678');
    expect(normalizeBangladeshiPhone('01300000000')).toBe('8801300000000');
  });

  it('returns null on invalid Bangladeshi telephone numbers', () => {
    expect(normalizeBangladeshiPhone('12345')).toBeNull();
    expect(normalizeBangladeshiPhone('01211223344')).toBeNull(); // 012 is not a valid BD telecom operator prefix
  });

  it('dispatches mock SMS when no API keys are provided', async () => {
    const res = await smsService.sendSms({
      recipient: '01711223344',
      message: 'Test verification message',
      tenantId: '11111111-1111-1111-1111-111111111111',
    });

    expect(res.success).toBe(true);
    expect(res.provider).toBe('MOCK');
    expect(res.messageId).toContain('sms_');
  });
});

describe('INFRA-703: Production HTML Email Templates', () => {
  it('renders a responsive HTML team invite email', () => {
    const html = renderTeamInviteHtml({
      inviterName: 'Rahim Chowdhury',
      tenantName: 'Dhaka Styles Ltd',
      role: 'ADMIN',
      inviteUrl: 'https://saas-bi.com.bd/invite?token=secret123',
    });

    expect(html).toContain('Rahim Chowdhury');
    expect(html).toContain('Dhaka Styles Ltd');
    expect(html).toContain('ADMIN');
    expect(html).toContain('https://saas-bi.com.bd/invite?token=secret123');
    expect(html).toContain('Accept Invitation');
  });

  it('renders a professional SSLCommerz BDT payment receipt email', () => {
    const html = renderPaymentReceiptHtml({
      tenantName: 'Aarong Crafts',
      amountBDT: 4999,
      planTier: 'ENTERPRISE',
      tranId: 'SSL_TXN_998877',
      date: 'Sep 17, 2026',
    });

    expect(html).toContain('Aarong Crafts');
    expect(html).toContain('4,999');
    expect(html).toContain('ENTERPRISE');
    expect(html).toContain('SSL_TXN_998877');
    expect(html).toContain('Payment Received');
  });

  it('renders a high-priority logistics anomaly alert email', () => {
    const html = renderAnomalyAlertHtml({
      tenantName: 'Dhaka Styles Ltd',
      title: 'Sudden Return Surge in Chittagong',
      message: 'Return rate for Pathao courier surged to 42% over the last 24 hours.',
      severity: 'critical',
      details: {
        district: 'Chittagong',
        carrier: 'Pathao',
        currentRate: '42%',
        baselineRate: '12%',
      },
    });

    expect(html).toContain('Sudden Return Surge in Chittagong');
    expect(html).toContain('Pathao');
    expect(html).toContain('42%');
    expect(html).toContain('CRITICAL');
  });

  it('dispatches emails via emailService cleanly', async () => {
    const res = await emailService.sendAnomalyAlertEmail({
      to: 'ops@dhakastyles.com',
      tenantName: 'Dhaka Styles Ltd',
      title: 'COD Settlement Delay',
      message: 'Steadfast COD disbursement is delayed by 48 hours.',
      severity: 'warning',
    });

    expect(res.success).toBe(true);
    expect(res.messageId).toContain('msg_');
  });
});

describe('INFRA-704: Diagnostic Healthcheck Route', () => {
  it('returns HTTP 200 with healthy diagnostic telemetry when DB is connected', async () => {
    vi.spyOn(prisma, '$queryRaw').mockResolvedValueOnce([{ alive: 1 }]);

    const response = await GET();
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.status).toBe('healthy');
    expect(json.services.database.status).toBe('connected');
    expect(json.services.cache.operational).toBe(true);
    expect(json.system.memory.heapUsedMb).toBeGreaterThan(0);
    expect(json.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it('returns HTTP 503 degraded status when DB connection fails', async () => {
    vi.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('Connection timeout to postgres'));

    const response = await GET();
    expect(response.status).toBe(503);

    const json = await response.json();
    expect(json.status).toBe('degraded');
    expect(json.services.database.status).toBe('disconnected');
    expect(json.services.database.error).toContain('Connection timeout to postgres');
  });
});
