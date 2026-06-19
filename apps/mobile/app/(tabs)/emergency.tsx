import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  ActivityIndicator,
  Alert,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeInUp,
} from 'react-native-reanimated';
import { Phone, Navigation, Star, MapPin, Stethoscope, Plus, AlertTriangle } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { supabase } from '@/lib/supabase';
import type { EmergencyVet, VetContact } from '@/src-shared';

type Status = 'idle' | 'requesting_perm' | 'locating' | 'searching' | 'results' | 'no_results' | 'error';

export default function EmergencyTab() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [status, setStatus] = useState<Status>('idle');
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [vets, setVets] = useState<EmergencyVet[]>([]);
  const [savedVets, setSavedVets] = useState<VetContact[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadSaved = useCallback(async () => {
    setSavedLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSavedLoading(false);
        return;
      }
      const { data } = await supabase
        .from('vet_contacts')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      setSavedVets((data ?? []) as VetContact[]);
    } catch (e) {
      console.warn('[Emergency] saved load failed', e);
    } finally {
      setSavedLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  async function requestPermissionAndLocate(): Promise<{ lat: number; lon: number } | null> {
    setErrorMsg(null);
    setStatus('requesting_perm');
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        setErrorMsg('Location permission denied. Enable it in Settings to find nearby vets.');
        setStatus('error');
        return null;
      }
      setStatus('locating');
      const pos = await Location.getCurrentPositionAsync({});
      const c = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      setCoords(c);
      return c;
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Could not get location');
      setStatus('error');
      return null;
    }
  }

  async function findVets() {
    let c = coords;
    if (!c) {
      const got = await requestPermissionAndLocate();
      if (!got) return;
      c = got;
    }
    setStatus('searching');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
      let found: EmergencyVet[] = [];
      try {
        const url = `${process.env.EXPO_PUBLIC_API_URL ?? ''}/api/emergency/vets?lat=${c.lat}&lon=${c.lon}&radius=10`;
        const res = await fetch(url, { headers });
        if (res.ok) {
          const json = await res.json();
          found = (json?.data ?? []) as EmergencyVet[];
        }
      } catch {
        // network failed — fall back below
      }
      if (!found || found.length === 0) {
        found = await overpassFallback(c.lat, c.lon);
      }
      // Sort by distance asc, nulls last
      found = (found ?? [])
        .filter((v) => typeof v.latitude === 'number' && typeof v.longitude === 'number')
        .sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));
      setVets(found);
      setStatus(found.length === 0 ? 'no_results' : 'results');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Search failed');
      setStatus('error');
    }
  }

  // --- Pulsing glow for the find button ---
  const pulse = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
        withTiming(1.0, { duration: 1100, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.95, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.45, { duration: 1100, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, [pulse, pulseOpacity]);
  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: pulseOpacity.value,
  }));
  const cardPulse = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + (pulse.value - 1) * 0.5 }],
  }));

  // --- Locating pulse indicator ---
  const locateDot = useSharedValue(0);
  useEffect(() => {
    if (status === 'locating' || status === 'searching' || status === 'requesting_perm') {
      locateDot.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      );
    } else {
      locateDot.value = 0;
    }
  }, [status, locateDot]);
  const dotStyle = useAnimatedStyle(() => ({
    opacity: 1 - locateDot.value,
    transform: [{ scale: 1 + locateDot.value * 1.6 }],
  }));

  // --- Theme ---
  const pageBg = isDark ? '#0C0C0F' : '#F7F7F9';
  const headingColor = isDark ? '#F2F2F7' : '#1A1A1E';
  const subColor = isDark ? '#8E8E93' : '#6E6E73';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const subtleBg = isDark ? '#2C2C2E' : '#F2F2F7';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const isBusy =
    status === 'locating' || status === 'searching' || status === 'requesting_perm';
  const buttonLabel = !coords
    ? isBusy
      ? 'Locating you…'
      : 'Find Nearest Vets'
    : isBusy
      ? 'Finding vets near you…'
      : 'Find Nearest Vets';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: pageBg }} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={savedLoading}
            onRefresh={() => {
              loadSaved();
              if (status === 'results' || status === 'no_results') findVets();
            }}
            tintColor="#FF3B30"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* a) TOP */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12, marginBottom: 16 }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: headingColor }}>
            🚨 Emergency Vet
          </Text>
          <Text style={{ fontSize: 14, color: subColor, marginTop: 2 }}>
            Find 24/7 clinics near you
          </Text>
        </View>

        {/* b) FIND BUTTON CARD with pulsing glow */}
        <Animated.View
          entering={FadeInUp.delay(0).duration(450)}
          style={{ paddingHorizontal: 16 }}
        >
          <View style={{ position: 'relative' }}>
            {/* Outer glow ring (pulsing) */}
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  top: -6,
                  left: -6,
                  right: -6,
                  bottom: -6,
                  borderRadius: 26,
                  borderWidth: 2,
                  borderColor: '#FF3B30',
                },
                glowStyle,
              ]}
            />
            <Animated.View style={cardPulse}>
              <Pressable
                onPress={findVets}
                disabled={isBusy}
                style={({ pressed }) => ({
                  borderRadius: 22,
                  overflow: 'hidden',
                  opacity: pressed ? 0.9 : 1,
                  shadowColor: '#FF3B30',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.35,
                  shadowRadius: 18,
                  elevation: 6,
                })}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#FF3B30', '#D70015']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ padding: 22 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: 'rgba(255,255,255,0.20)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 14,
                      }}
                    >
                      <Text style={{ fontSize: 30 }}>🚨</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '700' }}>
                        Emergency?
                      </Text>
                      <Text
                        style={{
                          color: 'rgba(255,255,255,0.85)',
                          fontSize: 13,
                          marginTop: 2,
                        }}
                        numberOfLines={2}
                      >
                        Tap to find the nearest open clinic
                      </Text>
                    </View>
                  </View>
                  {/* Full-width solid red CTA */}
                  <View
                    style={{
                      marginTop: 16,
                      borderRadius: 14,
                      backgroundColor: '#FFFFFF',
                      paddingVertical: 14,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                    }}
                  >
                    {isBusy ? (
                      <ActivityIndicator color="#FF3B30" />
                    ) : (
                      <>
                        <Text
                          style={{
                            color: '#FF3B30',
                            fontWeight: '700',
                            fontSize: 15,
                          }}
                        >
                          {buttonLabel}
                        </Text>
                      </>
                    )}
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </View>

          {errorMsg ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 10,
                padding: 10,
                backgroundColor: isDark ? 'rgba(255,59,48,0.12)' : '#FFEAEA',
                borderRadius: 10,
              }}
            >
              <AlertTriangle color="#FF3B30" size={16} />
              <Text style={{ color: '#FF3B30', fontSize: 13, marginLeft: 8, flex: 1 }}>
                {errorMsg}
              </Text>
            </View>
          ) : null}
        </Animated.View>

        {/* c) LOADING / RESULTS */}
        {isBusy ? (
          <Animated.View
            entering={FadeInUp.delay(120).duration(400)}
            style={{ alignItems: 'center', paddingTop: 36 }}
          >
            <View style={{ width: 100, height: 100, alignItems: 'center', justifyContent: 'center' }}>
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: isDark ? 'rgba(255,59,48,0.18)' : '#FFEAEA',
                  },
                  dotStyle,
                ]}
              />
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: isDark ? 'rgba(255,59,48,0.25)' : '#FFEAEA',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MapPin color="#FF3B30" size={28} />
              </View>
            </View>
            <Text style={{ fontSize: 16, fontWeight: '600', color: headingColor, marginTop: 16 }}>
              {status === 'requesting_perm'
                ? 'Requesting location…'
                : status === 'locating'
                  ? 'Finding your location…'
                  : 'Finding vets near you…'}
            </Text>
            <Text style={{ fontSize: 13, color: subColor, marginTop: 4 }}>
              Hang tight, this only takes a moment.
            </Text>
          </Animated.View>
        ) : status === 'no_results' ? (
          <Animated.View
            entering={FadeInUp.delay(120).duration(400)}
            style={{ paddingHorizontal: 16, marginTop: 24, gap: 12 }}
          >
            <View
              style={{
                backgroundColor: cardBg,
                borderRadius: 18,
                padding: 20,
                alignItems: 'center',
                borderWidth: 1,
                borderColor,
              }}
            >
              <Text style={{ fontSize: 36, marginBottom: 8 }}>🔍</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: headingColor }}>
                No 24/7 vets found nearby
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: subColor,
                  textAlign: 'center',
                  marginTop: 4,
                }}
              >
                Try expanding the search, or call your saved vet below.
              </Text>
            </View>
            <FirstAidCard cardBg={cardBg} borderColor={borderColor} headingColor={headingColor} subColor={subColor} subtleBg={subtleBg} isDark={isDark} />
          </Animated.View>
        ) : status === 'results' ? (
          <Animated.View
            entering={FadeInUp.delay(120).duration(400)}
            style={{ paddingHorizontal: 16, marginTop: 24 }}
          >
            <Text style={{ fontSize: 13, color: subColor, fontWeight: '600', marginBottom: 10 }}>
              {vets.length} clinic{vets.length === 1 ? '' : 's'} found · closest first
            </Text>
            <View style={{ gap: 10 }}>
              {vets.map((v, idx) => (
                <VetResultCard
                  key={v.id + '-' + idx}
                  vet={v}
                  cardBg={cardBg}
                  borderColor={borderColor}
                  headingColor={headingColor}
                  subColor={subColor}
                  subtleBg={subtleBg}
                  isDark={isDark}
                />
              ))}
            </View>
            <FirstAidCard cardBg={cardBg} borderColor={borderColor} headingColor={headingColor} subColor={subColor} subtleBg={subtleBg} isDark={isDark} />
          </Animated.View>
        ) : null}

        {/* d) SAVED VET CONTACTS */}
        <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Stethoscope color="#FF6B6B" size={18} />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: headingColor,
                  marginLeft: 8,
                }}
              >
                Your Saved Vets
              </Text>
            </View>
            <Pressable
              onPress={() => Alert.alert('Coming soon', 'Add-vet form will land in v1.1.')}
              style={({ pressed }) => ({
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: isDark ? 'rgba(255,107,107,0.18)' : '#FFF0EE',
                flexDirection: 'row',
                alignItems: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Plus color="#FF6B6B" size={14} />
              <Text style={{ color: '#FF6B6B', fontWeight: '600', fontSize: 12, marginLeft: 4 }}>
                Add
              </Text>
            </Pressable>
          </View>

          {savedLoading ? (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <ActivityIndicator color="#FF6B6B" />
            </View>
          ) : savedVets.length === 0 ? (
            <Pressable
              onPress={() => Alert.alert('Coming soon', 'Add-vet form will land in v1.1.')}
              style={({ pressed }) => ({
                backgroundColor: cardBg,
                borderRadius: 16,
                padding: 18,
                borderWidth: 1,
                borderColor,
                borderStyle: 'dashed',
                alignItems: 'center',
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <Text style={{ fontSize: 30, marginBottom: 6 }}>🏥</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: headingColor }}>
                No saved vets yet
              </Text>
              <Text style={{ fontSize: 12, color: subColor, marginTop: 4, textAlign: 'center' }}>
                Save your regular vet for quick access in emergencies
              </Text>
            </Pressable>
          ) : (
            <View style={{ gap: 10 }}>
              {savedVets.map((v) => (
                <SavedVetCard
                  key={v.id}
                  vet={v}
                  cardBg={cardBg}
                  borderColor={borderColor}
                  headingColor={headingColor}
                  subColor={subColor}
                  subtleBg={subtleBg}
                  isDark={isDark}
                />
              ))}
            </View>
          )}
        </View>

        {/* Footnote */}
        <Text
          style={{
            fontSize: 11,
            color: subColor,
            textAlign: 'center',
            paddingHorizontal: 32,
            marginTop: 28,
            lineHeight: 16,
          }}
        >
          If your pet is unresponsive, bleeding heavily, or having trouble breathing, go to the
          nearest open clinic immediately — call ahead so they can prepare.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- Components ----------

function VetResultCard({
  vet,
  cardBg,
  borderColor,
  headingColor,
  subColor,
  subtleBg,
  isDark,
}: {
  vet: EmergencyVet;
  cardBg: string;
  borderColor: string;
  headingColor: string;
  subColor: string;
  subtleBg: string;
  isDark: boolean;
}) {
  const km = vet.distance_km ?? null;
  const isClose = km != null && km < 2;
  return (
    <View
      style={{
        backgroundColor: cardBg,
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.06,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: isDark ? 'rgba(255,59,48,0.18)' : '#FFEAEA',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Stethoscope color="#FF3B30" size={20} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: headingColor }} numberOfLines={2}>
            {vet.name}
          </Text>
          {vet.address ? (
            <Pressable
              onPress={() =>
                Linking.openURL(
                  `https://www.google.com/maps/dir/?api=1&destination=${vet.latitude},${vet.longitude}`
                )
              }
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}
            >
              <MapPin color={subColor} size={12} />
              <Text style={{ fontSize: 12, color: subColor, marginLeft: 4, flex: 1 }} numberOfLines={2}>
                {vet.address}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Pills row */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {km != null ? (
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: isClose ? '#E8F8EC' : isDark ? '#2C2C2E' : '#F2F2F7',
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: isClose ? '#34C759' : subColor,
              }}
            >
              {km.toFixed(1)} km
            </Text>
          </View>
        ) : null}
        {vet.is_24_hours ? (
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: '#E8F8EC',
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#34C759' }}>24/7</Text>
          </View>
        ) : vet.is_open_now ? (
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: '#E8F8EC',
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#34C759' }}>Open now</Text>
          </View>
        ) : (
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: '#FFF3E0',
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#FF9F0A' }}>Closed</Text>
          </View>
        )}
        {vet.rating ? (
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Star color="#FF9F0A" size={11} fill="#FF9F0A" />
            <Text style={{ fontSize: 11, fontWeight: '700', color: subColor, marginLeft: 3 }}>
              {vet.rating.toFixed(1)}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Actions row */}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        {vet.phone ? (
          <Pressable
            onPress={() => Linking.openURL(`tel:${vet.phone}`)}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: '#FF3B30',
              paddingVertical: 11,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            })}
          >
            <Phone color="#FFFFFF" size={14} />
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13, marginLeft: 6 }}>
              Call
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() =>
            Linking.openURL(
              `https://www.google.com/maps/dir/?api=1&destination=${vet.latitude},${vet.longitude}`
            )
          }
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
            paddingVertical: 11,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          })}
        >
          <Navigation color={isDark ? '#F2F2F7' : '#1A1A1E'} size={14} />
          <Text
            style={{
              color: isDark ? '#F2F2F7' : '#1A1A1E',
              fontWeight: '700',
              fontSize: 13,
              marginLeft: 6,
            }}
          >
            Directions
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function SavedVetCard({
  vet,
  cardBg,
  borderColor,
  headingColor,
  subColor,
  subtleBg,
  isDark,
}: {
  vet: VetContact;
  cardBg: string;
  borderColor: string;
  headingColor: string;
  subColor: string;
  subtleBg: string;
  isDark: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: cardBg,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: isDark ? 'rgba(255,107,107,0.18)' : '#FFF0EE',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Stethoscope color="#FF6B6B" size={20} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: headingColor }} numberOfLines={1}>
          {vet.clinic_name ?? vet.name}
        </Text>
        {vet.address ? (
          <Text style={{ fontSize: 12, color: subColor, marginTop: 1 }} numberOfLines={1}>
            {vet.address}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
          {vet.is_24_hours ? (
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 999,
                backgroundColor: '#E8F8EC',
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#34C759' }}>24/7</Text>
            </View>
          ) : null}
          {vet.is_emergency ? (
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 999,
                backgroundColor: '#FFEAEA',
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#FF3B30' }}>Emergency</Text>
            </View>
          ) : null}
        </View>
      </View>
      {vet.phone ? (
        <Pressable
          onPress={() => Linking.openURL(`tel:${vet.phone}`)}
          style={({ pressed }) => ({
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: '#FF6B6B',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.94 : 1 }],
          })}
        >
          <Phone color="#FFFFFF" size={16} />
        </Pressable>
      ) : null}
    </View>
  );
}

function FirstAidCard({
  cardBg,
  borderColor,
  headingColor,
  subColor,
  subtleBg,
  isDark,
}: {
  cardBg: string;
  borderColor: string;
  headingColor: string;
  subColor: string;
  subtleBg: string;
  isDark: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: cardBg,
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor,
        marginTop: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: isDark ? 'rgba(255,159,10,0.18)' : '#FFF3E0',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
          }}
        >
          <Text style={{ fontSize: 16 }}>⛑️</Text>
        </View>
        <Text style={{ fontSize: 14, fontWeight: '700', color: headingColor }}>
          While travelling to the vet
        </Text>
      </View>
      {[
        'Keep the car cool and quiet — minimize stress',
        'Wrap your pet in a towel or blanket for warmth & safety',
        "Don't offer food or water if vomiting or sedated",
        'Call the clinic ahead so they can prepare',
      ].map((tip, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 6 }}>
          <View
            style={{
              width: 5,
              height: 5,
              borderRadius: 3,
              backgroundColor: subColor,
              marginTop: 8,
              marginRight: 10,
            }}
          />
          <Text style={{ fontSize: 13, color: headingColor, flex: 1, lineHeight: 19 }}>{tip}</Text>
        </View>
      ))}
    </View>
  );
}

async function overpassFallback(lat: number, lon: number): Promise<EmergencyVet[]> {
  const q = `[out:json][timeout:15];(node["amenity"="veterinary"](around:15000,${lat},${lon}););out body;`;
  try {
    const r = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`);
    const j = await r.json();
    type OverpassElement = {
      id: number;
      lat: number;
      lon: number;
      tags?: {
        name?: string;
        phone?: string;
        'contact:phone'?: string;
        'addr:street'?: string;
        opening_hours?: string;
      };
    };
    const elements: OverpassElement[] = j.elements ?? [];
    return elements
      .filter((e) => e.lat && e.lon)
      .map((e) => {
        const t = e.tags ?? {};
        const phone = t['contact:phone'] ?? t.phone ?? null;
        const is24 = (t.opening_hours ?? '').includes('24/7');
        return {
          id: String(e.id),
          name: t.name ?? 'Veterinary clinic',
          clinic_name: t.name ?? null,
          phone,
          address: t['addr:street'] ?? null,
          latitude: e.lat,
          longitude: e.lon,
          distance_km: null,
          is_open_now: is24,
          rating: null,
          is_24_hours: is24,
        } as EmergencyVet;
      });
  } catch {
    return [];
  }
}
