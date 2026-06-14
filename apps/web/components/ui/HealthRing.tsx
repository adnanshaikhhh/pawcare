'use client';

import { cn } from '@/lib/utils';

interface HealthRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function HealthRing({ score, size = 80, strokeWidth = 8, className }: HealthRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;

  const color = score >= 80 ? '#34C759' : score >= 50 ? '#FF9F0A' : '#FF3B30';

  return (
    <svg width={size} height={size} className={cn('-rotate-90', className)}>
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="#F0F0F5" strokeWidth={strokeWidth} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy="0.35em"
        className="fill-ink-900 font-semibold"
        style={{ fontSize: size / 4, transform: 'rotate(90deg)', transformOrigin: 'center' }}
      >
        {score}
      </text>
    </svg>
  );
}
