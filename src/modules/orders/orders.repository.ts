import { prisma } from '@/lib/prisma';
import {
  OrderFilterParams,
  PaginatedOrdersResult,
  CreateOrderInput,
  OrderWithHistory,
} from './orders.types';
import { NormalizedOrderStatus, Order, Prisma } from '@prisma/client';

export class OrdersRepository {
  async findPaginated(
    tenantId: string,
    params: OrderFilterParams
  ): Promise<PaginatedOrdersResult> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      tenantId,
    };

    if (params.status) {
      where.normalizedStatus = params.status;
    }

    if (params.district) {
      where.customerDistrict = { contains: params.district, mode: 'insensitive' };
    }

    if (params.search) {
      where.OR = [
        { orderNumber: { contains: params.search, mode: 'insensitive' } },
        { customerName: { contains: params.search, mode: 'insensitive' } },
        { customerPhone: { contains: params.search } },
        { trackingCode: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.startDate || params.endDate) {
      where.orderedAt = {};
      if (params.startDate) where.orderedAt.gte = params.startDate;
      if (params.endDate) where.orderedAt.lte = params.endDate;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { orderedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(tenantId: string, orderId: string): Promise<OrderWithHistory | null> {
    return prisma.order.findFirst({
      where: {
        id: orderId,
        tenantId,
      },
      include: {
        statusHistory: {
          orderBy: { changedAt: 'asc' },
        },
      },
    });
  }

  async findByTrackingCode(tenantId: string, trackingCode: string): Promise<Order | null> {
    return prisma.order.findFirst({
      where: {
        tenantId,
        trackingCode,
      },
    });
  }

  async upsertOrder(input: CreateOrderInput): Promise<Order> {
    return prisma.order.upsert({
      where: {
        tenantId_storeId_externalOrderId: {
          tenantId: input.tenantId,
          storeId: input.storeId,
          externalOrderId: input.externalOrderId,
        },
      },
      update: {
        totalAmount: new Prisma.Decimal(input.totalAmount),
        deliveryFee: new Prisma.Decimal(input.deliveryFee ?? 0),
        codAmount: new Prisma.Decimal(input.codAmount ?? 0),
        normalizedStatus: input.normalizedStatus,
        rawCourierStatus: input.rawCourierStatus,
        trackingCode: input.trackingCode,
        paymentStatus: input.paymentStatus ?? 'unpaid',
      },
      create: {
        tenantId: input.tenantId,
        storeId: input.storeId,
        courierId: input.courierId,
        externalOrderId: input.externalOrderId,
        orderNumber: input.orderNumber,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerAddress: input.customerAddress,
        customerCity: input.customerCity,
        customerDistrict: input.customerDistrict,
        totalAmount: new Prisma.Decimal(input.totalAmount),
        deliveryFee: new Prisma.Decimal(input.deliveryFee ?? 0),
        codAmount: new Prisma.Decimal(input.codAmount ?? 0),
        currency: input.currency ?? 'BDT',
        normalizedStatus: input.normalizedStatus ?? NormalizedOrderStatus.processing,
        rawCourierStatus: input.rawCourierStatus,
        trackingCode: input.trackingCode,
        paymentStatus: input.paymentStatus ?? 'unpaid',
        orderedAt: input.orderedAt,
        rawPayload: input.rawPayload as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async recordStatusChange(
    tenantId: string,
    orderId: string,
    previousStatus: NormalizedOrderStatus | null,
    newStatus: NormalizedOrderStatus,
    rawCourierStatus?: string,
    source = 'system',
    note?: string
  ) {
    return prisma.$transaction([
      prisma.order.update({
        where: { id: orderId, tenantId },
        data: {
          normalizedStatus: newStatus,
          rawCourierStatus,
        },
      }),
      prisma.orderStatusHistory.create({
        data: {
          tenantId,
          orderId,
          previousStatus,
          newStatus,
          rawCourierStatus,
          source,
          note,
        },
      }),
    ]);
  }
}

export const ordersRepository = new OrdersRepository();
