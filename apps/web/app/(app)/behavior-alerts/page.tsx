'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppShell } from '@/components/layout/AppShell';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { AlertTriangle, TrendingUp, TrendingDown, Check, Activity } from 'lucide-react';

interface BehaviorAlert {
  id: string;
  pet_id: string;
  metric_type: string;
  percent_change: number;
  severity: 'monitor' | 'watch' | 'concern' | 'urgent';
  ai_summary: string;
  suggested_action: string;
  pets?: { name: string; photo_url?: string } | null;
  detected_at: string;
}

const SEVERITY_META: Record<BehaviorAlert['severity'], { label: string; pill: 'info' | 'warning' | 'danger' | 'neutral' }> = {
  monitor: { label: 'Monitor', pill: 'info' },
  watch: { label: 'Watch', pill: 'warning' },
  concern: { label: 'Concern', pill: 'warning' },
  urgent: { label: 'Urgent', pill: 'danger' },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function BehaviorAlertsPage() {
  const [alerts, setAlerts] = useState<BehaviorAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function authedFetch(url: string, init?: RequestInit): Promise<Response> {
    const supabase = createSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    return fetch(url, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: 'Bearer ' + (session?.access_token ?? ''),
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await authedFetch('/api/behavior-alerts');
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? 'Failed to load alerts');
        setAlerts([]);
      } else {
        setAlerts((json.data as BehaviorAlert[]) ?? []);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function acknowledge(id: string) {
    setBusyId(id);
    try {
      const res = await authedFetch('/api/behavior-alerts', {
        method: 'PATCH',
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
      } else {
        const j = await res.json().catch(() => ({}));
        setError(j?.error?.message ?? 'Could not acknowledge alert');
      }
    } finally {
      setBusyId(null);
    }
  }

  const counts = {
    urgent: alerts.filter((a) => a.severity === 'urgent').length,
    concern: alerts.filter((a) => a.severity === 'concern').length,
    watch: alerts.filter((a) => a.severity === 'watch').length,
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">🚨 Behavior Alerts</h1>
          <p className="text-ink-500 mt-1">Detected changes in your pets' behavior.</p>
        </div>

        {!loading && alerts.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardBody className="text-center">
                <p className="text-3xl font-display font-bold text-semantic-danger">{counts.urgent}</p>
                <p className="text-xs text-ink-500 mt-1">Urgent</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <p className="text-3xl font-display font-bold text-semantic-warning">{counts.concern}</p>
                <p className="text-xs text-ink-500 mt-1">Concern</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <p className="text-3xl font-display font-bold text-semantic-info">{counts.watch}</p>
                <p className="text-xs text-ink-500 mt-1">Watch</p>
              </CardBody>
            </Card>
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-ink-500">Loading alerts…</p>
        ) : error ? (
          <Card>
            <CardBody>
              <EmptyState emoji="⚠️" title="Could not load alerts" description={error} />
            </CardBody>
          </Card>
        ) : alerts.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                emoji="✅"
                title="All clear"
                description="No outstanding behavior alerts. We'll surface meaningful changes here when we detect them."
              />
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {alerts.map((a) => {
              const meta = SEVERITY_META[a.severity] ?? SEVERITY_META.watch;
              const isUp = a.percent_change >= 0;
              return (
                <Card key={a.id} className="overflow-hidden">
                  <div className="flex">
                    <div
                      className={
                        a.severity === 'urgent'
                          ? 'w-1.5 bg-semantic-danger'
                          : a.severity === 'concern'
                            ? 'w-1.5 bg-semantic-warning'
                            : a.severity === 'watch'
                              ? 'w-1.5 bg-semantic-info'
                              : 'w-1.5 bg-ink-200'
                      }
                    />
                    <div className="flex-1">
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-xl bg-canvas-sunken flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-semantic-warning" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <CardTitle className="text-base">
                                {a.pets?.name ?? 'Pet'} · {a.metric_type}
                              </CardTitle>
                              <Pill variant={meta.pill}>{meta.label}</Pill>
                              <Pill variant={isUp ? 'danger' : 'info'}>
                                {isUp ? (
                                  <TrendingUp className="h-3 w-3" />
                                ) : (
                                  <TrendingDown className="h-3 w-3" />
                                )}
                                {isUp ? '+' : ''}
                                {a.percent_change}%
                              </Pill>
                            </div>
                            <p className="text-xs text-ink-500 mt-1 flex items-center gap-1.5">
                              <Activity className="h-3 w-3" /> {relativeTime(a.detected_at)}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardBody className="space-y-2">
                        <p className="text-sm text-ink-900">{a.ai_summary}</p>
                        <p className="text-sm text-ink-500">💡 {a.suggested_action}</p>
                        <div className="flex justify-end pt-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={<Check className="h-4 w-4" />}
                            loading={busyId === a.id}
                            onClick={() => acknowledge(a.id)}
                          >
                            Acknowledge
                          </Button>
                        </div>
                      </CardBody>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
