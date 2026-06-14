import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { usePets } from '@/hooks/usePets';
import { Card } from '@/components/Card';
import { api } from '@/lib/api';

export default function SymptomsScreen() {
  const { pets } = usePets();
  const [petId, setPetId] = useState<string | null>(pets[0]?.id ?? null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ urgency: string; possible_causes: string[]; recommended_actions: string[]; home_care_tips: string[]; when_to_go_to_vet: string } | null>(null);

  async function check() {
    if (!petId || text.length < 5) { Alert.alert('Add more detail', 'Tell us more about what you notice.'); return; }
    setLoading(true);
    try {
      const r = await api.checkSymptoms(petId, text);
      setResult(r.data.result);
    } catch (e) { Alert.alert('Failed', e instanceof Error ? e.message : 'Unknown'); }
    finally { setLoading(false); }
  }

  if (pets.length === 0) {
    return <View className="flex-1 items-center justify-center bg-canvas p-6"><Text className="text-4xl mb-2">🐾</Text><Text className="font-semibold">Add a pet first</Text></View>;
  }

  return (
    <ScrollView className="flex-1 bg-canvas" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text className="text-2xl font-bold text-ink-900">AI Symptom Checker</Text>
      <Text className="text-ink-500 mt-1 mb-4">Describe what you&apos;re noticing.</Text>

      <Text className="text-sm font-medium mb-1.5">Pet</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
        {pets.map((p) => (
          <Pressable key={p.id} onPress={() => setPetId(p.id)} className={`mr-2 px-3 py-2 rounded-full ${petId === p.id ? 'bg-brand-primary' : 'bg-white border border-ink-100'}`}>
            <Text className={petId === p.id ? 'text-white' : 'text-ink-700'}>{p.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text className="text-sm font-medium mb-1.5">Symptoms</Text>
      <TextInput className="bg-white border border-ink-100 rounded-xl px-4 py-3 min-h-[120px] mb-4" value={text} onChangeText={setText} placeholder="e.g. Smokey has been vomiting since morning, refuses food…" multiline />

      <Pressable onPress={check} disabled={loading} className="bg-brand-primary py-3.5 rounded-full items-center mb-4">
        {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-semibold">Check symptoms</Text>}
      </Pressable>

      {result ? (
        <Card className={`p-4 border-2 ${result.urgency === 'emergency' ? 'border-semantic-danger bg-red-50' : result.urgency === 'see_vet_soon' ? 'border-semantic-warning bg-amber-50' : 'border-semantic-info bg-blue-50'}`}>
          <Text className="font-bold text-lg mb-1">
            {result.urgency === 'emergency' ? '🚨 Emergency' : result.urgency === 'see_vet_soon' ? '⚠️ See a vet soon' : '👀 Monitor at home'}
          </Text>
          <Text className="text-sm mb-3">{result.when_to_go_to_vet}</Text>

          <Text className="font-semibold mb-1">Possible causes</Text>
          {result.possible_causes.map((c, i) => <Text key={i} className="text-sm">• {c}</Text>)}
          <Text className="font-semibold mt-3 mb-1">Recommended actions</Text>
          {result.recommended_actions.map((a, i) => <Text key={i} className="text-sm">→ {a}</Text>)}
          <Text className="font-semibold mt-3 mb-1">Home care tips</Text>
          {result.home_care_tips.map((t, i) => <Text key={i} className="text-sm">• {t}</Text>)}

          {result.urgency === 'emergency' ? (
            <Pressable onPress={() => {/* router.push('/emergency') */}} className="bg-semantic-danger py-3 rounded-full mt-4">
              <Text className="text-white text-center font-semibold">🚨 Find Emergency Vet</Text>
            </Pressable>
          ) : null}
        </Card>
      ) : null}
    </ScrollView>
  );
}
