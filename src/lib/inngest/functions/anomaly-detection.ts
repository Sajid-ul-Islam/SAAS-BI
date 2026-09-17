import { inngest } from '../client';
import { prisma } from '@/lib/prisma';
import { aiService } from '@/modules/ai/ai.service';
import { logger } from '@/lib/logger';

export const detectAnomaliesCron = inngest.createFunction(
  {
    id: 'ai-anomaly-detection',
    retries: 2,
  },
  [
    { cron: '0 3 * * *' }, // Daily at 3 AM BD time
    { event: 'ai/anomalies.detect' },
  ],
  async ({ step }) => {
    const activeTenants = await step.run('fetch-active-tenants', async () => {
      return prisma.tenant.findMany({
        where: { status: 'active' },
        select: { id: true, name: true },
      });
    });

    const summary: Record<string, number> = {};

    for (const tenant of activeTenants) {
      await step.run(`detect-anomalies-${tenant.id}`, async () => {
        const anomalies = await aiService.detectAnomalies(tenant.id);
        const highSeverity = anomalies.filter((a) => a.severity === 'HIGH');

        if (highSeverity.length > 0) {
          logger.warn('High severity logistics anomaly detected for merchant', {
            tenantId: tenant.id,
            merchantName: tenant.name,
            anomaliesCount: highSeverity.length,
          });
        }

        summary[tenant.id] = anomalies.length;
        return anomalies;
      });
    }

    return {
      success: true,
      tenantsAudited: activeTenants.length,
      anomaliesFound: summary,
    };
  }
);
