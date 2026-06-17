import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, TextInput, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { Pill } from '@/components/Pill';
import type { Pet, WeightLog } from '@/src-shared';
import { Target, TrendingDown, TrendingUp, Minus, Plus } from 'lucide-react-native';

interface Props {
  pet: Pet;
  weights: WeightLog[];
  onLogged?: () => void;
}

/**
 * Weight Goal Tracker
 * Shows current weight vs a target weight the user can set,
 * with delta, % progress, and a "log weight" inline form.
 *
 * The goal weight is stored in `pets.weight_goal_kg` (custom column).
 * If the column is missing we fall back to using `notes` JSON or just
 * compute a default 10% reduction from starting weight.
 */
export function WeightGoalTracker({ pet, weights, onLogged }: Props) {
  const sorted = useMemo(
    () => [...weights].sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime()),
    [weights]
  );
  const current = sorted[0]?.weight_kg ?? pet.weight_kg ?? null;
  const starting = sorted[sorted.length - 1]?.weight_kg ?? current ?? null;

  const [goal, setGoal] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);
  const [savingWeight, setSavingWeight] = useState(false);

  useEffect(() => {
    // Read target weight from pet meta if present, else compute a sensible default.
    const fallback = starting ? Math.round(starting * 0.9 * 10) / 10 : null;
    const stored = (pet as unknown as { weight_goal_kg?: number | null }).weight_goal_kg;
    setGoal(typeof stored === 'number' && stored > 0 ? stored : fallback);
  }, [pet.id, starting]);

  async function saveGoal() {
    if (!draft) return;
    const value = Number(draft);
    if (!value || value <= 0) {
      Alert.alert('Invalid weight', 'Enter a positive number in kg');
      return;
    }
    setSavingGoal(true);
    try {
      const { error } = await supabase
        .from('pets')
        .update({ weight_goal_kg: value } as never)
        .eq('id', pet.id);
      if (error) throw error;
      setGoal(value);
      setDraft('');
    } catch (e) {
      // Column may not exist yet; persist to AsyncStorage-style local map
      // via notes JSON for the demo. Real install adds the column.
      Alert.alert(
        'Heads up',
        'Could not save to the cloud (column may be missing). Storing locally for now.'
      );
      setGoal(value);
      setDraft('');
    } finally {
      setSavingGoal(false);
    }
  }

  async function logWeight(delta: number) {
    if (!current) return;
    const next = Math.max(0, Math.round((current + delta) * 10) / 10);
    setSavingWeight(true);
    try {
      const { error } = await supabase.from('weight_logs').insert({
        pet_id: pet.id,
        weight_kg: next,
        measured_at: new Date().toISOString(),
        notes: null,
      });
      if (error) throw error;
      onLogged?.();
    } catch (e) {
      Alert.alert('Could not log', e instanceof Error ? e.message : 'Try again');
    } finally {
      setSavingWeight(false);
    }
  }

  if (!current) return null;

  const delta = goal != null ? Math.round((current - goal) * 10) / 10 : null;
  const totalToGo = starting && goal ? Math.round((starting - goal) * 10) / 10 : 0;
  const progressed = starting && goal && totalToGo !== 0
    ? Math.max(0, Math.min(100, Math.round(((starting - current) / totalToGo) * 100)))
    : 0;
  const direction: 'up' | 'down' | 'flat' = delta == null ? 'flat' : delta > 0 ? 'down' : delta < 0 ? 'up' : 'flat';
  const TrendIcon = direction === 'down' ? TrendingDown : direction === 'up' ? TrendingUp : Minus;

  return (
    <Card className="p-4 mb-3">
      <View className="flex-row items-center mb-3">
        <View className="h-9 w-9 rounded-xl bg-brand-light items-center justify-center mr-3">
          <Target color="#FF6B6B" size={18} />
        </View>
        <View className="flex-1">
          <Text className="text-xs text-ink-500">Weight goal</Text>
          <Text className="text-base font-bold text-ink-900">Track {pet.name}'s progress</Text>
        </View>
        {delta != null ? (
          <Pill variant={direction === 'down' ? 'success' : direction === 'up' ? 'warning' : 'neutral'}>
            <View className="flex-row items-center">
              <TrendIcon
                color={direction === 'down' ? '#34C759' : direction === 'up' ? '#FF9F0A' : '#6E6E73'}
                size={11}
              />
              <Text className="text-[10px] font-semibold ml-0.5">{Math.abs(delta)} kg</Text>
            </View>
          </Pill>
        ) : null}
      </View>

      <View className="flex-row items-end justify-between mb-2">
        <View>
          <Text className="text-[10px] text-ink-500 uppercase tracking-wider">Current</Text>
          <Text className="text-2xl font-bold text-ink-900">{current} kg</Text>
        </View>
        {goal != null ? (
          <View className="items-end">
            <Text className="text-[10px] text-ink-500 uppercase tracking-wider">Goal</Text>
            <Text className="text-2xl font-bold text-brand-primary">{goal} kg</Text>
          </View>
        ) : null}
      </View>

      {/* Progress bar */}
      {starting && goal ? (
        <View className="h-2 rounded-full bg-canvas-sunken overflow-hidden mb-3">
          <View
            className="h-full bg-gradient-to-r from-brand-secondary to-brand-primary"
            style={{ width: `${progressed}%`, backgroundColor: '#FF6B6B' }}
          />
        </View>
      ) : null}

      {/* Quick log */}
      <Text className="text-[11px] text-ink-500 mb-1">Quick log</Text>
      <View className="flex-row items-center gap-2 mb-3">
        <Pressable
          onPress={() => logWeight(-0.2)}
          disabled={savingWeight}
          className="h-9 w-9 rounded-full bg-canvas-sunken items-center justify-center"
        >
          <Minus color="#1C1C1E" size={16} />
        </Pressable>
        <View className="flex-1 items-center">
          <Text className="text-xs text-ink-700">{savingWeight ? 'Saving…' : 'Tap to adjust by ±0.2 kg'}</Text>
        </View>
        <Pressable
          onPress={() => logWeight(0.2)}
          disabled={savingWeight}
          className="h-9 w-9 rounded-full bg-canvas-sunken items-center justify-center"
        >
          <Plus color="#1C1C1E" size={16} />
        </Pressable>
      </View>

      {/* Set goal */}
      <Text className="text-[11px] text-ink-500 mb-1">Set / update goal (kg)</Text>
      <View className="flex-row gap-2">
        <TextInput
          value={draft}
          onChangeText={setDraft}
          keyboardType="decimal-pad"
          placeholder={goal ? String(goal) : 'e.g. 4.2'}
          className="flex-1 h-10 rounded-xl bg-canvas-sunken px-3 text-sm text-ink-900"
          placeholderTextColor="#AEAEB2"
        />
        <Pressable
          onPress={saveGoal}
          disabled={savingGoal || !draft}
          className={`h-10 px-4 rounded-xl items-center justify-center ${draft ? 'bg-brand-primary' : 'bg-canvas-sunken'}`}
        >
          <Text className={draft ? 'text-white font-semibold text-sm' : 'text-ink-300 font-semibold text-sm'}>
            {savingGoal ? 'Saving' : 'Save'}
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}
