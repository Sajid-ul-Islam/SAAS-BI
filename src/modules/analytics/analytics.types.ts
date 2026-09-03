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
  totalCodCollectedBDT: number;
  pendingCodBDT: number;
}

export interface CourierPerformanceMetric {
  courier: string;
  totalOrders: number;
  deliveredCount: number;
  returnedCount: number;
  deliveryRatePercentage: number;
  returnRatePercentage: number;
}

export interface DistrictDeliveryMetric {
  district: string;
  orderCount: number;
  totalRevenueBDT: number;
  returnCount: number;
  returnRatePercentage: number;
}
