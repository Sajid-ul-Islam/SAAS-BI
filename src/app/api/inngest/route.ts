import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { syncOrders } from '@/lib/inngest/functions/order-sync';
import { pollCourierStatus } from '@/lib/inngest/functions/courier-poll';
import { detectAnomaliesCron } from '@/lib/inngest/functions/anomaly-detection';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [syncOrders, pollCourierStatus, detectAnomaliesCron],
});
