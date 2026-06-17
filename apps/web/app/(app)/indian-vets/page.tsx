'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { PageTransition } from '@/components/ui/PageTransition';
import { MapPin, Phone, Star, Search } from 'lucide-react';
import toast from 'react-hot-toast';

type Vet = {
  id: string;
  name: string;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  rating?: number | null;
  specialty?: string | null;
  [k: string]: any;
};

export default function IndianVetsPage() {
  const [vets, setVets] = useState<Vet[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');
  const [activeCity, setActiveCity] = useState('');

  async function load(cityFilter?: string) {
    setLoading(true);
    try {
      const url = cityFilter ? `/api/indian-vets?city=${encodeURIComponent(cityFilter)}` : '/api/indian-vets';
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to load');
      setVets(json.data ?? []);
    } catch (e: any) {
      toast.error(e.message ?? 'Could not load vets');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function applyFilter() {
    const v = city.trim();
    setActiveCity(v);
    load(v);
  }

  function clearFilter() {
    setCity('');
    setActiveCity('');
    load();
  }

  return (
    <AppShell>
      <PageTransition>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-display font-bold">🩺 Indian Vets Directory</h1>
            <p className="text-ink-500 mt-1">Find vets near you across India</p>
          </div>

          <Card>
            <CardBody>
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex-1">
                  <Input
                    label="Filter by city"
                    placeholder="e.g. Pune"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') applyFilter(); }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={applyFilter} icon={<Search className="h-4 w-4" />}>Search</Button>
                  {activeCity ? <Button variant="ghost" onClick={clearFilter}>Clear</Button> : null}
                </div>
              </div>
              {activeCity ? (
                <p className="mt-2 text-xs text-ink-500">Showing vets in “{activeCity}”.</p>
              ) : null}
            </CardBody>
          </Card>

          {loading ? (
            <p className="text-sm text-ink-500">Loading…</p>
          ) : vets.length === 0 ? (
            <Card>
              <CardBody>
                <EmptyState
                  emoji="🩺"
                  title="No vets found"
                  description={activeCity ? `No vets matched “${activeCity}”. Try a different city.` : 'The directory is empty for now — check back soon.'}
                />
              </CardBody>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {vets.map((v) => (
                <Card key={v.id} hover>
                  <CardBody>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-base font-semibold text-ink-900">{v.name}</p>
                        {typeof v.rating === 'number' && v.rating > 0 ? (
                          <Pill variant="warning">
                            <Star className="h-3 w-3" />
                            {v.rating.toFixed(1)}
                          </Pill>
                        ) : null}
                      </div>
                      {v.specialty ? (
                        <p className="text-xs text-ink-500">{v.specialty}</p>
                      ) : null}
                      {v.city ? (
                        <div className="flex items-center gap-1.5 text-sm text-ink-700">
                          <MapPin className="h-3.5 w-3.5 text-ink-500" />
                          <span>{v.city}</span>
                        </div>
                      ) : null}
                      {v.address ? (
                        <p className="text-sm text-ink-700">{v.address}</p>
                      ) : null}
                      {v.phone ? (
                        <a
                          href={`tel:${v.phone}`}
                          className="inline-flex items-center gap-1.5 text-sm text-brand-primary hover:underline"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {v.phone}
                        </a>
                      ) : null}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PageTransition>
    </AppShell>
  );
}
