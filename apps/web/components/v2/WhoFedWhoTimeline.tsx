'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Utensils, Pill, Stethoscope, Heart, Sparkles, Camera } from 'lucide-react';

interface TimelineEvent {
  id: string;
  pet_id?: string;
  activity_type: string;
  notes?: string;
  occurred_at: string;
  pets?: { name: string; photo_url?: string };
  profiles?: { full_name?: string; avatar_url?: string };
}

const ACTIVITY_ICONS: Record<string, any> = {
  fed: Utensils,
  medication: Pill,
  vet: Stethoscope,
  play: Heart,
  custom: Sparkles,
};

const ACTIVITY_COLORS: Record<string, string> = {
  fed: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  medication: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  vet: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  play: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
  custom: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
};

export function WhoFedWhoTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/timeline')
      .then((r) => r.json())
      .then((j) => setEvents(j.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>;
  }

  if (events.length === 0) {
    return (
      <div className="glass-card-light dark:glass-card p-8 text-center">
        <Camera className="h-10 w-10 mx-auto text-ink-300 dark:text-dark-text-dim mb-3" />
        <p className="text-ink-500 dark:text-dark-text-muted">No activity yet today</p>
        <p className="text-xs text-ink-300 dark:text-dark-text-dim mt-1">Log activities like feeding, meds, walks to see them here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event, i) => {
        const Icon = ACTIVITY_ICONS[event.activity_type] || Sparkles;
        const colorClass = ACTIVITY_COLORS[event.activity_type] || ACTIVITY_COLORS.custom;
        const time = new Date(event.occurred_at);
        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="glass-card-light dark:glass-card p-4 flex items-center gap-3"
          >
            {event.pets?.photo_url ? (
              <img src={event.pets.photo_url} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className={`h-10 w-10 rounded-full ${colorClass} flex items-center justify-center`}>
                <Icon className="h-5 w-5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink-900 dark:text-dark-text">
                <span className="font-semibold">{event.profiles?.full_name || 'Someone'}</span>{' '}
                <span className="text-ink-500 dark:text-dark-text-muted">{event.activity_type}</span>{' '}
                {event.pets && <span className="font-semibold">{event.pets.name}</span>}
              </p>
              {event.notes && <p className="text-xs text-ink-500 dark:text-dark-text-muted truncate">{event.notes}</p>}
            </div>
            <span className="text-xs text-ink-300 dark:text-dark-text-dim font-mono whitespace-nowrap">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
