import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface StatementRowInput {
  trackingCode: string;
  orderNumber?: string;
  collectedCodAmount: number;
  deliveryCharge: number;
  codFee: number;
  returnCharge?: number;
  netDisbursed: number;
}

export interface DiscrepancyItem {
  trackingCode: string;
  orderNumber: string;
  expectedCod: number;
  reportedCod: number;
  variance: number;
  reason: string;
}

export interface ReconciliationReport {
  tenantId: string;
  reconciledAt: string;
  summary: {
    totalOrdersChecked: number;
    matchedOrders: number;
    unmatchedOrders: number;
    expectedCodTotalBDT: number;
    courierDisbursedTotalBDT: number;
    totalDeliveryChargesBDT: number;
    totalCodFeesBDT: number;
    totalReturnChargesBDT: number;
    netVarianceBDT: number;
    status: 'BALANCED' | 'DISCREPANCY_DETECTED';
  };
  discrepancies: DiscrepancyItem[];
}

export class ReconciliationService {
  /**
   * Reconciles courier settlement statements against database orders for a tenant.
   */
  async reconcileCourierStatement(
    tenantId: string,
    rows: StatementRowInput[]
  ): Promise<ReconciliationReport> {
    const trackingCodes = rows.map((r) => r.trackingCode).filter(Boolean);

    // Fetch matching orders from DB
    const existingOrders = await prisma.order.findMany({
      where: {
        tenantId,
        trackingCode: { in: trackingCodes },
      },
      select: {
        id: true,
        orderNumber: true,
        trackingCode: true,
        totalAmount: true,
        codAmount: true,
        paymentStatus: true,
        normalizedStatus: true,
      },
    });

    const orderMap = new Map(existingOrders.map((o) => [o.trackingCode, o]));

    let expectedCodTotal = 0;
    let courierDisbursedTotal = 0;
    let totalDeliveryCharges = 0;
    let totalCodFees = 0;
    let totalReturnCharges = 0;
    let matchedCount = 0;
    let unmatchedCount = 0;

    const discrepancies: DiscrepancyItem[] = [];

    for (const row of rows) {
      courierDisbursedTotal += row.netDisbursed;
      totalDeliveryCharges += row.deliveryCharge;
      totalCodFees += row.codFee;
      totalReturnCharges += row.returnCharge ?? 0;

      const dbOrder = orderMap.get(row.trackingCode);

      if (!dbOrder) {
        unmatchedCount++;
        discrepancies.push({
          trackingCode: row.trackingCode,
          orderNumber: row.orderNumber || 'UNKNOWN',
          expectedCod: 0,
          reportedCod: row.collectedCodAmount,
          variance: -row.collectedCodAmount,
          reason: 'Order tracking code not found in merchant database',
        });
        continue;
      }

      matchedCount++;
      const expectedAmount = Number(dbOrder.codAmount || dbOrder.totalAmount);
      expectedCodTotal += expectedAmount;

      const expectedNetAfterFees = expectedAmount - row.deliveryCharge - row.codFee - (row.returnCharge ?? 0);
      const variance = expectedNetAfterFees - row.netDisbursed;

      if (Math.abs(variance) > 1.0) {
        discrepancies.push({
          trackingCode: row.trackingCode,
          orderNumber: dbOrder.orderNumber,
          expectedCod: expectedAmount,
          reportedCod: row.collectedCodAmount,
          variance,
          reason: `Net payout variance of ৳${variance.toFixed(2)} detected`,
        });
      }
    }

    const netVariance = (expectedCodTotal - totalDeliveryCharges - totalCodFees - totalReturnCharges) - courierDisbursedTotal;

    const report: ReconciliationReport = {
      tenantId,
      reconciledAt: new Date().toISOString(),
      summary: {
        totalOrdersChecked: rows.length,
        matchedOrders: matchedCount,
        unmatchedOrders: unmatchedCount,
        expectedCodTotalBDT: Math.round(expectedCodTotal),
        courierDisbursedTotalBDT: Math.round(courierDisbursedTotal),
        totalDeliveryChargesBDT: Math.round(totalDeliveryCharges),
        totalCodFeesBDT: Math.round(totalCodFees),
        totalReturnChargesBDT: Math.round(totalReturnCharges),
        netVarianceBDT: Math.round(netVariance),
        status: discrepancies.length === 0 ? 'BALANCED' : 'DISCREPANCY_DETECTED',
      },
      discrepancies,
    };

    logger.info('Courier COD statement reconciliation completed', {
      tenantId,
      status: report.summary.status,
      discrepanciesCount: discrepancies.length,
      netVariance,
    });

    return report;
  }
}

export const reconciliationService = new ReconciliationService();
