'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pill } from '@/components/ui/Pill';
import { AppShell } from '@/components/layout/AppShell';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Target, TrendingDown, TrendingUp, Scale } from 'lucide-react';

interface WeightGoal {
  id: string;
  pet_id: string;
  start_weight_kg: number;
  target_weight_kg: number;
  created_at: string;
  pets?: { name: string; target_weight_kg: number | null } | null;
}

export default function WeightGoalsPage() {
  const [goals, setGoals] = useState<WeightGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/weight-goals', {
          headers: { Authorization: 'Bearer ' + (session?.access_token ?? '') },
          credentials: 'include',
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json?.error?.message ?? 'Failed to load weight goals');
        } else {
          setGoals((json.data as WeightGoal[]) ?? []);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load weight goals');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">⚖️ Weight Goals</h1>
          <p className="text-ink-500 mt-1">Track weight goals and progress per pet.</p>
        </div>

        {loading ? (
          <p className="text-sm text-ink-500">Loading…</p>
        ) : error ? (
          <Card><CardBody><EmptyState emoji="⚠️" title="Could not load" description={error} /></CardBody></Card>
        ) : goals.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                emoji="⚖️"
                title="No weight goals yet"
                description="Set a target weight for each pet to start tracking progress."
              />
            </CardBody>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {goals.map((g) => {
              const totalDelta = g.target_weight_kg - g.start_weight_kg;
              const Trend = totalDelta < 0 ? TrendingDown : TrendingUp;
              return (
                <Card key={g.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-brand-primary" />
                      {g.pets?.name ?? 'Pet'}
                    </CardTitle>
                    <Pill variant="brand">{g.target_weight_kg} kg target</Pill>
                  </CardHeader>
                  <CardBody>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-ink-500">
                        <Scale className="h-4 w-4" /> Start
                      </span>
                      <span className="font-medium">{g.start_weight_kg} kg</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="flex items-center gap-1 text-ink-500">
                        <Trend className="h-4 w-4" />
                        {totalDelta < 0 ? 'Lose' : totalDelta > 0 ? 'Gain' : 'Maintain'}
                      </span>
                      <span className="font-medium">
                        {Math.abs(totalDelta).toFixed(2)} kg
                      </span>
                    </div>
                    <p className="text-xs text-ink-400 mt-3">
                      Set {new Date(g.created_at).toLocaleDateString()}
                    </p>
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
