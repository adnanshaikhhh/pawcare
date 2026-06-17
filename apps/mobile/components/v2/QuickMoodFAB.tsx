import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { MOOD_LABELS } from '@/src-shared';
import type { Mood, Pet } from '@/src-shared';
import { SmilePlus, X } from 'lucide-react-native';

/**
 * Quick Mood Log FAB
 * Tap the floating + button to log a mood in under 2 seconds.
 * Workflow: tap FAB → pick pet → tap emoji → done.
 */
export function QuickMoodFAB({ onLogged }: { onLogged?: () => void }) {
  const [open, setOpen] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'pet' | 'mood'>('pet');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data } = await supabase
          .from('pets')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        if (!cancelled && data) {
          setPets(data as Pet[]);
          if (data.length === 1) {
            setSelectedPetId(data[0].id);
            setStep('mood');
          }
        }
      } catch {
        // silent
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  function close() {
    setOpen(false);
    setStep('pet');
    setSelectedPetId(null);
  }

  async function logMood(mood: Mood) {
    if (!selectedPetId) return;
    setLoading(true);
    const start = Date.now();
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('mood_logs').insert({
        pet_id: selectedPetId,
        mood,
        logged_date: today,
        appetite: null,
        energy_level: null,
        notes: null,
      });
      if (error) throw error;
      const elapsed = Date.now() - start;
      // ensure UX is at least ~600ms so the tap feels intentional
      if (elapsed < 600) await new Promise((r) => setTimeout(r, 600 - elapsed));
      close();
      onLogged?.();
    } catch (e) {
      Alert.alert('Could not log mood', e instanceof Error ? e.message : 'Try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating action button */}
      <Pressable
        onPress={() => setOpen(true)}
        className="absolute bottom-6 right-6 h-14 w-14 rounded-full bg-brand-primary items-center justify-center"
        style={{
          shadowColor: '#FF6B6B',
          shadowOpacity: 0.4,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        }}
        accessibilityLabel="Quick mood log"
      >
        <SmilePlus color="white" size={24} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
        <Pressable className="flex-1 bg-black/40" onPress={close} />
        <View className="bg-white rounded-t-3xl p-5" style={{ maxHeight: '80%' }}>
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-lg font-bold text-ink-900">
                {step === 'pet' ? 'Which pet?' : 'How are they feeling?'}
              </Text>
              <Text className="text-xs text-ink-500">
                {step === 'pet' ? 'Tap a pet to log their mood' : 'Tap an emoji — done in 2 seconds'}
              </Text>
            </View>
            <Pressable onPress={close} className="h-9 w-9 rounded-full bg-canvas-sunken items-center justify-center">
              <X color="#1C1C1E" size={16} />
            </Pressable>
          </View>

          {step === 'pet' ? (
            <ScrollView style={{ maxHeight: 360 }}>
              {pets.length === 0 ? (
                <Text className="text-center text-ink-500 py-8">No pets yet. Add one from the Pets tab.</Text>
              ) : (
                <View className="flex-row flex-wrap gap-3">
                  {pets.map((p) => (
                    <Pressable
                      key={p.id}
                      onPress={() => {
                        setSelectedPetId(p.id);
                        setStep('mood');
                      }}
                      className="items-center p-2 rounded-2xl bg-canvas-sunken"
                      style={{ width: 80 }}
                    >
                      <View className="h-12 w-12 rounded-full bg-brand-light items-center justify-center">
                        <Text className="text-2xl">{p.species === 'cat' ? '🐱' : p.species === 'dog' ? '🐶' : '🐾'}</Text>
                      </View>
                      <Text className="text-xs font-medium text-ink-900 mt-1" numberOfLines={1}>
                        {p.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </ScrollView>
          ) : (
            <ScrollView>
              {loading ? (
                <View className="py-10 items-center">
                  <ActivityIndicator color="#FF6B6B" />
                </View>
              ) : (
                <View className="flex-row flex-wrap gap-3">
                  {(Object.keys(MOOD_LABELS) as Mood[]).map((m) => {
                    const cfg = MOOD_LABELS[m];
                    return (
                      <Pressable
                        key={m}
                        onPress={() => logMood(m)}
                        className="items-center p-3 rounded-2xl"
                        style={{ width: '30%', backgroundColor: cfg.color + '22' }}
                      >
                        <Text className="text-3xl">{cfg.emoji}</Text>
                        <Text className="text-xs font-semibold text-ink-900 mt-1">{cfg.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </>
  );
}
