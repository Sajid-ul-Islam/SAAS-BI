import { prisma } from '@/lib/prisma';
import {
  OrderFilterParams,
  PaginatedOrdersResult,
  CreateOrderInput,
  OrderWithHistory,
} from './orders.types';
import { CourierProvider, NormalizedOrderStatus, Order, Prisma } from '@prisma/client';

export class OrdersRepository {
  async findPaginated(
    tenantId: string,
    params: OrderFilterParams
  ): Promise<PaginatedOrdersResult> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(Math.max(1, params.limit ?? 20), 100);
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      tenantId,
    };

    if (
      params.status &&
      params.status !== 'ALL' &&
      Object.values(NormalizedOrderStatus).includes(params.status as NormalizedOrderStatus)
    ) {
      where.normalizedStatus = params.status as NormalizedOrderStatus;
    }

    if (params.courier && params.courier !== 'ALL') {
      const courierUpper = params.courier.toUpperCase();
      if (courierUpper in CourierProvider) {
        where.courierCredential = {
          courier: courierUpper as CourierProvider,
        };
      }
    }

    if (params.district && params.district !== 'ALL') {
      where.customerDistrict = { contains: params.district, mode: 'insensitive' };
    }

    if (params.search && params.search.trim()) {
      const searchTerm = params.search.trim();
      where.OR = [
        { orderNumber: { contains: searchTerm, mode: 'insensitive' } },
        { customerName: { contains: searchTerm, mode: 'insensitive' } },
        { customerPhone: { contains: searchTerm } },
        { trackingCode: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const now = new Date();
    if (params.timeframe && params.timeframe !== 'all') {
      let days = 30;
      if (params.timeframe === '7d') days = 7;
      if (params.timeframe === '90d') days = 90;
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      where.orderedAt = { gte: startDate };
    } else if (params.startDate || params.endDate) {
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
        include: {
          store: {
            select: { id: true, name: true, platform: true },
          },
          courierCredential: {
            select: { id: true, courier: true },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(tenantId: string, orderId: string): Promise<OrderWithHistory | null> {
    return prisma.order.findFirst({
      where: {
        id: orderId,
        tenantId,
      },
      include: {
        store: {
          select: { id: true, name: true, platform: true },
        },
        courierCredential: {
          select: { id: true, courier: true },
        },
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
