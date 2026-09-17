import {
  CourierProvider,
  NormalizedOrderStatus,
  Order,
  OrderStatusHistory,
  StorePlatform,
} from '@prisma/client';

export { NormalizedOrderStatus, CourierProvider };

export interface OrderFilterParams {
  status?: NormalizedOrderStatus | 'ALL' | string;
  courier?: CourierProvider | string;
  search?: string;
  district?: string;
  startDate?: Date;
  endDate?: Date;
  timeframe?: '7d' | '30d' | '90d' | 'all';
  page?: number;
  limit?: number;
}

export interface OrderWithRelations extends Order {
  store?: {
    id: string;
    name: string;
    platform: StorePlatform;
  } | null;
  courierCredential?: {
    id: string;
    courier: CourierProvider;
  } | null;
  statusHistory?: OrderStatusHistory[];
}

export interface PaginatedOrdersResult {
  orders: OrderWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrderWithHistory extends OrderWithRelations {
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

export const BANGLADESH_DISTRICTS = [
  'Dhaka',
  'Gazipur',
  'Narayanganj',
  'Tangail',
  'Narsingdi',
  'Manikganj',
  'Munshiganj',
  'Faridpur',
  'Gopalganj',
  'Madaripur',
  'Rajbari',
  'Shariatpur',
  'Kishoreganj',
  'Chittagong',
  'Cox\'s Bazar',
  'Comilla',
  'Feni',
  'Brahmanbaria',
  'Noakhali',
  'Chandpur',
  'Lakshmipur',
  'Rangamati',
  'Khagrachhari',
  'Bandarban',
  'Sylhet',
  'Moulvibazar',
  'Habiganj',
  'Sunamganj',
  'Rajshahi',
  'Bogra',
  'Pabna',
  'Sirajganj',
  'Naogaon',
  'Natore',
  'Chapainawabganj',
  'Joypurhat',
  'Khulna',
  'Jessore',
  'Kushtia',
  'Jhenaidah',
  'Satkhira',
  'Bagerhat',
  'Chuadanga',
  'Meherpur',
  'Magura',
  'Narail',
  'Barisal',
  'Patuakhali',
  'Bhola',
  'Pirojpur',
  'Barguna',
  'Jhalokati',
  'Rangpur',
  'Dinajpur',
  'Gaibandha',
  'Kurigram',
  'Lalmonirhat',
  'Nilphamari',
  'Panchagarh',
  'Thakurgaon',
  'Mymensingh',
  'Jamalpur',
  'Netrokona',
  'Sherpur',
] as const;
