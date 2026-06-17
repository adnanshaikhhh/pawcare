'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageTransition } from '@/components/ui/PageTransition';
import { Check, Clock, User, Cat, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

type Responsibility = {
  id: string;
  assignee_id: string;
  pet_id?: string | null;
  task_type: string;
  recurrence?: string | null;
  time_of_day?: string | null;
  notes?: string | null;
  active: boolean;
  profiles?: { full_name?: string; avatar_url?: string } | null;
  pets?: { name?: string } | null;
};

const TASK_LABELS: Record<string, { label: string; emoji: string }> = {
  feeding: { label: 'Feeding', emoji: '🍽️' },
  medication: { label: 'Medication', emoji: '💊' },
  litter: { label: 'Litter', emoji: '🪣' },
  cleaning: { label: 'Cleaning', emoji: '🧹' },
  walk: { label: 'Walk', emoji: '🚶' },
  custom: { label: 'Custom', emoji: '✨' },
};

const RECURRENCE_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  weekdays: 'Weekdays',
  custom: 'Custom',
};

export default function ResponsibilitiesPage() {
  const [items, setItems] = useState<Responsibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/responsibilities', { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to load');
      setItems(json.data ?? []);
    } catch (e: any) {
      toast.error(e.message ?? 'Could not load responsibilities');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function markDone(id: string) {
    setMarking(id);
    try {
      const res = await fetch(`/api/responsibilities?id=${id}`, { method: 'DELETE', credentials: 'include' });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error?.message ?? 'Failed to mark done');
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success('Marked done');
    } catch (e: any) {
      toast.error(e.message ?? 'Could not mark done');
    } finally {
      setMarking(null);
    }
  }

  return (
    <AppShell>
      <PageTransition>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-display font-bold">📋 Family Responsibilities</h1>
            <p className="text-ink-500 mt-1">Who feeds, walks, and medicates which pet</p>
          </div>

          {loading ? (
            <p className="text-sm text-ink-500">Loading…</p>
          ) : items.length === 0 ? (
            <Card>
              <CardBody>
                <EmptyState
                  emoji="📋"
                  title="No active responsibilities"
                  description="Add responsibilities on the Family page so everyone knows who does what, when."
                />
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-3">
              {items.map((r) => {
                const meta = TASK_LABELS[r.task_type] ?? { label: r.task_type, emoji: '✨' };
                return (
                  <Card key={r.id}>
                    <CardBody>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-2xl" aria-hidden>{meta.emoji}</span>
                            <p className="text-base font-semibold text-ink-900">{meta.label}</p>
                            {r.pets?.name ? (
                              <Pill variant="brand">
                                <Cat className="h-3 w-3" />
                                {r.pets.name}
                              </Pill>
                            ) : null}
                            {r.recurrence ? (
                              <Pill variant="info">
                                <Clock className="h-3 w-3" />
                                {RECURRENCE_LABELS[r.recurrence] ?? r.recurrence}
                              </Pill>
                            ) : null}
                            {r.time_of_day ? (
                              <Pill variant="neutral">{r.time_of_day}</Pill>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-1.5 text-sm text-ink-700">
                            <User className="h-3.5 w-3.5 text-ink-500" />
                            <span>{r.profiles?.full_name ?? 'Unassigned'}</span>
                          </div>

                          {r.notes ? (
                            <p className="text-sm text-ink-500 italic">“{r.notes}”</p>
                          ) : null}
                        </div>

                        <Button
                          size="sm"
                          variant="secondary"
                          loading={marking === r.id}
                          onClick={() => markDone(r.id)}
                          icon={<Check className="h-3.5 w-3.5" />}
                        >
                          Mark done
                        </Button>
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
