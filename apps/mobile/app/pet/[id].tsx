import { View, Text, ScrollView, Pressable, useColorScheme, Animated, ActivityIndicator } from 'react-native';
import * as Haptics from '@/lib/haptics';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Heart, Stethoscope, Syringe, Pill, Scale, Smile, Camera, Plus } from 'lucide-react-native';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { SPACING, RADIUS } from '@/lib/theme';
import type { Pet, VetVisit, Vaccination, Medication, WeightLog, MoodLog } from '@/src-shared';

type Tab = 'overview' | 'medical' | 'vaccines' | 'meds' | 'deworming' | 'weight' | 'mood' | 'photos';

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'overview', label: 'Overview', emoji: '🏠' },
  { id: 'medical', label: 'Medical', emoji: '🩺' },
  { id: 'vaccines', label: 'Vaccines', emoji: '💉' },
  { id: 'meds', label: 'Meds', emoji: '💊' },
  { id: 'deworming', label: 'Deworming', emoji: '🪱' },
  { id: 'weight', label: 'Weight', emoji: '⚖️' },
  { id: 'mood', label: 'Mood', emoji: '😺' },
  { id: 'photos', label: 'Photos', emoji: '📸' },
];

export default function PetProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [pet, setPet] = useState<Pet | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);

  // Data per tab
  const [vetVisits, setVetVisits] = useState<VetVisit[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [weights, setWeights] = useState<WeightLog[]>([]);
  const [moods, setMoods] = useState<MoodLog[]>([]);
  const [dewormings, setDewormings] = useState<any[]>([]);

  const fetchPet = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const pets = await api.listPets();
      const found = pets?.find((p) => p.id === id);
      setPet(found ?? null);

      // Load all section data in parallel
      const [vv, vacc, meds, w, m] = await Promise.all([
        api.listVetVisits(id).catch(() => []),
        api.listVaccinations(id).catch(() => []),
        api.listMedications(id).catch(() => []),
        api.listWeight(id).catch(() => []),
        api.listMood(id).catch(() => []),
      ]);
      setVetVisits(vv ?? []);
      setVaccinations(vacc ?? []);
      setMedications(meds ?? []);
      setWeights(w ?? []);
      setMoods(m ?? []);

      // Dewormings via direct REST
      const { data: dw } = await supabase
        .from('deworming_records')
        .select('*')
        .eq('pet_id', id)
        .order('date_given', { ascending: false });
      setDewormings(dw ?? []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchPet(); }, [fetchPet]);

  if (loading || !pet) {
    return (
      <View className={isDark ? 'flex-1 bg-[#0C0C0F] items-center justify-center' : 'flex-1 bg-[#F7F7F9] items-center justify-center'}>
        <ActivityIndicator color="#FF6B6B" size="large" />
      </View>
    );
  }

  const isDog = pet.species === 'dog';
  const speciesColor = isDog ? '#007AFF' : '#FF6B6B';
  const age = pet.date_of_birth ? calcAge(pet.date_of_birth) : null;
  const lastWeight = weights[0]?.weight_kg ?? pet.weight_kg ?? null;
  const nextVaccine = vaccinations.find(v => v.next_due_date && new Date(v.next_due_date) > new Date());

  return (
    <View className={isDark ? 'flex-1 bg-[#0C0C0F]' : 'flex-1 bg-[#F7F7F9]'}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header with photo or gradient */}
        <View style={{ height: 280, position: 'relative' }}>
          {pet.photo_url ? (
            <Animated.Image source={{ uri: pet.photo_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <LinearGradient
              colors={[speciesColor, isDog ? '#5856D6' : '#FF8E53']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 100 }}>{isDog ? '🐶' : '🐱'}</Text>
            </LinearGradient>
          )}

          {/* Bottom gradient */}
          <LinearGradient
            colors={['transparent', isDark ? 'rgba(12,12,15,1)' : 'rgba(247,247,249,1)']}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%' }}
            pointerEvents="none"
          />

          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              position: 'absolute', top: 50, left: 16,
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: 'rgba(0,0,0,0.4)',
              alignItems: 'center', justifyContent: 'center',
              transform: [{ scale: pressed ? 0.9 : 1 }],
            })}
          >
            <ArrowLeft color="white" size={22} />
          </Pressable>

          {/* Avatar + name floating at bottom */}
          <View style={{ position: 'absolute', bottom: 16, left: 20, right: 20 }}>
            <View className="flex-row items-end">
              <View
                style={{
                  width: 80, height: 80, borderRadius: 40,
                  backgroundColor: speciesColor,
                  borderWidth: 4, borderColor: 'white',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text className="text-white text-3xl font-bold">{pet.name[0]?.toUpperCase() || '?'}</Text>
              </View>
              <View className="flex-1 ml-3 mb-2">
                <Text className="text-white text-[26px] font-bold" style={{ textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 4 }}>
                  {pet.name}
                </Text>
                <Text className="text-white/90 text-[14px] mt-0.5">
                  {[isDog ? '🐶 Dog' : '🐱 Cat', pet.breed, age].filter(Boolean).join(' · ')}
                </Text>
              </View>
            </View>
            {/* Pills */}
            <View className="flex-row gap-2 mt-3">
              {lastWeight ? (
                <PetPill darkBg={isDark} icon={<Scale color={isDark ? '#F2F2F7' : '#1A1A1E'} size={12} />} label={`${lastWeight} kg`} />
              ) : null}
              {pet.is_neutered ? <PetPill darkBg={isDark} icon={<Heart color={isDark ? '#F2F2F7' : '#1A1A1E'} size={12} />} label="Neutered" /> : null}
              <PetPill darkBg={isDark} label={isDog ? 'Dog' : 'Cat'} />
            </View>
          </View>
        </View>

        {/* Quick stats row */}
        <View className="flex-row px-4 mt-4 gap-2">
          <StatCard label="Weight" value={lastWeight ? `${lastWeight}` : '—'} unit="kg" isDark={isDark} />
          <StatCard label="Last Vet" value={vetVisits[0] ? relTime(vetVisits[0].visit_date) : '—'} isDark={isDark} />
          <StatCard label="Next Vac" value={nextVaccine?.next_due_date ? relTime(nextVaccine.next_due_date) : '—'} isDark={isDark} />
          <StatCard label="Status" value={pet.is_neutered ? '✓' : '—'} isDark={isDark} />
        </View>

        {/* Tab pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, gap: 8 }}
        >
          {TABS.map(t => (
            <Pressable
              key={t.id}
              onPress={() => setActiveTab(t.id)}
              style={{
                paddingHorizontal: 14, paddingVertical: 8,
                borderRadius: RADIUS.pill,
                backgroundColor: activeTab === t.id ? '#FF6B6B' : (isDark ? '#1C1C1E' : '#FFFFFF'),
                borderWidth: 1, borderColor: activeTab === t.id ? '#FF6B6B' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
              }}
            >
              <Text className={`text-[13px] font-semibold ${activeTab === t.id ? 'text-white' : (isDark ? 'text-[#F2F2F7]' : 'text-[#1A1A1E]')}`}>
                {t.emoji} {t.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Tab content */}
        <View className="px-4 pb-8">
          {activeTab === 'overview' && <OverviewTab pet={pet} weights={weights} moods={moods} vetVisits={vetVisits} isDark={isDark} />}
          {activeTab === 'medical' && <TimelineSection title="Medical" items={vetVisits} renderItem={(v: any) => `${v.reason || 'Checkup'}${v.vet_name ? ' — ' + v.vet_name : ''}`} renderDate={(v: any) => v.visit_date} isDark={isDark} />}
          {activeTab === 'vaccines' && <TimelineSection title="Vaccinations" items={vaccinations} renderItem={(v: any) => v.vaccine_name} renderDate={(v: any) => v.date_given} isDark={isDark} />}
          {activeTab === 'meds' && <TimelineSection title="Medications" items={medications} renderItem={(m: any) => `${m.medicine_name}${m.dosage ? ' — ' + m.dosage : ''}`} renderDate={(m: any) => m.start_date} isDark={isDark} />}
          {activeTab === 'deworming' && <TimelineSection title="Deworming" items={dewormings} renderItem={(d: any) => d.product_name} renderDate={(d: any) => d.date_given} isDark={isDark} />}
          {activeTab === 'weight' && <TimelineSection title="Weight history" items={weights} renderItem={(w: any) => `${w.weight_kg} kg`} renderDate={(w: any) => w.measured_at} isDark={isDark} />}
          {activeTab === 'mood' && <TimelineSection title="Mood log" items={moods} renderItem={(m: any) => `${emojiForMood(m.mood)} ${m.mood}`} renderDate={(m: any) => m.logged_date} isDark={isDark} />}
          {activeTab === 'photos' && (
            <View className="items-center py-8">
              <Camera color={isDark ? '#48484A' : '#AEAEB2'} size={48} />
              <Text className={isDark ? 'text-[#8E8E93] mt-3' : 'text-[#6E6E73] mt-3'}>No photos yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function PetPill({ darkBg, icon, label }: { darkBg: boolean; icon?: React.ReactNode; label: string }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 10, paddingVertical: 4,
      borderRadius: RADIUS.pill,
      backgroundColor: darkBg ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.7)',
    }}>
      {icon ? <View style={{ marginRight: 4 }}>{icon}</View> : null}
      <Text className={darkBg ? 'text-white text-[11px] font-semibold' : 'text-[#1A1A1E] text-[11px] font-semibold'}>
        {label}
      </Text>
    </View>
  );
}

function StatCard({ label, value, unit, isDark }: { label: string; value: string; unit?: string; isDark: boolean }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
        borderRadius: 14,
        padding: 10,
        alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
      }}
    >
      <Text className={isDark ? 'text-[10px] text-[#8E8E93] uppercase' : 'text-[10px] text-[#6E6E73] uppercase'}>
        {label}
      </Text>
      <Text className={isDark ? 'text-[18px] font-bold text-[#F2F2F7] mt-1' : 'text-[18px] font-bold text-[#1A1A1E] mt-1'}>
        {value}{unit ? <Text className="text-[11px] text-[#8E8E93]"> {unit}</Text> : null}
      </Text>
    </View>
  );
}

function OverviewTab({ pet, weights, moods, vetVisits, isDark }: any) {
  return (
    <View>
      <Section title="Recent activity" isDark={isDark}>
        {weights[0] && <TimelineRow icon="⚖️" title={`${weights[0].weight_kg} kg`} subtitle={`Weighed ${relTime(weights[0].measured_at)}`} isDark={isDark} />}
        {moods[0] && <TimelineRow icon={emojiForMood(moods[0].mood)} title={moods[0].mood} subtitle={`Mood ${relTime(moods[0].logged_date)}`} isDark={isDark} />}
        {vetVisits[0] && <TimelineRow icon="🩺" title={vetVisits[0].reason || 'Vet visit'} subtitle={relTime(vetVisits[0].visit_date)} isDark={isDark} />}
        {!weights[0] && !moods[0] && !vetVisits[0] && (
          <EmptySection emoji="📋" message="No activity yet" hint="Add weight, mood, or vet visits to see them here." isDark={isDark} />
        )}
      </Section>
      {pet.bio ? (
        <Section title="About" isDark={isDark}>
          <Text className={isDark ? 'text-[#F2F2F7] text-[14px] leading-5' : 'text-[#1A1A1E] text-[14px] leading-5'}>
            {pet.bio}
          </Text>
        </Section>
      ) : null}
    </View>
  );
}

function Section({ title, isDark, children }: any) {
  return (
    <View className="mb-5">
      <Text className={isDark ? 'text-[16px] font-semibold text-[#F2F2F7] mb-3' : 'text-[16px] font-semibold text-[#1A1A1E] mb-3'}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function TimelineSection({ title, items, renderItem, renderDate, isDark }: any) {
  return (
    <Section title={title} isDark={isDark}>
      {items.length === 0 ? (
        <EmptySection emoji="📭" message={`No ${title.toLowerCase()} yet`} hint={`Tap + to add the first one.`} isDark={isDark} />
      ) : (
        items.slice(0, 30).map((item: any, i: number) => (
          <TimelineRow key={item.id || i} icon="•" title={renderItem(item)} subtitle={renderDate(item) ? new Date(renderDate(item)).toLocaleDateString() : ''} isDark={isDark} />
        ))
      )}
    </Section>
  );
}

function TimelineRow({ icon, title, subtitle, isDark }: any) {
  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 10, paddingHorizontal: 12,
        backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
        borderRadius: 12,
        marginBottom: 6,
      }}
    >
      <View
        style={{
          width: 8, height: 8, borderRadius: 4,
          backgroundColor: '#FF6B6B',
        }}
      />
      <View className="flex-1">
        <Text className={isDark ? 'text-[14px] font-semibold text-[#F2F2F7]' : 'text-[14px] font-semibold text-[#1A1A1E]'}>
          {icon} {title}
        </Text>
        {subtitle ? <Text className={isDark ? 'text-[11px] text-[#8E8E93] mt-0.5' : 'text-[11px] text-[#6E6E73] mt-0.5'}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

function EmptySection({ emoji, message, hint, isDark }: any) {
  return (
    <View
      style={{
        alignItems: 'center', paddingVertical: 24,
        backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
        borderRadius: 12,
      }}
    >
      <Text style={{ fontSize: 36 }}>{emoji}</Text>
      <Text className={isDark ? 'text-[15px] font-semibold text-[#F2F2F7] mt-2' : 'text-[15px] font-semibold text-[#1A1A1E] mt-2'}>
        {message}
      </Text>
      <Text className={isDark ? 'text-[12px] text-[#8E8E93] mt-1' : 'text-[12px] text-[#6E6E73] mt-1'}>
        {hint}
      </Text>
    </View>
  );
}

function emojiForMood(mood: string): string {
  const map: Record<string, string> = {
    happy: '😺', playful: '😸', calm: '😌', tired: '😴',
    anxious: '😿', aggressive: '😾', sick: '🤒', normal: '😼',
  };
  return map[mood?.toLowerCase()] || '😺';
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
  } catch { return ''; }
}

function relTime(iso: string): string {
  try {
    const d = new Date(iso);
    const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  } catch { return ''; }
}