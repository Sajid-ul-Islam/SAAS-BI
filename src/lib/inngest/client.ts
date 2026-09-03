import { Inngest } from 'inngest';

export type InngestEvents = {
  'integration/orders.sync': {
    data: {
      tenantId: string;
      storeId: string;
      source?: 'manual' | 'cron';
    };
  };
  'courier/status.poll': {
    data: {
      tenantId: string;
      courierId?: string;
    };
  };
  'ai/anomalies.detect': {
    data: {
      tenantId: string;
      date: string;
    };
  };
  'ai/forecast.generate': {
    data: {
      tenantId: string;
    };
  };
};

export const inngest = new Inngest({
  id: 'saas-bi-bangladesh',
  name: 'SaaS BI Bangladesh Background Worker',
});
