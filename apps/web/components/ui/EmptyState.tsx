'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function EmptyState({
  emoji = '🐾',
  title,
  description,
  action,
  className,
}: {
  emoji?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-6', className)}>
      <div className="text-5xl mb-4" aria-hidden>{emoji}</div>
      <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
      {description ? <p className="text-sm text-ink-500 mt-1 max-w-md">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
