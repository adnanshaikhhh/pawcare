'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  async function googleLogin() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6 py-12">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center text-white text-xl">🐾</div>
        <span className="font-display font-bold text-2xl">PawCare</span>
      </Link>

      <Card className="w-full max-w-md p-7">
        <h1 className="text-2xl font-display font-bold">Welcome back</h1>
        <p className="text-sm text-ink-500 mt-1">Sign in to care for your pets.</p>

        <form onSubmit={login} className="mt-6 space-y-4">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          <Button type="submit" className="w-full" size="lg" loading={loading}>Sign in</Button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-ink-100" />
          <span className="text-xs text-ink-500">OR</span>
          <div className="flex-1 h-px bg-ink-100" />
        </div>

        <Button type="button" variant="secondary" className="w-full" size="lg" onClick={googleLogin}>
          <span className="mr-2">🔐</span> Continue with Google
        </Button>

        <p className="text-sm text-ink-500 mt-6 text-center">
          New to PawCare? <Link href="/auth/signup" className="text-brand-primary font-medium hover:underline">Create an account</Link>
        </p>
      </Card>
    </div>
  );
}
