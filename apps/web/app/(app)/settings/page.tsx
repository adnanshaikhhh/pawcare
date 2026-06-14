'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/hooks/useFamily';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { PageTransition } from '@/components/ui/PageTransition';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const router = useRouter();
  const { profile, refresh } = useProfile();
  const [name, setName] = useState(profile?.full_name ?? '');
  const [timezone, setTimezone] = useState(profile?.timezone ?? 'Asia/Kolkata');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: name, timezone }),
    });
    setSaving(false);
    if (res.ok) { toast.success('Saved'); refresh(); }
  }

  async function exportData() {
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('pets').select('*');
    const blob = new Blob([JSON.stringify({ user_id: user.id, exported_at: new Date().toISOString(), pets: data }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pawcare-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteAccount() {
    if (!confirm('Delete your account permanently? This cannot be undone.')) return;
    toast.error('Account deletion requires you to contact support@pawcare.app. We will verify and delete within 24h.');
  }

  return (
    <PageTransition>
      <div className="space-y-5 max-w-2xl">
        <h1 className="text-3xl font-display font-bold">Settings</h1>

        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar src={profile?.avatar_url ?? null} name={profile?.full_name ?? 'You'} size="xl" />
              <div className="flex-1">
                <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>
            <Input label="Timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
            <div className="flex justify-end">
              <Button onClick={save} loading={saving}>Save</Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
          <CardBody className="space-y-2 text-sm">
            <p className="text-ink-500">Push notifications are configured in your mobile app. Web notifications require a one-time permission grant in your browser settings.</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Data</CardTitle></CardHeader>
          <CardBody className="space-y-2">
            <p className="text-sm text-ink-500">Export all your data as a JSON file.</p>
            <Button variant="secondary" onClick={exportData}>Export data</Button>
          </CardBody>
        </Card>

        <Card className="border-semantic-danger/30">
          <CardHeader><CardTitle className="text-semantic-danger">Danger zone</CardTitle></CardHeader>
          <CardBody>
            <p className="text-sm text-ink-500 mb-3">Deleting your account is permanent.</p>
            <Button variant="danger" onClick={deleteAccount}>Delete account</Button>
          </CardBody>
        </Card>

        <p className="text-xs text-ink-500 text-center">PawCare v1.0.0 · Made with 🐾</p>
      </div>
    </PageTransition>
  );
}
