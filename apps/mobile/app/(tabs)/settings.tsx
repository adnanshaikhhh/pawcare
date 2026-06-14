import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { Card } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import type { Profile } from '@pawcare/shared';
import { useRouter } from 'expo-router';
import { LogOut, Users, Bell, FileText, Info } from 'lucide-react-native';

export default function SettingsTab() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [familyCode, setFamilyCode] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('profiles').select('*').single().then(({ data }) => {
      setProfile(data);
      setFamilyCode(data?.family_code ?? null);
    });
  }, []);

  async function signOut() {
    Alert.alert('Sign out?', 'You can sign back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out', style: 'destructive', onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/auth/login');
        },
      },
    ]);
  }

  return (
    <ScrollView className="flex-1 bg-canvas" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text className="text-2xl font-bold text-ink-900">Me</Text>
      <Text className="text-ink-500 mt-1 mb-4">Profile, family, and app settings</Text>

      <Card className="p-5 mb-4 flex-row items-center gap-4">
        <Avatar src={profile?.avatar_url ?? null} name={profile?.full_name ?? 'You'} size="xl" />
        <View className="flex-1">
          <Text className="font-semibold text-lg">{profile?.full_name ?? 'You'}</Text>
          <Text className="text-sm text-ink-500">{profile?.timezone ?? 'Asia/Kolkata'}</Text>
        </View>
      </Card>

      <RowLink icon={Users} label="Family Sharing" sub={familyCode ? `Invite code: ${familyCode}` : 'Set up a family group'} onPress={() => router.push('/family')} />
      <RowLink icon={Bell} label="Notifications" sub="Manage your reminder settings" onPress={() => router.push('/reminders')} />
      <RowLink icon={FileText} label="Data" sub="Export your data" onPress={() => Alert.alert('Export', 'Use the web app to export your data.')} />
      <RowLink icon={Info} label="About" sub="PawCare v1.0.0 · Made with 🐾" onPress={() => {}} />

      <Pressable onPress={signOut} className="mt-6 bg-semantic-danger/10 py-3 rounded-full">
        <Text className="text-semantic-danger text-center font-semibold">Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

function RowLink({ icon: Icon, label, sub, onPress }: { icon: typeof Bell; label: string; sub: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="bg-white rounded-2xl border border-ink-100 p-4 mb-2 flex-row items-center">
      <View className="h-10 w-10 rounded-xl bg-brand-light items-center justify-center mr-3">
        <Icon color="#FF6B6B" size={18} />
      </View>
      <View className="flex-1">
        <Text className="font-semibold">{label}</Text>
        <Text className="text-xs text-ink-500">{sub}</Text>
      </View>
      <Text className="text-ink-300">›</Text>
    </Pressable>
  );
}
