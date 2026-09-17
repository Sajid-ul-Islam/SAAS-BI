import React from 'react';
import { aiService } from '@/modules/ai/ai.service';
import { resolveActiveTenantId } from '@/lib/tenant-context';
import { AiTokenMeterCard } from '@/components/ai/AiTokenMeterCard';
import { AiQueryChat } from '@/components/ai/AiQueryChat';
import { AiAnomaliesSection } from '@/components/ai/AiAnomaliesSection';
import { AiSalesForecastCard } from '@/components/ai/AiSalesForecastCard';
import { Bot, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AiDashboardPage() {
  const tenantId = await resolveActiveTenantId();

  const [usage, anomalies, forecast] = await Promise.all([
    aiService.checkQuota(tenantId),
    aiService.detectAnomalies(tenantId),
    aiService.generateSalesForecast(tenantId),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              AI Analytics & Business Intelligence
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" /> 100K Token Quota
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Natural language queries, automated logistics anomaly detection, and sales forecasting
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg">
            <Bot className="h-4 w-4" />
            <span>OpenAI Mini Model Engine</span>
          </div>
        </div>
      </div>

      {/* Token Usage & Cost Discipline Card */}
      <AiTokenMeterCard usage={usage} />

      {/* Natural Language Query Interface */}
      <AiQueryChat />

      {/* Anomaly Detection & Weekly Sales Velocity Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AiAnomaliesSection anomalies={anomalies} />
        <AiSalesForecastCard forecast={forecast} />
      </div>
    </div>
  );
}
