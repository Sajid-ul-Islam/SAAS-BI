import { NextRequest, NextResponse } from 'next/server';
import { resolveActiveTenantId } from '@/lib/tenant-context';
import { prisma } from '@/lib/prisma';
import { CourierProvider, NormalizedOrderStatus } from '@prisma/client';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const tenantId = await resolveActiveTenantId();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const courier = searchParams.get('courier');
    const district = searchParams.get('district');
    const search = searchParams.get('search');

    // Build query filters
    const where: Record<string, unknown> = { tenantId };

    if (status && status !== 'ALL' && Object.values(NormalizedOrderStatus).includes(status as NormalizedOrderStatus)) {
      where.normalizedStatus = status as NormalizedOrderStatus;
    }

    if (district && district !== 'ALL') {
      where.customerDistrict = { equals: district, mode: 'insensitive' };
    }

    if (courier && courier !== 'ALL' && Object.values(CourierProvider).includes(courier as CourierProvider)) {
      where.courierCredential = { courier: courier as CourierProvider };
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { trackingCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    let orders: Array<{
      orderNumber: string;
      customerName: string;
      customerPhone: string;
      customerAddress: string;
      customerCity: string;
      customerDistrict: string;
      courierCredential?: { courier: CourierProvider } | null;
      trackingCode?: string | null;
      normalizedStatus: string;
      totalAmount: unknown;
      deliveryFee: unknown;
      codAmount: unknown;
      paymentStatus: string;
      orderedAt: Date;
    }> = [];

    try {
      orders = await prisma.order.findMany({
        where,
        include: {
          courierCredential: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      });
    } catch {
      orders = [];
    }

    if (orders.length === 0 && (tenantId === '00000000-0000-0000-0000-000000000001' || tenantId.includes('demo'))) {
      const { queryDemoOrders } = await import('@/lib/demo-data');
      const demoRes = queryDemoOrders({
        status: status ?? undefined,
        courier: courier ?? undefined,
        district: district ?? undefined,
        search: search ?? undefined,
        limit: 1000,
      });
      orders = demoRes.orders;
    }

    // Helper to escape CSV cell
    const escapeCsv = (val: unknown) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      'Order Number',
      'Customer Name',
      'Customer Phone',
      'Customer Address',
      'City',
      'District',
      'Courier Partner',
      'Tracking Code',
      'Normalized Status',
      'Total Amount (BDT)',
      'Delivery Fee (BDT)',
      'COD Amount (BDT)',
      'Payment Status',
      'Ordered At',
    ];

    const rows = orders.map((o) => [
      escapeCsv(o.orderNumber),
      escapeCsv(o.customerName),
      escapeCsv(o.customerPhone),
      escapeCsv(o.customerAddress),
      escapeCsv(o.customerCity),
      escapeCsv(o.customerDistrict),
      escapeCsv(o.courierCredential?.courier ?? 'None'),
      escapeCsv(o.trackingCode ?? 'N/A'),
      escapeCsv(o.normalizedStatus.toUpperCase()),
      escapeCsv(Number(o.totalAmount)),
      escapeCsv(Number(o.deliveryFee)),
      escapeCsv(Number(o.codAmount)),
      escapeCsv(o.paymentStatus.toUpperCase()),
      escapeCsv(new Date(o.orderedAt).toISOString()),
    ]);

    // Prepend UTF-8 Byte Order Mark (\uFEFF) for Excel compatibility with Bangla scripts
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    logger.info('Orders exported to CSV', {
      tenantId,
      orderCount: orders.length,
    });

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="orders-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    logger.error('Failed to export orders to CSV', { error });
    return NextResponse.json({ error: 'Failed to generate CSV export' }, { status: 500 });
  }
}
