import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { Pill } from '@/components/Pill';
import { MOOD_LABELS } from '@/src-shared';
import type { Mood, Pet } from '@/src-shared';
import { AlertTriangle, X, ChevronRight } from 'lucide-react-native';

interface AlertSignal {
  pet: Pet;
  kind: 'mood_decline' | 'appetite_low' | 'anxiety_cluster' | 'sick_pattern';
  message: string;
  severity: 'info' | 'warning' | 'alert';
  count: number;
}

/**
 * Behavior Alert banner
 * Surfaces actionable insights derived from recent mood logs.
 * Examples: "Whiskers has been anxious for 3 days" or
 * "Mochi hasn't been logged as happy in over a week."
 */
export function BehaviorAlertBanner({ onDismiss }: { onDismiss?: () => void }) {
  const [signals, setSignals] = useState<AlertSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const since = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString().split('T')[0];
        const [{ data: pets }, { data: moods }] = await Promise.all([
          supabase.from('pets').select('*').eq('is_active', true),
          supabase
            .from('mood_logs')
            .select('pet_id, mood, appetite, energy_level, logged_date')
            .gte('logged_date', since)
            .order('logged_date', { ascending: false }),
        ]);
        if (cancelled || !pets) return;

        const byPet = new Map<string, { mood: Mood; appetite: string | null; energy: string | null; date: string }[]>();
        for (const m of moods ?? []) {
          const arr = byPet.get(m.pet_id) ?? [];
          arr.push({ mood: m.mood as Mood, appetite: m.appetite, energy: m.energy_level, date: m.logged_date });
          byPet.set(m.pet_id, arr);
        }

        const out: AlertSignal[] = [];
        for (const p of pets as Pet[]) {
          const logs = byPet.get(p.id) ?? [];
          if (logs.length < 2) continue;

          // Anxious cluster (3+ in last 7 days)
          const recent = logs.filter((l) => new Date(l.date) >= new Date(Date.now() - 7 * 24 * 3600 * 1000));
          const anxious = recent.filter((l) => l.mood === 'anxious').length;
          if (anxious >= 3) {
            out.push({
              pet: p,
              kind: 'anxiety_cluster',
              message: `${p.name} has been anxious ${anxious} times this week`,
              severity: 'alert',
              count: anxious,
            });
          }

          // Sick pattern
          const sick = logs.filter((l) => l.mood === 'sick').length;
          if (sick >= 2) {
            out.push({
              pet: p,
              kind: 'sick_pattern',
              message: `${p.name} has been logged as sick ${sick} times in the last 2 weeks`,
              severity: 'alert',
              count: sick,
            });
          }

          // Mood decline — recent mood is worse than baseline
          const positives = logs.filter((l) => ['happy', 'playful', 'calm', 'normal'].includes(l.mood)).length;
          const negatives = logs.filter((l) => ['sick', 'anxious', 'aggressive', 'tired'].includes(l.mood)).length;
          if (logs.length >= 4 && negatives > positives) {
            out.push({
              pet: p,
              kind: 'mood_decline',
              message: `${p.name}'s mood has been more negative than positive lately`,
              severity: 'warning',
              count: negatives,
            });
          }

          // Appetite low
          const lowAppetite = logs.filter((l) => l.appetite === 'poor' || l.appetite === 'none').length;
          if (lowAppetite >= 2) {
            out.push({
              pet: p,
              kind: 'appetite_low',
              message: `${p.name} has had a poor appetite ${lowAppetite} times recently`,
              severity: 'warning',
              count: lowAppetite,
            });
          }
        }

        if (!cancelled) setSignals(out.slice(0, 3));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const top = signals[0];

  const bg = useMemo(() => {
    if (!top) return '#FFF9C4';
    if (top.severity === 'alert') return '#FFE5E5';
    if (top.severity === 'warning') return '#FFF3E0';
    return '#EAF4FF';
  }, [top]);
  const fg = useMemo(() => {
    if (!top) return '#8A6D00';
    if (top.severity === 'alert') return '#D70015';
    if (top.severity === 'warning') return '#B35900';
    return '#007AFF';
  }, [top]);

  if (loading || !top || dismissed) return null;

  return (
    <Card
      className="p-4 mb-4 flex-row items-center"
      style={{ backgroundColor: bg, borderColor: fg + '55', borderWidth: 1 }}
    >
      <View className="h-9 w-9 rounded-full items-center justify-center mr-3" style={{ backgroundColor: fg + '22' }}>
        <AlertTriangle color={fg} size={18} />
      </View>
      <View className="flex-1">
        <Text className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: fg }}>
          Behavior alert
        </Text>
        <Text className="text-sm font-medium text-ink-900 mt-0.5" numberOfLines={1}>
          {top.message}
        </Text>
      </View>
      <Link href={`/pet/${top.pet.id}`} asChild>
        <Pressable className="h-8 w-8 rounded-full items-center justify-center" style={{ backgroundColor: fg + '22' }}>
          <ChevronRight color={fg} size={16} />
        </Pressable>
      </Link>
      <Pressable
        onPress={() => {
          setDismissed(true);
          onDismiss?.();
        }}
        className="h-8 w-8 rounded-full items-center justify-center ml-1"
        style={{ backgroundColor: fg + '11' }}
      >
        <X color={fg} size={14} />
      </Pressable>
    </Card>
  );
}
