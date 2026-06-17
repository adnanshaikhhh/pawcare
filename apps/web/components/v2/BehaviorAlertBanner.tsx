'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface Alert {
  id: string;
  pet_id: string;
  metric_type: string;
  percent_change: number;
  severity: 'monitor' | 'watch' | 'concern' | 'urgent';
  ai_summary: string;
  suggested_action: string;
  pets: { name: string; photo_url?: string };
  detected_at: string;
}

const SEVERITY_STYLES = {
  monitor: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: 'text-blue-500' },
  watch: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', icon: 'text-amber-500' },
  concern: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', icon: 'text-orange-500' },
  urgent: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', icon: 'text-red-500' },
};

export function BehaviorAlertBanner() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/behavior-alerts')
      .then((r) => r.json())
      .then((j) => setAlerts(j.data || []))
      .finally(() => setLoading(false));
  }, []);

  const dismiss = async (id: string) => {
    await fetch('/api/behavior-alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  if (loading || alerts.length === 0) return null;

  const urgent = alerts.find((a) => a.severity === 'urgent');
  const concern = alerts.find((a) => a.severity === 'concern');
  const primary = urgent || concern || alerts[0];
  const style = SEVERITY_STYLES[primary.severity];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`${style.bg} ${style.border} border rounded-2xl p-4 flex items-start gap-3`}
      >
        <AlertTriangle className={`h-5 w-5 mt-0.5 ${style.icon} flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wide opacity-70">
              {primary.severity === 'urgent' ? '⚠️ Urgent' : primary.severity === 'concern' ? 'Watch' : 'Behavior alert'}
            </span>
          </div>
          <p className="text-sm font-medium text-ink-900 dark:text-dark-text">{primary.ai_summary}</p>
          <p className="text-xs text-ink-500 dark:text-dark-text-muted mt-1">💡 {primary.suggested_action}</p>
        </div>
        <button onClick={() => dismiss(primary.id)} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded">
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
