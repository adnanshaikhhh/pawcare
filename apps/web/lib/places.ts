import type { EmergencyVet } from '@/lib/shared';

const HAVERSINE_KM = 6371;

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * HAVERSINE_KM * Math.asin(Math.sqrt(a));
}

export async function findNearbyVets(
  latitude: number,
  longitude: number,
  radiusKm = 10
): Promise<EmergencyVet[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY;
  if (apiKey) {
    return findWithGooglePlaces(latitude, longitude, radiusKm, apiKey);
  }
  return findWithOverpass(latitude, longitude, radiusKm);
}

async function findWithGooglePlaces(
  lat: number,
  lon: number,
  radius: number,
  apiKey: string
): Promise<EmergencyVet[]> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radius * 1000}&type=veterinary_care&keyword=24%20hours%20emergency&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.results) return [];
    return data.results.map((r: { place_id: string; name: string; vicinity?: string; geometry: { location: { lat: number; lng: number } }; rating?: number; opening_hours?: { open_now?: boolean } }) => ({
      id: r.place_id,
      name: r.name,
      clinic_name: r.name,
      phone: null,
      address: r.vicinity ?? null,
      latitude: r.geometry.location.lat,
      longitude: r.geometry.location.lng,
      distance_km: distanceKm(lat, lon, r.geometry.location.lat, r.geometry.location.lng),
      is_open_now: r.opening_hours?.open_now ?? false,
      rating: r.rating ?? null,
      is_24_hours: true,
    }));
  } catch (err) {
    console.warn('[places] Google Places failed, falling back to Overpass', err);
    return findWithOverpass(lat, lon, radius);
  }
}

async function findWithOverpass(
  lat: number,
  lon: number,
  radius: number
): Promise<EmergencyVet[]> {
  try {
    const query = `
[out:json][timeout:15];
(
  node["amenity"="veterinary"](around:${radius * 1000},${lat},${lon});
  way["amenity"="veterinary"](around:${radius * 1000},${lat},${lon});
);
out body;
>;
out skel qt;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    const data = await res.json();
    const elements = (data.elements ?? []) as Array<{
      id: number;
      lat: number;
      lon: number;
      tags?: { name?: string; 'contact:phone'?: string; phone?: string; 'addr:full'?: string; 'addr:street'?: string; opening_hours?: string };
    }>;
    return elements
      .filter((e) => e.lat && e.lon)
      .map((e) => {
        const tags = e.tags ?? {};
        const phone = tags['contact:phone'] ?? tags.phone ?? null;
        const address = tags['addr:full'] ?? tags['addr:street'] ?? null;
        const is24 = (tags.opening_hours ?? '').includes('24/7');
        return {
          id: String(e.id),
          name: tags.name ?? 'Veterinary Clinic',
          clinic_name: tags.name ?? null,
          phone,
          address,
          latitude: e.lat,
          longitude: e.lon,
          distance_km: distanceKm(lat, lon, e.lat, e.lon),
          is_open_now: is24,
          rating: null,
          is_24_hours: is24,
        } satisfies EmergencyVet;
      })
      .sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));
  } catch (err) {
    console.error('[places] Overpass failed', err);
    return [];
  }
}

export { distanceKm };
