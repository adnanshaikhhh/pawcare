'use client';

import { useState } from 'react';
import { useLocation } from '@/hooks/useLocation';
import type { EmergencyVet } from '@/lib/shared';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Pill } from '../ui/Pill';
import { Phone, MapPin, Navigation } from 'lucide-react';

export function EmergencyVetFinder() {
  const { coords, error: locError, loading: locLoading, request } = useLocation();
  const [vets, setVets] = useState<EmergencyVet[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  async function search() {
    let c = coords;
    if (!c) {
      request();
      return;
    }
    setLoading(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/emergency/vets?lat=${c.lat}&lon=${c.lon}&radius=10`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed');
      setVets(json.data ?? []);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-6 border-2 border-semantic-danger/30 bg-gradient-to-br from-red-50 to-white">
        <h2 className="text-2xl font-bold text-semantic-danger mb-1">🚨 Emergency?</h2>
        <p className="text-ink-700 mb-4">Find the nearest 24/7 veterinary clinic. We&apos;ll use your location to surface open clinics near you.</p>
        {locError ? <p className="text-sm text-semantic-danger mb-3">Location: {locError}</p> : null}
        <Button variant="danger" size="lg" onClick={search} loading={loading || locLoading}>
          {coords ? 'Find nearest vets' : 'Allow location & find vets'}
        </Button>
        {searchError ? <p className="text-sm text-semantic-danger mt-3">{searchError}</p> : null}
      </Card>

      {vets ? (
        vets.length === 0 ? (
          <Card className="p-6 text-center text-ink-500">No 24/7 vets found within 10 km. Try increasing the radius or contact a regular clinic.</Card>
        ) : (
          <div className="space-y-3">
            {vets.map((v) => (
              <Card key={v.id} className="p-5">
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-ink-900">{v.name}</h3>
                      {v.is_24_hours ? <Pill variant="success">24/7</Pill> : null}
                      {v.is_open_now ? <Pill variant="success">Open now</Pill> : <Pill variant="warning">Closed</Pill>}
                      {v.distance_km != null ? <Pill variant="brand">{v.distance_km.toFixed(1)} km</Pill> : null}
                    </div>
                    {v.address ? (
                      <p className="text-sm text-ink-500 mt-1 flex items-start gap-1.5">
                        <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />{v.address}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    {v.phone ? (
                      <a href={`tel:${v.phone}`}>
                        <Button variant="primary" size="md" icon={<Phone className="h-4 w-4" />}>Call</Button>
                      </a>
                    ) : null}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${v.latitude},${v.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button variant="secondary" size="md" icon={<Navigation className="h-4 w-4" />}>Directions</Button>
                    </a>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
