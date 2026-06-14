'use client';

import { useState } from 'react';
import { useReminders } from '@/hooks/useInventory';
import { usePets } from '@/hooks/usePets';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Pill } from '@/components/ui/Pill';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageTransition } from '@/components/ui/PageTransition';
import { REMINDER_TYPE_LABELS, type ReminderType } from '@pawcare/shared';
import { Plus, Check } from 'lucide-react';
import { formatRelativeDays } from '@/lib/utils';
import { differenceInDays, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

export default function RemindersPage() {
  const { reminders, refresh } = useReminders();
  const { pets } = usePets();
  const [adding, setAdding] = useState(false);

  const [form, setForm] = useState<{ pet_id: string; type: ReminderType; title: string; description: string; due_date: string }>({
    pet_id: '', type: 'custom', title: '', description: '', due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  });

  async function complete(id: string) {
    const res = await fetch('/api/reminders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_completed: true }) });
    if (res.ok) { toast.success('Done!'); refresh(); }
  }

  async function add() {
    if (!form.title) return;
    const res = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pet_id: form.pet_id || null, type: form.type, title: form.title, description: form.description || null,
        due_date: new Date(form.due_date).toISOString(),
        reminder_at: new Date(form.due_date).toISOString(),
      }),
    });
    if (res.ok) { setAdding(false); setForm({ ...form, title: '', description: '' }); toast.success('Reminder added'); refresh(); }
  }

  return (
    <PageTransition>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-display font-bold">Reminders</h1>
            <p className="text-ink-500 mt-1">{reminders.length} pending</p>
          </div>
          <Button onClick={() => setAdding(!adding)} icon={<Plus className="h-4 w-4" />}>{adding ? 'Cancel' : 'New reminder'}</Button>
        </div>

        {adding ? (
          <Card>
            <CardBody>
              <div className="grid sm:grid-cols-2 gap-3">
                <Select label="Pet (optional)" value={form.pet_id} onChange={(e) => setForm({ ...form, pet_id: e.target.value })}>
                  <option value="">— No specific pet —</option>
                  {pets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Select>
                <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ReminderType })}>
                  {Object.entries(REMINDER_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                </Select>
                <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="sm:col-span-2" />
                <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="sm:col-span-2" />
                <Input type="date" label="Due date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="sm:col-span-2" />
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={add}>Save reminder</Button>
              </div>
            </CardBody>
          </Card>
        ) : null}

        {reminders.length === 0 ? (
          <Card><CardBody><EmptyState emoji="⏰" title="No reminders" description="Add a reminder or log a vaccine/deworming to auto-create one." /></CardBody></Card>
        ) : (
          <div className="space-y-2">
            {reminders.map((r) => {
              const days = differenceInDays(parseISO(r.due_date), new Date());
              const lbl = REMINDER_TYPE_LABELS[r.type];
              return (
                <Card key={r.id} className="p-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="h-10 w-10 rounded-xl bg-brand-light text-brand-primary flex items-center justify-center text-lg">{lbl.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{r.title}</p>
                      {r.description ? <p className="text-xs text-ink-500 truncate">{r.description}</p> : null}
                    </div>
                    <Pill variant={days <= 0 ? 'danger' : days <= 7 ? 'warning' : 'brand'}>{formatRelativeDays(days)}</Pill>
                    <Button size="sm" variant="ghost" onClick={() => complete(r.id)} icon={<Check className="h-4 w-4" />}>Done</Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
