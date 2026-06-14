import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Linking, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { Card } from '@/components/Card';
import { Pill } from '@/components/Pill';
import { Phone, Navigation } from 'lucide-react-native';
import type { EmergencyVet } from '@pawcare/shared';

export default function EmergencyTab() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [vets, setVets] = useState<EmergencyVet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function locate() {
    setError(null);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setError('Location permission denied');
      return;
    }
    const pos = await Location.getCurrentPositionAsync({});
    setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
  }

  async function search() {
    let c = coords;
    if (!c) {
      await locate();
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/emergency/vets?lat=${c.lat}&lon=${c.lon}&radius=10`,
        { headers: { Authorization: `Bearer ${(await import('@/lib/supabase')).supabase.auth.getSession().then(s => s.data.session?.access_token ?? '')}` } }
      ).catch(() => null);
      // Mobile falls back to its own Overpass if web API not reachable
      const data = res ? await res.json().catch(() => null) : null;
      const found = data?.data ?? (await overpassFallback(c.lat, c.lon));
      setVets(found ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-canvas" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text className="text-2xl font-bold text-ink-900">Emergency Vet</Text>
      <Text className="text-ink-500 mt-1 mb-4">Find 24/7 clinics near you.</Text>

      <Card className="p-5 border-2 border-semantic-danger/30 bg-red-50">
        <Text className="text-2xl font-bold text-semantic-danger mb-1">🚨 Emergency?</Text>
        <Text className="text-ink-700 mb-3">Tap to find the nearest open vet clinic.</Text>
        <Pressable onPress={coords ? search : locate} className="bg-semantic-danger py-3 rounded-full">
          <Text className="text-white text-center font-semibold">
            {loading ? <ActivityIndicator color="white" /> : coords ? 'Find nearest vets' : 'Allow location & find vets'}
          </Text>
        </Pressable>
        {error ? <Text className="text-semantic-danger text-sm mt-2">{error}</Text> : null}
      </Card>

      {vets.map((v) => (
        <Card key={v.id} className="p-4 mt-3">
          <View className="flex-row items-start justify-between flex-wrap gap-2">
            <View className="flex-1 min-w-[150px]">
              <Text className="font-semibold text-base">{v.name}</Text>
              {v.address ? <Text className="text-xs text-ink-500 mt-0.5">{v.address}</Text> : null}
              <View className="flex-row gap-1 mt-2 flex-wrap">
                {v.is_24_hours ? <Pill variant="success">24/7</Pill> : null}
                {v.is_open_now ? <Pill variant="success">Open</Pill> : <Pill variant="warning">Closed</Pill>}
                {v.distance_km != null ? <Pill variant="brand">{v.distance_km.toFixed(1)} km</Pill> : null}
              </View>
            </View>
            <View className="flex-row gap-2">
              {v.phone ? (
                <Pressable onPress={() => Linking.openURL(`tel:${v.phone}`)} className="bg-brand-primary px-3 py-2 rounded-full flex-row items-center gap-1">
                  <Phone color="white" size={14} />
                  <Text className="text-white text-sm font-medium">Call</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${v.latitude},${v.longitude}`)}
                className="bg-white border border-ink-100 px-3 py-2 rounded-full flex-row items-center gap-1"
              >
                <Navigation color="#1C1C1E" size={14} />
                <Text className="text-ink-900 text-sm font-medium">Map</Text>
              </Pressable>
            </View>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

async function overpassFallback(lat: number, lon: number): Promise<EmergencyVet[]> {
  const q = `[out:json][timeout:15];(node["amenity"="veterinary"](around:10000,${lat},${lon}););out body;`;
  try {
    const r = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`);
    const j = await r.json();
    return (j.elements ?? []).filter((e: { lat: number; lon: number; tags?: { name?: string; phone?: string; 'contact:phone'?: string; 'addr:street'?: string; opening_hours?: string } }) => e.lat && e.lon).map((e: { id: number; lat: number; lon: number; tags?: { name?: string; phone?: string; 'contact:phone'?: string; 'addr:street'?: string; opening_hours?: string } }) => {
      const t = e.tags ?? {};
      const phone = t['contact:phone'] ?? t.phone ?? null;
      const is24 = (t.opening_hours ?? '').includes('24/7');
      return {
        id: String(e.id), name: t.name ?? 'Veterinary', clinic_name: t.name ?? null, phone,
        address: t['addr:street'] ?? null, latitude: e.lat, longitude: e.lon,
        distance_km: null, is_open_now: is24, rating: null, is_24_hours: is24,
      } as EmergencyVet;
    });
  } catch { return []; }
}
