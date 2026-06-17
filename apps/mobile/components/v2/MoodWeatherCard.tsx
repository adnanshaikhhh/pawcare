import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { MOOD_LABELS, SPECIES_LABELS } from '@/src-shared';
import type { Mood, Pet } from '@/src-shared';
import { Sun, Cloud, CloudRain, CloudSnow, Wind, ChevronRight } from 'lucide-react-native';

interface PetMoodSummary {
  pet: Pet;
  moods: Mood[];
}

/**
 * Cat Mood Weather Card
 * Aggregates the last 7 days of mood logs across all pets and renders
 * a "weather forecast" metaphor. Sunny = mostly happy, Cloudy = mixed,
 * Rainy = anxious/sick, etc.
 */
export function MoodWeatherCard() {
  const [summaries, setSummaries] = useState<PetMoodSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
        const [{ data: pets }, { data: moods }] = await Promise.all([
          supabase.from('pets').select('*').eq('is_active', true),
          supabase.from('mood_logs').select('pet_id, mood, logged_date').gte('logged_date', since.split('T')[0]),
        ]);
        if (cancelled) return;
        const byPet = new Map<string, Mood[]>();
        for (const m of moods ?? []) {
          const arr = byPet.get(m.pet_id) ?? [];
          arr.push(m.mood as Mood);
          byPet.set(m.pet_id, arr);
        }
        const list: PetMoodSummary[] = (pets ?? []).map((p) => ({
          pet: p as Pet,
          moods: byPet.get(p.id) ?? [],
        }));
        if (!cancelled) setSummaries(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const weather = useMemo(() => deriveWeather(summaries), [summaries]);

  if (loading) return null;
  // Only show if we have any mood data
  const totalLogs = summaries.reduce((acc, s) => acc + s.moods.length, 0);
  if (totalLogs === 0) return null;

  const Icon = weather.icon;
  const hasCats = summaries.some((s) => s.pet.species === 'cat');

  return (
    <Card className="p-4 mb-5 overflow-hidden">
      <View className="flex-row items-center mb-3">
        <View
          className="h-10 w-10 rounded-2xl items-center justify-center mr-3"
          style={{ backgroundColor: weather.bg }}
        >
          <Icon color={weather.fg} size={22} />
        </View>
        <View className="flex-1">
          <Text className="text-xs text-ink-500">Family mood · last 7 days</Text>
          <Text className="text-lg font-bold text-ink-900">{weather.title}</Text>
        </View>
        <Link href="/pet" asChild>
          <Pressable className="h-8 w-8 rounded-full bg-canvas-sunken items-center justify-center">
            <ChevronRight color="#6E6E73" size={16} />
          </Pressable>
        </Link>
      </View>

      <Text className="text-sm text-ink-700 mb-3">{weather.subtitle}</Text>

      {/* Mini forecast for each pet */}
      <View className="flex-row gap-2 flex-wrap">
        {summaries.map(({ pet, moods }) => {
          if (moods.length === 0) return null;
          const dominant = pickDominant(moods);
          const cfg = MOOD_LABELS[dominant];
          return (
            <Link key={pet.id} href={`/pet/${pet.id}`} asChild>
              <Pressable className="flex-1 min-w-[80px] rounded-xl bg-canvas-sunken px-2 py-2 items-center">
                <Text className="text-lg">{cfg.emoji}</Text>
                <Text className="text-xs font-medium text-ink-900 mt-0.5" numberOfLines={1}>
                  {pet.name}
                </Text>
                <Text className="text-[10px] text-ink-500">
                  {moods.length} log{moods.length === 1 ? '' : 's'}
                </Text>
              </Pressable>
            </Link>
          );
        })}
      </View>

      {hasCats ? (
        <Text className="text-[10px] text-ink-300 mt-2">
          Purr-cast updated daily
        </Text>
      ) : null}
    </Card>
  );
}

function pickDominant(moods: Mood[]): Mood {
  const counts: Partial<Record<Mood, number>> = {};
  for (const m of moods) counts[m] = (counts[m] ?? 0) + 1;
  let best: Mood = 'normal';
  let bestN = 0;
  for (const [m, n] of Object.entries(counts) as [Mood, number][]) {
    if (n > bestN) {
      best = m;
      bestN = n;
    }
  }
  return best;
}

function deriveWeather(summaries: PetMoodSummary[]): {
  title: string;
  subtitle: string;
  icon: typeof Sun;
  bg: string;
  fg: string;
} {
  const all = summaries.flatMap((s) => s.moods);
  if (all.length === 0) {
    return { title: 'No data yet', subtitle: 'Log a mood to see the forecast.', icon: Cloud, bg: '#F4F4F6', fg: '#6E6E73' };
  }
  const counts: Partial<Record<Mood, number>> = {};
  for (const m of all) counts[m] = (counts[m] ?? 0) + 1;
  const total = all.length;
  const pct = (m: Mood) => (counts[m] ?? 0) / total;

  const negative = pct('sick') + pct('anxious') + pct('aggressive') + pct('tired');
  const positive = pct('happy') + pct('playful') + pct('calm') + pct('normal');

  if (negative >= 0.5) {
    return {
      title: 'Stormy skies',
      subtitle: 'Several pets seem off. Worth a closer look at health and environment.',
      icon: CloudRain,
      bg: '#FFE5E5',
      fg: '#FF3B30',
    };
  }
  if (negative >= 0.25) {
    return {
      title: 'A bit cloudy',
      subtitle: 'Mixed moods this week — some pets could use extra attention.',
      icon: Cloud,
      bg: '#FFF3E0',
      fg: '#FF9F0A',
    };
  }
  if (positive >= 0.75 && pct('playful') >= 0.3) {
    return {
      title: 'Bright & playful',
      subtitle: 'The whole family is in a great mood — zoomies incoming!',
      icon: Sun,
      bg: '#FFF9C4',
      fg: '#FF9F0A',
    };
  }
  return {
    title: 'Mostly sunny',
    subtitle: 'Things are looking good across the family.',
    icon: Sun,
    bg: '#FFF0EE',
    fg: '#FF6B6B',
  };
}
