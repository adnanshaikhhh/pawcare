'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Home, PawPrint, Stethoscope, Bell, Truck, Users, Settings, LogOut, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/pets', label: 'My Pets', icon: PawPrint },
  { href: '/symptoms', label: 'Symptom Checker', icon: Activity },
  { href: '/emergency', label: 'Emergency', icon: Stethoscope },
  { href: '/inventory', label: 'Inventory', icon: Truck },
  { href: '/reminders', label: 'Reminders', icon: Bell },
  { href: '/family', label: 'Family', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((j) => setEmail(j.data?.id ? 'you' : null))
      .catch(() => {});
  }, []);

  async function signOut() {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/auth/login');
    router.refresh();
  }

  return (
    <aside className="hidden md:flex flex-col w-60 fixed inset-y-0 left-0 bg-white border-r border-ink-100 z-30">
      <div className="px-5 py-5 flex items-center gap-2 border-b border-ink-100">
        <div className="h-9 w-9 rounded-xl gradient-brand flex items-center justify-center text-white text-lg">🐾</div>
        <div>
          <p className="font-display font-bold text-ink-900">PawCare</p>
          <p className="text-[10px] text-ink-500 leading-tight">Every pet. Every moment.</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition',
                active ? 'bg-brand-light text-brand-primary' : 'text-ink-700 hover:bg-canvas-sunken'
              )}
            >
              <item.icon className="h-4 w-4" />{item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-ink-100">
        <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-ink-700 hover:bg-canvas-sunken">
          <LogOut className="h-4 w-4" />Sign out
        </button>
      </div>
    </aside>
  );
}
