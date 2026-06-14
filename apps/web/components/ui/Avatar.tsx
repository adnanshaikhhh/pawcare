'use client';

import { cn, initials } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name: string | null | undefined;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  ringColor?: 'green' | 'yellow' | 'red' | 'none';
  className?: string;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-20 w-20 text-xl',
  '2xl': 'h-32 w-32 text-3xl',
};

const ringClasses = {
  green: 'ring-4 ring-semantic-success/40',
  yellow: 'ring-4 ring-semantic-warning/40',
  red: 'ring-4 ring-semantic-danger/40',
  none: '',
};

export function Avatar({ src, name, size = 'md', ringColor = 'none', className }: AvatarProps) {
  return (
    <div className={cn('inline-flex items-center justify-center rounded-full overflow-hidden bg-gradient-to-br from-brand-light to-brand-primary/20 text-brand-primary font-semibold', sizeClasses[size], ringClasses[ringColor], className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ?? ''} className="h-full w-full object-cover" />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  );
}
