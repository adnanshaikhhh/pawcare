import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Pet, Reminder, InventoryItem, Vaccination, Medication, WeightLog, MoodLog, VetVisit, DewormingRecord } from '@/src-shared';

export function usePets() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.listPets();
      setPets(data ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { pets, isLoading, error, refresh: fetch };
}

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.listInventory();
      setItems(data ?? []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { fetch(); }, [fetch]);
  return { items, isLoading, refresh: fetch };
}

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const fetch = useCallback(async () => {
    try {
      const data = await api.listReminders();
      setReminders(data ?? []);
    } catch (e) {
      console.warn(e);
    }
  }, []);
  useEffect(() => { fetch(); }, [fetch]);
  return { reminders, refresh: fetch };
}

export function usePetMedical(petId: string | null) {
  const [vaccinations, setVacc] = useState<Vaccination[]>([]);
  const [medications, setMeds] = useState<Medication[]>([]);
  const [weights, setWeights] = useState<WeightLog[]>([]);
  const [moods, setMoods] = useState<MoodLog[]>([]);
  const [visits, setVisits] = useState<VetVisit[]>([]);
  const [deworming, setDew] = useState<DewormingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!petId) return;
    setLoading(true);
    try {
      const [v, m, w, mo, vi, d] = await Promise.all([
        api.listVaccinations(petId).catch(() => []),
        api.listMedications(petId).catch(() => []),
        api.listWeight(petId).catch(() => []),
        api.listMood(petId).catch(() => []),
        api.listVetVisits(petId).catch(() => []),
        api.listDeworming(petId).catch(() => []),
      ]);
      setVacc(v as Vaccination[]);
      setMeds(m as Medication[]);
      setWeights(w as WeightLog[]);
      setMoods(mo as MoodLog[]);
      setVisits(vi as VetVisit[]);
      setDew(d as DewormingRecord[]);
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { vaccinations, medications, weights, moods, visits, deworming, loading, refresh: fetch };
}
