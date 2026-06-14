import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { SPECIES_LABELS, POPULAR_CAT_BREEDS, POPULAR_DOG_BREEDS, type Species } from '@pawcare/shared';
import * as ImagePicker from 'expo-image-picker';

export default function NewPetScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', species: 'cat' as Species, breed: '', gender: 'unknown' as 'male' | 'female' | 'unknown',
    is_neutered: false, photo_url: '', bio: '',
  });

  function u<K extends keyof typeof form>(k: K, v: (typeof form)[K]) { setForm((f) => ({ ...f, [k]: v })); }

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission needed', 'Allow photo access to upload a pet picture.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!res.canceled && res.assets[0]) {
      u('photo_url', res.assets[0].uri);
    }
  }

  async function save() {
    if (!form.name) { Alert.alert('Name required'); return; }
    setSaving(true);
    try {
      const pet = await api.createPet({
        name: form.name, species: form.species, breed: form.breed || null,
        gender: form.gender, is_neutered: form.is_neutered, photo_url: form.photo_url || null,
        bio: form.bio || null, is_indoor: true, is_birthday_known: true,
      });
      router.replace(`/pet/${pet.id}`);
    } catch (e) {
      Alert.alert('Failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  const breeds = form.species === 'cat' ? POPULAR_CAT_BREEDS : form.species === 'dog' ? POPULAR_DOG_BREEDS : ['Other'];

  return (
    <ScrollView className="flex-1 bg-canvas" contentContainerStyle={{ padding: 16 }}>
      <View className="flex-row items-center gap-2 mb-6">
        {[0, 1, 2].map((i) => (
          <View key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-brand-primary' : 'bg-ink-100'}`} />
        ))}
      </View>

      {step === 0 ? (
        <View>
          <Text className="text-2xl font-bold mb-1">Tell us about your pet</Text>
          <Text className="text-ink-500 mb-5">Step 1 of 3</Text>

          <Text className="text-sm font-medium mb-1.5">Name</Text>
          <TextInput className="bg-white border border-ink-100 rounded-xl px-4 h-13 mb-3" value={form.name} onChangeText={(t) => u('name', t)} placeholder="e.g. Smokey" />

          <Text className="text-sm font-medium mb-1.5">Species</Text>
          <View className="flex-row gap-2 mb-3">
            {(['cat', 'dog', 'other'] as const).map((s) => (
              <Pressable key={s} onPress={() => u('species', s)} className={`flex-1 py-3 rounded-xl border ${form.species === s ? 'bg-brand-light border-brand-primary' : 'bg-white border-ink-100'}`}>
                <Text className="text-center">{SPECIES_LABELS[s].emoji} {SPECIES_LABELS[s].label}</Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-sm font-medium mb-1.5">Breed</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            {breeds.map((b) => (
              <Pressable key={b} onPress={() => u('breed', b)} className={`mr-2 px-3 py-2 rounded-full ${form.breed === b ? 'bg-brand-primary' : 'bg-white border border-ink-100'}`}>
                <Text className={form.breed === b ? 'text-white' : 'text-ink-700'}>{b}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text className="text-sm font-medium mb-1.5">Gender</Text>
          <View className="flex-row gap-2">
            {(['female', 'male', 'unknown'] as const).map((g) => (
              <Pressable key={g} onPress={() => u('gender', g)} className={`flex-1 py-3 rounded-xl border ${form.gender === g ? 'bg-brand-light border-brand-primary' : 'bg-white border-ink-100'}`}>
                <Text className="text-center capitalize">{g}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={() => setStep(1)} disabled={!form.name} className={`mt-6 py-3.5 rounded-full ${form.name ? 'bg-brand-primary' : 'bg-ink-100'}`}>
            <Text className={`text-center font-semibold ${form.name ? 'text-white' : 'text-ink-300'}`}>Continue</Text>
          </Pressable>
        </View>
      ) : null}

      {step === 1 ? (
        <View>
          <Text className="text-2xl font-bold mb-1">Quick info</Text>
          <Text className="text-ink-500 mb-5">Step 2 of 3</Text>

          <Pressable onPress={() => u('is_neutered', !form.is_neutered)} className="flex-row items-center bg-white border border-ink-100 rounded-xl p-4 mb-3">
            <View className={`h-6 w-6 rounded-md border-2 ${form.is_neutered ? 'bg-brand-primary border-brand-primary' : 'border-ink-300'} items-center justify-center mr-3`}>
              {form.is_neutered ? <Text className="text-white">✓</Text> : null}
            </View>
            <Text>Neutered / spayed</Text>
          </Pressable>

          <Text className="text-sm font-medium mb-1.5">Bio (optional)</Text>
          <TextInput className="bg-white border border-ink-100 rounded-xl px-4 py-3 mb-3 min-h-[100px]" value={form.bio} onChangeText={(t) => u('bio', t)} placeholder="Personality, quirks, favourite snacks…" multiline />

          <View className="flex-row gap-2 mt-6">
            <Pressable onPress={() => setStep(0)} className="flex-1 py-3.5 rounded-full bg-white border border-ink-100"><Text className="text-center">Back</Text></Pressable>
            <Pressable onPress={() => setStep(2)} className="flex-1 py-3.5 rounded-full bg-brand-primary"><Text className="text-center text-white font-semibold">Continue</Text></Pressable>
          </View>
        </View>
      ) : null}

      {step === 2 ? (
        <View>
          <Text className="text-2xl font-bold mb-1">Add a photo</Text>
          <Text className="text-ink-500 mb-5">Step 3 of 3 · optional</Text>

          <View className="items-center mb-5">
            <View className="h-40 w-40 rounded-3xl bg-canvas-sunken items-center justify-center overflow-hidden">
              {form.photo_url ? (
                <Text className="text-5xl">📷</Text>
              ) : (
                <Text className="text-5xl">{SPECIES_LABELS[form.species].emoji}</Text>
              )}
            </View>
          </View>

          <Pressable onPress={pickPhoto} className="bg-white border border-ink-100 py-3 rounded-full mb-3">
            <Text className="text-center">Choose from gallery</Text>
          </Pressable>

          <View className="flex-row gap-2 mt-3">
            <Pressable onPress={() => setStep(1)} className="flex-1 py-3.5 rounded-full bg-white border border-ink-100"><Text className="text-center">Back</Text></Pressable>
            <Pressable onPress={save} disabled={saving} className="flex-1 py-3.5 rounded-full bg-brand-primary">
              {saving ? <ActivityIndicator color="white" /> : <Text className="text-center text-white font-semibold">Save {form.name}</Text>}
            </Pressable>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}
