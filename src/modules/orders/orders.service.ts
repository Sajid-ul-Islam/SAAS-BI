import { ordersRepository } from './orders.repository';
import {
  OrderFilterParams,
  PaginatedOrdersResult,
  CreateOrderInput,
  OrderWithHistory,
} from './orders.types';
import { NormalizedOrderStatus, Order } from '@prisma/client';
import { logger } from '@/lib/logger';

export class OrdersService {
  async getOrders(tenantId: string, params: OrderFilterParams): Promise<PaginatedOrdersResult> {
    try {
      return await ordersRepository.findPaginated(tenantId, params);
    } catch (err) {
      logger.warn('Failed to fetch orders from database (database offline), serving demo fallback', { tenantId, err });
      const { queryDemoOrders } = await import('@/lib/demo-data');
      return queryDemoOrders(params);
    }
  }

  async getOrderDetails(tenantId: string, orderId: string): Promise<OrderWithHistory | null> {
    try {
      const res = await ordersRepository.findById(tenantId, orderId);
      if (!res && orderId.startsWith('order_demo_')) {
        const { getDemoOrderDetails } = await import('@/lib/demo-data');
        return getDemoOrderDetails(orderId);
      }
      return res;
    } catch (err) {
      logger.warn('Failed to fetch order details from database, serving demo fallback', { tenantId, orderId, err });
      const { getDemoOrderDetails } = await import('@/lib/demo-data');
      return getDemoOrderDetails(orderId);
    }
  }

  async processIncomingOrder(input: CreateOrderInput): Promise<Order> {
    logger.info('Processing incoming store order', {
      tenantId: input.tenantId,
      orderNumber: input.orderNumber,
      externalOrderId: input.externalOrderId,
    });

    return ordersRepository.upsertOrder(input);
  }

  async updateCourierStatus(
    tenantId: string,
    orderId: string,
    newStatus: NormalizedOrderStatus,
    rawCourierStatus?: string,
    source = 'courier_webhook',
    note?: string
  ): Promise<void> {
    const existing = await ordersRepository.findById(tenantId, orderId);
    if (!existing) {
      logger.warn('Attempted to update status on nonexistent order', { tenantId, orderId });
      return;
    }

    if (existing.normalizedStatus === newStatus && existing.rawCourierStatus === rawCourierStatus) {
      // Idempotent: No state transition occurred
      return;
    }

    logger.info('Order transition recorded', {
      tenantId,
      orderId,
      from: existing.normalizedStatus,
      to: newStatus,
      rawCourierStatus,
    });

    await ordersRepository.recordStatusChange(
      tenantId,
      orderId,
      existing.normalizedStatus,
      newStatus,
      rawCourierStatus,
      source,
      note
    );
  }
}

export const ordersService = new OrdersService();
