'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pill } from '@/components/ui/Pill';
import { Select } from '@/components/ui/Input';
import { AppShell } from '@/components/layout/AppShell';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { CalendarRange, Sparkles } from 'lucide-react';

interface Pet {
  id: string;
  name: string;
  photo_url?: string | null;
  date_of_birth?: string | null;
}

interface YearReview {
  id: string;
  pet_id: string;
  year: number;
  review_data: any;
  created_at: string;
  pets?: Pet;
}

export default function YearReviewPage() {
  const currentYear = new Date().getFullYear();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<string>('');
  const [year, setYear] = useState<number>(currentYear);
  const [review, setReview] = useState<YearReview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load pets on mount
  useEffect(() => {
    let cancelled = false;
    async function loadPets() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/pets', {
          headers: { Authorization: 'Bearer ' + (session?.access_token ?? '') },
          credentials: 'include',
        });
        const json = await res.json();
        if (!cancelled) {
          const list = (json.data as Pet[]) ?? [];
          setPets(list);
          if (list.length > 0) setSelectedPet(list[0].id);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load pets');
      }
    }
    loadPets();
    return () => { cancelled = true; };
  }, []);

  // Load review when pet/year change
  useEffect(() => {
    if (!selectedPet) return;
    let cancelled = false;
    async function loadReview() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`/api/year-review?pet_id=${selectedPet}&year=${year}`, {
          headers: { Authorization: 'Bearer ' + (session?.access_token ?? '') },
          credentials: 'include',
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json?.error?.message ?? 'Failed to load review');
          setReview(null);
        } else {
          setReview((json.data as YearReview) ?? null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load review');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadReview();
    return () => { cancelled = true; };
  }, [selectedPet, year]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">📅 Year in Review</h1>
          <p className="text-ink-500 mt-1">Annual recap of your pet&apos;s journey.</p>
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-ink-500 mb-1">Pet</label>
            <Select value={selectedPet} onChange={(e) => setSelectedPet(e.target.value)} disabled={pets.length === 0}>
              {pets.length === 0 ? <option value="">No pets</option> : null}
              {pets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </div>
          <div className="w-32">
            <label className="block text-xs text-ink-500 mb-1">Year</label>
            <Select value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
              {[currentYear, currentYear - 1, currentYear - 2].map((y) => <option key={y} value={y}>{y}</option>)}
            </Select>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-ink-500">Loading review…</p>
        ) : error ? (
          <Card><CardBody><EmptyState emoji="⚠️" title="Could not load" description={error} /></CardBody></Card>
        ) : !review ? (
          <Card>
            <CardBody>
              <EmptyState
                emoji="📅"
                title="No year review yet"
                description={`No review has been generated for this pet in ${year}.`}
              />
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarRange className="h-5 w-5 text-brand-primary" />
                {review.pets?.name ?? 'Pet'} — {review.year}
              </CardTitle>
              <Pill variant="brand"><Sparkles className="h-3 w-3" /> AI-generated</Pill>
            </CardHeader>
            <CardBody>
              {review.review_data && typeof review.review_data === 'object' ? (
                <div className="space-y-3">
                  {Object.entries(review.review_data as Record<string, unknown>).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-xs uppercase tracking-wide text-ink-500 font-medium">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-ink-900 mt-1 whitespace-pre-wrap">
                        {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-700 whitespace-pre-wrap">
                  {String(review.review_data)}
                </p>
              )}
            </CardBody>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
