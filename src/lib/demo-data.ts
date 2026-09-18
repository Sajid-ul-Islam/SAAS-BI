import {
  CourierProvider,
  NormalizedOrderStatus,
  StorePlatform,
  Prisma,
} from '@prisma/client';
import {
  OrderFilterParams,
  OrderWithHistory,
  PaginatedOrdersResult,
} from '@/modules/orders/orders.types';
import {
  CourierPerformanceMetric,
  DailySalesMetric,
  KpiMetrics,
  RegionalDistributionMetric,
} from '@/modules/analytics/analytics.types';
import {
  AiAnomaly,
  AiSalesForecast,
  AiUsageStatus,
} from '@/modules/ai/ai.types';
import { SubscriptionInfo, SubscriptionStatus, PlanTier } from '@/modules/billing/billing.types';
import { StoreSummary, CourierCredentialSummary } from '@/modules/integrations/integrations.types';

export const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export const DEMO_STORES: StoreSummary[] = [
  {
    id: 'store_demo_woo_001',
    name: 'Dhaka Fashion WooCommerce',
    platform: StorePlatform.WOOCOMMERCE,
    storeUrl: 'https://dhakafashion.com.bd',
    syncStatus: 'SUCCESS',
    lastSyncedAt: new Date(Date.now() - 1000 * 60 * 12), // 12 mins ago
  },
  {
    id: 'store_demo_shopify_002',
    name: 'Dhaka Fashion Shopify Flagship',
    platform: StorePlatform.SHOPIFY,
    storeUrl: 'https://dhaka-fashion.myshopify.com',
    syncStatus: 'SUCCESS',
    lastSyncedAt: new Date(Date.now() - 1000 * 60 * 4), // 4 mins ago
  },
];

export const DEMO_COURIERS: CourierCredentialSummary[] = [
  {
    id: 'cred_demo_pathao_001',
    courier: CourierProvider.PATHAO,
    isActive: true,
    hasWebhookSecret: true,
  },
  {
    id: 'cred_demo_steadfast_002',
    courier: CourierProvider.STEADFAST,
    isActive: true,
    hasWebhookSecret: true,
  },
  {
    id: 'cred_demo_redx_003',
    courier: CourierProvider.REDX,
    isActive: true,
    hasWebhookSecret: true,
  },
];

export const DEMO_SUBSCRIPTION_INFO: SubscriptionInfo = {
  tier: PlanTier.PRO,
  status: SubscriptionStatus.ACTIVE,
  monthlyOrderLimit: 2000,
  dailyAiTokenLimit: 250000,
  currentPeriodEnd: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000), // 26 days left
};

export const DEMO_AI_USAGE: AiUsageStatus = {
  tenantId: DEMO_TENANT_ID,
  dailyTokenLimit: 250000,
  tokensUsedToday: 18450,
  remainingTokens: 231550,
  isLimitReached: false,
  queryCountToday: 24,
  cacheHitRatePercentage: 42,
};

export const DEMO_AI_ANOMALIES: AiAnomaly[] = [
  {
    id: 'anom_01',
    type: 'RTO_SPIKE',
    severity: 'HIGH',
    title: 'Surge in Chittagong Returns (Steadfast)',
    description: 'Chittagong return rate rose to 18.2% (baseline: 9.1%) over the last 48 hours for fashion apparel shipments.',
    metricValue: '18.2%',
    benchmarkValue: '9.1%',
    recommendedAction: 'Verify recipient phone numbers before dispatching high-value orders to Chittagong.',
    detectedAt: new Date(Date.now() - 1000 * 60 * 90),
  },
  {
    id: 'anom_02',
    type: 'COD_RISK',
    severity: 'MEDIUM',
    title: 'Pending Steadfast COD Remittance',
    description: '৳84,500 in collected Cash on Delivery from Sep 14 batch has exceeded 48h settlement expectation.',
    metricValue: '৳84,500',
    benchmarkValue: '৳30,000 max float',
    recommendedAction: 'Review courier settlement statements and reconcile outstanding remittances.',
    detectedAt: new Date(Date.now() - 1000 * 60 * 240),
  },
];

export const DEMO_AI_FORECAST: AiSalesForecast = {
  tenantId: DEMO_TENANT_ID,
  periodDays: 7,
  projectedTotalRevenueBDT: 385400,
  projectedTotalOrders: 162,
  projectedTotalCodBDT: 327590,
  growthRatePercentage: 14.8,
  days: [
    { date: '2026-09-19', dayName: 'Fri', projectedOrderCount: 28, projectedRevenueBDT: 66500, projectedCodInflowBDT: 56525 },
    { date: '2026-09-20', dayName: 'Sat', projectedOrderCount: 31, projectedRevenueBDT: 74200, projectedCodInflowBDT: 63070 },
    { date: '2026-09-21', dayName: 'Sun', projectedOrderCount: 22, projectedRevenueBDT: 52400, projectedCodInflowBDT: 44540 },
    { date: '2026-09-22', dayName: 'Mon', projectedOrderCount: 19, projectedRevenueBDT: 45100, projectedCodInflowBDT: 38335 },
    { date: '2026-09-23', dayName: 'Tue', projectedOrderCount: 18, projectedRevenueBDT: 42800, projectedCodInflowBDT: 36380 },
    { date: '2026-09-24', dayName: 'Wed', projectedOrderCount: 21, projectedRevenueBDT: 49900, projectedCodInflowBDT: 42415 },
    { date: '2026-09-25', dayName: 'Thu', projectedOrderCount: 23, projectedRevenueBDT: 54500, projectedCodInflowBDT: 46325 },
  ],
  generatedAt: new Date(),
};

export const DEMO_TENANT = {
  id: DEMO_TENANT_ID,
  name: 'Dhaka Fashion Hub',
  slug: 'dhaka-fashion-hub',
  status: 'active',
  plan: 'PRO',
  createdAt: new Date('2026-01-01'),
  stores: DEMO_STORES,
  courierCredentials: DEMO_COURIERS,
  users: [
    {
      id: 'usr_demo_01',
      tenantId: DEMO_TENANT_ID,
      supabaseUserId: 'usr_demo_01',
      email: 'merchant@dhakafashion.com',
      role: 'OWNER',
      name: 'Rahim Chowdhury',
    },
  ],
};

// Seed 28 realistic Bangladeshi orders
const rawDemoOrders = [
  {
    orderNumber: 'DF-1098',
    customerName: 'Sadia Sultana',
    customerPhone: '01711223344',
    customerAddress: 'House 42, Road 11, Banani',
    customerCity: 'Dhaka',
    customerDistrict: 'Dhaka',
    courier: CourierProvider.PATHAO,
    normalizedStatus: NormalizedOrderStatus.delivered,
    totalAmount: 3850,
    deliveryFee: 60,
    codAmount: 3850,
    paymentStatus: 'paid',
    trackingCode: 'PTH-BD-982101',
    orderedAt: new Date(Date.now() - 1000 * 60 * 35),
  },
  {
    orderNumber: 'DF-1097',
    customerName: 'Tanvir Ahmed',
    customerPhone: '01819876543',
    customerAddress: 'GEC Circle, Nasirabad',
    customerCity: 'Chittagong',
    customerDistrict: 'Chittagong',
    courier: CourierProvider.STEADFAST,
    normalizedStatus: NormalizedOrderStatus.on_the_way,
    totalAmount: 2450,
    deliveryFee: 130,
    codAmount: 2450,
    paymentStatus: 'pending',
    trackingCode: 'STF-BD-441029',
    orderedAt: new Date(Date.now() - 1000 * 60 * 110),
  },
  {
    orderNumber: 'DF-1096',
    customerName: 'Nusrat Jahan',
    customerPhone: '01912345678',
    customerAddress: 'Zindabazar Point, Sylhet Sadar',
    customerCity: 'Sylhet',
    customerDistrict: 'Sylhet',
    courier: CourierProvider.REDX,
    normalizedStatus: NormalizedOrderStatus.shipped,
    totalAmount: 5200,
    deliveryFee: 150,
    codAmount: 0,
    paymentStatus: 'paid',
    trackingCode: 'RDX-BD-883192',
    orderedAt: new Date(Date.now() - 1000 * 60 * 220),
  },
  {
    orderNumber: 'DF-1095',
    customerName: 'Kamal Hossain',
    customerPhone: '01722334455',
    customerAddress: 'Shaheb Bazar, Rajshahi',
    customerCity: 'Rajshahi',
    customerDistrict: 'Rajshahi',
    courier: CourierProvider.STEADFAST,
    normalizedStatus: NormalizedOrderStatus.processing,
    totalAmount: 1850,
    deliveryFee: 130,
    codAmount: 1850,
    paymentStatus: 'pending',
    trackingCode: 'STF-BD-441030',
    orderedAt: new Date(Date.now() - 1000 * 60 * 360),
  },
  {
    orderNumber: 'DF-1094',
    customerName: 'Farhana Yasmin',
    customerPhone: '01611223344',
    customerAddress: 'Uttara Sector 7, Road 14',
    customerCity: 'Dhaka',
    customerDistrict: 'Dhaka',
    courier: CourierProvider.PATHAO,
    normalizedStatus: NormalizedOrderStatus.delivered,
    totalAmount: 4600,
    deliveryFee: 60,
    codAmount: 4600,
    paymentStatus: 'paid',
    trackingCode: 'PTH-BD-982102',
    orderedAt: new Date(Date.now() - 1000 * 60 * 480),
  },
  {
    orderNumber: 'DF-1093',
    customerName: 'Mehedi Hasan',
    customerPhone: '01733445566',
    customerAddress: 'Shibbari More, Khulna Sadar',
    customerCity: 'Khulna',
    customerDistrict: 'Khulna',
    courier: CourierProvider.STEADFAST,
    normalizedStatus: NormalizedOrderStatus.return,
    totalAmount: 2950,
    deliveryFee: 130,
    codAmount: 2950,
    paymentStatus: 'failed',
    trackingCode: 'STF-BD-441031',
    orderedAt: new Date(Date.now() - 1000 * 60 * 600),
  },
  {
    orderNumber: 'DF-1092',
    customerName: 'Anika Tabassum',
    customerPhone: '01844556677',
    customerAddress: 'Agrabad C/A, Chittagong',
    customerCity: 'Chittagong',
    customerDistrict: 'Chittagong',
    courier: CourierProvider.PATHAO,
    normalizedStatus: NormalizedOrderStatus.delivered,
    totalAmount: 3100,
    deliveryFee: 130,
    codAmount: 3100,
    paymentStatus: 'paid',
    trackingCode: 'PTH-BD-982103',
    orderedAt: new Date(Date.now() - 1000 * 60 * 750),
  },
  {
    orderNumber: 'DF-1091',
    customerName: 'Zubair Al Mahmud',
    customerPhone: '01511223344',
    customerAddress: 'Chashara, Narayanganj Sadar',
    customerCity: 'Narayanganj',
    customerDistrict: 'Narayanganj',
    courier: CourierProvider.PATHAO,
    normalizedStatus: NormalizedOrderStatus.delivered,
    totalAmount: 1950,
    deliveryFee: 80,
    codAmount: 1950,
    paymentStatus: 'paid',
    trackingCode: 'PTH-BD-982104',
    orderedAt: new Date(Date.now() - 1000 * 60 * 900),
  },
  {
    orderNumber: 'DF-1090',
    customerName: 'Tahmina Akhter',
    customerPhone: '01755667788',
    customerAddress: 'Joydebpur Chowrasta',
    customerCity: 'Gazipur',
    customerDistrict: 'Gazipur',
    courier: CourierProvider.PATHAO,
    normalizedStatus: NormalizedOrderStatus.on_the_way,
    totalAmount: 3400,
    deliveryFee: 80,
    codAmount: 3400,
    paymentStatus: 'pending',
    trackingCode: 'PTH-BD-982105',
    orderedAt: new Date(Date.now() - 1000 * 60 * 1100),
  },
  {
    orderNumber: 'DF-1089',
    customerName: 'Imtiaz Hossain',
    customerPhone: '01922334455',
    customerAddress: 'Kandirpar, Comilla Sadar',
    customerCity: 'Comilla',
    customerDistrict: 'Comilla',
    courier: CourierProvider.STEADFAST,
    normalizedStatus: NormalizedOrderStatus.delivered,
    totalAmount: 2750,
    deliveryFee: 130,
    codAmount: 2750,
    paymentStatus: 'paid',
    trackingCode: 'STF-BD-441032',
    orderedAt: new Date(Date.now() - 1000 * 60 * 1350),
  },
  {
    orderNumber: 'DF-1088',
    customerName: 'Rashedul Karim',
    customerPhone: '01766778899',
    customerAddress: 'Shatmatha, Bogra Sadar',
    customerCity: 'Bogra',
    customerDistrict: 'Bogra',
    courier: CourierProvider.STEADFAST,
    normalizedStatus: NormalizedOrderStatus.delivered,
    totalAmount: 4100,
    deliveryFee: 130,
    codAmount: 4100,
    paymentStatus: 'paid',
    trackingCode: 'STF-BD-441033',
    orderedAt: new Date(Date.now() - 1000 * 60 * 1500),
  },
  {
    orderNumber: 'DF-1087',
    customerName: 'Sharmin Jahan',
    customerPhone: '01855667788',
    customerAddress: 'Sadullahpur Road, Barisal Sadar',
    customerCity: 'Barisal',
    customerDistrict: 'Barisal',
    courier: CourierProvider.REDX,
    normalizedStatus: NormalizedOrderStatus.cancelled,
    totalAmount: 1500,
    deliveryFee: 150,
    codAmount: 1500,
    paymentStatus: 'cancelled',
    trackingCode: 'RDX-BD-883193',
    orderedAt: new Date(Date.now() - 1000 * 60 * 1800),
  },
  {
    orderNumber: 'DF-1086',
    customerName: 'Shahidul Islam',
    customerPhone: '01777889900',
    customerAddress: 'Dhanmondi 27, Rangs Fortune Square',
    customerCity: 'Dhaka',
    customerDistrict: 'Dhaka',
    courier: CourierProvider.PATHAO,
    normalizedStatus: NormalizedOrderStatus.delivered,
    totalAmount: 6800,
    deliveryFee: 60,
    codAmount: 6800,
    paymentStatus: 'paid',
    trackingCode: 'PTH-BD-982106',
    orderedAt: new Date(Date.now() - 1000 * 60 * 2100),
  },
  {
    orderNumber: 'DF-1085',
    customerName: 'Nazia Rahman',
    customerPhone: '01933445566',
    customerAddress: 'Upashahar Block D, Sylhet',
    customerCity: 'Sylhet',
    customerDistrict: 'Sylhet',
    courier: CourierProvider.PATHAO,
    normalizedStatus: NormalizedOrderStatus.delivered,
    totalAmount: 3250,
    deliveryFee: 130,
    codAmount: 3250,
    paymentStatus: 'paid',
    trackingCode: 'PTH-BD-982107',
    orderedAt: new Date(Date.now() - 1000 * 60 * 2500),
  },
  {
    orderNumber: 'DF-1084',
    customerName: 'Mahmudul Hasan',
    customerPhone: '01622334455',
    customerAddress: 'Mirpur 10, Section 6, Block C',
    customerCity: 'Dhaka',
    customerDistrict: 'Dhaka',
    courier: CourierProvider.PATHAO,
    normalizedStatus: NormalizedOrderStatus.delivered,
    totalAmount: 2150,
    deliveryFee: 60,
    codAmount: 2150,
    paymentStatus: 'paid',
    trackingCode: 'PTH-BD-982108',
    orderedAt: new Date(Date.now() - 1000 * 60 * 2900),
  },
  {
    orderNumber: 'DF-1083',
    customerName: 'Farzana Haque',
    customerPhone: '01788990011',
    customerAddress: 'Halishahar H-Block, Chittagong',
    customerCity: 'Chittagong',
    customerDistrict: 'Chittagong',
    courier: CourierProvider.STEADFAST,
    normalizedStatus: NormalizedOrderStatus.delivered,
    totalAmount: 5400,
    deliveryFee: 130,
    codAmount: 5400,
    paymentStatus: 'paid',
    trackingCode: 'STF-BD-441034',
    orderedAt: new Date(Date.now() - 1000 * 60 * 3400),
  },
  {
    orderNumber: 'DF-1082',
    customerName: 'Ashiqur Rahman',
    customerPhone: '01866778899',
    customerAddress: 'Jinjira, Keraniganj',
    customerCity: 'Dhaka',
    customerDistrict: 'Dhaka',
    courier: CourierProvider.PATHAO,
    normalizedStatus: NormalizedOrderStatus.delivered,
    totalAmount: 1650,
    deliveryFee: 80,
    codAmount: 1650,
    paymentStatus: 'paid',
    trackingCode: 'PTH-BD-982109',
    orderedAt: new Date(Date.now() - 1000 * 60 * 3900),
  },
  {
    orderNumber: 'DF-1081',
    customerName: 'Samira Khan',
    customerPhone: '01799001122',
    customerAddress: 'Khilgaon Chowdhury Para',
    customerCity: 'Dhaka',
    customerDistrict: 'Dhaka',
    courier: CourierProvider.PATHAO,
    normalizedStatus: NormalizedOrderStatus.delivered,
    totalAmount: 2890,
    deliveryFee: 60,
    codAmount: 2890,
    paymentStatus: 'paid',
    trackingCode: 'PTH-BD-982110',
    orderedAt: new Date(Date.now() - 1000 * 60 * 4400),
  },
  {
    orderNumber: 'DF-1080',
    customerName: 'Moniruzzaman Mia',
    customerPhone: '01944556677',
    customerAddress: 'Sonadanga R/A, Khulna',
    customerCity: 'Khulna',
    customerDistrict: 'Khulna',
    courier: CourierProvider.STEADFAST,
    normalizedStatus: NormalizedOrderStatus.delivered,
    totalAmount: 3990,
    deliveryFee: 130,
    codAmount: 3990,
    paymentStatus: 'paid',
    trackingCode: 'STF-BD-441035',
    orderedAt: new Date(Date.now() - 1000 * 60 * 5000),
  },
  {
    orderNumber: 'DF-1079',
    customerName: 'Lamia Binte Sayed',
    customerPhone: '01633445566',
    customerAddress: 'Gulshan 2, Road 59, Apt 4A',
    customerCity: 'Dhaka',
    customerDistrict: 'Dhaka',
    courier: CourierProvider.PATHAO,
    normalizedStatus: NormalizedOrderStatus.delivered,
    totalAmount: 7200,
    deliveryFee: 60,
    codAmount: 7200,
    paymentStatus: 'paid',
    trackingCode: 'PTH-BD-982111',
    orderedAt: new Date(Date.now() - 1000 * 60 * 5600),
  },
];

export const DEMO_ORDERS: OrderWithHistory[] = rawDemoOrders.map((o, idx) => {
  const id = `order_demo_${(1098 - idx).toString()}`;
  const totalAmountDec = new Prisma.Decimal(o.totalAmount);
  const deliveryFeeDec = new Prisma.Decimal(o.deliveryFee);
  const codAmountDec = new Prisma.Decimal(o.codAmount);

  return {
    id,
    tenantId: DEMO_TENANT_ID,
    storeId: idx % 2 === 0 ? DEMO_STORES[0]!.id : DEMO_STORES[1]!.id,
    courierCredentialId: o.courier === CourierProvider.PATHAO
      ? DEMO_COURIERS[0]!.id
      : o.courier === CourierProvider.STEADFAST
      ? DEMO_COURIERS[1]!.id
      : DEMO_COURIERS[2]!.id,
    courierId: null,
    externalOrderId: `ext_${(1098 - idx).toString()}`,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    customerAddress: o.customerAddress,
    customerCity: o.customerCity,
    customerDistrict: o.customerDistrict,
    totalAmount: totalAmountDec,
    deliveryFee: deliveryFeeDec,
    codAmount: codAmountDec,
    currency: 'BDT',
    normalizedStatus: o.normalizedStatus,
    rawCourierStatus: o.normalizedStatus === NormalizedOrderStatus.delivered ? 'Delivered to Customer' : 'Order Picked Up',
    rawPayload: null,
    trackingCode: o.trackingCode,
    paymentStatus: o.paymentStatus,
    orderedAt: o.orderedAt,
    deliveredAt: o.normalizedStatus === NormalizedOrderStatus.delivered ? new Date(o.orderedAt.getTime() + 1000 * 60 * 60 * 28) : null,
    createdAt: o.orderedAt,
    updatedAt: new Date(),
    store: {
      id: idx % 2 === 0 ? DEMO_STORES[0]!.id : DEMO_STORES[1]!.id,
      name: idx % 2 === 0 ? DEMO_STORES[0]!.name : DEMO_STORES[1]!.name,
      platform: idx % 2 === 0 ? DEMO_STORES[0]!.platform : DEMO_STORES[1]!.platform,
    },
    courierCredential: {
      id: o.courier === CourierProvider.PATHAO
        ? DEMO_COURIERS[0]!.id
        : o.courier === CourierProvider.STEADFAST
        ? DEMO_COURIERS[1]!.id
        : DEMO_COURIERS[2]!.id,
      courier: o.courier,
    },
    statusHistory: [
      {
        id: `hist_${id}_1`,
        tenantId: DEMO_TENANT_ID,
        orderId: id,
        previousStatus: null,
        newStatus: NormalizedOrderStatus.processing,
        rawCourierStatus: 'Order Placed by Customer',
        source: 'store_webhook',
        note: 'Synced from Store platform',
        changedAt: o.orderedAt,
      },
      {
        id: `hist_${id}_2`,
        tenantId: DEMO_TENANT_ID,
        orderId: id,
        previousStatus: NormalizedOrderStatus.processing,
        newStatus: NormalizedOrderStatus.shipped,
        rawCourierStatus: 'Dispatched to Courier Hub',
        source: 'courier_webhook',
        note: `Assigned tracking ${o.trackingCode} with ${o.courier}`,
        changedAt: new Date(o.orderedAt.getTime() + 1000 * 60 * 60 * 4),
      },
      ...(o.normalizedStatus === NormalizedOrderStatus.delivered
        ? [
            {
              id: `hist_${id}_3`,
              tenantId: DEMO_TENANT_ID,
              orderId: id,
              previousStatus: NormalizedOrderStatus.shipped,
              newStatus: NormalizedOrderStatus.on_the_way,
              rawCourierStatus: 'Out for Delivery / Rider Assigned',
              source: 'courier_webhook',
              note: 'Rider on the way to destination',
              changedAt: new Date(o.orderedAt.getTime() + 1000 * 60 * 60 * 22),
            },
            {
              id: `hist_${id}_4`,
              tenantId: DEMO_TENANT_ID,
              orderId: id,
              previousStatus: NormalizedOrderStatus.on_the_way,
              newStatus: NormalizedOrderStatus.delivered,
              rawCourierStatus: 'Delivered - Cash Collected',
              source: 'courier_webhook',
              note: `COD amount ৳${o.totalAmount} collected`,
              changedAt: new Date(o.orderedAt.getTime() + 1000 * 60 * 60 * 28),
            },
          ]
        : []),
    ],
  };
});

export const DEMO_KPIS: KpiMetrics = {
  totalOrders: 542,
  totalRevenueBDT: 1284500,
  averageOrderValueBDT: 2370,
  deliverySuccessRatePercentage: 86.4,
  deliveredOrders: 468,
  returnRatePercentage: 8.5,
  returnedOrders: 46,
  codConversionRatePercentage: 91.2,
  cancelledOrders: 28,
  totalCodCollectedBDT: 1045000,
  pendingCodBDT: 84500,
};

export function getDemoDailySalesTrend(timeframeDays = 30): DailySalesMetric[] {
  const result: DailySalesMetric[] = [];
  const now = new Date();

  for (let i = timeframeDays - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().slice(0, 10);
    const isWeekend = d.getDay() === 5 || d.getDay() === 6; // Fri or Sat in BD
    const baseAmount = isWeekend ? 58000 : 38000;
    const randomVariation = (i * 997) % 15000;
    const grossSalesBDT = baseAmount + randomVariation;
    const orderCount = Math.round(grossSalesBDT / 2400);

    result.push({
      date: dateStr,
      formattedDate: d.toLocaleDateString('en-BD', { month: 'short', day: 'numeric' }),
      revenueBDT: grossSalesBDT,
      orderCount,
      deliveredCount: Math.round(orderCount * 0.86),
    });
  }

  return result;
}

export const DEMO_COURIER_PERFORMANCE: CourierPerformanceMetric[] = [
  {
    courier: 'PATHAO',
    totalOrders: 265,
    deliveredCount: 236,
    returnedCount: 18,
    deliveryRatePercentage: 89.1,
    returnRatePercentage: 6.8,
  },
  {
    courier: 'STEADFAST',
    totalOrders: 198,
    deliveredCount: 168,
    returnedCount: 19,
    deliveryRatePercentage: 84.8,
    returnRatePercentage: 9.6,
  },
  {
    courier: 'REDX',
    totalOrders: 79,
    deliveredCount: 64,
    returnedCount: 9,
    deliveryRatePercentage: 81.0,
    returnRatePercentage: 11.4,
  },
];

export const DEMO_REGIONAL_DISTRIBUTION: RegionalDistributionMetric[] = [
  {
    region: 'Dhaka',
    orderCount: 312,
    revenueBDT: 742000,
    percentage: 57.5,
  },
  {
    region: 'Chittagong',
    orderCount: 98,
    revenueBDT: 232000,
    percentage: 18.1,
  },
  {
    region: 'Sylhet',
    orderCount: 46,
    revenueBDT: 114000,
    percentage: 8.5,
  },
  {
    region: 'Rajshahi',
    orderCount: 34,
    revenueBDT: 85000,
    percentage: 6.3,
  },
  {
    region: 'Khulna',
    orderCount: 30,
    revenueBDT: 68000,
    percentage: 5.5,
  },
  {
    region: 'Barisal',
    orderCount: 22,
    revenueBDT: 43500,
    percentage: 4.1,
  },
];

/**
 * Filter & paginate demo orders in-memory.
 */
export function queryDemoOrders(params: OrderFilterParams): PaginatedOrdersResult {
  let filtered = [...DEMO_ORDERS];

  // 1. Status Filter
  if (
    params.status &&
    params.status !== 'ALL' &&
    Object.values(NormalizedOrderStatus).includes(params.status as NormalizedOrderStatus)
  ) {
    filtered = filtered.filter((o) => o.normalizedStatus === params.status);
  }

  // 2. Courier Filter
  if (params.courier && params.courier !== 'ALL') {
    const courierUpper = params.courier.toUpperCase();
    filtered = filtered.filter(
      (o) => o.courierCredential?.courier === courierUpper
    );
  }

  // 3. District Filter
  if (params.district && params.district !== 'ALL') {
    const dLower = params.district.toLowerCase();
    filtered = filtered.filter((o) => o.customerDistrict.toLowerCase().includes(dLower));
  }

  // 4. Search Filter
  if (params.search && params.search.trim()) {
    const term = params.search.trim().toLowerCase();
    filtered = filtered.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(term) ||
        o.customerName.toLowerCase().includes(term) ||
        o.customerPhone.includes(term) ||
        (o.trackingCode && o.trackingCode.toLowerCase().includes(term))
    );
  }

  // 5. Timeframe Filter
  if (params.timeframe && params.timeframe !== 'all') {
    const days = params.timeframe === '7d' ? 7 : params.timeframe === '90d' ? 90 : 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    filtered = filtered.filter((o) => o.orderedAt.getTime() >= cutoff);
  }

  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(Math.max(1, params.limit ?? 20), 100);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const skip = (page - 1) * limit;
  const paginatedOrders = filtered.slice(skip, skip + limit);

  return {
    orders: paginatedOrders,
    total,
    page,
    limit,
    totalPages,
  };
}

export function getDemoOrderDetails(orderId: string): OrderWithHistory | null {
  const found = DEMO_ORDERS.find((o) => o.id === orderId || o.orderNumber === orderId);
  return found ?? DEMO_ORDERS[0] ?? null;
}
