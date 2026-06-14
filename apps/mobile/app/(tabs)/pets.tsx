import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { Link } from 'expo-router';
import { usePets } from '@/hooks/usePets';
import { Card } from '@/components/Card';
import { Pill } from '@/components/Pill';
import { calculateAge, SPECIES_LABELS } from '@/src-shared';
import { Plus } from 'lucide-react-native';

export default function PetsTab() {
  const { pets, isLoading, refresh } = usePets();
  return (
    <View className="flex-1 bg-canvas">
      <View className="px-4 pt-5 pb-3 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-ink-900">My Pets</Text>
          <Text className="text-ink-500 text-sm">{pets.length} in your family</Text>
        </View>
        <Link href="/pet/new" asChild>
          <Pressable className="h-10 w-10 rounded-full bg-brand-primary items-center justify-center">
            <Plus color="white" size={20} />
          </Pressable>
        </Link>
      </View>
      <FlatList
        data={pets}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingBottom: 24, gap: 12 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
        renderItem={({ item }) => (
          <Link href={`/pet/${item.id}`} asChild style={{ flex: 1 }}>
            <Pressable>
              <Card className="overflow-hidden">
                <View className={`h-20 ${item.species === 'cat' ? 'bg-pink-50' : 'bg-blue-50'}`} />
                <View className="p-3 -mt-8">
                  <View className="h-14 w-14 rounded-full bg-white border-2 border-white items-center justify-center">
                    <Text className="text-2xl">{SPECIES_LABELS[item.species].emoji}</Text>
                  </View>
                  <Text className="mt-2 font-semibold">{item.name}</Text>
                  <Text className="text-xs text-ink-500">{item.breed ?? SPECIES_LABELS[item.species].label} · {calculateAge(item.date_of_birth)}</Text>
                  <View className="mt-2 flex-row gap-1 flex-wrap">
                    {item.is_neutered ? <Pill variant="success">Neutered</Pill> : null}
                    {item.is_indoor ? <Pill variant="info">Indoor</Pill> : null}
                  </View>
                </View>
              </Card>
            </Pressable>
          </Link>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View className="p-8 items-center">
              <Text className="text-4xl mb-2">🐾</Text>
              <Text className="font-semibold">No pets yet</Text>
              <Text className="text-sm text-ink-500 text-center mt-1">Tap the + button to add your first pet.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
