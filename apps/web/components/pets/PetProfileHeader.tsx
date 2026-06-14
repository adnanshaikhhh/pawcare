'use client';

import type { Pet } from '@/lib/shared';
import { calculateAge, SPECIES_LABELS } from '@/lib/shared';
import { Avatar } from '../ui/Avatar';
import { HealthRing } from '../ui/HealthRing';
import { Pill } from '../ui/Pill';
import { calculateHealthScore, healthScoreColor, healthScoreLabel } from '@/lib/shared';
import type { Vaccination, DewormingRecord } from '@/lib/shared';

interface PetProfileHeaderProps {
  pet: Pet;
  vaccinations?: Vaccination[];
  deworming?: DewormingRecord[];
}

export function PetProfileHeader({ pet, vaccinations = [], deworming = [] }: PetProfileHeaderProps) {
  const today = new Date();
  const overdueVaccine = vaccinations.find((v) => v.next_due_date && new Date(v.next_due_date) < today);
  const overdueDeworm = deworming.find((d) => d.next_due_date && new Date(d.next_due_date) < today);
  const isCat = pet.species === 'cat';

  const score = calculateHealthScore({
    isVaccinationOverdue: !!overdueVaccine,
    isDewormingOverdue: !!overdueDeworm,
    isVetCheckOverdue: false,
    hasRecentMoodIssues: false,
    hasWeightIssue: false,
  });

  const color = healthScoreColor(score);

  return (
    <div className="relative">
      <div className={cn('h-44 w-full overflow-hidden', isCat ? 'gradient-card-cat' : 'gradient-card-dog')}>
        {pet.banner_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pet.banner_photo_url} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="px-6 -mt-14 relative flex items-end gap-5 flex-wrap">
        <Avatar src={pet.photo_url} name={pet.name} size="2xl" className="ring-4 ring-white shadow-card" />
        <div className="flex-1 min-w-0 pb-2">
          <h1 className="text-3xl font-bold text-ink-900 font-display">{pet.name}</h1>
          <p className="text-ink-500">
            {SPECIES_LABELS[pet.species].emoji} {pet.breed ?? SPECIES_LABELS[pet.species].label} · {calculateAge(pet.date_of_birth)}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {pet.is_neutered ? <Pill variant="success">Neutered</Pill> : <Pill variant="warning">Not neutered</Pill>}
            {pet.is_indoor ? <Pill variant="info">Indoor</Pill> : <Pill variant="neutral">Outdoor</Pill>}
            {pet.weight_kg ? <Pill variant="brand">{pet.weight_kg} kg</Pill> : null}
          </div>
        </div>
        <div className="flex flex-col items-center pb-2">
          <HealthRing score={score} />
          <p className="text-xs text-ink-500 mt-1">{healthScoreLabel(score)}</p>
        </div>
      </div>
      {pet.bio ? <p className="px-6 mt-4 text-ink-700 max-w-2xl">{pet.bio}</p> : null}
    </div>
  );
}

function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}
