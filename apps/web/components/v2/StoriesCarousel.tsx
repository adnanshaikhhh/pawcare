'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface Story {
  id: string;
  pet_id: string;
  media_url: string;
  media_type: 'photo' | 'video';
  caption: string | null;
  expires_at: string;
  view_count: number;
  created_at: string;
  pet?: { id: string; name: string; photo_url: string | null; species: string } | null;
  creator?: { id: string; full_name: string | null; avatar_url: string | null } | null;
}

const MOOD_RING_COLORS: Record<string, string> = {
  happy: '#FCD34D',
  playful: '#FB923C',
  calm: '#60A5FA',
  tired: '#94A3B8',
  anxious: '#A78BFA',
  aggressive: '#EF4444',
  sick: '#F87171',
  normal: '#34D399',
};

function getPetMood(petId: string): string {
  // Deterministic mood ring color from petId hash
  const moods = Object.keys(MOOD_RING_COLORS);
  let h = 0;
  for (let i = 0; i < petId.length; i++) h = (h * 31 + petId.charCodeAt(i)) >>> 0;
  return moods[h % moods.length];
}

export function StoriesCarousel({ stories, onAddStory }: { stories: Story[]; onAddStory?: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  // Group stories by pet
  const byPet = new Map<string, Story[]>();
  for (const s of stories) {
    const arr = byPet.get(s.pet_id) ?? [];
    arr.push(s);
    byPet.set(s.pet_id, arr);
  }
  const pets = Array.from(byPet.entries()).map(([petId, items]) => {
    const pet = items[0]?.pet;
    return { petId, pet, stories: items, latest: items[0] };
  });

  if (pets.length === 0 && !onAddStory) {
    return null;
  }

  return (
    <section className="glass-card-light dark:glass-card rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">Pet Stories</h2>
        <span className="text-xs text-ink-500 dark:text-dark-text-muted">last 24h</span>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide"
        style={{ scrollbarWidth: 'none' }}
      >
        {onAddStory ? (
          <button
            onClick={onAddStory}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
            aria-label="Add story"
          >
            <div className="h-16 w-16 rounded-full bg-canvas-sunken dark:bg-dark-raised border-2 border-dashed border-ink-300 dark:border-dark-border flex items-center justify-center text-2xl group-hover:border-brand-primary transition">
              +
            </div>
            <span className="text-[11px] text-ink-500 dark:text-dark-text-muted">Add</span>
          </button>
        ) : null}

        {pets.map(({ petId, pet, stories: petStories, latest }) => {
          const mood = getPetMood(petId);
          const ringColor = MOOD_RING_COLORS[mood] ?? MOOD_RING_COLORS.normal;
          return (
            <button
              key={petId}
              onClick={() => setActiveIdx(pets.findIndex((p) => p.petId === petId))}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
            >
              <div
                className="h-16 w-16 rounded-full p-0.5 transition-transform group-hover:scale-105"
                style={{ background: `conic-gradient(from 0deg, ${ringColor}, ${ringColor}99, ${ringColor})` }}
              >
                <div className="h-full w-full rounded-full bg-white dark:bg-dark-bg p-0.5 overflow-hidden">
                  {pet?.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pet.photo_url} alt={pet?.name ?? ''} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <div className="h-full w-full rounded-full bg-brand-light flex items-center justify-center text-2xl">
                      🐾
                    </div>
                  )}
                </div>
              </div>
              <div className="text-center max-w-[68px]">
                <p className="text-[11px] font-medium truncate">{pet?.name ?? 'Unknown'}</p>
                {petStories.length > 1 ? (
                  <p className="text-[10px] text-ink-500 dark:text-dark-text-muted">{petStories.length} new</p>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {activeIdx !== null && pets[activeIdx] ? (
        <StoryViewer
          stories={pets[activeIdx].stories}
          onClose={() => setActiveIdx(null)}
        />
      ) : null}
    </section>
  );
}

function StoryViewer({ stories, onClose }: { stories: Story[]; onClose: () => void }) {
  const [idx, setIdx] = useState(0);
  const current = stories[idx];
  useEffect(() => {
    const t = setTimeout(() => {
      if (idx + 1 < stories.length) setIdx(idx + 1);
      else onClose();
    }, 5000);
    return () => clearTimeout(t);
  }, [idx, stories.length, onClose]);

  if (!current) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md aspect-[9/16] bg-dark-bg rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-3">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded">
              <div
                className={cn('h-full bg-white rounded transition-all', i < idx ? 'w-full' : i === idx ? 'w-1/2' : 'w-0')}
              />
            </div>
          ))}
        </div>
        <div className="absolute top-3 right-3 z-10">
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center">×</button>
        </div>
        <div className="absolute top-10 left-3 z-10 flex items-center gap-2">
          {current.pet?.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.pet.photo_url} alt="" className="h-7 w-7 rounded-full border-2 border-white object-cover" />
          ) : null}
          <div>
            <p className="text-white text-sm font-semibold">{current.pet?.name ?? 'Pet'}</p>
            <p className="text-white/70 text-[10px]">{current.creator?.full_name ?? 'Family'}</p>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.media_url} alt="" className="h-full w-full object-cover" />
        {current.caption ? (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white text-sm">{current.caption}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
