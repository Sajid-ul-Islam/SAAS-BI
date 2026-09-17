import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { wooCommerceConnector } from '../../src/modules/integrations/stores/woocommerce.connector';
import { shopifyConnector } from '../../src/modules/integrations/stores/shopify.connector';
import { reconciliationService } from '../../src/modules/analytics/reconciliation.service';
import { billingService } from '../../src/modules/billing/billing.service';
import { prisma } from '../../src/lib/prisma';

describe('Backend Gap Closure Unit Tests', () => {
  let fetchSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  describe('GAP-01: Two-Way Courier Status Writeback', () => {
    it('WooCommerceConnector.updateOrderTracking posts note and updates meta_data', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 101 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 456 }),
        });

      const creds = { consumerKey: 'ck_test', consumerSecret: 'cs_test' };
      const res = await wooCommerceConnector.updateOrderTracking(
        'https://shop.dhakafashion.com',
        creds,
        '456',
        'PTH-12345',
        'PATHAO'
      );

      expect(res.success).toBe(true);
      expect(res.noteId).toBe(101);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('ShopifyConnector.fulfillOrderWithTracking creates fulfillment with tracking', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ fulfillment: { id: 7890 } }),
      });

      const res = await shopifyConnector.fulfillOrderWithTracking(
        'dhaka-store.myshopify.com',
        'shpat_test_token',
        '12345678',
        'STEAD-9988',
        'Steadfast Courier'
      );

      expect(res.success).toBe(true);
      expect(res.fulfillmentId).toBe(7890);
    });
  });

  describe('GAP-04: COD Statement & Disbursement Reconciliation', () => {
    it('reconciles courier statement with matched orders and flags zero discrepancy when balanced', async () => {
      vi.spyOn(prisma.order, 'findMany').mockResolvedValue([
        {
          id: 'ord-1',
          orderNumber: '#DF-1001',
          trackingCode: 'PTH-001',
          totalAmount: 1500,
          codAmount: 1500,
          paymentStatus: 'paid',
          normalizedStatus: 'delivered',
        } as any,
      ]);

      const statementRows = [
        {
          trackingCode: 'PTH-001',
          orderNumber: '#DF-1001',
          collectedCodAmount: 1500,
          deliveryCharge: 60,
          codFee: 15,
          returnCharge: 0,
          netDisbursed: 1425, // 1500 - 60 - 15 = 1425
        },
      ];

      const report = await reconciliationService.reconcileCourierStatement('tenant-1', statementRows);

      expect(report.summary.status).toBe('BALANCED');
      expect(report.summary.matchedOrders).toBe(1);
      expect(report.summary.unmatchedOrders).toBe(0);
      expect(report.summary.netVarianceBDT).toBe(0);
      expect(report.discrepancies).toHaveLength(0);
    });

    it('detects payout variance when courier disbursed amount is less than expected', async () => {
      vi.spyOn(prisma.order, 'findMany').mockResolvedValue([
        {
          id: 'ord-2',
          orderNumber: '#DF-1002',
          trackingCode: 'PTH-002',
          totalAmount: 2000,
          codAmount: 2000,
          paymentStatus: 'paid',
          normalizedStatus: 'delivered',
        } as any,
      ]);

      const statementRows = [
        {
          trackingCode: 'PTH-002',
          orderNumber: '#DF-1002',
          collectedCodAmount: 2000,
          deliveryCharge: 60,
          codFee: 20,
          returnCharge: 0,
          netDisbursed: 1800, // Expected: 2000 - 60 - 20 = 1920. Disbursed: 1800 (120 variance)
        },
      ];

      const report = await reconciliationService.reconcileCourierStatement('tenant-1', statementRows);

      expect(report.summary.status).toBe('DISCREPANCY_DETECTED');
      expect(report.discrepancies).toHaveLength(1);
      expect(report.discrepancies[0]?.variance).toBe(120);
    });
  });

  describe('GAP-05: SSLCommerz Server Validation', () => {
    it('queries SSLCommerz validation API and returns parsed response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'VALID',
          tran_id: 'TRAN_998877',
          amount: '2500.00',
          currency: 'BDT',
          risk_level: '0',
        }),
      });

      const validation = await billingService.validateSslCommerzTransaction('VAL_123456');

      expect(validation.isValid).toBe(true);
      expect(validation.amount).toBe(2500);
      expect(validation.tranId).toBe('TRAN_998877');
    });
  });

  describe('GAP-11: Transactional Email Dispatcher', () => {
    it('sends team invite and payment receipt emails without throwing', async () => {
      const { emailDispatcher } = await import('../../src/lib/email');

      const inviteRes = await emailDispatcher.sendTeamInviteEmail({
        to: 'member@dhakafashion.com',
        inviterName: 'Rahim Chowdhury',
        tenantName: 'Dhaka Fashion Hub',
        role: 'ADMIN',
        inviteUrl: 'http://localhost:3000/invite?token=abc',
      });

      expect(inviteRes.success).toBe(true);
      expect(inviteRes.messageId).toContain('msg_');

      const receiptRes = await emailDispatcher.sendPaymentReceiptEmail({
        to: 'merchant@dhakafashion.com',
        tenantName: 'Dhaka Fashion Hub',
        amountBDT: 2500,
        planTier: 'PRO',
        tranId: 'TRAN_998877',
      });

      expect(receiptRes.success).toBe(true);
    });
  });

  describe('GAP-12: Role-Based Access Control (RBAC)', () => {
    it('allows OWNER and ADMIN to access admin resources, but denies MEMBER', async () => {
      const { assertRole, InsufficientRoleError } = await import('../../src/modules/tenants');
      const { TenantRole } = await import('@prisma/client');

      // OWNER has highest privilege
      expect(() => assertRole(TenantRole.OWNER, TenantRole.ADMIN)).not.toThrow();
      expect(() => assertRole(TenantRole.OWNER, TenantRole.MEMBER)).not.toThrow();

      // ADMIN can access ADMIN and MEMBER
      expect(() => assertRole(TenantRole.ADMIN, TenantRole.ADMIN)).not.toThrow();
      expect(() => assertRole(TenantRole.ADMIN, TenantRole.MEMBER)).not.toThrow();

      // MEMBER cannot access ADMIN or OWNER operations
      expect(() => assertRole(TenantRole.MEMBER, TenantRole.ADMIN)).toThrow(InsufficientRoleError);
      expect(() => assertRole(TenantRole.MEMBER, TenantRole.OWNER)).toThrow(InsufficientRoleError);
    });
  });
});

