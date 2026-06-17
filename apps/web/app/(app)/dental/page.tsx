'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppShell } from '@/components/layout/AppShell';
import { Select } from '@/components/ui/Input';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { usePets } from '@/hooks/usePets';
import { Stethoscope, Calendar, FileText, AlertCircle, Clock } from 'lucide-react';

interface DentalRecord {
  id: string;
  pet_id: string;
  cleaning_date: string;
  procedure_type?: string | null;
  vet_name?: string | null;
  grade?: string | null;
  notes?: string | null;
  next_due_date?: string | null;
  pets?: { name: string } | null;
}

const PROCEDURE_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'brand' | 'neutral'> = {
  cleaning: 'success',
  extraction: 'danger',
  check: 'info',
  exam: 'info',
  surgery: 'warning',
};

export default function DentalPage() {
  const { pets } = usePets();
  const [records, setRecords] = useState<DentalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [petFilter, setPetFilter] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/dental', {
          headers: { Authorization: 'Bearer ' + (session?.access_token ?? '') },
          credentials: 'include',
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json?.error?.message ?? 'Failed to load dental records');
          setRecords([]);
        } else {
          setRecords((json.data as DentalRecord[]) ?? []);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load dental records');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () => (petFilter === 'all' ? records : records.filter((r) => r.pet_id === petFilter)),
    [records, petFilter]
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">🦷 Dental Records</h1>
          <p className="text-ink-500 mt-1">Track dental health, cleanings, and issues.</p>
        </div>

        {!loading && records.length > 0 ? (
          <Card>
            <CardBody>
              <Select
                label="Filter by pet"
                value={petFilter}
                onChange={(e) => setPetFilter(e.target.value)}
              >
                <option value="all">All pets</option>
                {pets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </CardBody>
          </Card>
        ) : null}

        {loading ? (
          <p className="text-sm text-ink-500">Loading dental records…</p>
        ) : error ? (
          <Card>
            <CardBody>
              <EmptyState emoji="⚠️" title="Could not load dental records" description={error} />
            </CardBody>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                emoji="🦷"
                title={petFilter === 'all' ? 'No dental records yet' : 'No records for this pet'}
                description="Log cleanings, extractions, and check-ups so we can send timely reminders."
              />
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => {
              const proc = (r.procedure_type ?? '').toLowerCase();
              const pillVariant = PROCEDURE_VARIANT[proc] ?? 'neutral';
              return (
                <Card key={r.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-brand-light text-brand-primary flex items-center justify-center flex-shrink-0">
                          <Stethoscope className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {r.pets?.name ?? 'Pet'} ·{' '}
                            <span className="capitalize">{r.procedure_type ?? 'Procedure'}</span>
                          </CardTitle>
                          <p className="text-xs text-ink-500 mt-1 flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />{' '}
                            {new Date(r.cleaning_date).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                            {r.vet_name ? <> · {r.vet_name}</> : null}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill variant={pillVariant} className="capitalize">
                          {r.procedure_type ?? 'procedure'}
                        </Pill>
                        {r.grade ? <Pill variant="info">Grade {r.grade}</Pill> : null}
                        {r.next_due_date ? (
                          <Pill variant="brand">
                            <Clock className="h-3 w-3" /> Next:{' '}
                            {new Date(r.next_due_date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Pill>
                        ) : null}
                      </div>
                    </div>
                  </CardHeader>
                  {r.notes ? (
                    <CardBody>
                      <p className="text-sm text-ink-700 flex items-start gap-2">
                        <FileText className="h-4 w-4 text-ink-400 flex-shrink-0 mt-0.5" />
                        <span>{r.notes}</span>
                      </p>
                    </CardBody>
                  ) : null}
                </Card>
              );
            })}
          </div>
        )}

        {!loading && records.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-semantic-info" /> Why dental matters
              </CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-ink-500">
                Most pets show early dental disease by age 3. Regular cleanings and at-home brushing
                help prevent pain, tooth loss, and organ damage from chronic infection.
              </p>
            </CardBody>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
