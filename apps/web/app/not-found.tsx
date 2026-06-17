import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center light-mesh-bg dark:dark-mesh-bg px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🐾</div>
        <h1 className="text-4xl font-display font-bold text-ink-900 dark:text-dark-text mb-2">Page not found</h1>
        <p className="text-ink-500 dark:text-dark-text-muted mb-6">
          This page wandered off like a curious cat. Let&apos;s get you back home.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/">
            <Button>Go home</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary">Open dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
