import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { usePetMedical } from '@/hooks/usePets';
import { Card } from '@/components/Card';
import { Pill } from '@/components/Pill';
import { calculateAge, SPECIES_LABELS } from '@/src-shared';
import { api } from '@/lib/api';
import type { Pet } from '@/src-shared';
import { Plus } from 'lucide-react-native';

const TABS = ['Overview', 'Vaccines', 'Meds', 'Weight', 'Mood'] as const;

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pet, setPet] = useState<Pet | null>(null);
  const { vaccinations, medications, weights, moods, visits, deworming, loading, refresh } = usePetMedical(id ?? null);
  const [tab, setTab] = useState<typeof TABS[number]>('Overview');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) api.getPet(id).then(setPet).catch(console.warn);
  }, [id]);

  const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

  if (!pet) return <View className="flex-1 items-center justify-center bg-canvas"><Text>Loading…</Text></View>;

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className={`h-32 rounded-3xl ${pet.species === 'cat' ? 'bg-pink-50' : 'bg-blue-50'} mb-4 items-center justify-center`}>
        <Text className="text-6xl">{SPECIES_LABELS[pet.species].emoji}</Text>
      </View>

      <Text className="text-3xl font-bold text-ink-900">{pet.name}</Text>
      <Text className="text-ink-500 mt-1">{pet.breed ?? SPECIES_LABELS[pet.species].label} · {calculateAge(pet.date_of_birth)}</Text>
      <View className="flex-row gap-2 mt-3 flex-wrap">
        {pet.is_neutered ? <Pill variant="success">Neutered</Pill> : null}
        {pet.is_indoor ? <Pill variant="info">Indoor</Pill> : null}
        {pet.weight_kg ? <Pill variant="brand">{pet.weight_kg} kg</Pill> : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4">
        {TABS.map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} className={`mr-2 px-4 py-2 rounded-full ${tab === t ? 'bg-brand-primary' : 'bg-white border border-ink-100'}`}>
            <Text className={tab === t ? 'text-white' : 'text-ink-700'}>{t}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View className="mt-4">
        {tab === 'Overview' ? (
          <View className="gap-2">
            <Card className="p-4">
              <Text className="text-xs text-ink-500">Latest weight</Text>
              <Text className="text-2xl font-bold mt-1">{weights[0] ? `${weights[0].weight_kg} kg` : '—'}</Text>
            </Card>
            <Card className="p-4">
              <Text className="text-xs text-ink-500">Active medications</Text>
              <Text className="text-2xl font-bold mt-1">{medications.filter((m) => m.is_active).length}</Text>
            </Card>
            <Card className="p-4">
              <Text className="text-xs text-ink-500">Total vaccines</Text>
              <Text className="text-2xl font-bold mt-1">{vaccinations.length}</Text>
            </Card>
            {visits.length > 0 ? (
              <Card className="p-4">
                <Text className="font-semibold mb-2">Recent vet visit</Text>
                <Text className="text-sm">{visits[0].reason ?? 'Visit'}</Text>
                <Text className="text-xs text-ink-500 mt-1">{new Date(visits[0].visit_date).toLocaleDateString()} · {visits[0].clinic_name ?? visits[0].vet_name ?? '—'}</Text>
              </Card>
            ) : null}
          </View>
        ) : null}

        {tab === 'Vaccines' ? (
          <View>
            {vaccinations.length === 0 ? <Card className="p-6 items-center"><Text className="text-3xl mb-2">💉</Text><Text>No vaccines yet</Text></Card> : null}
            {vaccinations.map((v) => (
              <Card key={v.id} className="p-4 mb-2">
                <View className="flex-row justify-between items-center">
                  <View>
                    <Text className="font-semibold">{v.vaccine_name}</Text>
                    <Text className="text-xs text-ink-500">{new Date(v.date_given).toLocaleDateString()} · {v.vaccine_type}</Text>
                  </View>
                  {v.next_due_date ? <Pill variant={new Date(v.next_due_date) < new Date() ? 'danger' : 'brand'}>Next: {new Date(v.next_due_date).toLocaleDateString()}</Pill> : null}
                </View>
              </Card>
            ))}
          </View>
        ) : null}

        {tab === 'Meds' ? (
          <View>
            {medications.length === 0 ? <Card className="p-6 items-center"><Text className="text-3xl mb-2">💊</Text><Text>No medications yet</Text></Card> : null}
            {medications.map((m) => (
              <Card key={m.id} className="p-4 mb-2">
                <View className="flex-row justify-between items-center">
                  <View>
                    <Text className="font-semibold">{m.medicine_name}</Text>
                    <Text className="text-xs text-ink-500">{m.dosage ?? '—'} · {m.frequency}</Text>
                  </View>
                  <Pressable
                    onPress={async () => { await api.logMedicationGiven({ medication_id: m.id, pet_id: id! }); Alert.alert('Done', 'Logged as given just now.'); }}
                    className="bg-brand-primary px-3 py-1.5 rounded-full"
                  >
                    <Text className="text-white text-sm font-medium">Give now</Text>
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        ) : null}

        {tab === 'Weight' ? (
          <View>
            {weights.length === 0 ? <Card className="p-6 items-center"><Text className="text-3xl mb-2">⚖️</Text><Text>No weight logs yet</Text></Card> : null}
            {weights.slice(0, 12).map((w) => (
              <Card key={w.id} className="p-3 mb-2 flex-row justify-between">
                <Text className="font-medium">{new Date(w.measured_at).toLocaleDateString()}</Text>
                <Text className="font-semibold">{w.weight_kg} kg</Text>
              </Card>
            ))}
            <Pressable
              onPress={async () => {
                Alert.prompt?.('Log weight', 'Enter weight in kg', async (text) => {
                  const kg = Number(text);
                  if (!kg) return;
                  await api.createWeight(id!, { weight_kg: kg, measured_at: new Date().toISOString() });
                  refresh();
                });
              }}
              className="bg-brand-primary py-3 rounded-full mt-3"
            >
              <Text className="text-white text-center font-semibold">+ Log weight</Text>
            </Pressable>
          </View>
        ) : null}

        {tab === 'Mood' ? (
          <View>
            {moods.length === 0 ? <Card className="p-6 items-center"><Text className="text-3xl mb-2">😊</Text><Text>No mood logs yet</Text></Card> : null}
            <View className="flex-row flex-wrap gap-2">
              {moods.slice(0, 14).map((m) => {
                const e = m.mood === 'happy' ? '😸' : m.mood === 'playful' ? '😺' : m.mood === 'calm' ? '😌' : m.mood === 'tired' ? '😴' : m.mood === 'anxious' ? '😟' : m.mood === 'sick' ? '🤒' : '🙂';
                return (
                  <Card key={m.id} className="p-3 items-center" style={{ width: 60 }}>
                    <Text className="text-2xl">{e}</Text>
                    <Text className="text-[10px] text-ink-500 mt-1">{new Date(m.logged_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
                  </Card>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
