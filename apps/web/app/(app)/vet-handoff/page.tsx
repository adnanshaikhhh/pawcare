'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { AppShell } from '@/components/layout/AppShell';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { HandHeart, MapPin, Clock, User, CheckCircle2, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

interface Handoff {
  id: string;
  pet_id: string;
  traveler_id: string;
  started_at: string;
  estimated_return?: string;
  ended_at?: string | null;
  live_updates?: Array<{ text: string; at: string; by: string }>;
  pets?: { name: string } | null;
  profiles?: { full_name: string; avatar_url?: string } | null;
}

export default function VetHandoffPage() {
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ending, setEnding] = useState<string | null>(null);

  const fetchHandoffs = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/vet-handoff', {
        headers: { Authorization: 'Bearer ' + (session?.access_token ?? '') },
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? 'Failed to load');
      } else {
        setHandoffs((json.data as Handoff[]) ?? []);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHandoffs(); }, []);

  const handleEnd = async (id: string) => {
    setEnding(id);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/vet-handoff', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + (session?.access_token ?? ''),
        },
        credentials: 'include',
        body: JSON.stringify({ id, action: 'end' }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error('Failed to end handoff: ' + (json?.error?.message ?? ''));
      } else {
        toast.success('Handoff ended — marked as completed.');
        await fetchHandoffs();
      }
    } catch (e: any) {
      toast.error('Network error: ' + (e?.message ?? ''));
    } finally {
      setEnding(null);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">🤝 Vet Handoff</h1>
          <p className="text-ink-500 mt-1">Live updates when one person takes the pet to the vet.</p>
        </div>

        {loading ? (
          <p className="text-sm text-ink-500">Loading…</p>
        ) : error ? (
          <Card><CardBody><EmptyState emoji="⚠️" title="Could not load" description={error} /></CardBody></Card>
        ) : handoffs.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                emoji="🤝"
                title="No active handoffs"
                description="When someone in the family takes a pet to the vet, the handoff shows up here for live updates."
              />
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {handoffs.map((h) => (
              <Card key={h.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HandHeart className="h-5 w-5 text-brand-primary" />
                    {h.pets?.name ?? 'Pet'}
                  </CardTitle>
                  <Pill variant="success">Active</Pill>
                </CardHeader>
                <CardBody>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-ink-500 font-medium flex items-center gap-1">
                        <User className="h-3 w-3" /> Traveler
                      </p>
                      <p className="text-sm text-ink-900 mt-1">
                        {h.profiles?.full_name ?? 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-ink-500 font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Started
                      </p>
                      <p className="text-sm text-ink-900 mt-1">
                        {new Date(h.started_at).toLocaleString()}
                      </p>
                    </div>
                    {h.estimated_return ? (
                      <div className="sm:col-span-2">
                        <p className="text-xs uppercase tracking-wide text-ink-500 font-medium flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Estimated return
                        </p>
                        <p className="text-sm text-ink-900 mt-1">{h.estimated_return}</p>
                      </div>
                    ) : null}
                  </div>

                  {h.live_updates && h.live_updates.length > 0 ? (
                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-wide text-ink-500 font-medium flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> Live updates
                      </p>
                      <ul className="mt-2 space-y-2">
                        {h.live_updates.map((u, i) => (
                          <li key={i} className="text-sm bg-canvas-sunken rounded-xl p-3">
                            <p className="text-ink-900">{u.text}</p>
                            <p className="text-xs text-ink-500 mt-1">
                              {new Date(u.at).toLocaleString()}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="secondary"
                      onClick={() => handleEnd(h.id)}
                      disabled={ending === h.id}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      {ending === h.id ? 'Ending…' : 'End handoff'}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
