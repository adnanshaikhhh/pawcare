'use client';

import useSWR from 'swr';
import type { Pet } from '@pawcare/shared';

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch');
  const json = await res.json();
  return json.data;
};

export function usePets() {
  const { data, error, isLoading, mutate } = useSWR<Pet[]>('/api/pets', fetcher);
  return { pets: data ?? [], error, isLoading, refresh: mutate };
}

export function usePet(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Pet>(id ? `/api/pets/${id}` : null, fetcher);
  return { pet: data, error, isLoading, refresh: mutate };
}
