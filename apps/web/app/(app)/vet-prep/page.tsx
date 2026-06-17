'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Input';
import { PageTransition } from '@/components/ui/PageTransition';
import toast from 'react-hot-toast';
import { Sparkles, RefreshCw } from 'lucide-react';

type Pet = { id: string; name: string; species?: string };
type Brief = {
  id: string;
  pet_id: string;
  ai_summary?: string;
  brief?: string;
  weight_trend?: string;
  appetite_summary?: string;
  mood_summary?: string;
  suggested_questions?: string[];
  generated_at?: string;
};

export default function VetPrepPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [petId, setPetId] = useState<string>('');
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/pets', { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => {
        if (!active) return;
        const list: Pet[] = j.data ?? [];
        setPets(list);
        if (list.length > 0) setPetId(list[0].id);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!petId) return;
    let active = true;
    setLoading(true);
    fetch(`/api/vet-prep?pet_id=${petId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => { if (active) setBriefs(j.data ?? []); })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [petId]);

  async function generate() {
    if (!petId) {
      toast.error('Please select a pet first');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/vet-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pet_id: petId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to generate brief');
      const newBrief: Brief = json.data;
      setBriefs((prev) => [newBrief, ...prev]);
      toast.success('Brief generated');
    } catch (e: any) {
      toast.error(e.message ?? 'Could not generate brief');
    } finally {
      setGenerating(false);
    }
  }

  const selectedPet = pets.find((p) => p.id === petId);

  return (
    <AppShell>
      <PageTransition>
        <div className="space-y-6">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-display font-bold">🏥 Vet Visit Prep</h1>
              <p className="text-ink-500 mt-1">AI-generated brief for the next vet visit</p>
            </div>
          </div>

          <Card>
            <CardBody>
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex-1">
                  <Select
                    label="Choose a pet"
                    value={petId}
                    onChange={(e) => setPetId(e.target.value)}
                  >
                    <option value="" disabled>Select a pet…</option>
                    {pets.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Select>
                </div>
                <Button onClick={generate} loading={generating} icon={<Sparkles className="h-4 w-4" />}>
                  Generate New Brief
                </Button>
              </div>
            </CardBody>
          </Card>

          {loading ? (
            <p className="text-sm text-ink-500">Loading…</p>
          ) : pets.length === 0 ? (
            <Card><CardBody><EmptyState emoji="🐾" title="No pets yet" description="Add a pet to generate vet visit briefs." /></CardBody></Card>
          ) : briefs.length === 0 ? (
            <Card>
              <CardBody>
                <EmptyState
                  emoji="🏥"
                  title="No briefs yet for this pet"
                  description="Tap ‘Generate New Brief’ to create an AI summary of recent weight, mood, and medical history."
                  action={<Button onClick={generate} loading={generating} icon={<Sparkles className="h-4 w-4" />}>Generate brief</Button>}
                />
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-4">
              {briefs.map((b) => (
                <Card key={b.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <CardTitle>
                        Brief for {selectedPet?.name ?? b.pet_id}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {b.generated_at ? (
                          <Pill variant="info">
                            <RefreshCw className="h-3 w-3" />
                            {new Date(b.generated_at).toLocaleDateString()}
                          </Pill>
                        ) : null}
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    {(b.ai_summary || b.brief) ? (
                      <div>
                        <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">AI summary</p>
                        <p className="mt-1 text-sm text-ink-900 whitespace-pre-wrap">{b.ai_summary || b.brief}</p>
                      </div>
                    ) : null}

                    <div className="grid sm:grid-cols-3 gap-3">
                      <SummaryTile label="Weight trend" value={b.weight_trend} />
                      <SummaryTile label="Appetite" value={b.appetite_summary} />
                      <SummaryTile label="Mood" value={b.mood_summary} />
                    </div>

                    {b.suggested_questions && b.suggested_questions.length > 0 ? (
                      <div>
                        <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Suggested questions for the vet</p>
                        <ul className="mt-2 space-y-1.5 list-disc list-inside text-sm text-ink-900">
                          {b.suggested_questions.map((q, i) => (
                            <li key={i}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PageTransition>
    </AppShell>
  );
}

function SummaryTile({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-canvas-sunken p-3">
      <p className="text-[10px] font-semibold text-ink-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-ink-900 mt-1">{value || '—'}</p>
    </div>
  );
}
