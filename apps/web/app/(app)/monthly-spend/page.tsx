'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppShell } from '@/components/layout/AppShell';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { formatInr } from '@/lib/shared';

interface MonthlySpend {
  month_year: string;
  total_inr: number;
  by_category?: Record<string, number>;
  by_pet?: Record<string, number>;
  trend_pct?: number;
}

export default function MonthlySpendPage() {
  const [months, setMonths] = useState<MonthlySpend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/monthly-spend', {
          headers: { Authorization: 'Bearer ' + (session?.access_token ?? '') },
          credentials: 'include',
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json?.error?.message ?? 'Failed to load');
        } else {
          setMonths((json.data as MonthlySpend[]) ?? []);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const max = months.length > 0 ? Math.max(...months.map((m) => m.total_inr || 0), 1) : 1;
  const totalYear = months.reduce((sum, m) => sum + (m.total_inr || 0), 0);
  const avgMonth = months.length > 0 ? totalYear / months.length : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">💰 Monthly Spend</h1>
          <p className="text-ink-500 mt-1">Month-by-month pet expense breakdown.</p>
        </div>

        {loading ? (
          <p className="text-sm text-ink-500">Loading…</p>
        ) : error ? (
          <Card><CardBody><EmptyState emoji="⚠️" title="Could not load" description={error} /></CardBody></Card>
        ) : months.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState emoji="💰" title="No spend data yet" description="Log a few expenses to see monthly trends." />
            </CardBody>
          </Card>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <Card>
                <CardBody>
                  <p className="text-xs text-ink-500 uppercase tracking-wide">Last {months.length} months</p>
                  <p className="text-3xl font-display font-bold text-brand-primary mt-1">
                    {formatInr(totalYear)}
                  </p>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <p className="text-xs text-ink-500 uppercase tracking-wide">Average / month</p>
                  <p className="text-3xl font-display font-bold text-ink-900 mt-1">
                    {formatInr(avgMonth)}
                  </p>
                </CardBody>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" /> By month</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {[...months].reverse().map((m) => {
                    const pct = max > 0 ? (m.total_inr / max) * 100 : 0;
                    const Trend = (m.trend_pct ?? 0) > 0 ? TrendingUp : TrendingDown;
                    return (
                      <div key={m.month_year}>
                        <div className="flex items-baseline justify-between text-sm">
                          <span className="font-medium">{m.month_year}</span>
                          <span className="flex items-center gap-2">
                            {m.trend_pct !== undefined ? (
                              <span className={`inline-flex items-center text-xs ${m.trend_pct > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                                <Trend className="h-3 w-3" />
                                {Math.abs(m.trend_pct).toFixed(0)}%
                              </span>
                            ) : null}
                            <span className="font-mono">{formatInr(m.total_inr)}</span>
                          </span>
                        </div>
                        <div className="mt-1 h-3 rounded-full bg-canvas-sunken overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
