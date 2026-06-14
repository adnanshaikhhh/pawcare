'use client';

import useSWR from 'swr';
import type { InventoryItem, Reminder } from '@pawcare/shared';

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch');
  const json = await res.json();
  return json.data;
};

export function useInventory() {
  const { data, error, isLoading, mutate } = useSWR<InventoryItem[]>('/api/inventory', fetcher);
  return { items: data ?? [], error, isLoading, refresh: mutate };
}

export function useReminders(includeCompleted = false) {
  const { data, error, isLoading, mutate } = useSWR<Reminder[]>(
    `/api/reminders?include_completed=${includeCompleted}`,
    fetcher
  );
  return { reminders: data ?? [], error, isLoading, refresh: mutate };
}
