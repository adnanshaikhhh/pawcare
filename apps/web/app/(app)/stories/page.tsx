'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pill } from '@/components/ui/Pill';
import { AppShell } from '@/components/layout/AppShell';
import { StoriesCarousel, type Story } from '@/components/v2/StoriesCarousel';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Camera, Eye, Sparkles } from 'lucide-react';

export default function StoriesPage() {
  const [stories, setStories] = useState<Array<Story & { detected_pet_id?: string | null; ai_confidence?: number | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/stories', {
          headers: { Authorization: 'Bearer ' + (session?.access_token ?? '') },
          credentials: 'include',
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json?.error?.message ?? 'Failed to load stories');
          setStories([]);
        } else {
          setStories((json.data as Story[]) ?? []);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load stories');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">📸 Pet Stories</h1>
          <p className="text-ink-500 mt-1">Instagram-style moments from your pets.</p>
        </div>

        {loading ? (
          <p className="text-sm text-ink-500">Loading stories…</p>
        ) : error ? (
          <Card>
            <CardBody>
              <EmptyState emoji="⚠️" title="Could not load stories" description={error} />
            </CardBody>
          </Card>
        ) : stories.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                emoji="📸"
                title="No stories yet"
                description="Share a moment — post a photo or short clip of your pet to get started."
              />
            </CardBody>
          </Card>
        ) : (
          <>
            <StoriesCarousel stories={stories} />

            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Camera className="h-5 w-5 text-brand-primary" /> All moments
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stories.map((s) => (
                  <Card key={s.id} hover>
                    <div className="relative aspect-square bg-canvas-sunken overflow-hidden rounded-t-2xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={s.media_url}
                        alt={s.caption ?? s.pet?.name ?? 'Pet story'}
                        className="h-full w-full object-cover"
                      />
                      {s.media_type === 'video' ? (
                        <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 text-white text-[10px] font-medium">
                          ▶ Video
                        </span>
                      ) : null}
                      <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 text-white text-[10px] font-medium">
                        <Eye className="h-3 w-3" /> {s.view_count ?? 0}
                      </span>
                    </div>
                    <CardBody>
                      <div className="flex items-center gap-2 mb-2">
                        {s.pet?.photo_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={s.pet.photo_url}
                            alt=""
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        ) : (
                          <span className="h-6 w-6 rounded-full bg-brand-light flex items-center justify-center text-xs">🐾</span>
                        )}
                        <p className="text-sm font-medium">{s.pet?.name ?? 'Unknown pet'}</p>
                        {s.detected_pet_id ? (
                          <Pill variant="brand" className="ml-auto">
                            <Sparkles className="h-3 w-3" /> AI match
                          </Pill>
                        ) : null}
                      </div>
                      {s.caption ? (
                        <p className="text-sm text-ink-700 line-clamp-3">{s.caption}</p>
                      ) : (
                        <p className="text-sm text-ink-400 italic">No caption</p>
                      )}
                      <p className="text-xs text-ink-500 mt-2">
                        {s.creator?.full_name ?? 'Family'} · {new Date(s.created_at).toLocaleString()}
                      </p>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>About stories</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-ink-500">
                  Stories auto-expire after 24 hours. AI face-matching is used to tag which pet appears
                  in each moment — confidence is shown to help you confirm.
                </p>
              </CardBody>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
