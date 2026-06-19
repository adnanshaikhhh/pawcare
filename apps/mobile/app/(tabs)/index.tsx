import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Animated,
  Easing,
  useColorScheme,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { usePets, useReminders, useInventory } from '@/hooks/usePets';
import { Pill } from '@/components/Pill';
import { SPACING, timeBasedGreeting, greetingSubtext } from '@/lib/theme';
import { SPECIES_LABELS, calculateAge } from '@/src-shared';
import type { Pet, Reminder, InventoryItem, Species } from '@/src-shared';
import {
  Bell,
  BellDot,
  Plus,
  Activity,
  Stethoscope,
  Truck,
  Calendar,
  Sparkles,
  ArrowRight,
  Heart,
  Syringe,
  Package,
} from 'lucide-react-native';

// ─── Color tokens (keep in sync with lib/theme.ts) ──────────────────────────
const C = {
  light: {
    bg: '#F7F7F9',
    card: '#FFFFFF',
    textPrimary: '#1A1A1E',
    textSecondary: '#6E6E73',
    textMuted: '#AEAEB2',
    border: 'rgba(0,0,0,0.06)',
    accentBg: '#FFF0EE',
    sosBg: '#FFF1F0',
    sosBorder: 'rgba(255,59,48,0.35)',
    petCardBg: '#FFF0EE',
  },
  dark: {
    bg: '#0C0C0F',
    card: '#1C1C1E',
    textPrimary: '#F2F2F7',
    textSecondary: '#8E8E93',
    textMuted: '#48484A',
    border: 'rgba(255,255,255,0.08)',
    accentBg: 'rgba(255,107,107,0.15)',
    sosBg: 'rgba(255,59,48,0.10)',
    sosBorder: 'rgba(255,59,48,0.35)',
    petCardBg: '#2C2C2E',
  },
};

// ─── Animated number component (counts up from 0 on mount) ─────────────────
function AnimatedNumber({ value, duration = 600, style }: { value: number; duration?: number; style?: object }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const listener = anim.addListener(({ value: v }) => {
      setDisplay(Math.round(v));
    });
    Animated.timing(anim, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(listener);
  }, [value, duration, anim]);

  return <Text style={style}>{display}</Text>;
}

// ─── Pet card for horizontal carousel ──────────────────────────────────────
function PetCard({ pet, onPress, isDark }: { pet: Pet; onPress: () => void; isDark: boolean }) {
  const speciesInfo = SPECIES_LABELS[pet.species as Species] ?? SPECIES_LABELS.other;
  const age = calculateAge(pet.date_of_birth);
  // Health dot: green default, yellow if any reminders, red if overdue
  const healthColor = '#34C759';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 140,
        height: 160,
        borderRadius: 20,
        overflow: 'hidden',
        opacity: pressed ? 0.85 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      {pet.photo_url ? (
        <Image
          source={{ uri: pet.photo_url }}
          style={{ width: '100%', height: '60%' }}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={isDark ? ['#FF6B6B', '#E85555'] : ['#FF8E53', '#FF6B6B']}
          style={{ width: '100%', height: '60%', alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 44 }}>🐾</Text>
        </LinearGradient>
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.65)']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '60%',
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: healthColor,
          borderWidth: 2,
          borderColor: '#FFFFFF',
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40%',
          backgroundColor: isDark ? C.dark.card : C.light.card,
          paddingHorizontal: 10,
          paddingTop: 8,
          justifyContent: 'center',
        }}
      >
        <Text
          numberOfLines={1}
          style={{ fontSize: 15, fontWeight: '700', color: isDark ? C.dark.textPrimary : C.light.textPrimary }}
        >
          {pet.name}
        </Text>
        <Text
          numberOfLines={1}
          style={{ fontSize: 11, color: isDark ? C.dark.textSecondary : C.light.textSecondary, marginTop: 2 }}
        >
          {speciesInfo.emoji} {pet.breed ?? speciesInfo.label} · {age}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Main Home Screen ──────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const t = isDark ? C.dark : C.light;

  const { pets, refresh: refreshPets, isLoading } = usePets();
  const { reminders, refresh: refreshReminders } = useReminders();
  const { items, refresh: refreshInventory } = useInventory();
  const [refreshing, setRefreshing] = useState(false);

  // Mount animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshPets(), refreshReminders(), refreshInventory()]);
    setRefreshing(false);
  };

  const lowStock = items.filter((i) => (i.estimated_days_remaining ?? 999) <= (i.alert_days_before ?? 2));
  const upcomingReminders = reminders
    .filter((r) => !r.is_completed)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 3);

  // Stats values
  const petsCount = pets.length;
  const remindersCount = reminders.filter((r) => !r.is_completed).length;
  const lowStockCount = lowStock.length;

  // Next upcoming event (for "Coming up")
  const nextEvent = upcomingReminders[0];
  const daysUntil = nextEvent
    ? Math.max(0, Math.ceil((new Date(nextEvent.due_date).getTime() - Date.now()) / 86400000))
    : null;

  // Pet carousel items
  const showEmptyPet = !isLoading && pets.length === 0;

  return (
    <Animated.View
      style={{
        flex: 1,
        backgroundColor: t.bg,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#8E8E93' : '#6E6E73'}
          />
        }
      >
        {/* ─── HEADER ─────────────────────────────────────────────────────── */}
        <View style={{ paddingTop: 20, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: t.textPrimary }} numberOfLines={1}>
              {timeBasedGreeting()}
            </Text>
            <Text style={{ fontSize: 14, color: t.textSecondary, marginTop: 4 }}>
              {greetingSubtext(petsCount)}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/reminders')}
            hitSlop={8}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: t.card,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: t.border,
            }}
          >
            {remindersCount > 0 ? (
              <BellDot color="#FF6B6B" size={20} />
            ) : (
              <Bell color={t.textPrimary} size={20} />
            )}
            {remindersCount > 0 ? (
              <View
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#FF3B30',
                }}
              />
            ) : null}
          </Pressable>
        </View>

        {/* ─── STATS ROW ──────────────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginTop: 20, gap: 12 }}>
          <StatCard
            label="Pets"
            value={petsCount}
            accent="#FF6B6B"
            isDark={isDark}
            t={t}
          />
          <StatCard
            label="Reminders"
            value={remindersCount}
            accent="#FF9F0A"
            warning={remindersCount > 0}
            isDark={isDark}
            t={t}
          />
          <StatCard
            label="Low Stock"
            value={lowStockCount}
            accent="#FF3B30"
            danger={lowStockCount > 0}
            isDark={isDark}
            t={t}
          />
        </View>

        {/* ─── PET CAROUSEL ───────────────────────────────────────────────── */}
        <View style={{ marginTop: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: t.textPrimary }}>Your Pets</Text>
            <Link href="/pet/new" asChild>
              <Pressable hitSlop={8}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#FF6B6B' }}>+ Add</Text>
              </Pressable>
            </Link>
          </View>

          {isLoading ? (
            <View style={{ paddingHorizontal: 16, paddingVertical: 40 }}>
              <ActivityIndicator color="#FF6B6B" />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
              {showEmptyPet ? (
                <Link href="/pet/new" asChild>
                  <Pressable
                    style={{
                      width: 140,
                      height: 160,
                      borderRadius: 20,
                      borderWidth: 2,
                      borderStyle: 'dashed',
                      borderColor: isDark ? '#48484A' : '#AEAEB2',
                      backgroundColor: t.card,
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: t.accentBg,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Plus color="#FF6B6B" size={22} />
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: t.textPrimary }}>Add your</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: t.textPrimary }}>first pet</Text>
                  </Pressable>
                </Link>
              ) : (
                pets.map((p) => (
                  <PetCard
                    key={p.id}
                    pet={p}
                    isDark={isDark}
                    onPress={() => router.push(`/pet/${p.id}`)}
                  />
                ))
              )}
            </ScrollView>
          )}
        </View>

        {/* ─── QUICK ACTIONS 2×2 GRID ─────────────────────────────────────── */}
        <View style={{ marginTop: 28, paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: t.textPrimary, marginBottom: 12 }}>
            Quick Actions
          </Text>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <QuickAction
                icon={<Activity color="#FF6B6B" size={20} />}
                iconBg={isDark ? 'rgba(255,107,107,0.15)' : '#FFF0EE'}
                label="Symptoms"
                sub="AI check"
                onPress={() => router.push('/symptoms')}
                isDark={isDark}
                t={t}
              />
              <QuickAction
                icon={<Stethoscope color="#FF3B30" size={20} />}
                iconBg={isDark ? 'rgba(255,59,48,0.15)' : '#FFE5E5'}
                label="Find Vet"
                sub="24/7 clinics"
                onPress={() => router.push('/emergency')}
                isDark={isDark}
                t={t}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <QuickAction
                icon={<Bell color="#FF9F0A" size={20} />}
                iconBg={isDark ? 'rgba(255,159,10,0.15)' : '#FFF3E0'}
                label="Reminders"
                sub="Upcoming"
                onPress={() => router.push('/reminders')}
                isDark={isDark}
                t={t}
              />
              <QuickAction
                icon={<Package color="#007AFF" size={20} />}
                iconBg={isDark ? 'rgba(0,122,255,0.15)' : '#E5F1FF'}
                label="Stock"
                sub="Inventory"
                onPress={() => router.push('/inventory')}
                isDark={isDark}
                t={t}
              />
            </View>
          </View>
        </View>

        {/* ─── SOS EMERGENCY CARD ─────────────────────────────────────────── */}
        <Pressable
          onPress={() => router.push('/emergency')}
          style={({ pressed }) => ({
            marginTop: 20,
            marginHorizontal: 16,
            backgroundColor: t.sosBg,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: t.sosBorder,
            padding: 18,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            opacity: pressed ? 0.9 : 1,
            shadowColor: '#FF3B30',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 4,
          })}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              backgroundColor: '#FF3B30',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 28 }}>🚨</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#FF3B30' }}>Emergency?</Text>
            <Text style={{ fontSize: 12, color: isDark ? '#FFB3B0' : '#D70015', marginTop: 2 }}>
              24/7 vet finder — locate the nearest open clinic
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: '#FF3B30',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>Find Vets</Text>
            <ArrowRight color="#FFFFFF" size={14} />
          </View>
        </Pressable>

        {/* ─── UPCOMING EVENTS (optional) ──────────────────────────────────── */}
        {nextEvent && daysUntil !== null ? (
          <View style={{ marginTop: 28, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 6 }}>
              <Sparkles color="#FF6B6B" size={16} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: t.textPrimary }}>Coming Up</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
            >
              {upcomingReminders.map((r) => {
                const days = Math.max(
                  0,
                  Math.ceil((new Date(r.due_date).getTime() - Date.now()) / 86400000)
                );
                return (
                  <Link key={r.id} href="/reminders" asChild>
                    <Pressable
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.85 : 1,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 16,
                        backgroundColor: t.card,
                        borderWidth: 1,
                        borderColor: t.border,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      })}
                    >
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 10,
                          backgroundColor: t.accentBg,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Syringe color="#FF6B6B" size={16} />
                      </View>
                      <View>
                        <Text
                          numberOfLines={1}
                          style={{ fontSize: 13, fontWeight: '600', color: t.textPrimary, maxWidth: 140 }}
                        >
                          {r.title}
                        </Text>
                        <Text style={{ fontSize: 11, color: t.textSecondary, marginTop: 2 }}>
                          in {days} {days === 1 ? 'day' : 'days'}
                        </Text>
                      </View>
                    </Pressable>
                  </Link>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>
    </Animated.View>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  accent,
  warning,
  danger,
  isDark,
  t,
}: {
  label: string;
  value: number;
  accent: string;
  warning?: boolean;
  danger?: boolean;
  isDark: boolean;
  t: typeof C.light;
}) {
  const numberColor = danger ? '#FF3B30' : warning ? '#FF9F0A' : t.textPrimary;
  return (
    <View
      style={{
        flex: 1,
        height: 84,
        borderRadius: 20,
        backgroundColor: t.card,
        borderWidth: 1,
        borderColor: t.border,
        overflow: 'hidden',
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View style={{ width: 3, backgroundColor: accent }} />
      <View style={{ flex: 1, padding: 12, justifyContent: 'space-between' }}>
        <Text
          style={{
            fontSize: 10,
            color: t.textMuted,
            fontWeight: '600',
            letterSpacing: 0.6,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
        <AnimatedNumber
          value={value}
          style={{ fontSize: 26, fontWeight: '700', color: numberColor }}
        />
      </View>
    </View>
  );
}

function QuickAction({
  icon,
  iconBg,
  label,
  sub,
  onPress,
  isDark,
  t,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  sub?: string;
  onPress: () => void;
  isDark: boolean;
  t: typeof C.light;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        height: 90,
        borderRadius: 20,
        backgroundColor: t.card,
        borderWidth: 1,
        borderColor: t.border,
        paddingHorizontal: 12,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        opacity: pressed ? 0.85 : 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: t.textPrimary }} numberOfLines={1}>
          {label}
        </Text>
        {sub ? (
          <Text style={{ fontSize: 10, color: t.textSecondary, marginTop: 2 }} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
