import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as checkoutHandler } from '../../src/app/api/billing/checkout/route';
import { POST as ipnHandler } from '../../src/app/api/billing/ipn/route';
import { billingRepository } from '../../src/modules/billing/billing.repository';
import { billingService } from '../../src/modules/billing/billing.service';
import { ErrorTracker } from '../../src/lib/error-tracker';
import { logger } from '../../src/lib/logger';
import { prisma } from '../../src/lib/prisma';
import { PlanTier } from '@prisma/client';

describe('Billing Checkout & IPN Routes', () => {
  it('rejects checkout request for free tier with 400 Bad Request', async () => {
    const req = new NextRequest('http://localhost:3000/api/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ planTier: PlanTier.FREE }),
    });

    const res = await checkoutHandler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Cannot checkout for free tier');
  });

  it('rejects invalid plan input with 400 Bad Request', async () => {
    const req = new NextRequest('http://localhost:3000/api/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ planTier: 'INVALID_TIER' }),
    });

    const res = await checkoutHandler(req);
    expect(res.status).toBe(400);
  });

  it('processes valid SSLCommerz IPN payload and triggers subscription upgrade', async () => {
    const updateSpy = vi.spyOn(billingRepository, 'updateSubscription').mockResolvedValue({} as any);
    const tenantSpy = vi.spyOn(prisma.tenant, 'findFirst').mockResolvedValue({ id: 'tenant-123' } as any);
    const eventSpy = vi.spyOn(prisma.webhookEvent, 'create').mockResolvedValue({} as any);
    const valSpy = vi.spyOn(billingService, 'validateSslCommerzTransaction').mockResolvedValue({ isValid: true, status: 'VALID' });

    const formData = new FormData();
    formData.append('tran_id', 'SSL_SESSION_123_456');
    formData.append('val_id', 'VAL_999');
    formData.append('amount', '6500.00');
    formData.append('status', 'VALID');
    formData.append('currency', 'BDT');

    const req = new NextRequest('http://localhost:3000/api/billing/ipn', {
      method: 'POST',
      body: formData,
    });

    const res = await ipnHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('PROCESSED');

    expect(updateSpy).toHaveBeenCalled();
    updateSpy.mockRestore();
    tenantSpy.mockRestore();
    eventSpy.mockRestore();
    valSpy.mockRestore();
  });

  it('captures structured exceptions via ErrorTracker without throwing', () => {
    const logSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

    ErrorTracker.captureException(new Error('Simulated database timeout'), {
      tenantId: '00000000-0000-0000-0000-000000000001',
      source: 'test-suite',
    });

    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
