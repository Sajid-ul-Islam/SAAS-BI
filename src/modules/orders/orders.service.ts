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
    return ordersRepository.findPaginated(tenantId, params);
  }

  async getOrderDetails(tenantId: string, orderId: string): Promise<OrderWithHistory | null> {
    return ordersRepository.findById(tenantId, orderId);
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
