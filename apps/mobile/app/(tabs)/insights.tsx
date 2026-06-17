import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { BehaviorAlertBanner } from '@/components/v2/BehaviorAlertBanner';
import { CatEconomicsWidget } from '@/components/v2/CatEconomicsWidget';
import { DailyMoodSummary } from '@/components/v2/DailyMoodSummary';
import { MoodWeatherCard } from '@/components/v2/MoodWeatherCard';
import { QuickMoodFAB } from '@/components/v2/QuickMoodFAB';
import { StoriesCarousel } from '@/components/v2/StoriesCarousel';
import { WeightGoalTracker } from '@/components/v2/WeightGoalTracker';
import { Sparkles } from 'lucide-react-native';

export default function InsightsTab() {
  const [refreshing, setRefreshing] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [petId, setPetId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('family_group_id')
          .eq('id', user.id)
          .single();
        setFamilyId(profile?.family_group_id ?? null);

        const { data: pets } = await supabase
          .from('pets')
          .select('id')
          .limit(1);
        setPetId(pets?.[0]?.id ?? null);
      }
    } catch (e) {
      console.warn('[Insights] load failed', e);
    } finally {
      setSessionReady(true);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 128 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={load} />
        }
      >
        <View className="px-4 pt-5 pb-3 flex-row items-center gap-2">
          <Sparkles color="#FF6B6B" size={22} />
          <View>
            <Text className="text-2xl font-bold text-ink-900">AI Insights</Text>
            <Text className="text-ink-500 text-sm">
              v2 features — stories, behavior, mood, weight & more
            </Text>
          </View>
        </View>

        {!sessionReady ? (
          <View className="py-12 items-center">
            <ActivityIndicator color="#FF6B6B" />
          </View>
        ) : (
          <View className="px-4 gap-4">
            <BehaviorAlertBanner />

            <View>
              <Text className="text-base font-semibold text-ink-900 mb-2">Stories</Text>
              <StoriesCarousel />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <MoodWeatherCard />
              </View>
            </View>

            <View>
              <Text className="text-base font-semibold text-ink-900 mb-2">Daily Mood</Text>
              <DailyMoodSummary />
            </View>

            <View>
              <Text className="text-base font-semibold text-ink-900 mb-2">Cat Economics</Text>
              <CatEconomicsWidget />
            </View>

            {petId ? (
              <View>
                <Text className="text-base font-semibold text-ink-900 mb-2">Weight Goal</Text>
                <WeightGoalTracker
                  pet={undefined as never}
                  weights={undefined as never}
                  onLogged={() => load()}
                />
              </View>
            ) : null}

            <View className="py-6 items-center">
              <Text className="text-xs text-ink-400 text-center px-6">
                Tip: pull down to refresh. All data syncs with the web app at pawcare-omega.vercel.app.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <QuickMoodFAB />
    </SafeAreaView>
  );
}
