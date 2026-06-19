import { View, Text, ScrollView, Pressable, Alert, useColorScheme } from 'react-native';
import { Card } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { LogOut, Users, Bell, FileText, Info, ChevronRight, Mail } from 'lucide-react-native';
import { SPACING, RADIUS, FONT_SIZE } from '@/lib/theme';

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  family_group_id: string | null;
}

interface Family {
  invite_code: string | null;
  name: string | null;
}

export default function SettingsTab() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [profile, setProfile] = useState<Profile | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        if (!cancelled) setAuthEmail(user.email ?? null);

        const { data: prof } = await supabase
          .from('profiles')
          .select('id, email, full_name, avatar_url, family_group_id')
          .eq('id', user.id)
          .single();
        if (!cancelled) setProfile(prof ?? null);

        if (prof?.family_group_id) {
          const { data: fam } = await supabase
            .from('family_groups')
            .select('invite_code, name')
            .eq('id', prof.family_group_id)
            .single();
          if (!cancelled) setFamily(fam ?? null);
        }
      } catch (e) {
        console.warn('[Settings] load failed', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const displayName = profile?.full_name?.trim() || authEmail?.split('@')[0] || 'Pet parent';
  const initial = displayName[0]?.toUpperCase() || '?';

  async function signOut() {
    Alert.alert('Sign out?', 'You can sign back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/auth/login');
        },
      },
    ]);
  }

  return (
    <ScrollView
      className={isDark ? 'flex-1 bg-[#0C0C0F]' : 'flex-1 bg-[#F7F7F9]'}
      contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 120 }}
    >
      {/* Header */}
      <View className="mt-3 mb-6">
        <Text className={isDark ? 'text-[32px] font-bold text-[#F2F2F7]' : 'text-[32px] font-bold text-[#1A1A1E]'}>
          Me
        </Text>
        <Text className={isDark ? 'text-[14px] text-[#8E8E93] mt-1' : 'text-[14px] text-[#6E6E73] mt-1'}>
          Profile, family, and app settings
        </Text>
      </View>

      {/* Profile card */}
      <View
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 3,
        }}
        className={isDark ? 'bg-[#1C1C1E] rounded-[20px] p-5 mb-4 items-center' : 'bg-white rounded-[20px] p-5 mb-4 items-center'}
      >
        <View
          className="w-16 h-16 rounded-full items-center justify-center mb-3"
          style={{ backgroundColor: '#FF6B6B' }}
        >
          {profile?.avatar_url ? (
            <Avatar src={profile.avatar_url} name={displayName} size="xl" />
          ) : (
            <Text className="text-white text-2xl font-bold">{initial}</Text>
          )}
        </View>
        <Text className={isDark ? 'text-[20px] font-bold text-[#F2F2F7]' : 'text-[20px] font-bold text-[#1A1A1E]'}>
          {displayName}
        </Text>
        {authEmail ? (
          <View className="flex-row items-center mt-1">
            <Mail color={isDark ? '#8E8E93' : '#6E6E73'} size={12} />
            <Text className={isDark ? 'text-[13px] text-[#8E8E93] ml-1' : 'text-[13px] text-[#6E6E73] ml-1'}>
              {authEmail}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Menu items */}
      <View className={isDark ? 'bg-[#1C1C1E] rounded-[20px] overflow-hidden' : 'bg-white rounded-[20px] overflow-hidden'}
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}
      >
        <MenuRow
          icon={Users}
          iconBg={isDark ? 'rgba(255,107,107,0.15)' : '#FFF0EE'}
          iconColor="#FF6B6B"
          label="Family Sharing"
          sub={family?.invite_code ? `Invite code: ${family.invite_code}` : 'Set up a family group'}
          isDark={isDark}
          isLast={false}
          onPress={() => router.push('/family')}
        />
        <MenuRow
          icon={Bell}
          iconBg={isDark ? 'rgba(255,159,10,0.15)' : '#FFF3E0'}
          iconColor="#FF9F0A"
          label="Notifications"
          sub="Manage your reminder settings"
          isDark={isDark}
          isLast={false}
          onPress={() => router.push('/reminders')}
        />
        <MenuRow
          icon={FileText}
          iconBg={isDark ? 'rgba(0,122,255,0.15)' : '#E5F1FF'}
          iconColor="#007AFF"
          label="Data"
          sub="Export your data"
          isDark={isDark}
          isLast={false}
          onPress={() => Alert.alert('Export', 'Use the web app at pawcare-omega.vercel.app to export your data.')}
        />
        <MenuRow
          icon={Info}
          iconBg={isDark ? 'rgba(142,142,147,0.15)' : '#F2F2F7'}
          iconColor={isDark ? '#8E8E93' : '#6E6E73'}
          label="About"
          sub="PawCare v1.0.0 · Made with 🐾"
          isDark={isDark}
          isLast
          onPress={() => {}}
        />
      </View>

      {/* Sign out (subtle, at bottom) */}
      <Pressable
        onPress={signOut}
        className="mt-6 py-3 items-center"
      >
        <Text className="text-[#FF3B30] text-[14px] font-medium">Sign out</Text>
      </Pressable>

      {/* Version footer */}
      <Text className={isDark ? 'text-center text-[#48484A] text-[11px] mt-4' : 'text-center text-[#AEAEB2] text-[11px] mt-4'}>
        PawCare v1.0.0 · Made with 🐾
      </Text>
    </ScrollView>
  );
}

function MenuRow({
  icon: Icon, iconBg, iconColor, label, sub, isDark, isLast, onPress,
}: {
  icon: typeof Users;
  iconBg: string;
  iconColor: string;
  label: string;
  sub: string;
  isDark: boolean;
  isLast: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center px-4 py-3.5 ${!isLast ? (isDark ? 'border-b border-white/[0.08]' : 'border-b border-black/[0.08]') : ''}`}
      style={({ pressed }) => ({ backgroundColor: pressed ? (isDark ? '#2C2C2E' : '#F2F2F7') : 'transparent' })}
    >
      <View
        className="w-9 h-9 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: iconBg }}
      >
        <Icon color={iconColor} size={18} />
      </View>
      <View className="flex-1">
        <Text className={isDark ? 'text-[16px] font-semibold text-[#F2F2F7]' : 'text-[16px] font-semibold text-[#1A1A1E]'}>
          {label}
        </Text>
        <Text className={isDark ? 'text-[12px] text-[#8E8E93] mt-0.5' : 'text-[12px] text-[#6E6E73] mt-0.5'}>
          {sub}
        </Text>
      </View>
      <ChevronRight color={isDark ? '#48484A' : '#AEAEB2'} size={18} />
    </Pressable>
  );
}