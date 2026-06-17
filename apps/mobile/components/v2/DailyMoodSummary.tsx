import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { MOOD_LABELS, SPECIES_LABELS } from '@/src-shared';
import type { Mood, Pet } from '@/src-shared';
import { Calendar, ChevronRight } from 'lucide-react-native';

interface PetToday {
  pet: Pet;
  mood: Mood | null;
  appetite: string | null;
  energy: string | null;
}

/**
 * Daily Mood Summary widget
 * Shows today's logged mood for each pet at a glance.
 * Renders nothing for pets not logged today (with a "+" affordance).
 */
export function DailyMoodSummary() {
  const [data, setData] = useState<PetToday[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const today = new Date().toISOString().split('T')[0];
        const [{ data: pets }, { data: moods }] = await Promise.all([
          supabase.from('pets').select('*').eq('is_active', true).order('display_order'),
          supabase
            .from('mood_logs')
            .select('pet_id, mood, appetite, energy_level, logged_date')
            .eq('logged_date', today),
        ]);
        if (cancelled) return;
        const byPet = new Map<string, { mood: Mood; appetite: string | null; energy: string | null }>();
        for (const m of moods ?? []) {
          byPet.set(m.pet_id, {
            mood: m.mood as Mood,
            appetite: m.appetite,
            energy: m.energy_level,
          });
        }
        const list: PetToday[] = (pets ?? []).map((p) => {
          const entry = byPet.get(p.id);
          return {
            pet: p as Pet,
            mood: entry?.mood ?? null,
            appetite: entry?.appetite ?? null,
            energy: entry?.energy ?? null,
          };
        });
        if (!cancelled) setData(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const logged = data.filter((d) => d.mood !== null);
    const total = data.length;
    const happy = logged.filter((d) => d.mood === 'happy' || d.mood === 'playful').length;
    return { logged: logged.length, total, happy };
  }, [data]);

  if (loading) {
    return (
      <Card className="p-4 mb-4">
        <ActivityIndicator color="#FF6B6B" />
      </Card>
    );
  }
  if (data.length === 0) return null;

  return (
    <Card className="p-4 mb-4">
      <View className="flex-row items-center mb-3">
        <View className="h-10 w-10 rounded-2xl bg-brand-light items-center justify-center mr-3">
          <Calendar color="#FF6B6B" size={22} />
        </View>
        <View className="flex-1">
          <Text className="text-xs text-ink-500">Today</Text>
          <Text className="text-lg font-bold text-ink-900">
            Daily mood · {stats.logged}/{stats.total} logged
          </Text>
        </View>
        <Link href="/reminders" asChild>
          <Pressable className="h-8 w-8 rounded-full bg-canvas-sunken items-center justify-center">
            <ChevronRight color="#6E6E73" size={16} />
          </Pressable>
        </Link>
      </View>

      <View className="flex-row gap-2 mb-3">
        <View className="flex-1 bg-green-50 rounded-xl px-3 py-2">
          <Text className="text-[10px] text-semantic-success font-semibold uppercase">Happy / playful</Text>
          <Text className="text-lg font-bold text-semantic-success">{stats.happy}</Text>
        </View>
        <View className="flex-1 bg-amber-50 rounded-xl px-3 py-2">
          <Text className="text-[10px] text-semantic-warning font-semibold uppercase">Not yet</Text>
          <Text className="text-lg font-bold text-semantic-warning">{stats.total - stats.logged}</Text>
        </View>
      </View>

      <View className="flex-row gap-2 flex-wrap">
        {data.map(({ pet, mood }) => {
          const cfg = mood ? MOOD_LABELS[mood] : null;
          return (
            <Link key={pet.id} href={`/pet/${pet.id}`} asChild>
              <Pressable
                className="flex-1 min-w-[70px] rounded-xl px-2 py-2 items-center"
                style={{
                  backgroundColor: cfg ? cfg.color + '22' : '#F4F4F6',
                  borderWidth: 1,
                  borderColor: cfg ? cfg.color + '55' : 'transparent',
                  borderStyle: cfg ? 'solid' : 'dashed',
                }}
              >
                <Text className="text-xl">{cfg ? cfg.emoji : '＋'}</Text>
                <Text className="text-xs font-medium text-ink-900 mt-0.5" numberOfLines={1}>
                  {pet.name}
                </Text>
                <Text className="text-[10px] text-ink-500" numberOfLines={1}>
                  {cfg ? cfg.label : `${SPECIES_LABELS[pet.species].emoji} log`}
                </Text>
              </Pressable>
            </Link>
          );
        })}
      </View>
    </Card>
  );
}
