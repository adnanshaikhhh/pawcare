'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [terms, setTerms] = useState(false);

  async function signup(e: React.FormEvent) {
    e.preventDefault();
    if (!terms) {
      toast.error('Please accept the terms');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    toast.success('Account created. Check your email to verify.');
    setTimeout(() => router.push('/dashboard'), 1200);
  }

  async function googleSignup() {
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
        <h1 className="text-2xl font-display font-bold">Create your account</h1>
        <p className="text-sm text-ink-500 mt-1">Free forever. No credit card needed.</p>

        <form onSubmit={signup} className="mt-6 space-y-4">
          <Input label="Your name" type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Priya" />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="At least 6 characters" hint="Use 6+ characters with a mix of letters and numbers" />
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5" />
            <span className="text-ink-700">I agree to the Terms of Service and Privacy Policy.</span>
          </label>
          <Button type="submit" className="w-full" size="lg" loading={loading}>Create account</Button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-ink-100" />
          <span className="text-xs text-ink-500">OR</span>
          <div className="flex-1 h-px bg-ink-100" />
        </div>

        <Button type="button" variant="secondary" className="w-full" size="lg" onClick={googleSignup}>
          <span className="mr-2">🔐</span> Sign up with Google
        </Button>

        <p className="text-sm text-ink-500 mt-6 text-center">
          Already have an account? <Link href="/auth/login" className="text-brand-primary font-medium hover:underline">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}
