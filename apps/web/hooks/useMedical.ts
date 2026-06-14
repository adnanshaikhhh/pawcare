'use client';

import useSWR from 'swr';
import type { Vaccination, Medication, DewormingRecord, WeightLog, MoodLog, HeatCycle, VetVisit, MedicationLog } from '@/lib/shared';

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch');
  const json = await res.json();
  return json.data;
};

export function useVaccinations(petId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Vaccination[]>(
    petId ? `/api/vaccinations?pet_id=${petId}` : null,
    fetcher
  );
  return { vaccinations: data ?? [], error, isLoading, refresh: mutate };
}

export function useMedications(petId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Medication[]>(
    petId ? `/api/medications?pet_id=${petId}` : null,
    fetcher
  );
  return { medications: data ?? [], error, isLoading, refresh: mutate };
}

export function useVetVisits(petId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<VetVisit[]>(
    petId ? `/api/vet-visits?pet_id=${petId}` : null,
    fetcher
  );
  return { visits: data ?? [], error, isLoading, refresh: mutate };
}

export function useDeworming(petId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<DewormingRecord[]>(
    petId ? `/api/medical/deworming/${petId}` : null,
    fetcher
  );
  return { deworming: data ?? [], error, isLoading, refresh: mutate };
}

export function useWeightLogs(petId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<WeightLog[]>(
    petId ? `/api/medical/weight/${petId}` : null,
    fetcher
  );
  return { weights: data ?? [], error, isLoading, refresh: mutate };
}

export function useMoodLogs(petId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<MoodLog[]>(
    petId ? `/api/medical/mood/${petId}` : null,
    fetcher
  );
  return { moods: data ?? [], error, isLoading, refresh: mutate };
}

export function useHeatCycles(petId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<HeatCycle[]>(
    petId ? `/api/medical/heat-cycles/${petId}` : null,
    fetcher
  );
  return { cycles: data ?? [], error, isLoading, refresh: mutate };
}

export function useMedicationLogs(medicationId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<MedicationLog[]>(
    medicationId ? `/api/medication-logs?medication_id=${medicationId}` : null,
    fetcher
  );
  return { logs: data ?? [], error, isLoading, refresh: mutate };
}
