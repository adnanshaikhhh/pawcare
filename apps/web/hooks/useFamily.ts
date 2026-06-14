'use client';

import useSWR from 'swr';
import type { Profile, FamilyGroup, FamilyMember } from '@pawcare/shared';

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch');
  const json = await res.json();
  return json.data;
};

export function useProfile() {
  const { data, error, isLoading, mutate } = useSWR<Profile>('/api/profile', fetcher);
  return { profile: data, error, isLoading, refresh: mutate };
}

export function useFamily() {
  const { data, error, isLoading, mutate } = useSWR<{
    group: FamilyGroup;
    members: Array<FamilyMember & { profiles: { full_name: string | null; avatar_url: string | null } | null }>;
    my_role: string;
  }>('/api/family', fetcher);
  return { family: data, error, isLoading, refresh: mutate };
}
