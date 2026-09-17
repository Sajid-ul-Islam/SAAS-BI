import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { syncOrders, backfillStoreOrders } from '@/lib/inngest/functions/order-sync';
import { pollCourierStatus, reconcileStaleOrdersCron } from '@/lib/inngest/functions/courier-poll';
import { detectAnomaliesCron } from '@/lib/inngest/functions/anomaly-detection';
import { checkSubscriptionExpirationsCron } from '@/lib/inngest/functions/subscription-audit';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    syncOrders,
    backfillStoreOrders,
    pollCourierStatus,
    reconcileStaleOrdersCron,
    detectAnomaliesCron,
    checkSubscriptionExpirationsCron,
  ],
});

