import { supabase } from './supabase';
import type { Pet, Reminder, InventoryItem, Vaccination, Medication, WeightLog, MoodLog, VetVisit, DewormingRecord, FamilyGroup } from '@pawcare/shared';

async function authedFetch(path: string, init?: RequestInit) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  const url = `${process.env.EXPO_PUBLIC_API_URL ?? ''}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  listPets: () => authedFetch('/api/pets').then((r) => r.data as Pet[]),
  getPet: (id: string) => authedFetch(`/api/pets/${id}`).then((r) => r.data as Pet),
  createPet: (body: Partial<Pet>) => authedFetch('/api/pets', { method: 'POST', body: JSON.stringify(body) }).then((r) => r.data as Pet),
  updatePet: (id: string, body: Partial<Pet>) => authedFetch(`/api/pets/${id}`, { method: 'PATCH', body: JSON.stringify(body) }).then((r) => r.data as Pet),
  deletePet: (id: string) => authedFetch(`/api/pets/${id}`, { method: 'DELETE' }),

  listVaccinations: (petId: string) => authedFetch(`/api/vaccinations?pet_id=${petId}`).then((r) => r.data as Vaccination[]),
  createVaccination: (body: Partial<Vaccination>) => authedFetch('/api/vaccinations', { method: 'POST', body: JSON.stringify(body) }),
  listMedications: (petId: string) => authedFetch(`/api/medications?pet_id=${petId}`).then((r) => r.data as Medication[]),
  createMedication: (body: Partial<Medication>) => authedFetch('/api/medications', { method: 'POST', body: JSON.stringify(body) }),
  logMedicationGiven: (body: { medication_id: string; pet_id: string; given_at?: string }) =>
    authedFetch('/api/medication-logs', { method: 'POST', body: JSON.stringify(body) }),

  listVetVisits: (petId: string) => authedFetch(`/api/vet-visits?pet_id=${petId}`).then((r) => r.data as VetVisit[]),
  createVetVisit: (body: Partial<VetVisit>) => authedFetch('/api/vet-visits', { method: 'POST', body: JSON.stringify(body) }),

  listWeight: (petId: string) => authedFetch(`/api/medical/weight/${petId}`).then((r) => r.data as WeightLog[]),
  createWeight: (petId: string, body: Partial<WeightLog>) => authedFetch(`/api/medical/weight/${petId}`, { method: 'POST', body: JSON.stringify(body) }),

  listMood: (petId: string) => authedFetch(`/api/medical/mood/${petId}`).then((r) => r.data as MoodLog[]),
  createMood: (petId: string, body: Partial<MoodLog>) => authedFetch(`/api/medical/mood/${petId}`, { method: 'POST', body: JSON.stringify(body) }),

  listDeworming: (petId: string) => authedFetch(`/api/medical/deworming/${petId}`).then((r) => r.data as DewormingRecord[]),
  createDeworming: (petId: string, body: Partial<DewormingRecord>) => authedFetch(`/api/medical/deworming/${petId}`, { method: 'POST', body: JSON.stringify(body) }),

  listInventory: () => authedFetch('/api/inventory').then((r) => r.data as InventoryItem[]),
  createInventoryItem: (body: Partial<InventoryItem>) => authedFetch('/api/inventory', { method: 'POST', body: JSON.stringify(body) }),
  logPurchase: (body: { item_id: string; purchase_date: string; quantity?: number; cost_inr?: number }) =>
    authedFetch('/api/inventory-purchases', { method: 'POST', body: JSON.stringify(body) }),

  listReminders: () => authedFetch('/api/reminders').then((r) => r.data as Reminder[]),
  completeReminder: (id: string) => authedFetch('/api/reminders', { method: 'PATCH', body: JSON.stringify({ id, is_completed: true }) }),

  getFamily: () => authedFetch('/api/family').then((r) => r.data as { group: FamilyGroup } | null),
  createFamily: (name: string) => authedFetch('/api/family', { method: 'POST', body: JSON.stringify({ name }) }),
  joinFamily: (invite_code: string) => authedFetch('/api/family', { method: 'PATCH', body: JSON.stringify({ invite_code }) }),

  findEmergencyVets: (lat: number, lon: number) =>
    authedFetch(`/api/emergency/vets?lat=${lat}&lon=${lon}&radius=10`).then((r) => r.data),

  checkSymptoms: (pet_id: string, symptoms_described: string) =>
    authedFetch('/api/ai/symptoms', { method: 'POST', body: JSON.stringify({ pet_id, symptoms_described }) }),

  getProfile: () => authedFetch('/api/profile').then((r) => r.data),
  updateProfile: (body: { full_name?: string; timezone?: string }) =>
    authedFetch('/api/profile', { method: 'PATCH', body: JSON.stringify(body) }),
};
