'use client';

import Link from 'next/link';
import type { Pet } from '@pawcare/shared';
import { calculateAge, SPECIES_LABELS } from '@pawcare/shared';
import { Avatar } from '../ui/Avatar';
import { Card } from '../ui/Card';
import { Pill } from '../ui/Pill';
import { cn } from '@/lib/utils';

export function PetCard({ pet, nextEvent, className }: { pet: Pet; nextEvent?: { label: string; daysAway: number } | null; className?: string }) {
  const speciesLabel = SPECIES_LABELS[pet.species];
  const isCat = pet.species === 'cat';

  return (
    <Link href={`/pets/${pet.id}`} className="block group">
      <Card hover className={cn('overflow-hidden', className)}>
        <div className={cn('h-24 relative', isCat ? 'gradient-card-cat' : 'gradient-card-dog')}>
          {pet.banner_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pet.banner_photo_url} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="p-5 -mt-10 relative">
          <Avatar src={pet.photo_url} name={pet.name} size="xl" className="ring-4 ring-white" />
          <h3 className="mt-3 text-lg font-semibold text-ink-900">{pet.name}</h3>
          <p className="text-sm text-ink-500">
            {speciesLabel.emoji} {pet.breed ?? speciesLabel.label} · {calculateAge(pet.date_of_birth)}
          </p>
          {nextEvent ? (
            <div className="mt-3">
              <Pill variant={nextEvent.daysAway <= 1 ? 'danger' : nextEvent.daysAway <= 7 ? 'warning' : 'brand'}>
                {nextEvent.label}
              </Pill>
            </div>
          ) : null}
        </div>
      </Card>
    </Link>
  );
}
