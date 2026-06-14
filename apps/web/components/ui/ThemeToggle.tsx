'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-10 h-10 rounded-full" />;
  }

  const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';

  return (
    <button
      onClick={() => setTheme(next)}
      className="theme-toggle group"
      title={`Theme: ${theme} (click for ${next})`}
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        <Sun
          className={`absolute inset-0 w-5 h-5 text-amber-500 transition-all duration-500 ${
            resolvedTheme === 'light' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
          }`}
        />
        <Moon
          className={`absolute inset-0 w-5 h-5 text-coral-primary transition-all duration-500 ${
            resolvedTheme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`}
          style={{ color: '#FF6B6B' }}
        />
        {theme === 'system' && (
          <Monitor
            className="absolute inset-0 w-5 h-5 text-ink-500 transition-all duration-300 opacity-50"
          />
        )}
      </div>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
