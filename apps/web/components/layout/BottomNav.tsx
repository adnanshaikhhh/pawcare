'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PawPrint, Stethoscope, Truck, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/pets', label: 'Pets', icon: PawPrint },
  { href: '/emergency', label: 'SOS', icon: Stethoscope },
  { href: '/inventory', label: 'Stock', icon: Truck },
  { href: '/settings', label: 'Me', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur border-t border-ink-100 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium',
                active ? 'text-brand-primary' : 'text-ink-500'
              )}
            >
              <item.icon className={cn('h-5 w-5', active && 'text-brand-primary')} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
