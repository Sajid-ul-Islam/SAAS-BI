import { NormalizedOrderStatus, Order, OrderStatusHistory } from '@prisma/client';

export { NormalizedOrderStatus };

export interface OrderFilterParams {
  status?: NormalizedOrderStatus;
  courier?: string;
  search?: string;
  district?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface PaginatedOrdersResult {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrderWithHistory extends Order {
  statusHistory: OrderStatusHistory[];
}

export interface CreateOrderInput {
  tenantId: string;
  storeId: string;
  externalOrderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerDistrict: string;
  totalAmount: number;
  deliveryFee?: number;
  codAmount?: number;
  currency?: string;
  normalizedStatus?: NormalizedOrderStatus;
  rawCourierStatus?: string;
  trackingCode?: string;
  courierId?: string;
  paymentStatus?: string;
  orderedAt: Date;
  rawPayload?: Record<string, unknown>;
}
