'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePets } from '@/hooks/usePets';
import { PetCard } from '@/components/pets/PetCard';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageTransition } from '@/components/ui/PageTransition';
import { SPECIES_LABELS, type Species } from '@pawcare/shared';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PetsPage() {
  const { pets, isLoading } = usePets();
  const [filter, setFilter] = useState<Species | 'all'>('all');

  const filtered = filter === 'all' ? pets : pets.filter((p) => p.species === filter);

  return (
    <PageTransition>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-display font-bold">My Pets</h1>
            <p className="text-ink-500 mt-1">{pets.length} pet{pets.length === 1 ? '' : 's'} in your family</p>
          </div>
          <Link href="/pets/new"><Button icon={<Plus className="h-4 w-4" />}>Add pet</Button></Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['all', 'cat', 'dog', 'other'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm border transition',
                filter === s ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-ink-700 border-ink-100 hover:border-ink-300'
              )}
            >
              {s === 'all' ? '🐾 All' : `${SPECIES_LABELS[s].emoji} ${SPECIES_LABELS[s].label}`}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-sm text-ink-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <Card><CardBody><EmptyState emoji="🐾" title={filter === 'all' ? 'No pets yet' : `No ${filter}s yet`} action={<Link href="/pets/new"><Button>Add a pet</Button></Link>} /></CardBody></Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => <PetCard key={p.id} pet={p} />)}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
