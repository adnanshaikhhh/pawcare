'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppShell } from '@/components/layout/AppShell';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { FlaskConical, Calendar, Building2, ChevronDown, ChevronUp, FileText, AlertTriangle } from 'lucide-react';

interface LabResult {
  id: string;
  pet_id: string;
  test_date: string;
  lab_name?: string | null;
  source_image_url?: string | null;
  ai_extracted_values: Record<string, any>;
  flagged_abnormalities?: string[] | null;
  ai_summary?: string | null;
  pets?: { name: string } | null;
}

export default function LabsPage() {
  const [labs, setLabs] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/labs', {
          headers: { Authorization: 'Bearer ' + (session?.access_token ?? '') },
          credentials: 'include',
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json?.error?.message ?? 'Failed to load lab results');
          setLabs([]);
        } else {
          setLabs((json.data as LabResult[]) ?? []);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load lab results');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const flaggedCount = labs.reduce(
    (acc, l) => acc + (l.flagged_abnormalities?.length ?? 0),
    0
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">🧪 Lab Results</h1>
          <p className="text-ink-500 mt-1">
            Bloodwork, urinalysis, and other tests with AI-extracted values.
          </p>
        </div>

        {!loading && labs.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Card>
              <CardBody className="text-center">
                <p className="text-3xl font-display font-bold">{labs.length}</p>
                <p className="text-xs text-ink-500 mt-1">Total tests</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <p className="text-3xl font-display font-bold text-semantic-warning">{flaggedCount}</p>
                <p className="text-xs text-ink-500 mt-1">Flagged values</p>
              </CardBody>
            </Card>
            <Card className="col-span-2 sm:col-span-1">
              <CardBody className="text-center">
                <p className="text-3xl font-display font-bold text-brand-primary">
                  {new Set(labs.map((l) => l.pet_id)).size}
                </p>
                <p className="text-xs text-ink-500 mt-1">Pets tested</p>
              </CardBody>
            </Card>
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-ink-500">Loading lab results…</p>
        ) : error ? (
          <Card>
            <CardBody>
              <EmptyState emoji="⚠️" title="Could not load lab results" description={error} />
            </CardBody>
          </Card>
        ) : labs.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                emoji="🧪"
                title="No lab results yet"
                description="Upload a bloodwork or urinalysis report and we'll extract the values automatically."
              />
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {labs.map((l) => {
              const expanded = expandedId === l.id;
              const abnormalities = l.flagged_abnormalities ?? [];
              return (
                <Card key={l.id}>
                  <CardHeader>
                    <div className="flex items-start gap-3 flex-wrap">
                      <div className="h-10 w-10 rounded-xl bg-brand-light text-brand-primary flex items-center justify-center flex-shrink-0">
                        <FlaskConical className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base">
                            {l.pets?.name ?? 'Pet'} · Lab panel
                          </CardTitle>
                          {abnormalities.length > 0 ? (
                            <Pill variant="warning">
                              <AlertTriangle className="h-3 w-3" /> {abnormalities.length} flagged
                            </Pill>
                          ) : (
                            <Pill variant="success">All normal</Pill>
                          )}
                        </div>
                        <p className="text-xs text-ink-500 mt-1 flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            {new Date(l.test_date).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          {l.lab_name ? (
                            <span className="flex items-center gap-1.5">
                              <Building2 className="h-3 w-3" />
                              {l.lab_name}
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody className="space-y-3">
                    {l.ai_summary ? (
                      <p className="text-sm text-ink-700 flex items-start gap-2">
                        <FileText className="h-4 w-4 text-ink-400 flex-shrink-0 mt-0.5" />
                        <span>{l.ai_summary}</span>
                      </p>
                    ) : null}
                    {abnormalities.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {abnormalities.map((a, i) => (
                          <Pill key={i} variant="warning">
                            {a}
                          </Pill>
                        ))}
                      </div>
                    ) : null}
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={
                          expanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )
                        }
                        onClick={() => setExpandedId(expanded ? null : l.id)}
                      >
                        {expanded ? 'Hide values' : 'View values'}
                      </Button>
                    </div>
                    {expanded ? (
                      <pre className="mt-2 p-3 rounded-xl bg-canvas-sunken text-xs text-ink-700 overflow-x-auto">
                        {JSON.stringify(l.ai_extracted_values ?? {}, null, 2)}
                      </pre>
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
