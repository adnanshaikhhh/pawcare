'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppShell } from '@/components/layout/AppShell';
import { MoodWeatherCard } from '@/components/v2/MoodWeatherCard';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Cloud, Sun, CloudRain, Wind, Sparkles } from 'lucide-react';

interface DailyMood {
  vibesScore: number;
  breakdown: Record<string, number>;
  dominantMood: string;
  totalLogs: number;
}

const MOOD_META: Record<string, { label: string; emoji: string; icon: typeof Cloud; color: string }> = {
  happy: { label: 'Happy', emoji: '😊', icon: Sun, color: 'text-amber-500' },
  playful: { label: 'Playful', emoji: '😺', icon: Sparkles, color: 'text-pink-500' },
  calm: { label: 'Calm', emoji: '😌', icon: Cloud, color: 'text-sky-500' },
  hungry: { label: 'Hungry', emoji: '🍽️', icon: Wind, color: 'text-orange-500' },
  sleepy: { label: 'Sleepy', emoji: '😴', icon: Cloud, color: 'text-indigo-500' },
  anxious: { label: 'Anxious', emoji: '😟', icon: Wind, color: 'text-rose-500' },
  sick: { label: 'Sick', emoji: '🤒', icon: CloudRain, color: 'text-red-500' },
  unknown: { label: 'Unknown', emoji: '❓', icon: Cloud, color: 'text-ink-400' },
};

export default function DailyMoodSummaryPage() {
  const [mood, setMood] = useState<DailyMood | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/daily-mood-summary', {
          headers: { Authorization: 'Bearer ' + (session?.access_token ?? '') },
          credentials: 'include',
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json?.error?.message ?? 'Failed to load daily mood');
        } else {
          setMood((json.data as DailyMood) ?? null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load daily mood');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">🌤️ Daily Mood</h1>
          <p className="text-ink-500 mt-1">Today&apos;s family-wide mood weather — {today}.</p>
        </div>

        {loading ? (
          <p className="text-sm text-ink-500">Loading…</p>
        ) : error ? (
          <Card><CardBody><EmptyState emoji="⚠️" title="Could not load" description={error} /></CardBody></Card>
        ) : !mood || mood.totalLogs === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                emoji="🌤️"
                title="No mood logs today"
                description="Log a mood for your pets to see the family-wide weather."
              />
            </CardBody>
          </Card>
        ) : (
          <>
            <MoodWeatherCard />

            <Card>
              <CardHeader>
                <CardTitle>Vibes Score</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="text-5xl font-display font-bold text-brand-primary">
                  {mood.vibesScore}<span className="text-2xl text-ink-400">/100</span>
                </div>
                <p className="text-sm text-ink-500 mt-1">
                  Across {mood.totalLogs} log{mood.totalLogs !== 1 ? 's' : ''} today
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mood breakdown</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(mood.breakdown).map(([moodKey, count]) => {
                    const meta = MOOD_META[moodKey] ?? MOOD_META.unknown;
                    const Icon = meta.icon;
                    return (
                      <div key={moodKey} className="flex items-center gap-2 p-2 rounded-xl bg-canvas-sunken">
                        <Icon className={`h-5 w-5 ${meta.color}`} />
                        <div>
                          <p className="text-sm font-medium">{meta.label}</p>
                          <p className="text-xs text-ink-500">{count}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
