import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, useCallback, useMemo } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeInUp,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { BehaviorAlertBanner } from '@/components/v2/BehaviorAlertBanner';
import { CatEconomicsWidget } from '@/components/v2/CatEconomicsWidget';
import { DailyMoodSummary } from '@/components/v2/DailyMoodSummary';
import { MoodWeatherCard } from '@/components/v2/MoodWeatherCard';
import { StoriesCarousel } from '@/components/v2/StoriesCarousel';
import { WeightGoalTracker } from '@/components/v2/WeightGoalTracker';
import { Card } from '@/components/Card';
import { Sparkles, ArrowRight, Plus, Calendar, Wallet, Activity, Camera, Heart } from 'lucide-react-native';
import { INVENTORY_CATEGORIES, MOOD_LABELS, SPECIES_LABELS } from '@/src-shared';
import type { Pet, WeightLog, Mood, InventoryItem, InventoryPurchase } from '@/src-shared';

interface StoryCard {
  pet: Pet;
  headline: string;
  body: string;
  emoji: string;
}

const MOOD_EMOJIS_FALLBACK = ['🌤️', '😴', '😺', '🙂', '😌', '😸', '😴'];

const SPENDING_CATEGORIES = [
  { key: 'food_dry', label: 'Dry Food', emoji: '🍖' },
  { key: 'litter', label: 'Litter', emoji: '🪨' },
  { key: 'medicine', label: 'Meds', emoji: '💊' },
] as const;

export default function InsightsTab() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [primaryPet, setPrimaryPet] = useState<Pet | null>(null);
  const [weights, setWeights] = useState<WeightLog[]>([]);
  const [moodLogs, setMoodLogs] = useState<{ pet_id: string; mood: Mood; logged_date: string }[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [purchases, setPurchases] = useState<InventoryPurchase[]>([]);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSessionReady(true);
        return;
      }
      const [{ data: petsData }, { data: weightRows }] = await Promise.all([
        supabase
          .from('pets')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('weight_logs')
          .select('*')
          .order('measured_at', { ascending: false })
          .limit(50),
      ]);
      const petList = (petsData ?? []) as Pet[];
      setPets(petList);
      setPrimaryPet(petList[0] ?? null);
      setWeights((weightRows as WeightLog[]) ?? []);

      const petIds = petList.map((p) => p.id);
      if (petIds.length > 0) {
        const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0];
        const { data: moods } = await supabase
          .from('mood_logs')
          .select('pet_id, mood, logged_date')
          .in('pet_id', petIds)
          .gte('logged_date', since);
        setMoodLogs(moods ?? []);

        const [{ data: inv }, { data: pur }] = await Promise.all([
          supabase.from('inventory_items').select('*').eq('is_active', true),
          supabase
            .from('inventory_purchases')
            .select('*')
            .order('purchase_date', { ascending: false })
            .limit(50),
        ]);
        setInventoryItems((inv ?? []) as InventoryItem[]);
        setPurchases((pur ?? []) as InventoryPurchase[]);
      } else {
        setMoodLogs([]);
        setInventoryItems([]);
        setPurchases([]);
      }
    } catch (e) {
      console.warn('[Insights] load failed', e);
    } finally {
      setSessionReady(true);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // --- Derived: stories (deterministic) ---
  const stories = useMemo<StoryCard[]>(() => {
    if (pets.length === 0) return [];
    return pets.slice(0, 2).map((pet, idx) => {
      const petMoods = moodLogs.filter((m) => m.pet_id === pet.id);
      const latestMood = petMoods[0]?.mood ?? null;
      const moodCfg = latestMood ? MOOD_LABELS[latestMood] : null;
      const speciesEmoji = SPECIES_LABELS[pet.species].emoji;
      const morningActivity = idx === 0 ? 'a stretch near the window' : 'breakfast with zoomies';
      const moodLine = moodCfg
        ? `Currently feeling ${moodCfg.label.toLowerCase()} ${moodCfg.emoji}.`
        : `No mood logged today — tap to add one.`;
      return {
        pet,
        headline: `${pet.name} started the morning with ${morningActivity}`,
        body: moodLine,
        emoji: moodCfg?.emoji ?? speciesEmoji,
      };
    });
  }, [pets, moodLogs]);

  // --- Derived: 7-day mood grid (deterministic fallback) ---
  const weekMood = useMemo(() => {
    const days: { date: Date; emoji: string; hasData: boolean }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayMoods = moodLogs.filter((m) => m.logged_date === dateStr);
      const dominant =
        dayMoods.length > 0
          ? MOOD_LABELS[dayMoods[dayMoods.length - 1].mood]?.emoji ?? '🙂'
          : null;
      days.push({
        date: d,
        emoji: dominant ?? (i === 0 ? '🌤️' : MOOD_EMOJIS_FALLBACK[i % MOOD_EMOJIS_FALLBACK.length]),
        hasData: dayMoods.length > 0,
      });
    }
    return days;
  }, [moodLogs]);

  const hasAnyMoodData = moodLogs.length > 0;
  const hasAnySpending = inventoryItems.length > 0 || purchases.length > 0;

  // --- Pulse for header sparkle ---
  const sparkleScale = useSharedValue(1);
  useEffect(() => {
    sparkleScale.value = withRepeat(
      withSequence(
        withTiming(1.25, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(1.0, { duration: 900, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, [sparkleScale]);
  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sparkleScale.value }],
  }));

  const pageBg = isDark ? '#0C0C0F' : '#F7F7F9';
  const headingColor = isDark ? '#F2F2F7' : '#1A1A1E';
  const subColor = isDark ? '#8E8E93' : '#6E6E73';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const subtleBg = isDark ? '#2C2C2E' : '#F2F2F7';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: pageBg }} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#FF6B6B" />}
        showsVerticalScrollIndicator={false}
      >
        {/* a) HEADER — gradient hero */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <View
            style={{
              borderRadius: 24,
              overflow: 'hidden',
              shadowColor: '#FF6B6B',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 18,
              elevation: 6,
            }}
          >
            <LinearGradient
              colors={['#FF8E53', '#FF6B6B', '#E85555']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 20, paddingTop: 22, paddingBottom: 22 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Animated.View
                  style={[
                    {
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: 'rgba(255,255,255,0.22)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    },
                    sparkleStyle,
                  ]}
                >
                  <Sparkles color="#FFFFFF" size={22} />
                </Animated.View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>
                    AI Insights ✨
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 2 }}>
                    Powered by your pet data
                  </Text>
                </View>
              </View>

              {/* Mini decorative blobs to feel like a real gradient */}
              <View
                style={{
                  position: 'absolute',
                  right: -40,
                  top: -30,
                  width: 160,
                  height: 160,
                  borderRadius: 80,
                  backgroundColor: 'rgba(255,255,255,0.10)',
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  left: -20,
                  bottom: -40,
                  width: 110,
                  height: 110,
                  borderRadius: 55,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                }}
              />
            </LinearGradient>
          </View>
        </View>

        {!sessionReady ? null : (
          <View style={{ paddingHorizontal: 16, marginTop: 16, gap: 16 }}>
            {/* Behavior alerts always on top */}
            <BehaviorAlertBanner />

            {/* b) STORIES */}
            <Animated.View entering={FadeInUp.delay(0).duration(450)}>
              <SectionHeading
                icon={<Camera color="#FF6B6B" size={18} />}
                title="Stories"
                subtitle={pets.length > 0 ? `${pets.length} pet${pets.length === 1 ? '' : 's'} · AI-generated` : 'Daily snapshots from your crew'}
                isDark={isDark}
              />
              {pets.length === 0 ? (
                <StoriesEmptyState
                  isDark={isDark}
                  cardBg={cardBg}
                  borderColor={borderColor}
                  subColor={subColor}
                  onAdd={() => router.push('/pet/new')}
                />
              ) : stories.length === 0 ? (
                <View
                  style={{
                    backgroundColor: cardBg,
                    borderRadius: 20,
                    padding: 24,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor,
                  }}
                >
                  <ActivityIndicatorSmall />
                  <Text style={{ color: subColor, marginTop: 8, fontSize: 13 }}>
                    Brewing today's stories…
                  </Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12, paddingRight: 4 }}
                >
                  {stories.map((s) => (
                    <Pressable
                      key={s.pet.id}
                      onPress={() => router.push(`/pet/${s.pet.id}`)}
                      style={({ pressed }) => ({
                        width: 260,
                        height: 140,
                        backgroundColor: cardBg,
                        borderRadius: 20,
                        padding: 14,
                        borderWidth: 1,
                        borderColor,
                        opacity: pressed ? 0.85 : 1,
                        transform: [{ scale: pressed ? 0.97 : 1 }],
                      })}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: '#FFF0EE',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 10,
                          }}
                        >
                          <Text style={{ fontSize: 20 }}>{s.emoji}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: headingColor }} numberOfLines={1}>
                            {s.pet.name}
                          </Text>
                          <Text style={{ fontSize: 11, color: subColor }}>
                            {SPECIES_LABELS[s.pet.species].emoji} {SPECIES_LABELS[s.pet.species].label}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 11, color: subColor }}>Today</Text>
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: headingColor, marginBottom: 4 }} numberOfLines={2}>
                        {s.headline}
                      </Text>
                      <Text style={{ fontSize: 12, color: subColor, lineHeight: 17 }} numberOfLines={2}>
                        {s.body}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </Animated.View>

            {/* Mood weather card (only if data) */}
            <Animated.View entering={FadeInUp.delay(60).duration(450)}>
              <MoodWeatherCard />
            </Animated.View>

            {/* c) DAILY MOOD SECTION */}
            <Animated.View entering={FadeInUp.delay(120).duration(450)}>
              <SectionHeading
                icon={<Heart color="#FF6B6B" size={18} />}
                title="Daily Mood"
                subtitle={hasAnyMoodData ? 'Last 7 days · your family mood' : 'Start logging to see patterns'}
                isDark={isDark}
              />
              {pets.length === 0 ? (
                <MoodEmptyState
                  isDark={isDark}
                  cardBg={cardBg}
                  borderColor={borderColor}
                  subColor={subColor}
                  headingColor={headingColor}
                  onAdd={() => router.push('/pet/new')}
                />
              ) : !hasAnyMoodData ? (
                <View>
                  <MoodWeekGrid days={weekMood} isDark={isDark} cardBg={cardBg} subColor={subColor} headingColor={headingColor} borderColor={borderColor} />
                  <Pressable
                    onPress={() => router.push('/pet/new')}
                    style={({ pressed }) => ({
                      marginTop: 10,
                      paddingVertical: 12,
                      borderRadius: 14,
                      alignItems: 'center',
                      backgroundColor: '#FFF0EE',
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <Text style={{ color: '#FF6B6B', fontWeight: '600', fontSize: 14 }}>
                      Log mood daily from a pet profile →
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View>
                  <DailyMoodSummary />
                  <MoodWeekGrid days={weekMood} isDark={isDark} cardBg={cardBg} subColor={subColor} headingColor={headingColor} borderColor={borderColor} compact />
                </View>
              )}
            </Animated.View>

            {/* d) MONTHLY SPEND (renamed from Cat Economics) */}
            <Animated.View entering={FadeInUp.delay(180).duration(450)}>
              <SectionHeading
                icon={<Wallet color="#FF6B6B" size={18} />}
                title="Monthly Spend"
                subtitle={hasAnySpending ? 'Estimate based on your inventory' : 'Track food, litter and meds'}
                isDark={isDark}
              />
              {!hasAnySpending ? (
                <SpendingEmptyState
                  isDark={isDark}
                  cardBg={cardBg}
                  borderColor={borderColor}
                  subColor={subColor}
                  headingColor={headingColor}
                  subtleBg={subtleBg}
                  onAdd={() => router.push('/(tabs)/inventory')}
                />
              ) : (
                <CatEconomicsWidget />
              )}
            </Animated.View>

            {/* e) AI SYMPTOM CHECKER prominent card */}
            <Animated.View entering={FadeInUp.delay(240).duration(450)}>
              <Pressable
                onPress={() => router.push('/symptoms')}
                style={({ pressed }) => ({
                  borderRadius: 22,
                  overflow: 'hidden',
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.985 : 1 }],
                  shadowColor: '#FF6B6B',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.25,
                  shadowRadius: 14,
                  elevation: 5,
                })}
              >
                <LinearGradient
                  colors={['#FF8E53', '#FF6B6B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ padding: 18, flexDirection: 'row', alignItems: 'center' }}
                >
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: 'rgba(255,255,255,0.22)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 14,
                    }}
                  >
                    <Text style={{ fontSize: 30 }}>🩺</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 19, fontWeight: '700' }}>
                      Check Symptoms
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 }} numberOfLines={2}>
                      Describe what you&apos;re seeing, get an instant assessment
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: 'rgba(255,255,255,0.22)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ArrowRight color="#FFFFFF" size={18} />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {/* f) WEIGHT GOAL */}
            {primaryPet ? (
              <Animated.View entering={FadeInUp.delay(300).duration(450)}>
                <SectionHeading
                  icon={<Activity color="#FF6B6B" size={18} />}
                  title="Weight Goal"
                  subtitle={`Tracking ${primaryPet.name}`}
                  isDark={isDark}
                />
                <WeightGoalTracker pet={primaryPet} weights={weights} onLogged={() => load()} />
              </Animated.View>
            ) : null}

            {/* Footer tip */}
            <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 16 }}>
              <Text style={{ fontSize: 11, color: subColor, textAlign: 'center', paddingHorizontal: 24 }}>
                Tip: pull down to refresh. All data syncs with pawcare-omega.vercel.app.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- Sub components ----------

function SectionHeading({
  icon,
  title,
  subtitle,
  isDark,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  isDark: boolean;
}) {
  const headingColor = isDark ? '#F2F2F7' : '#1A1A1E';
  const subColor = isDark ? '#8E8E93' : '#6E6E73';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: isDark ? 'rgba(255,107,107,0.18)' : '#FFF0EE',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: headingColor }}>{title}</Text>
        {subtitle ? (
          <Text style={{ fontSize: 12, color: subColor, marginTop: 1 }} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function StoriesEmptyState({
  isDark,
  cardBg,
  borderColor,
  subColor,
  onAdd,
}: {
  isDark: boolean;
  cardBg: string;
  borderColor: string;
  subColor: string;
  onAdd: () => void;
}) {
  return (
    <Pressable
      onPress={onAdd}
      style={({ pressed }) => ({
        backgroundColor: cardBg,
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor,
        borderStyle: 'dashed',
        alignItems: 'center',
        opacity: pressed ? 0.85 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <Text style={{ fontSize: 40, marginBottom: 8 }}>🐾</Text>
      <Text
        style={{
          fontSize: 16,
          fontWeight: '700',
          color: isDark ? '#F2F2F7' : '#1A1A1E',
          marginBottom: 4,
        }}
      >
        Add a pet to unlock stories
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: subColor,
          textAlign: 'center',
          marginBottom: 14,
        }}
      >
        We&apos;ll turn their day into little snapshots — meals, moods and milestones.
      </Text>
      <View
        style={{
          paddingHorizontal: 18,
          paddingVertical: 10,
          borderRadius: 14,
          backgroundColor: '#FF6B6B',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Plus color="#FFFFFF" size={16} />
        <Text style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: 6 }}>Add pet</Text>
      </View>
    </Pressable>
  );
}

function MoodEmptyState({
  isDark,
  cardBg,
  borderColor,
  subColor,
  headingColor,
  onAdd,
}: {
  isDark: boolean;
  cardBg: string;
  borderColor: string;
  subColor: string;
  headingColor: string;
  onAdd: () => void;
}) {
  return (
    <Pressable
      onPress={onAdd}
      style={({ pressed }) => ({
        backgroundColor: cardBg,
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor,
        alignItems: 'center',
        opacity: pressed ? 0.85 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <Text style={{ fontSize: 38, marginBottom: 8 }}>😴</Text>
      <Text style={{ fontSize: 16, fontWeight: '700', color: headingColor, marginBottom: 4 }}>
        No mood data yet
      </Text>
      <Text style={{ fontSize: 13, color: subColor, textAlign: 'center', marginBottom: 12 }}>
        Add a pet and start logging daily moods — patterns appear after 3 days.
      </Text>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 12,
          backgroundColor: '#FFF0EE',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#FF6B6B', fontWeight: '600', fontSize: 13 }}>Add your first pet →</Text>
      </View>
    </Pressable>
  );
}

function MoodWeekGrid({
  days,
  isDark,
  cardBg,
  subColor,
  headingColor,
  borderColor,
  compact = false,
}: {
  days: { date: Date; emoji: string; hasData: boolean }[];
  isDark: boolean;
  cardBg: string;
  subColor: string;
  headingColor: string;
  borderColor: string;
  compact?: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: cardBg,
        borderRadius: 20,
        padding: compact ? 12 : 16,
        borderWidth: 1,
        borderColor,
        marginTop: compact ? 10 : 0,
      }}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {days.map((d, idx) => {
          const isToday = idx === days.length - 1;
          return (
            <View
              key={d.date.toISOString()}
              style={{
                width: 56,
                alignItems: 'center',
                paddingVertical: 10,
                paddingHorizontal: 6,
                borderRadius: 14,
                backgroundColor: isToday
                  ? isDark
                    ? 'rgba(255,107,107,0.18)'
                    : '#FFF0EE'
                  : 'transparent',
                borderWidth: isToday ? 0 : 1,
                borderColor,
                borderStyle: d.hasData ? 'solid' : 'dashed',
              }}
            >
              <Text style={{ fontSize: 10, color: subColor, marginBottom: 4, fontWeight: '600' }}>
                {d.date.toLocaleDateString(undefined, { weekday: 'short' })}
              </Text>
              <Text style={{ fontSize: 22, opacity: d.hasData ? 1 : 0.55 }}>{d.emoji}</Text>
              <Text style={{ fontSize: 10, color: subColor, marginTop: 4 }}>
                {d.date.getDate()}
              </Text>
            </View>
          );
        })}
      </ScrollView>
      {!compact ? (
        <Text style={{ fontSize: 11, color: subColor, marginTop: 10, textAlign: 'center' }}>
          Dashed circles = no log that day. Tap below to start.
        </Text>
      ) : null}
    </View>
  );
}

function SpendingEmptyState({
  isDark,
  cardBg,
  borderColor,
  subColor,
  headingColor,
  subtleBg,
  onAdd,
}: {
  isDark: boolean;
  cardBg: string;
  borderColor: string;
  subColor: string;
  headingColor: string;
  subtleBg: string;
  onAdd: () => void;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Pressable
        onPress={onAdd}
        style={({ pressed }) => ({
          backgroundColor: cardBg,
          borderRadius: 20,
          padding: 18,
          borderWidth: 1,
          borderColor,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: subtleBg,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Text style={{ fontSize: 24 }}>💰</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: subColor, fontWeight: '600', letterSpacing: 0.5 }}>
              THIS MONTH
            </Text>
            <Text style={{ fontSize: 26, fontWeight: '700', color: headingColor, marginTop: 2 }}>
              ₹ 0
            </Text>
            <Text style={{ fontSize: 12, color: subColor, marginTop: 2 }}>
              Add purchases to track spending
            </Text>
          </View>
        </View>
        <View
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: borderColor,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ fontSize: 12, color: subColor }}>Track from the Stock tab</Text>
          <View
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: '#FF6B6B',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 13 }}>Track spending</Text>
            <ArrowRight color="#FFFFFF" size={14} style={{ marginLeft: 4 }} />
          </View>
        </View>
      </Pressable>

      {/* Category placeholder mini-cards */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {SPENDING_CATEGORIES.map((c) => {
          const cfg = INVENTORY_CATEGORIES.find((x) => x.key === c.key);
          return (
            <View
              key={c.key}
              style={{
                flex: 1,
                backgroundColor: cardBg,
                borderRadius: 16,
                padding: 12,
                borderWidth: 1,
                borderColor,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 22 }}>{c.emoji}</Text>
              <Text style={{ fontSize: 11, color: subColor, marginTop: 4 }}>{c.label}</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: headingColor, marginTop: 2 }}>
                ₹ —
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ActivityIndicatorSmall() {
  return <ActivityIndicator color="#FF6B6B" />;
}
