'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pill } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';
import { AppShell } from '@/components/layout/AppShell';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Link2, Sparkles, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Correlation {
  id: string;
  symptom_signature: string;
  affected_pet_ids: string[];
  possible_causes: string[];
  shared_environment: string;
  ai_analysis: string;
  correlation_strength: number;
  detected_at: string;
  resolved: boolean;
}

export default function SymptomCorrelationsPage() {
  const [correlations, setCorrelations] = useState<Correlation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchCorrelations = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/symptom-correlations', {
        headers: { Authorization: 'Bearer ' + (session?.access_token ?? '') },
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? 'Failed to load');
      } else {
        setCorrelations((json.data as Correlation[]) ?? []);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCorrelations(); }, []);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/symptom-correlations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + (session?.access_token ?? ''),
        },
        credentials: 'include',
        body: JSON.stringify({ shared_environment: 'shared living spaces' }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error('Analysis failed: ' + (json?.error?.message ?? 'Try again'));
      } else {
        toast.success('Analysis complete — new correlations added.');
        await fetchCorrelations();
      }
    } catch (e: any) {
      toast.error('Network error: ' + (e?.message ?? ''));
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">🔗 Symptom Correlations</h1>
            <p className="text-ink-500 mt-1">AI-detected patterns across pets' symptoms.</p>
          </div>
          <Button onClick={handleAnalyze} disabled={analyzing}>
            <Sparkles className="h-4 w-4 mr-1" />
            {analyzing ? 'Analyzing…' : 'Run analysis'}
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-ink-500">Loading…</p>
        ) : error ? (
          <Card><CardBody><EmptyState emoji="⚠️" title="Could not load" description={error} /></CardBody></Card>
        ) : correlations.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                emoji="🔗"
                title="No correlations detected"
                description="Run an analysis to look for shared-environment patterns across pets."
              />
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {correlations.map((c) => {
              const strengthPct = Math.round((c.correlation_strength ?? 0) * 100);
              const high = strengthPct >= 70;
              return (
                <Card key={c.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Link2 className={`h-5 w-5 ${high ? 'text-amber-500' : 'text-sky-500'}`} />
                      Signature: {c.symptom_signature}
                    </CardTitle>
                    <Pill variant={high ? 'warning' : 'info'}>
                      {strengthPct}% strength
                    </Pill>
                  </CardHeader>
                  <CardBody>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-ink-500 font-medium">Affected pets</p>
                        <p className="text-sm text-ink-900 mt-1">{c.affected_pet_ids?.length ?? 0} pets</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-ink-500 font-medium">Shared environment</p>
                        <p className="text-sm text-ink-900 mt-1">{c.shared_environment || '—'}</p>
                      </div>
                    </div>

                    {c.possible_causes?.length > 0 ? (
                      <div className="mt-4">
                        <p className="text-xs uppercase tracking-wide text-ink-500 font-medium">Possible causes</p>
                        <ul className="text-sm text-ink-900 mt-1 list-disc list-inside space-y-1">
                          {c.possible_causes.map((cause, i) => (
                            <li key={i}>{cause}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {c.ai_analysis ? (
                      <div className="mt-4 p-3 rounded-xl bg-canvas-sunken">
                        <p className="text-xs uppercase tracking-wide text-ink-500 font-medium flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> AI analysis
                        </p>
                        <p className="text-sm text-ink-700 mt-1 whitespace-pre-wrap">
                          {c.ai_analysis}
                        </p>
                      </div>
                    ) : null}

                    {high ? (
                      <div className="mt-3 p-2 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-amber-900">
                        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p className="text-xs">
                          High-confidence correlation. Consider consulting your vet about shared environmental factors.
                        </p>
                      </div>
                    ) : null}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
