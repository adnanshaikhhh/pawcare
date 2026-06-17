'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageTransition } from '@/components/ui/PageTransition';
import { Check, X, Lightbulb, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

type Suggestion = {
  id: string;
  pet_id?: string;
  type?: string;
  reason?: string;
  message?: string;
  suggested_at?: string;
  pets?: { name?: string } | null;
};

const TYPE_LABELS: Record<string, { label: string; emoji: string; variant: 'info' | 'warning' | 'danger' | 'brand' | 'success' | 'neutral' }> = {
  medication: { label: 'Medication', emoji: '💊', variant: 'danger' },
  vet_visit: { label: 'Vet visit', emoji: '🏥', variant: 'warning' },
  vaccination: { label: 'Vaccination', emoji: '💉', variant: 'warning' },
  grooming: { label: 'Grooming', emoji: '✂️', variant: 'info' },
  weight_check: { label: 'Weight check', emoji: '⚖️', variant: 'info' },
  feeding: { label: 'Feeding', emoji: '🍽️', variant: 'brand' },
  default: { label: 'Reminder', emoji: '💡', variant: 'neutral' },
};

export default function SmartRemindersPage() {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/smart-reminders', { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to load');
      setItems(json.data ?? []);
    } catch (e: any) {
      toast.error(e.message ?? 'Could not load suggestions');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function act(id: string, action: 'act' | 'dismiss') {
    setBusy(id);
    try {
      const res = await fetch('/api/smart-reminders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed');
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success(action === 'act' ? 'Acted on' : 'Dismissed');
    } catch (e: any) {
      toast.error(e.message ?? 'Could not update');
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppShell>
      <PageTransition>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-display font-bold">💡 Smart Reminders</h1>
            <p className="text-ink-500 mt-1">AI-suggested reminders based on your pets’ patterns</p>
          </div>

          {loading ? (
            <p className="text-sm text-ink-500">Loading…</p>
          ) : items.length === 0 ? (
            <Card>
              <CardBody>
                <EmptyState
                  emoji="💡"
                  title="No smart suggestions right now"
                  description="As you log feedings, medications, and symptoms, PawCare will surface reminders that match your pets’ patterns."
                />
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-3">
              {items.map((s) => {
                const meta = TYPE_LABELS[s.type ?? ''] ?? TYPE_LABELS.default;
                return (
                  <Card key={s.id}>
                    <CardBody>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-2xl" aria-hidden>{meta.emoji}</span>
                            <p className="text-base font-semibold text-ink-900">{meta.label}</p>
                            {s.pets?.name ? (
                              <Pill variant="brand">{s.pets.name}</Pill>
                            ) : null}
                            {s.suggested_at ? (
                              <Pill variant="neutral">
                                <Clock className="h-3 w-3" />
                                {new Date(s.suggested_at).toLocaleDateString()}
                              </Pill>
                            ) : null}
                          </div>
                          {s.reason || s.message ? (
                            <div className="flex items-start gap-2 text-sm text-ink-700">
                              <Lightbulb className="h-4 w-4 mt-0.5 text-ink-500 shrink-0" />
                              <span>{s.reason || s.message}</span>
                            </div>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={busy === s.id}
                            onClick={() => act(s.id, 'dismiss')}
                            icon={<X className="h-3.5 w-3.5" />}
                          >
                            Dismiss
                          </Button>
                          <Button
                            size="sm"
                            loading={busy === s.id}
                            onClick={() => act(s.id, 'act')}
                            icon={<Check className="h-3.5 w-3.5" />}
                          >
                            Act on this
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </PageTransition>
    </AppShell>
  );
}
