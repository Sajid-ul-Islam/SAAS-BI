import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { syncOrders } from '@/lib/inngest/functions/order-sync';
import { pollCourierStatus } from '@/lib/inngest/functions/courier-poll';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [syncOrders, pollCourierStatus],
});
