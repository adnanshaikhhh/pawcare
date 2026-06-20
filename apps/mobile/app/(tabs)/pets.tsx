import { View, Text, FlatList, Pressable, useColorScheme, Animated, Image } from 'react-native';
import * as Haptics from '@/lib/haptics';
import { useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Cat, Dog } from 'lucide-react-native';
import { usePets } from '@/hooks/usePets';
import { SPACING, RADIUS, FONT_SIZE } from '@/lib/theme';
import type { Pet } from '@/src-shared';

export default function PetsTab() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { pets, isLoading, refresh } = usePets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <SafeAreaView className={isDark ? 'flex-1 bg-[#0C0C0F]' : 'flex-1 bg-[#F7F7F9]'} edges={['top']}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {/* Header */}
        <View className="px-4 pt-5 pb-3 flex-row items-center justify-between">
          <View>
            <Text className={isDark ? 'text-[28px] font-bold text-[#F2F2F7]' : 'text-[28px] font-bold text-[#1A1A1E]'}>
              My Pets
            </Text>
            <Text className={isDark ? 'text-[14px] text-[#8E8E93] mt-1' : 'text-[14px] text-[#6E6E73] mt-1'}>
              {pets.length} {pets.length === 1 ? 'family member' : 'family members'}
            </Text>
          </View>
          <Pressable
            onPress={() => { Haptics.medium(); router.push('/pet/new'); }}
            style={({ pressed }) => ({
              width: 52, height: 52, borderRadius: 26,
              backgroundColor: '#FF6B6B',
              alignItems: 'center', justifyContent: 'center',
              shadowColor: '#FF6B6B', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
              transform: [{ scale: pressed ? 0.94 : 1 }],
            })}
          >
            <Plus color="white" size={26} />
          </Pressable>
        </View>

        {pets.length === 0 && !isLoading ? (
          <EmptyState isDark={isDark} onAdd={() => router.push('/pet/new')} />
        ) : (
          <FlatList
            data={pets}
            keyExtractor={(p) => p.id}
            numColumns={pets.length > 1 ? 2 : 1}
            key={pets.length > 1 ? 'grid' : 'single'}
            contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
            columnWrapperStyle={pets.length > 1 ? { gap: 12 } : undefined}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            refreshing={isLoading}
            onRefresh={refresh}
            renderItem={({ item }) => <PetCard pet={item} isDark={isDark} router={router} />}
          />
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

function PetCard({ pet, isDark, router }: { pet: Pet; isDark: boolean; router: ReturnType<typeof useRouter> }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const speciesColor = pet.species === 'dog' ? '#007AFF' : '#FF6B6B';
  const isDog = pet.species === 'dog';
  const initial = pet.name[0]?.toUpperCase() || '?';
  // Calculate age
  const age = pet.date_of_birth ? calcAge(pet.date_of_birth) : null;

  return (
    <Pressable
      onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()}
      onPress={() => router.push(`/pet/${pet.id}`)}
      style={{
        flex: 1,
        aspectRatio: 3 / 4,
        borderRadius: RADIUS.card,
        overflow: 'hidden',
        backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
        transform: [{ scale: scaleAnim }],
      }}
    >
      {/* Photo / fallback */}
      <View className="flex-1">
        {pet.photo_url ? (
          <Image source={{ uri: pet.photo_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={[speciesColor, isDog ? '#5856D6' : '#FF8E53']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 80 }}>{isDog ? '🐶' : '🐱'}</Text>
          </LinearGradient>
        )}

        {/* Bottom gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' }}
          pointerEvents="none"
        />

        {/* Species pill top-right */}
        <View
          style={{
            position: 'absolute', top: 12, right: 12,
            backgroundColor: speciesColor,
            paddingHorizontal: 10, paddingVertical: 4,
            borderRadius: RADIUS.pill,
            flexDirection: 'row', alignItems: 'center',
          }}
        >
          {isDog ? <Dog color="white" size={12} /> : <Cat color="white" size={12} />}
          <Text className="text-white text-[11px] font-semibold ml-1">
            {isDog ? 'Dog' : 'Cat'}
          </Text>
        </View>

        {/* Health dot top-left */}
        <View
          style={{
            position: 'absolute', top: 14, left: 14,
            width: 12, height: 12, borderRadius: 6,
            backgroundColor: '#34C759',
            borderWidth: 2, borderColor: 'white',
          }}
        />

        {/* Name + breed overlay bottom */}
        <View style={{ position: 'absolute', left: 14, right: 14, bottom: 14 }}>
          <Text className="text-white text-[18px] font-bold" numberOfLines={1}>
            {pet.name}
          </Text>
          <Text className="text-white/80 text-[12px] mt-0.5" numberOfLines={1}>
            {[pet.breed, age].filter(Boolean).join(' · ') || (isDog ? 'Dog' : 'Cat')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function EmptyState({ isDark, onAdd }: { isDark: boolean; onAdd: () => void }) {
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -8, duration: 800, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [bounce]);

  return (
    <View className="flex-1 items-center justify-center px-10">
      <Animated.View style={{ transform: [{ translateY: bounce }] }}>
        <Text style={{ fontSize: 80 }}>🐾</Text>
      </Animated.View>
      <Text className={isDark ? 'text-[22px] font-bold text-[#F2F2F7] mt-6' : 'text-[22px] font-bold text-[#1A1A1E] mt-6'}>
        No pets yet
      </Text>
      <Text className={isDark ? 'text-[15px] text-[#8E8E93] mt-2 text-center' : 'text-[15px] text-[#6E6E73] mt-2 text-center'}>
        Add your cats and dogs to get started
      </Text>
      <Pressable
        onPress={onAdd}
        style={({ pressed }) => ({
          marginTop: 24, paddingHorizontal: 28, paddingVertical: 14,
          backgroundColor: '#FF6B6B', borderRadius: RADIUS.button,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        })}
      >
        <Text className="text-white text-[15px] font-semibold">Add First Pet</Text>
      </Pressable>
    </View>
  );
}

function calcAge(dob: string): string {
  try {
    const birth = new Date(dob);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    if (years < 1) {
      const months = (now.getMonth() - birth.getMonth()) + (now.getFullYear() - birth.getFullYear()) * 12;
      return months <= 0 ? 'new' : `${months}mo`;
    }
    return `${years}y`;
  } catch {
    return '';
  }
}