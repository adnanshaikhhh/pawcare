import { View, Text, ScrollView, Pressable, RefreshControl, useColorScheme, ActivityIndicator } from 'react-native';
import * as Haptics from '@/lib/haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState, useMemo, useCallback } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeInUp,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Plus, Wallet, ChevronRight, Package, Truck, AlertTriangle, Phone, MapPin } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { INVENTORY_CATEGORIES, formatInr } from '@/src-shared';
import type { InventoryItem } from '@/src-shared';
import { supabase } from '@/lib/supabase';

const CATEGORY_BAR_COLORS: Record<string, string> = {
  food_dry: '#FF8E53',
  food_wet: '#FF6B6B',
  food_treats: '#FFB347',
  litter: '#A0A0A0',
  medicine: '#4FACFE',
  grooming: '#FF85A1',
  accessories: '#B084F6',
  toys: '#FFD93D',
  other: '#6E6E73',
};

export default function InventoryTab() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [purchases, setPurchases] = useState<{ item_id: string; cost_inr: number | null; purchase_date: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string | 'all'>('all');

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      const [{ data: inv }, { data: pur }] = await Promise.all([
        supabase.from('inventory_items').select('*').eq('is_active', true),
        supabase
          .from('inventory_purchases')
          .select('item_id, cost_inr, purchase_date')
          .order('purchase_date', { ascending: false })
          .limit(200),
      ]);
      setItems((inv ?? []) as InventoryItem[]);
      setPurchases(pur ?? []);
    } catch (e) {
      console.warn('[Inventory] load failed', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // --- Derived metrics ---
  const lowStock = useMemo(
    () => items.filter((i) => (i.estimated_days_remaining ?? 999) <= (i.alert_days_before ?? 2)),
    [items]
  );
  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((i) => i.category === filter)),
    [items, filter]
  );

  // Monthly spend: sum purchases this month
  const monthly = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const thisMonth = purchases
      .filter((p) => p.purchase_date >= monthStart && p.purchase_date <= monthEnd)
      .reduce((acc, p) => acc + (p.cost_inr ?? 0), 0);

    // Last 3 months bars
    const months: { label: string; amount: number; isCurrent: boolean }[] = [];
    for (let i = 2; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const sStr = start.toISOString().split('T')[0];
      const eStr = end.toISOString().split('T')[0];
      const amt = purchases
        .filter((p) => p.purchase_date >= sStr && p.purchase_date <= eStr)
        .reduce((acc, p) => acc + (p.cost_inr ?? 0), 0);
      months.push({
        label: start.toLocaleDateString(undefined, { month: 'short' }),
        amount: amt,
        isCurrent: i === 0,
      });
    }

    const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
    return { thisMonth, months, daysLeft };
  }, [purchases]);

  // --- Pulse for FAB ---
  const fabScale = useSharedValue(1);
  useEffect(() => {
    fabScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(1.0, { duration: 900, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, [fabScale]);
  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  // --- Theme ---
  const pageBg = isDark ? '#0C0C0F' : '#F7F7F9';
  const headingColor = isDark ? '#F2F2F7' : '#1A1A1E';
  const subColor = isDark ? '#8E8E93' : '#6E6E73';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const subtleBg = isDark ? '#2C2C2E' : '#F2F2F7';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const inactiveChipBg = isDark ? '#1C1C1E' : '#FFFFFF';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: pageBg }} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#FF6B6B" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* a) HEADER */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: headingColor }}>
              📦 Inventory
            </Text>
            <Text style={{ fontSize: 14, color: subColor, marginTop: 2 }}>
              Track food, litter, and supplies
            </Text>
          </View>
          <Animated.View style={fabStyle}>
            <Pressable
              onPress={() => router.push('/(tabs)/inventory')}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: '#FF6B6B',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#FF6B6B',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 8,
                elevation: 5,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.94 : 1 }],
              })}
              accessibilityLabel="Add inventory item"
            >
              <Plus color="#FFFFFF" size={22} />
            </Pressable>
          </Animated.View>
        </View>

        {/* b) MONTHLY SPEND CARD */}
        <Animated.View
          entering={FadeInUp.delay(0).duration(400)}
          style={{ paddingHorizontal: 16, marginTop: 8 }}
        >
          <MonthlySpendCard
            monthly={monthly}
            cardBg={cardBg}
            borderColor={borderColor}
            subtleBg={subtleBg}
            headingColor={headingColor}
            subColor={subColor}
            isDark={isDark}
          />
        </Animated.View>

        {/* c) CATEGORY CHIPS */}
        <Animated.View entering={FadeInUp.delay(60).duration(400)} style={{ marginTop: 16 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            <Chip
              label="All"
              emoji="🗂️"
              active={filter === 'all'}
              activeBg="#FF6B6B"
              inactiveBg={inactiveChipBg}
              activeColor="#FFFFFF"
              inactiveColor={subColor}
              borderColor={borderColor}
              onPress={() => setFilter('all')}
            />
            {INVENTORY_CATEGORIES.map((c) => (
              <Chip
                key={c.key}
                label={c.label}
                emoji={c.emoji}
                active={filter === c.key}
                activeBg="#FF6B6B"
                inactiveBg={inactiveChipBg}
                activeColor="#FFFFFF"
                inactiveColor={subColor}
                borderColor={borderColor}
                onPress={() => setFilter(c.key)}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* Body */}
        {loading ? (
          <View style={{ paddingHorizontal: 16, marginTop: 16, gap: 10 }}>
            {Array.from({ length: 3 }).map((_, idx) => (
              <SkeletonItemCard key={idx} cardBg={cardBg} subtleBg={subtleBg} borderColor={borderColor} delay={idx * 80} />
            ))}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
            {/* d) LOW STOCK SECTION */}
            {lowStock.length > 0 ? (
              <Animated.View entering={FadeInUp.delay(120).duration(400)} style={{ marginBottom: 16 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <AlertTriangle color="#FF9F0A" size={16} />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: headingColor,
                      marginLeft: 6,
                    }}
                  >
                    ⚠️ Running Low
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: subColor,
                      marginLeft: 8,
                    }}
                  >
                    {lowStock.length} item{lowStock.length === 1 ? '' : 's'}
                  </Text>
                </View>
                <View
                  style={{
                    borderLeftWidth: 3,
                    borderLeftColor: '#FF9F0A',
                    backgroundColor: cardBg,
                    borderRadius: 14,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor,
                  }}
                >
                  {lowStock.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      cardBg={cardBg}
                      borderColor={borderColor}
                      subtleBg={subtleBg}
                      headingColor={headingColor}
                      subColor={subColor}
                      onPress={() => router.push('/(tabs)/inventory')}
                    />
                  ))}
                </View>
              </Animated.View>
            ) : null}

            {/* Items list */}
            {filtered.length === 0 ? (
              <EmptyState
                isDark={isDark}
                cardBg={cardBg}
                borderColor={borderColor}
                subColor={subColor}
                headingColor={headingColor}
                onAdd={() => router.push('/(tabs)/inventory')}
              />
            ) : (
              <View style={{ gap: 10 }}>
                {filtered.map((item, idx) => (
                  <Animated.View
                    key={item.id}
                    entering={FadeInUp.delay(150 + idx * 40).duration(350)}
                  >
                    <ItemCard
                      item={item}
                      cardBg={cardBg}
                      borderColor={borderColor}
                      subtleBg={subtleBg}
                      headingColor={headingColor}
                      subColor={subColor}
                      onPress={() => router.push('/(tabs)/inventory')}
                    />
                  </Animated.View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- Components ----------

function MonthlySpendCard({
  monthly,
  cardBg,
  borderColor,
  subtleBg,
  headingColor,
  subColor,
  isDark,
}: {
  monthly: { thisMonth: number; months: { label: string; amount: number; isCurrent: boolean }[]; daysLeft: number };
  cardBg: string;
  borderColor: string;
  subtleBg: string;
  headingColor: string;
  subColor: string;
  isDark: boolean;
}) {
  const max = Math.max(1, ...monthly.months.map((m) => m.amount));
  const hasData = monthly.months.some((m) => m.amount > 0);
  return (
    <View
      style={{
        backgroundColor: cardBg,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.06,
        shadowRadius: 12,
        elevation: 3,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: isDark ? 'rgba(52,199,89,0.18)' : '#E8F8EC',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Wallet color="#34C759" size={22} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: subColor, fontWeight: '600', letterSpacing: 0.5 }}>
            THIS MONTH
          </Text>
          <Text style={{ fontSize: 26, fontWeight: '700', color: headingColor, marginTop: 2 }}>
            {hasData ? formatInr(monthly.thisMonth) : '₹ 0'}
          </Text>
        </View>
      </View>

      {/* Mini bar chart */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          height: 56,
          marginTop: 14,
          paddingHorizontal: 4,
        }}
      >
        {monthly.months.map((m) => {
          const h = Math.max(4, Math.round((m.amount / max) * 40));
          return (
            <View key={m.label} style={{ alignItems: 'center', width: 60 }}>
              <View
                style={{
                  width: 28,
                  height: h,
                  borderRadius: 6,
                  backgroundColor: m.isCurrent ? '#FF6B6B' : isDark ? '#3A3A3C' : '#E8E8ED',
                  marginBottom: 4,
                }}
              />
              <Text
                style={{
                  fontSize: 10,
                  color: m.isCurrent ? (isDark ? '#F2F2F7' : '#1A1A1E') : subColor,
                  fontWeight: m.isCurrent ? '700' : '500',
                }}
              >
                {m.label}
              </Text>
              {m.amount > 0 ? (
                <Text style={{ fontSize: 9, color: subColor, marginTop: 1 }}>
                  {formatInr(m.amount).replace('₹', '₹')}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>

      {/* Caption */}
      <Text style={{ fontSize: 12, color: subColor, marginTop: 10, textAlign: 'center' }}>
        {hasData
          ? `${monthly.daysLeft} day${monthly.daysLeft === 1 ? '' : 's'} left in this month`
          : 'Add purchases to track spending'}
      </Text>
    </View>
  );
}

function Chip({
  label,
  emoji,
  active,
  activeBg,
  inactiveBg,
  activeColor,
  inactiveColor,
  borderColor,
  onPress,
}: {
  label: string;
  emoji?: string;
  active: boolean;
  activeBg: string;
  inactiveBg: string;
  activeColor: string;
  inactiveColor: string;
  borderColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: active ? activeBg : inactiveBg,
        borderWidth: active ? 0 : 1,
        borderColor,
        shadowColor: active ? '#FF6B6B' : 'transparent',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: active ? 0.3 : 0,
        shadowRadius: 8,
        elevation: active ? 3 : 0,
        opacity: pressed ? 0.85 : 1,
        transform: [{ scale: pressed ? 0.96 : 1 }],
      })}
    >
      {emoji ? (
        <Text style={{ fontSize: 13, marginRight: 6 }}>{emoji}</Text>
      ) : null}
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: active ? activeColor : inactiveColor,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ItemCard({
  item,
  cardBg,
  borderColor,
  subtleBg,
  headingColor,
  subColor,
  onPress,
}: {
  item: InventoryItem;
  cardBg: string;
  borderColor: string;
  subtleBg: string;
  headingColor: string;
  subColor: string;
  onPress: () => void;
}) {
  const days = item.estimated_days_remaining ?? 0;
  const isLow = days <= (item.alert_days_before ?? 2);
  const isOut = days <= 0;
  const cat = INVENTORY_CATEGORIES.find((c) => c.key === item.category);
  const catColor = CATEGORY_BAR_COLORS[item.category] ?? '#FF6B6B';

  const statusBg = isOut ? '#FFEAEA' : isLow ? '#FFF3E0' : '#E8F8EC';
  const statusFg = isOut ? '#FF3B30' : isLow ? '#FF9F0A' : '#34C759';
  const statusLabel = isOut ? 'Out' : isLow ? 'Low' : 'OK';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: cardBg,
        borderRadius: 16,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 72,
        borderWidth: 1,
        borderColor,
        marginBottom: 10,
        opacity: pressed ? 0.85 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      {/* Left: category emoji in colored circle */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: catColor + '22',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Text style={{ fontSize: 22 }}>{cat?.emoji ?? '📦'}</Text>
      </View>

      {/* Middle: name + brand + qty */}
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontSize: 15, fontWeight: '700', color: headingColor }}
          numberOfLines={1}
        >
          {item.item_name}
        </Text>
        {item.brand ? (
          <Text style={{ fontSize: 12, color: subColor, marginTop: 1 }} numberOfLines={1}>
            {item.brand}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Text style={{ fontSize: 11, color: subColor }}>
            {item.current_quantity ?? '—'} {item.unit} remaining
          </Text>
          <View
            style={{
              width: 3,
              height: 3,
              borderRadius: 2,
              backgroundColor: subColor,
              marginHorizontal: 6,
            }}
          />
          <Text style={{ fontSize: 11, color: subColor }}>
            ~{days} day{days === 1 ? '' : 's'} left
          </Text>
        </View>
      </View>

      {/* Right: status pill */}
      <View
        style={{
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 999,
          backgroundColor: statusBg,
          marginLeft: 8,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '700', color: statusFg }}>{statusLabel}</Text>
      </View>
    </Pressable>
  );
}

function EmptyState({
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
    <View
      style={{
        backgroundColor: cardBg,
        borderRadius: 22,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor,
        borderStyle: 'dashed',
        marginTop: 8,
      }}
    >
      <Text style={{ fontSize: 56, marginBottom: 12 }}>🗂️</Text>
      <Text style={{ fontSize: 22, fontWeight: '700', color: headingColor, marginBottom: 6 }}>
        Nothing tracked yet
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: subColor,
          textAlign: 'center',
          marginBottom: 18,
          lineHeight: 20,
          maxWidth: 280,
        }}
      >
        Add cat food, litter, and supplies to get low-stock alerts before you run out.
      </Text>
      <Pressable
        onPress={onAdd}
        style={({ pressed }) => ({
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 14,
          backgroundColor: '#FF6B6B',
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#FF6B6B',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        })}
      >
        <Plus color="#FFFFFF" size={16} />
        <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14, marginLeft: 6 }}>
          Add First Item
        </Text>
      </Pressable>
    </View>
  );
}

function SkeletonItemCard({
  cardBg,
  subtleBg,
  borderColor,
  delay,
}: {
  cardBg: string;
  subtleBg: string;
  borderColor: string;
  delay: number;
}) {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 750, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.4, { duration: 750, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(350)}
      style={[
        {
          backgroundColor: cardBg,
          borderRadius: 16,
          padding: 12,
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 72,
          borderWidth: 1,
          borderColor,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: subtleBg,
          marginRight: 12,
        }}
      />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ width: '55%', height: 12, borderRadius: 6, backgroundColor: subtleBg }} />
        <View style={{ width: '35%', height: 10, borderRadius: 5, backgroundColor: subtleBg }} />
      </View>
      <View style={{ width: 50, height: 22, borderRadius: 11, backgroundColor: subtleBg }} />
    </Animated.View>
  );
}
