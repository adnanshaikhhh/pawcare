'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFamily } from '@/hooks/useFamily';
import { Card, CardBody, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Pill } from '../ui/Pill';
import { Avatar } from '../ui/Avatar';
import { Copy, Check, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

export function FamilyPanel() {
  const { family, refresh } = useFamily();
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function createFamily() {
    setJoinLoading(true);
    try {
      const res = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Our Family' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed');
      toast.success('Family group created');
      refresh();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setJoinLoading(false);
    }
  }

  async function joinFamily() {
    if (joinCode.length !== 8) {
      toast.error('Invite code is 8 characters');
      return;
    }
    setJoinLoading(true);
    try {
      const res = await fetch('/api/family', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_code: joinCode.toUpperCase() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed');
      toast.success('Joined family group');
      router.refresh();
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setJoinLoading(false);
    }
  }

  function copyCode() {
    if (!family?.group.invite_code) return;
    navigator.clipboard.writeText(family.group.invite_code);
    setCopied(true);
    toast.success('Invite code copied');
    setTimeout(() => setCopied(false), 1500);
  }

  if (!family) {
    return (
      <div className="grid md:grid-cols-2 gap-5">
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-2">Create a family group</h3>
          <p className="text-sm text-ink-500 mb-4">Start a new group and invite your partner or family members to share pet care.</p>
          <Button onClick={createFamily} loading={joinLoading}>Create family group</Button>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-2">Join an existing group</h3>
          <p className="text-sm text-ink-500 mb-4">Enter the 8-character invite code shared by your family member.</p>
          <div className="flex gap-2">
            <Input placeholder="ABCD1234" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} maxLength={8} className="font-mono" />
            <Button onClick={joinFamily} loading={joinLoading}>Join</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle>{family.group.name}</CardTitle>
              <p className="text-sm text-ink-500 mt-1">Share this code so your family can join</p>
            </div>
            <button onClick={copyCode} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-canvas-sunken hover:bg-ink-100/50 transition">
              <span className="font-mono font-semibold tracking-widest">{family.group.invite_code}</span>
              {copied ? <Check className="h-4 w-4 text-semantic-success" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </CardHeader>
        <CardBody>
          <h4 className="font-semibold mb-3">Members ({family.members.length})</h4>
          <div className="space-y-2">
            {family.members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-2">
                <Avatar src={null} name={m.profiles?.full_name ?? 'Member'} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink-900">{m.profiles?.full_name ?? 'Member'}</p>
                  <p className="text-xs text-ink-500">Joined {new Date(m.joined_at).toLocaleDateString()}</p>
                </div>
                <Pill variant={m.role === 'owner' ? 'brand' : m.role === 'caregiver' ? 'info' : 'neutral'}>{m.role}</Pill>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold mb-1">Join a different group</h3>
        <p className="text-sm text-ink-500 mb-3">Use another invite code to switch families.</p>
        <div className="flex gap-2 max-w-md">
          <Input placeholder="ABCD1234" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} maxLength={8} className="font-mono" />
          <Button onClick={joinFamily} loading={joinLoading} icon={<LogOut className="h-4 w-4" />}>Switch</Button>
        </div>
      </Card>
    </div>
  );
}
