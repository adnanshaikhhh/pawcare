import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { Pill } from '@/components/Pill';
import { INVENTORY_CATEGORIES, formatInr } from '@/src-shared';
import type { InventoryItem, InventoryPurchase, InventoryCategory } from '@/src-shared';
import { Wallet, TrendingUp, ChevronRight } from 'lucide-react-native';

interface Economics {
  monthlyEstimate: number;
  ytdSpend: number;
  topCategory: { category: InventoryCategory; amount: number } | null;
  perPetShare: { petId: string; petName: string; amount: number }[];
}

/**
 * Cat Economics widget
 * Shows estimated monthly spend on your pets based on inventory
 * consumption rates, plus year-to-date totals.
 */
export function CatEconomicsWidget() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [purchases, setPurchases] = useState<InventoryPurchase[]>([]);
  const [petNames, setPetNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const ytdStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
        const [{ data: inv }, { data: pur }] = await Promise.all([
          supabase.from('inventory_items').select('*').eq('is_active', true),
          supabase
            .from('inventory_purchases')
            .select('*')
            .gte('purchase_date', ytdStart)
            .order('purchase_date', { ascending: false }),
        ]);
        if (!cancelled) {
          setItems((inv ?? []) as InventoryItem[]);
          setPurchases((pur ?? []) as InventoryPurchase[]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const econ = useMemo<Economics | null>(() => {
    if (items.length === 0 && purchases.length === 0) return null;

    // Estimate monthly spend: for each item, divide its last purchase cost
    // by its estimated days remaining times 30.
    let monthly = 0;
    const byCat = new Map<InventoryCategory, number>();
    for (const it of items) {
      const days = it.estimated_days_remaining ?? 30;
      const monthlyCost = it.last_purchased_cost_inr ? (it.last_purchased_cost_inr / Math.max(1, days)) * 30 : 0;
      monthly += monthlyCost;
      byCat.set(it.category, (byCat.get(it.category) ?? 0) + monthlyCost);
    }

    // YTD spend: sum purchases
    const ytd = purchases.reduce((acc, p) => acc + (p.cost_inr ?? 0), 0);

    // Top category
    let topCategory: Economics['topCategory'] = null;
    for (const [cat, amount] of byCat.entries()) {
      if (!topCategory || amount > topCategory.amount) topCategory = { category: cat, amount };
    }

    return {
      monthlyEstimate: monthly,
      ytdSpend: ytd,
      topCategory,
      perPetShare: [], // per-pet breakdown requires richer purchase model
    };
  }, [items, purchases]);

  if (loading) {
    return (
      <Card className="p-4 mb-4">
        <ActivityIndicator color="#FF6B6B" />
      </Card>
    );
  }
  if (!econ) return null;

  const topCatLabel = econ.topCategory
    ? INVENTORY_CATEGORIES.find((c) => c.key === econ.topCategory!.category)
    : null;

  return (
    <Card className="p-4 mb-4 overflow-hidden">
      <View className="flex-row items-center mb-3">
        <View className="h-10 w-10 rounded-2xl bg-green-50 items-center justify-center mr-3">
          <Wallet color="#34C759" size={22} />
        </View>
        <View className="flex-1">
          <Text className="text-xs text-ink-500">Cat economics</Text>
          <Text className="text-lg font-bold text-ink-900">Pet spending</Text>
        </View>
        <Link href="/inventory" asChild>
          <Pressable className="h-8 w-8 rounded-full bg-canvas-sunken items-center justify-center">
            <ChevronRight color="#6E6E73" size={16} />
          </Pressable>
        </Link>
      </View>

      <View className="flex-row gap-3 mb-3">
        <View className="flex-1 bg-canvas-sunken rounded-2xl p-3">
          <Text className="text-[10px] text-ink-500 uppercase tracking-wider">Est. monthly</Text>
          <Text className="text-xl font-bold text-ink-900 mt-0.5">{formatInr(Math.round(econ.monthlyEstimate))}</Text>
        </View>
        <View className="flex-1 bg-canvas-sunken rounded-2xl p-3">
          <Text className="text-[10px] text-ink-500 uppercase tracking-wider">YTD spent</Text>
          <Text className="text-xl font-bold text-ink-900 mt-0.5">{formatInr(econ.ytdSpend)}</Text>
        </View>
      </View>

      {topCatLabel ? (
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Text className="text-lg mr-2">{topCatLabel.emoji}</Text>
            <View>
              <Text className="text-xs text-ink-500">Top category</Text>
              <Text className="text-sm font-semibold text-ink-900">
                {topCatLabel.label} · {formatInr(Math.round(econ.topCategory!.amount))}/mo
              </Text>
            </View>
          </View>
          <Pill variant="brand">
            <View className="flex-row items-center">
              <TrendingUp color="#FF6B6B" size={11} />
              <Text className="text-[10px] font-semibold text-brand-primary ml-0.5">est</Text>
            </View>
          </Pill>
        </View>
      ) : null}
    </Card>
  );
}
