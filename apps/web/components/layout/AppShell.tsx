'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Sidebar } from './Sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/auth/login');
        return;
      }
      setEmail(data.user.email ?? null);
      fetch('/api/profile')
        .then((r) => r.json())
        .then((j) => setName(j.data?.full_name ?? null))
        .catch(() => {});
      setLoading(false);
    });
  }, [router]);

  useEffect(() => { setDrawer(false); }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center light-mesh-bg dark:dark-mesh-bg">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto rounded-2xl gradient-brand animate-pulse brand-glow" />
          <p className="mt-3 text-sm text-ink-500 dark:text-dark-text-muted">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen light-mesh-bg dark:dark-mesh-bg">
      <Sidebar />

      <header className="md:hidden sticky top-0 z-30 glass-nav-light dark:glass-nav px-4 py-3 flex items-center justify-between">
        <button onClick={() => setDrawer(true)} className="p-2 -ml-2 text-ink-900 dark:text-dark-text">
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg gradient-brand flex items-center justify-center text-white text-sm brand-glow">🐾</div>
          <span className="font-display font-bold text-ink-900 dark:text-dark-text">PawCare</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Avatar src={null} name={name ?? email ?? 'You'} size="sm" />
        </div>
      </header>

      {drawer ? (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <div className="relative glass-nav-light dark:glass-nav w-64 h-full shadow-modal p-4 border-r border-ink-100 dark:border-dark-border">
            <button onClick={() => setDrawer(false)} className="absolute top-3 right-3 p-1 text-ink-900 dark:text-dark-text">
              <X className="h-5 w-5" />
            </button>
            <div className="mt-8 space-y-1">
              {[
                { href: '/dashboard', label: '🏠 Dashboard' },
                { href: '/pets', label: '🐾 My Pets' },
                { href: '/symptoms', label: '🤖 Symptom Checker' },
                { href: '/emergency', label: '🚨 Emergency' },
                { href: '/inventory', label: '📦 Inventory' },
                { href: '/reminders', label: '⏰ Reminders' },
                { href: '/family', label: '👨‍👩‍👧 Family' },
                { href: '/settings', label: '⚙️ Settings' },
              ].map((i) => (
                <Link key={i.href} href={i.href} className="block px-3 py-2.5 rounded-xl text-sm text-ink-900 dark:text-dark-text hover:bg-canvas-sunken dark:hover:bg-dark-surface">
                  {i.label}
                </Link>
              ))}
              <button
                onClick={async () => {
                  await fetch('/api/auth/signout', { method: 'POST' });
                  router.push('/auth/login');
                }}
                className="block w-full text-left px-3 py-2.5 rounded-xl text-sm text-ink-900 dark:text-dark-text hover:bg-canvas-sunken dark:hover:bg-dark-surface"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <main className="md:pl-60 pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
