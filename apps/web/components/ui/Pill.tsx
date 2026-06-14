'use client';

import { cn } from '@/lib/utils';

type PillVariant = 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'neutral';

const variantClasses: Record<PillVariant, string> = {
  success: 'bg-green-50 text-semantic-success',
  warning: 'bg-amber-50 text-semantic-warning',
  danger: 'bg-red-50 text-semantic-danger',
  info: 'bg-blue-50 text-semantic-info',
  brand: 'bg-brand-light text-brand-primary',
  neutral: 'bg-canvas-sunken text-ink-700',
};

export function Pill({ children, variant = 'neutral', className }: { children: React.ReactNode; variant?: PillVariant; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', variantClasses[variant], className)}>
      {children}
    </span>
  );
}
