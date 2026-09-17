import React from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { AiAnomaly } from '@/modules/ai/ai.types';

interface AiAnomaliesSectionProps {
  anomalies: AiAnomaly[];
}

export function AiAnomaliesSection({ anomalies }: AiAnomaliesSectionProps) {
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return {
          badge: 'bg-rose-50 text-rose-700 border-rose-200',
          border: 'border-rose-200 bg-rose-50/20',
          icon: ShieldAlert,
          iconColor: 'text-rose-600',
        };
      case 'MEDIUM':
        return {
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
          border: 'border-amber-200 bg-amber-50/20',
          icon: AlertTriangle,
          iconColor: 'text-amber-600',
        };
      default:
        return {
          badge: 'bg-blue-50 text-blue-700 border-blue-200',
          border: 'border-slate-200 bg-slate-50/30',
          icon: CheckCircle,
          iconColor: 'text-blue-600',
        };
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Automated Logistics & Revenue Anomaly Alerts</h3>
          <p className="text-xs text-slate-500">Nightly Inngest cron auditing return spikes and COD remittance delays</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
          {anomalies.length} Signals
        </span>
      </div>

      <div className="space-y-3">
        {anomalies.map((item) => {
          const style = getSeverityStyle(item.severity);
          const Icon = style.icon;

          return (
            <div
              key={item.id}
              className={`rounded-xl border p-4 transition hover:shadow-xs ${style.border}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    <Icon className={`h-4 w-4 ${style.iconColor}`} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                    <p className="text-xs text-slate-600 mt-0.5">{item.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.badge}`}
                  >
                    {item.severity} Risk
                  </span>
                  <span className="rounded bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-800">
                    {item.metricValue}
                  </span>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-white/80 p-2.5 border border-slate-200/60 text-xs">
                <p className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider mb-0.5">
                  Recommended Action:
                </p>
                <p className="text-slate-700 leading-relaxed">{item.recommendedAction}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
