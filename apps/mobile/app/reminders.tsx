import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useReminders } from '@/hooks/usePets';
import { Card } from '@/components/Card';
import { Pill } from '@/components/Pill';
import { api } from '@/lib/api';
import { Check } from 'lucide-react-native';

export default function RemindersScreen() {
  const { reminders, refresh } = useReminders();

  async function done(id: string) {
    await api.completeReminder(id);
    refresh();
  }

  return (
    <ScrollView className="flex-1 bg-canvas" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text className="text-2xl font-bold text-ink-900">Reminders</Text>
      <Text className="text-ink-500 mt-1 mb-4">{reminders.length} pending</Text>

      {reminders.length === 0 ? (
        <Card className="p-6 items-center"><Text className="text-3xl mb-2">⏰</Text><Text className="font-semibold">No reminders</Text><Text className="text-sm text-ink-500 mt-1 text-center">Log a vaccine or deworming to auto-create one.</Text></Card>
      ) : (
        reminders.map((r) => {
          const days = Math.ceil((new Date(r.due_date).getTime() - Date.now()) / 86400000);
          return (
            <Card key={r.id} className="p-4 mb-2">
              <View className="flex-row items-center gap-3">
                <View className="flex-1">
                  <Text className="font-semibold">{r.title}</Text>
                  {r.description ? <Text className="text-xs text-ink-500" numberOfLines={1}>{r.description}</Text> : null}
                </View>
                <Pill variant={days <= 0 ? 'danger' : days <= 7 ? 'warning' : 'brand'}>{days <= 0 ? 'Overdue' : `${days}d`}</Pill>
                <Pressable onPress={() => done(r.id)} className="bg-semantic-success/10 p-2 rounded-full">
                  <Check color="#34C759" size={16} />
                </Pressable>
              </View>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}
