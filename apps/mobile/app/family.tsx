import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator, Share } from 'react-native';
import { Card } from '@/components/Card';
import { api } from '@/lib/api';
import { Users, Copy } from 'lucide-react-native';

export default function FamilyScreen() {
  const [family, setFamily] = useState<{ group: { name: string; invite_code: string } } | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getFamily().then((d) => { setFamily(d as { group: { name: string; invite_code: string } } | null); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  async function create() {
    setLoading(true);
    try {
      await api.createFamily('Our Family');
      const f = await api.getFamily();
      setFamily(f as { group: { name: string; invite_code: string } } | null);
    } catch (e) { Alert.alert('Failed', String(e)); }
    finally { setLoading(false); }
  }

  async function join() {
    if (joinCode.length !== 8) { Alert.alert('Invalid', 'Code is 8 characters'); return; }
    setLoading(true);
    try {
      await api.joinFamily(joinCode.toUpperCase());
      const f = await api.getFamily();
      setFamily(f as { group: { name: string; invite_code: string } } | null);
    } catch (e) { Alert.alert('Failed', String(e)); }
    finally { setLoading(false); }
  }

  async function share() {
    if (!family) return;
    try { await Share.share({ message: `Join my PawCare family group! Use code: ${family.group.invite_code}` }); } catch {}
  }

  if (loading) return <View className="flex-1 items-center justify-center"><ActivityIndicator /></View>;

  return (
    <ScrollView className="flex-1 bg-canvas" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text className="text-2xl font-bold text-ink-900">Family Sharing</Text>
      <Text className="text-ink-500 mt-1 mb-4">Care for pets together.</Text>

      {family ? (
        <Card className="p-5">
          <View className="flex-row items-center mb-3"><View className="h-10 w-10 rounded-xl bg-brand-light items-center justify-center mr-3"><Users color="#FF6B6B" size={18} /></View>
            <View className="flex-1"><Text className="font-semibold text-lg">{family.group.name}</Text></View>
          </View>
          <Text className="text-sm text-ink-500 mb-2">Share this invite code:</Text>
          <View className="bg-canvas-sunken rounded-xl p-4 flex-row items-center justify-between mb-3">
            <Text className="font-mono text-xl font-bold tracking-widest">{family.group.invite_code}</Text>
            <Pressable onPress={share} className="bg-brand-primary px-3 py-2 rounded-full flex-row items-center gap-1">
              <Copy color="white" size={14} /><Text className="text-white text-sm font-medium">Share</Text>
            </Pressable>
          </View>
        </Card>
      ) : (
        <View className="gap-3">
          <Card className="p-5">
            <Text className="font-semibold mb-2">Create a family group</Text>
            <Text className="text-sm text-ink-500 mb-3">Start a new group and invite your partner.</Text>
            <Pressable onPress={create} className="bg-brand-primary py-3 rounded-full"><Text className="text-white text-center font-semibold">Create group</Text></Pressable>
          </Card>
          <Card className="p-5">
            <Text className="font-semibold mb-2">Join existing group</Text>
            <Text className="text-sm text-ink-500 mb-3">Enter the 8-character invite code.</Text>
            <TextInput className="bg-canvas-sunken border border-ink-100 rounded-xl px-4 h-13 font-mono mb-3" value={joinCode} onChangeText={setJoinCode} placeholder="ABCD1234" autoCapitalize="characters" maxLength={8} />
            <Pressable onPress={join} className="bg-white border border-ink-100 py-3 rounded-full"><Text className="text-ink-900 text-center font-semibold">Join</Text></Pressable>
          </Card>
        </View>
      )}
    </ScrollView>
  );
}
