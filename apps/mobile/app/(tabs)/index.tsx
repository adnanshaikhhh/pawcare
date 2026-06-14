import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { usePets } from '@/hooks/usePets';
import { useReminders, useInventory } from '@/hooks/useInventory';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { Pill } from '@/components/Pill';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@pawcare/shared';
import { calculateAge, SPECIES_LABELS } from '@pawcare/shared';
import { Bell, Activity, Stethoscope, Truck, Sparkles } from 'lucide-react-native';

function greet() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { pets, refresh: refreshPets, isLoading } = usePets();
  const { reminders, refresh: refreshReminders } = useReminders();
  const { items, refresh: refreshInventory } = useInventory();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    supabase.from('profiles').select('*').single().then(({ data }) => setProfile(data));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshPets(), refreshReminders(), refreshInventory()]);
    setRefreshing(false);
  };

  const lowStock = items.filter((i) => (i.estimated_days_remaining ?? 999) <= (i.alert_days_before ?? 2));
  const upcoming = reminders.slice(0, 4);

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="mb-5">
        <Text className="text-3xl font-bold text-ink-900">
          {greet()}{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''} 👋
        </Text>
        <Text className="text-ink-500 mt-1">Here&apos;s how your family is doing today.</Text>
      </View>

      <View className="flex-row gap-3 mb-5">
        <Card className="flex-1 p-4">
          <Text className="text-xs text-ink-500">Pets</Text>
          <Text className="text-2xl font-bold mt-1">{pets.length}</Text>
        </Card>
        <Card className="flex-1 p-4">
          <Text className="text-xs text-ink-500">Reminders</Text>
          <Text className="text-2xl font-bold mt-1">{reminders.length}</Text>
        </Card>
        <Card className="flex-1 p-4">
          <Text className="text-xs text-ink-500">Low stock</Text>
          <Text className="text-2xl font-bold mt-1">{lowStock.length}</Text>
        </Card>
      </View>

      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-semibold">Your pets</Text>
        <Link href="/pet/new" asChild>
          <Pressable className="px-3 py-1.5 rounded-full bg-brand-primary">
            <Text className="text-white text-sm font-medium">+ Add</Text>
          </Pressable>
        </Link>
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : pets.length === 0 ? (
        <Card className="p-6 items-center">
          <Text className="text-4xl mb-2">🐾</Text>
          <Text className="font-semibold">Add your first pet</Text>
          <Text className="text-sm text-ink-500 text-center mt-1">Start by adding one of your cats or dogs.</Text>
        </Card>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
          {pets.map((p) => (
            <Link key={p.id} href={`/pet/${p.id}`} asChild>
              <Pressable className="mr-3 w-44">
                <Card className="overflow-hidden">
                  <View className={`h-20 ${p.species === 'cat' ? 'bg-pink-50' : 'bg-blue-50'}`} />
                  <View className="p-3 -mt-8">
                    <Avatar src={p.photo_url} name={p.name} size="lg" />
                    <Text className="mt-2 font-semibold text-ink-900">{p.name}</Text>
                    <Text className="text-xs text-ink-500">{SPECIES_LABELS[p.species].emoji} {calculateAge(p.date_of_birth)}</Text>
                  </View>
                </Card>
              </Pressable>
            </Link>
          ))}
        </ScrollView>
      )}

      <View className="flex-row flex-wrap gap-3 mb-5">
        <Link href="/symptoms" asChild>
          <Pressable className="w-[48%]">
            <Card className="p-4 items-center"><Activity color="#FF6B6B" size={22} /><Text className="text-sm font-medium mt-2">Symptoms</Text></Card>
          </Pressable>
        </Link>
        <Link href="/emergency" asChild>
          <Pressable className="w-[48%]">
            <Card className="p-4 items-center"><Stethoscope color="#FF3B30" size={22} /><Text className="text-sm font-medium mt-2">Find vet</Text></Card>
          </Pressable>
        </Link>
        <Link href="/reminders" asChild>
          <Pressable className="w-[48%]">
            <Card className="p-4 items-center"><Bell color="#FF9F0A" size={22} /><Text className="text-sm font-medium mt-2">Reminders</Text></Card>
          </Pressable>
        </Link>
        <Link href="/inventory" asChild>
          <Pressable className="w-[48%]">
            <Card className="p-4 items-center"><Truck color="#007AFF" size={22} /><Text className="text-sm font-medium mt-2">Inventory</Text></Card>
          </Pressable>
        </Link>
      </View>

      {upcoming.length > 0 ? (
        <>
          <View className="flex-row items-center mb-3"><Sparkles color="#FF6B6B" size={18} /><Text className="text-lg font-semibold ml-1">Upcoming</Text></View>
          {upcoming.map((r) => (
            <Card key={r.id} className="p-3 mb-2 flex-row items-center">
              <View className="h-9 w-9 rounded-full bg-brand-light items-center justify-center mr-3"><Bell color="#FF6B6B" size={16} /></View>
              <View className="flex-1">
                <Text className="font-medium" numberOfLines={1}>{r.title}</Text>
              </View>
              <Pill>{new Date(r.due_date).toLocaleDateString()}</Pill>
            </Card>
          ))}
        </>
      ) : null}

      {lowStock.length > 0 ? (
        <>
          <Text className="text-lg font-semibold mb-3 mt-3">Low stock</Text>
          {lowStock.slice(0, 3).map((i) => (
            <Card key={i.id} className="p-3 mb-2 flex-row items-center">
              <View className="h-9 w-9 rounded-full bg-amber-50 items-center justify-center mr-3"><Truck color="#FF9F0A" size={16} /></View>
              <View className="flex-1">
                <Text className="font-medium" numberOfLines={1}>{i.item_name}</Text>
                <Text className="text-xs text-ink-500">~{i.estimated_days_remaining ?? 0} days left</Text>
              </View>
              <Pill variant="warning">Low</Pill>
            </Card>
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}
