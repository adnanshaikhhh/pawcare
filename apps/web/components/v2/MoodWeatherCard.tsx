'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Cloud, CloudRain, Zap } from 'lucide-react';

interface MoodWeather {
  vibesScore: number;
  dominantMood: string;
  totalLogs: number;
}

const MOOD_LABELS: Record<string, { emoji: string; label: string }> = {
  happy: { emoji: '😸', label: 'happy' },
  playful: { emoji: '😺', label: 'playful' },
  calm: { emoji: '😌', label: 'calm' },
  normal: { emoji: '🐾', label: 'normal' },
  sick: { emoji: '🤒', label: 'sick' },
  hiding: { emoji: '🙀', label: 'hiding' },
  anxious: { emoji: '😿', label: 'anxious' },
  lethargic: { emoji: '😴', label: 'lethargic' },
  unknown: { emoji: '🌤️', label: 'unknown' },
};

export function MoodWeatherCard() {
  const [weather, setWeather] = useState<MoodWeather | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/daily-mood-summary')
      .then((r) => r.json())
      .then((j) => setWeather(j.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="glass-card-light dark:glass-card p-6 h-32 skeleton" />;
  }

  if (!weather || weather.totalLogs === 0) {
    return (
      <div className="glass-card-light dark:glass-card p-6">
        <div className="flex items-center gap-3">
          <Sun className="h-8 w-8 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-ink-900 dark:text-dark-text">Today&apos;s vibes</p>
            <p className="text-xs text-ink-500 dark:text-dark-text-muted">No mood logs yet today</p>
          </div>
        </div>
      </div>
    );
  }

  const vibe = weather.vibesScore;
  const moodInfo = MOOD_LABELS[weather.dominantMood] || MOOD_LABELS.unknown;
  const WeatherIcon = vibe > 70 ? Sun : vibe > 40 ? Cloud : vibe > 20 ? CloudRain : Zap;
  const colorClass = vibe > 70 ? 'text-amber-500' : vibe > 40 ? 'text-blue-400' : vibe > 20 ? 'text-orange-400' : 'text-red-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-light dark:glass-card p-6"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-dark-text-muted">Today&apos;s vibes</p>
          <p className="text-3xl font-display font-bold text-ink-900 dark:text-dark-text mt-1">
            {moodInfo.emoji} {moodInfo.label}
          </p>
        </div>
        <WeatherIcon className={`h-12 w-12 ${colorClass}`} />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-ink-500 dark:text-dark-text-muted">
          <span>Vibes score</span>
          <span className="font-mono">{vibe}/100</span>
        </div>
        <div className="h-2 bg-canvas-sunken dark:bg-dark-surface rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${vibe}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full ${vibe > 70 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : vibe > 40 ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 'bg-gradient-to-r from-orange-400 to-red-500'}`}
          />
        </div>
        <p className="text-[10px] text-ink-300 dark:text-dark-text-dim">{weather.totalLogs} mood log{weather.totalLogs !== 1 ? 's' : ''} from your pets today</p>
      </div>
    </motion.div>
  );
}
