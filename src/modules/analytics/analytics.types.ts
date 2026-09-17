export type AnalyticsTimeframeOption = '7d' | '30d' | '90d' | '1y' | 'all';

export interface AnalyticsTimeframe {
  startDate: Date;
  endDate: Date;
}

export interface KpiMetrics {
  totalRevenueBDT: number;
  totalOrders: number;
  deliveredOrders: number;
  returnedOrders: number;
  cancelledOrders: number;
  averageOrderValueBDT: number;
  deliverySuccessRatePercentage: number;
  returnRatePercentage: number;
  codConversionRatePercentage: number;
  totalCodCollectedBDT: number;
  pendingCodBDT: number;
  revenueGrowthPercentage?: number;
}

export interface CourierPerformanceMetric {
  courier: string;
  totalOrders: number;
  deliveredCount: number;
  returnedCount: number;
  deliveryRatePercentage: number;
  returnRatePercentage: number;
}

export interface DailySalesMetric {
  date: string;
  formattedDate: string;
  revenueBDT: number;
  orderCount: number;
  deliveredCount: number;
}

export interface RegionalDistributionMetric {
  region: string;
  orderCount: number;
  revenueBDT: number;
  percentage: number;
}

export interface DistrictDeliveryMetric {
  district: string;
  orderCount: number;
  totalRevenueBDT: number;
  returnCount: number;
  returnRatePercentage: number;
}
