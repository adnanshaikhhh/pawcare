'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppShell } from '@/components/layout/AppShell';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Pill as PillIcon, AlertCircle, ShieldCheck, Users } from 'lucide-react';

interface Medication {
  id: string;
  medicine_name: string;
  purpose?: string | null;
  is_active: boolean;
  pet_id: string;
}

interface Interaction {
  type: string;
  severity: 'info' | 'warning' | 'danger' | string;
  description: string;
  recommendation: string;
  pet_ids: string[];
}

interface InteractionResponse {
  medications: Medication[];
  interactions: Interaction[];
}

const SEVERITY_META: Record<string, { label: string; pill: 'info' | 'warning' | 'danger' }> = {
  info: { label: 'Info', pill: 'info' },
  warning: { label: 'Moderate', pill: 'warning' },
  danger: { label: 'High', pill: 'danger' },
};

const SEVERITY_ORDER: Record<string, number> = {
  danger: 0,
  warning: 1,
  info: 2,
};

const TYPE_LABEL: Record<string, string> = {
  cross_pet_risk: 'Cross-pet risk',
  info: 'Known interaction',
};

export default function MedicationInteractionsPage() {
  const [data, setData] = useState<InteractionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/medication-interactions', {
          headers: { Authorization: 'Bearer ' + (session?.access_token ?? '') },
          credentials: 'include',
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json?.error?.message ?? 'Failed to load interactions');
          setData(null);
        } else {
          setData((json.data as InteractionResponse) ?? { medications: [], interactions: [] });
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load interactions');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const medications = data?.medications ?? [];
  const interactions = (data?.interactions ?? [])
    .slice()
    .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9));

  const highCount = interactions.filter((i) => i.severity === 'danger').length;
  const moderateCount = interactions.filter((i) => i.severity === 'warning').length;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">💊 Medication Interactions</h1>
          <p className="text-ink-500 mt-1">
            AI-checked interactions across your pets&apos; active medications.
          </p>
        </div>

        {!loading && medications.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardBody className="text-center">
                <p className="text-3xl font-display font-bold text-brand-primary">{medications.length}</p>
                <p className="text-xs text-ink-500 mt-1">Active meds</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <p className="text-3xl font-display font-bold text-semantic-danger">{highCount}</p>
                <p className="text-xs text-ink-500 mt-1">High risk</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <p className="text-3xl font-display font-bold text-semantic-warning">{moderateCount}</p>
                <p className="text-xs text-ink-500 mt-1">Moderate</p>
              </CardBody>
            </Card>
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-ink-500">Checking active medications…</p>
        ) : error ? (
          <Card>
            <CardBody>
              <EmptyState emoji="⚠️" title="Could not load interactions" description={error} />
            </CardBody>
          </Card>
        ) : medications.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                emoji="💊"
                title="No active medications"
                description="Once you log a medication for one of your pets, we'll check it for cross-reactions automatically."
              />
            </CardBody>
          </Card>
        ) : interactions.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                emoji="🛡️"
                title="No interactions detected"
                description="Your current combination of medications looks safe. We'll alert you here if anything changes."
                action={
                  <div className="flex items-center gap-1.5 text-sm text-semantic-success">
                    <ShieldCheck className="h-4 w-4" /> All clear
                  </div>
                }
              />
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {interactions.map((i, idx) => {
              const meta = SEVERITY_META[i.severity] ?? SEVERITY_META.info;
              const isCrossPet = i.type === 'cross_pet_risk';
              return (
                <Card key={`${i.type}-${idx}`} className="overflow-hidden">
                  <div className="flex">
                    <div
                      className={
                        i.severity === 'danger'
                          ? 'w-1.5 bg-semantic-danger'
                          : i.severity === 'warning'
                            ? 'w-1.5 bg-semantic-warning'
                            : 'w-1.5 bg-semantic-info'
                      }
                    />
                    <div className="flex-1">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-xl bg-canvas-sunken flex items-center justify-center flex-shrink-0">
                              {isCrossPet ? (
                                <Users className="h-5 w-5 text-semantic-warning" />
                              ) : (
                                <PillIcon className="h-5 w-5 text-semantic-info" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <CardTitle className="text-base">
                                  {TYPE_LABEL[i.type] ?? 'Interaction'}
                                </CardTitle>
                                <Pill variant={meta.pill}>{meta.label}</Pill>
                              </div>
                              <p className="text-sm text-ink-700 mt-2">{i.description}</p>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardBody className="space-y-2">
                        <div className="rounded-xl bg-canvas-sunken p-3 flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-semantic-info flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-ink-700">
                            <span className="font-medium">Recommendation: </span>
                            {i.recommendation}
                          </p>
                        </div>
                        {i.pet_ids.length > 0 ? (
                          <p className="text-xs text-ink-500">
                            Affects {i.pet_ids.length} pet{i.pet_ids.length === 1 ? '' : 's'}
                          </p>
                        ) : null}
                      </CardBody>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {!loading && medications.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">About this check</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-ink-500">
                We compare active medications against a library of known veterinary drug interactions
                and check for cross-pet risks (e.g. two pets sharing the same active ingredient).
                This is informational — always confirm with your vet before changing medications.
              </p>
            </CardBody>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
