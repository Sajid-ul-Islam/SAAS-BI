'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Zap,
  CheckCircle2,
  Clock,
  AlertCircle,
  Database,
} from 'lucide-react';
import { AiQueryResult } from '@/modules/ai/ai.types';

const SUGGESTIONS = [
  'Why did sales drop in Dhaka?',
  'Compare Pathao vs Steadfast return rates',
  'What is my COD collection efficiency?',
  'Which courier has the highest delivery rate?',
];

export function AiQueryChat() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiQueryResult | null>(null);

  const handleAsk = async (promptText: string) => {
    if (!promptText.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: promptText.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          setError('Daily AI token quota reached (100,000 tokens/day). Please try again tomorrow or upgrade plan.');
        } else {
          setError(data.message || 'Failed to process AI query.');
        }
        return;
      }

      setResult(data.data);
    } catch {
      setError('Network error while querying AI engine. Please check connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAsk(query);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-2 text-indigo-600">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Natural Language Query Engine</h3>
            <p className="text-xs text-slate-500">
              Ask questions about sales, courier returns, and district performance in plain English
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 border border-slate-200">
          <Database className="h-3 w-3 text-indigo-600" /> SQL-Grounded LLM
        </span>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-semibold uppercase text-slate-400 mr-1">Suggested:</span>
        {SUGGESTIONS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setQuery(item);
              handleAsk(item);
            }}
            disabled={isLoading}
            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition disabled:opacity-50"
          >
            {item}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Why did sales drop in Dhaka last week? Or compare Pathao vs Steadfast..."
          disabled={isLoading}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-24 py-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span>Analyzing...</span>
          ) : (
            <>
              Ask <Send className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Query Result Card */}
      {result && (
        <div className="rounded-xl border border-indigo-100 bg-gradient-to-b from-indigo-50/40 to-white p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-indigo-100/60 pb-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                Question
              </p>
              <p className="text-xs font-semibold text-slate-800 italic">
                &ldquo;{result.query}&rdquo;
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto text-[10px] font-mono">
              {result.cached ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 font-bold text-emerald-700">
                  <Zap className="h-3 w-3 text-emerald-600" /> Cached Result (0 Tokens)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 font-semibold text-indigo-700">
                  <Clock className="h-3 w-3 text-indigo-600" /> {result.tokensUsed} Tokens Consumed
                </span>
              )}

              {result.executionTimeMs && (
                <span className="text-slate-400">
                  {result.executionTimeMs}ms
                </span>
              )}
            </div>
          </div>

          {/* Answer Body */}
          <div className="text-xs leading-relaxed text-slate-700 space-y-2">
            <p className="font-normal">{result.answer}</p>
          </div>

          {/* Actionable Recommendations */}
          {result.suggestedActions && result.suggestedActions.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Recommended Merchant Actions
              </p>
              <div className="space-y-1.5">
                {result.suggestedActions.map((action, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transparency Footer */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
            <span>Model: {result.model}</span>
            <span>Deterministic SHA-256 Prompt Caching</span>
          </div>
        </div>
      )}
    </div>
  );
}
