import { PrismaClient, TenantRole, StorePlatform, CourierProvider, NormalizedOrderStatus, PlanTier } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedDatabase(client: PrismaClient = prisma) {
  // eslint-disable-next-line no-console
  console.log('Seeding demo tenant and e-commerce records for Bangladesh market...');

  // 1. Create Demo Tenant
  const tenant = await client.tenant.upsert({
    where: { slug: 'dhaka-fashion-hub' },
    update: {},
    create: {
      name: 'Dhaka Fashion Hub',
      slug: 'dhaka-fashion-hub',
      status: 'active',
      subscriptions: {
        create: {
          planTier: PlanTier.PRO,
          monthlyOrderLimit: 2000,
          dailyAiTokenLimit: 100000,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  // 2. Create Demo User
  const user = await client.user.upsert({
    where: { email: 'merchant@dhakafashion.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      supabaseUserId: '00000000-0000-0000-0000-000000000001',
      email: 'merchant@dhakafashion.com',
      name: 'Rahim Chowdhury',
      role: TenantRole.OWNER,
    },
  });

  // 3. Create Connected Stores (WooCommerce & Shopify)
  const wooStore = await client.store.upsert({
    where: {
      tenantId_storeUrl: {
        tenantId: tenant.id,
        storeUrl: 'https://shop.dhakafashion.com',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Dhaka Fashion WooCommerce Store',
      storeUrl: 'https://shop.dhakafashion.com',
      platform: StorePlatform.WOOCOMMERCE,
      credentialsEncrypted: 'mock_encrypted_ck_cs_token',
      lastSyncedAt: new Date(),
    },
  });

  // 4. Create Courier Credentials
  const pathaoCourier = await client.courierCredential.upsert({
    where: {
      tenantId_courier: {
        tenantId: tenant.id,
        courier: CourierProvider.PATHAO,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      courier: CourierProvider.PATHAO,
      credentialsEncrypted: 'mock_pathao_encrypted_credentials',
      webhookSecret: 'pathao_wh_secret_xyz',
      isActive: true,
    },
  });

  const steadfastCourier = await client.courierCredential.upsert({
    where: {
      tenantId_courier: {
        tenantId: tenant.id,
        courier: CourierProvider.STEADFAST,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      courier: CourierProvider.STEADFAST,
      credentialsEncrypted: 'mock_steadfast_encrypted_credentials',
      webhookSecret: 'steadfast_wh_secret_abc',
      isActive: true,
    },
  });

  // 5. Seed Realistic Orders in BDT with Dhaka vs Outside Dhaka
  const sampleOrders = [
    {
      externalOrderId: 'WOO-1001',
      orderNumber: '#DF-1001',
      customerName: 'Tanvir Hasan',
      customerPhone: '+8801712345678',
      customerAddress: 'House 42, Road 7, Dhanmondi',
      customerCity: 'Dhaka',
      customerDistrict: 'Dhaka',
      totalAmount: 3450.0,
      deliveryFee: 60.0,
      codAmount: 3450.0,
      currency: 'BDT',
      normalizedStatus: NormalizedOrderStatus.delivered,
      rawCourierStatus: 'Delivered',
      trackingCode: 'PT-DH-90123',
      courierId: pathaoCourier.id,
      paymentStatus: 'paid',
      orderedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      externalOrderId: 'WOO-1002',
      orderNumber: '#DF-1002',
      customerName: 'Sadia Islam',
      customerPhone: '+8801819876543',
      customerAddress: 'GEC Circle, Nasirabad',
      customerCity: 'Chittagong',
      customerDistrict: 'Chittagong',
      totalAmount: 5200.0,
      deliveryFee: 120.0,
      codAmount: 5200.0,
      currency: 'BDT',
      normalizedStatus: NormalizedOrderStatus.on_the_way,
      rawCourierStatus: 'in_transit',
      trackingCode: 'SF-CTG-44312',
      courierId: steadfastCourier.id,
      paymentStatus: 'unpaid',
      orderedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      externalOrderId: 'WOO-1003',
      orderNumber: '#DF-1003',
      customerName: 'Kamal Ahmed',
      customerPhone: '+8801911223344',
      customerAddress: 'Zindabazar Point',
      customerCity: 'Sylhet',
      customerDistrict: 'Sylhet',
      totalAmount: 1850.0,
      deliveryFee: 130.0,
      codAmount: 1850.0,
      currency: 'BDT',
      normalizedStatus: NormalizedOrderStatus.return,
      rawCourierStatus: 'returned',
      trackingCode: 'SF-SYL-77102',
      courierId: steadfastCourier.id,
      paymentStatus: 'refunded',
      orderedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      externalOrderId: 'WOO-1004',
      orderNumber: '#DF-1004',
      customerName: 'Nusrat Jahan',
      customerPhone: '+8801615554433',
      customerAddress: 'Uttara Sector 11',
      customerCity: 'Dhaka',
      customerDistrict: 'Dhaka',
      totalAmount: 7600.0,
      deliveryFee: 60.0,
      codAmount: 0.0,
      currency: 'BDT',
      normalizedStatus: NormalizedOrderStatus.delivered,
      rawCourierStatus: 'Delivered',
      trackingCode: 'PT-DH-90199',
      courierId: pathaoCourier.id,
      paymentStatus: 'paid',
      orderedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const ord of sampleOrders) {
    const createdOrder = await client.order.upsert({
      where: {
        tenantId_storeId_externalOrderId: {
          tenantId: tenant.id,
          storeId: wooStore.id,
          externalOrderId: ord.externalOrderId,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        storeId: wooStore.id,
        courierId: ord.courierId,
        externalOrderId: ord.externalOrderId,
        orderNumber: ord.orderNumber,
        customerName: ord.customerName,
        customerPhone: ord.customerPhone,
        customerAddress: ord.customerAddress,
        customerCity: ord.customerCity,
        customerDistrict: ord.customerDistrict,
        totalAmount: ord.totalAmount,
        deliveryFee: ord.deliveryFee,
        codAmount: ord.codAmount,
        currency: ord.currency,
        normalizedStatus: ord.normalizedStatus,
        rawCourierStatus: ord.rawCourierStatus,
        trackingCode: ord.trackingCode,
        paymentStatus: ord.paymentStatus,
        orderedAt: ord.orderedAt,
      },
    });

    await client.orderStatusHistory.create({
      data: {
        tenantId: tenant.id,
        orderId: createdOrder.id,
        previousStatus: NormalizedOrderStatus.processing,
        newStatus: ord.normalizedStatus,
        rawCourierStatus: ord.rawCourierStatus,
        source: 'seed_importer',
        note: `Initial status update for ${ord.orderNumber}`,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Seed completed successfully for tenant "${tenant.name}" (${tenant.id}) with sample orders.`);
  return { tenant, user, wooStore };
}

if (require.main === module) {
  seedDatabase()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      // eslint-disable-next-line no-console
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
