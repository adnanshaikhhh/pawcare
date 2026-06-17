import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Avatar } from '@/components/Avatar';
import { MOOD_LABELS, SPECIES_LABELS } from '@/src-shared';
import type { Mood, Pet } from '@/src-shared';
import { Plus, Camera } from 'lucide-react-native';

interface StoryPet extends Pet {
  latestMood?: Mood | null;
  photoUrl?: string | null;
  storyCount?: number;
}

/**
 * Pet Avatar Stories carousel (Instagram-style ring)
 * Shows each pet as a tappable avatar with a colored ring
 * if there's a recent mood log or photo in the last 24h.
 */
export function StoriesCarousel() {
  const [pets, setPets] = useState<StoryPet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data: petsData } = await supabase
          .from('pets')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (!petsData || cancelled) return;

        // Hydrate each pet with latest mood + recent photo count
        const enriched: StoryPet[] = await Promise.all(
          (petsData as Pet[]).map(async (p) => {
            const [{ data: mood }, { count }] = await Promise.all([
              supabase
                .from('mood_logs')
                .select('mood')
                .eq('pet_id', p.id)
                .order('logged_date', { ascending: false })
                .limit(1)
                .maybeSingle(),
              supabase
                .from('pet_photos')
                .select('*', { count: 'exact', head: true })
                .eq('pet_id', p.id)
                .gte('created_at', new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()),
            ]);
            return {
              ...p,
              latestMood: (mood?.mood as Mood | undefined) ?? null,
              storyCount: count ?? 0,
            };
          })
        );
        if (!cancelled) setPets(enriched);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <View className="h-24 items-center justify-center">
        <ActivityIndicator color="#FF6B6B" />
      </View>
    );
  }
  if (pets.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mb-5"
      contentContainerStyle={{ paddingHorizontal: 4 }}
    >
      {/* Add pet shortcut */}
      <Link href="/pet/new" asChild>
        <Pressable className="items-center mr-4" style={{ width: 70 }}>
          <View className="h-16 w-16 rounded-full bg-canvas-sunken border-2 border-dashed border-ink-300 items-center justify-center">
            <Plus color="#6E6E73" size={22} />
          </View>
          <Text className="text-[11px] text-ink-500 mt-1" numberOfLines={1}>
            Add pet
          </Text>
        </Pressable>
      </Link>

      {pets.map((p) => {
        const mood = p.latestMood ? MOOD_LABELS[p.latestMood] : null;
        const ringColor = mood?.color ?? '#E8E8ED';
        const hasStory = !!p.latestMood || (p.storyCount ?? 0) > 0;
        return (
          <Link key={p.id} href={`/pet/${p.id}`} asChild>
            <Pressable className="items-center mr-4" style={{ width: 70 }}>
              <View
                className="h-16 w-16 rounded-full p-[3px]"
                style={{
                  backgroundColor: hasStory ? ringColor : 'transparent',
                  borderWidth: hasStory ? 0 : 2,
                  borderColor: '#E8E8ED',
                }}
              >
                <View className="h-full w-full rounded-full bg-white p-[2px] overflow-hidden">
                  {p.photo_url ? (
                    <Image
                      source={{ uri: p.photo_url }}
                      className="h-full w-full rounded-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Avatar src={null} name={p.name} size="xl" />
                  )}
                </View>
              </View>
              <Text className="text-xs font-medium text-ink-900 mt-1" numberOfLines={1}>
                {p.name}
              </Text>
              {mood ? (
                <Text className="text-[10px] text-ink-500" numberOfLines={1}>
                  {mood.emoji} {mood.label}
                </Text>
              ) : (
                <Text className="text-[10px] text-ink-300">
                  {SPECIES_LABELS[p.species].emoji} tap
                </Text>
              )}
            </Pressable>
          </Link>
        );
      })}

      {/* Camera/photo hint at the end */}
      <Pressable className="items-center mr-2 opacity-60" style={{ width: 70 }}>
        <View className="h-16 w-16 rounded-full bg-canvas-sunken items-center justify-center">
          <Camera color="#6E6E73" size={20} />
        </View>
        <Text className="text-[11px] text-ink-500 mt-1" numberOfLines={1}>
          Photos
        </Text>
      </Pressable>
    </ScrollView>
  );
}
