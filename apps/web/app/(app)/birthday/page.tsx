'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppShell } from '@/components/layout/AppShell';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { PartyPopper, Cake, Calendar, Sparkles } from 'lucide-react';

interface BirthdayCard {
  id: string;
  pet_id: string;
  year: number;
  card_data: any;
  generated_at: string;
  pets?: { name: string; photo_url?: string | null; date_of_birth?: string | null } | null;
}

const CURRENT_YEAR = new Date().getFullYear();

function cardImageUrl(card: BirthdayCard): string | null {
  const d = card.card_data;
  if (!d || typeof d !== 'object') return null;
  return d.image_url ?? d.imageUrl ?? d.card_image_url ?? d.cardUrl ?? null;
}

function cardMessage(card: BirthdayCard): string | null {
  const d = card.card_data;
  if (!d || typeof d !== 'object') return null;
  return d.message ?? d.caption ?? d.text ?? null;
}

export default function BirthdayPage() {
  const [cards, setCards] = useState<BirthdayCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<number>(CURRENT_YEAR);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`/api/birthday?year=${year}`, {
          headers: { Authorization: 'Bearer ' + (session?.access_token ?? '') },
          credentials: 'include',
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json?.error?.message ?? 'Failed to load birthday cards');
          setCards([]);
        } else {
          setCards((json.data as BirthdayCard[]) ?? []);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load birthday cards');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [year]);

  const yearOptions = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">🎂 Pet Birthdays</h1>
          <p className="text-ink-500 mt-1">Cards and celebrations for your pets.</p>
        </div>

        <Card>
          <CardBody className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-2 text-sm text-ink-700">
              <Calendar className="h-4 w-4 text-brand-primary" /> Show year
            </div>
            <div className="flex gap-2">
              {yearOptions.map((y) => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={
                    'h-9 px-4 rounded-full text-sm font-medium transition ' +
                    (y === year
                      ? 'bg-brand-primary text-white shadow-brand-glow'
                      : 'bg-canvas-sunken text-ink-700 hover:bg-ink-100')
                  }
                >
                  {y}
                </button>
              ))}
            </div>
          </CardBody>
        </Card>

        {loading ? (
          <p className="text-sm text-ink-500">Loading birthday cards…</p>
        ) : error ? (
          <Card>
            <CardBody>
              <EmptyState emoji="⚠️" title="Could not load birthday cards" description={error} />
            </CardBody>
          </Card>
        ) : cards.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                emoji="🎂"
                title={`No birthday cards for ${year}`}
                description="Generate a celebration card for your pet's special day."
                action={
                  <div className="flex items-center gap-1.5 text-sm text-ink-500">
                    <PartyPopper className="h-4 w-4" /> Coming soon
                  </div>
                }
              />
            </CardBody>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((c) => {
              const img = cardImageUrl(c);
              const msg = cardMessage(c);
              return (
                <Card key={c.id} hover className="overflow-hidden">
                  <div className="aspect-[4/5] bg-gradient-to-br from-brand-light to-canvas-sunken relative overflow-hidden">
                    {img ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    ) : c.pets?.photo_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={c.pets.photo_url}
                        alt={c.pets.name ?? 'Pet'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-7xl">🐾</div>
                    )}
                    <div className="absolute top-2 left-2">
                      <Pill variant="brand" className="bg-white/90">
                        <Cake className="h-3 w-3" /> {c.year}
                      </Pill>
                    </div>
                  </div>
                  <CardBody>
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="h-4 w-4 text-brand-primary" />
                      <CardTitle className="text-base">{c.pets?.name ?? 'Pet'}</CardTitle>
                    </div>
                    {msg ? (
                      <p className="text-sm text-ink-700 line-clamp-3">{msg}</p>
                    ) : (
                      <p className="text-sm text-ink-400 italic">Card generated for {c.year}</p>
                    )}
                    {c.pets?.date_of_birth ? (
                      <p className="text-xs text-ink-500 mt-2 flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        Born {new Date(c.pets.date_of_birth).toLocaleDateString()}
                      </p>
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
