import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useInventory } from '@/hooks/usePets';
import { Card } from '@/components/Card';
import { Pill } from '@/components/Pill';
import { INVENTORY_CATEGORIES } from '@/src-shared';
import { useState } from 'react';

export default function InventoryTab() {
  const { items, refresh } = useInventory();
  const [filter, setFilter] = useState<string | 'all'>('all');

  const lowStock = items.filter((i) => (i.estimated_days_remaining ?? 999) <= (i.alert_days_before ?? 2));
  const filtered = filter === 'all' ? items : items.filter((i) => i.category === filter);

  return (
    <ScrollView className="flex-1 bg-canvas" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text className="text-2xl font-bold text-ink-900">Inventory</Text>
      <Text className="text-ink-500 mt-1 mb-4">Track food, litter, and supplies</Text>

      {lowStock.length > 0 ? (
        <Card className="p-4 mb-4 border-2 border-semantic-warning/30">
          <Text className="font-semibold text-semantic-warning">⚠️ {lowStock.length} item(s) running low</Text>
          {lowStock.slice(0, 3).map((i) => (
            <Text key={i.id} className="text-sm text-ink-700 mt-1">• {i.item_name} (~{i.estimated_days_remaining ?? 0} days)</Text>
          ))}
        </Card>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
        <Pressable onPress={() => setFilter('all')} className={`px-3 py-1.5 rounded-full mr-2 ${filter === 'all' ? 'bg-brand-primary' : 'bg-white border border-ink-100'}`}>
          <Text className={filter === 'all' ? 'text-white' : 'text-ink-700'}>All</Text>
        </Pressable>
        {INVENTORY_CATEGORIES.map((c) => (
          <Pressable key={c.key} onPress={() => setFilter(c.key)} className={`px-3 py-1.5 rounded-full mr-2 ${filter === c.key ? 'bg-brand-primary' : 'bg-white border border-ink-100'}`}>
            <Text className={filter === c.key ? 'text-white' : 'text-ink-700'}>{c.emoji} {c.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <Card className="p-6 items-center"><Text className="text-3xl mb-2">📦</Text><Text className="font-semibold">No items yet</Text></Card>
      ) : (
        filtered.map((i) => {
          const days = i.estimated_days_remaining ?? 0;
          const isLow = days <= (i.alert_days_before ?? 2);
          const isOut = days <= 0;
          const cat = INVENTORY_CATEGORIES.find((c) => c.key === i.category);
          return (
            <Card key={i.id} className="p-4 mb-2">
              <View className="flex-row items-start justify-between">
                <View>
                  <Text className="text-xl">{cat?.emoji}</Text>
                  <Text className="font-semibold mt-1">{i.item_name}</Text>
                  {i.brand ? <Text className="text-xs text-ink-500">{i.brand}</Text> : null}
                </View>
                {isOut ? <Pill variant="danger">Out</Pill> : isLow ? <Pill variant="warning">Low</Pill> : <Pill variant="success">OK</Pill>}
              </View>
              <View className="mt-2 h-1.5 rounded-full bg-canvas-sunken overflow-hidden">
                <View className={`h-full ${isOut ? 'bg-semantic-danger' : isLow ? 'bg-semantic-warning' : 'bg-semantic-success'}`} style={{ width: `${Math.min(100, (days / 30) * 100)}%` }} />
              </View>
              <Text className="text-xs text-ink-500 mt-1">{i.current_quantity ?? '—'} {i.unit} · ~{days} days left</Text>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}
