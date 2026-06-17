'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log to console for debugging
    // eslint-disable-next-line no-console
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center light-mesh-bg dark:dark-mesh-bg px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">😿</div>
        <h1 className="text-4xl font-display font-bold text-ink-900 dark:text-dark-text mb-2">Something went wrong</h1>
        <p className="text-ink-500 dark:text-dark-text-muted mb-2">
          We hit an unexpected snag. Your data is safe.
        </p>
        {error.digest && (
          <p className="text-xs text-ink-300 dark:text-dark-text-dim mb-6 font-mono">Error: {error.digest}</p>
        )}
        <div className="flex items-center justify-center gap-3">
          <Button onClick={() => reset()}>Try again</Button>
          <Link href="/">
            <Button variant="secondary">Go home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
