'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePet } from '@/hooks/usePets';
import { Card, CardBody } from '@/components/ui/Card';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { POPULAR_CAT_BREEDS, POPULAR_DOG_BREEDS, SPECIES_LABELS } from '@/lib/shared';
import type { Species } from '@/lib/shared';
import { PageTransition } from '@/components/ui/PageTransition';
import toast from 'react-hot-toast';

export default function EditPetPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { pet, isLoading } = usePet(params?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (pet) setForm(pet as unknown as Record<string, unknown>);
  }, [pet]);

  if (isLoading) return <p className="text-sm text-ink-500">Loading…</p>;
  if (!pet) return <p className="text-sm text-semantic-danger">Not found.</p>;

  const breeds = (form.species as Species) === 'cat' ? POPULAR_CAT_BREEDS : (form.species as Species) === 'dog' ? POPULAR_DOG_BREEDS : ['Other'];

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/pets/${params?.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { toast.success('Saved'); router.push(`/pets/${params?.id}`); }
    else toast.error('Failed');
  }

  function u<K extends string>(key: K, val: unknown) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-display font-bold mb-1">Edit {pet.name}</h1>
        <p className="text-ink-500 mb-6">Update any field and save.</p>
        <Card>
          <CardBody className="space-y-4">
            <Input label="Name" value={(form.name as string) ?? ''} onChange={(e) => u('name', e.target.value)} />
            <div className="grid sm:grid-cols-2 gap-3">
              <Select label="Species" value={(form.species as string) ?? 'cat'} onChange={(e) => u('species', e.target.value)}>
                {Object.entries(SPECIES_LABELS).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
              </Select>
              <Select label="Breed" value={(form.breed as string) ?? ''} onChange={(e) => u('breed', e.target.value)}>
                <option value="">—</option>
                {breeds.map((b) => <option key={b} value={b}>{b}</option>)}
              </Select>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input type="date" label="Date of birth" value={(form.date_of_birth as string) ?? ''} onChange={(e) => u('date_of_birth', e.target.value)} />
              <Input type="date" label="Adoption date" value={(form.adoption_date as string) ?? ''} onChange={(e) => u('adoption_date', e.target.value)} />
            </div>
            <Input label="Photo URL" value={(form.photo_url as string) ?? ''} onChange={(e) => u('photo_url', e.target.value)} />
            <Textarea label="Bio" value={(form.bio as string) ?? ''} onChange={(e) => u('bio', e.target.value)} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.is_neutered} onChange={(e) => u('is_neutered', e.target.checked)} />
              Neutered / spayed
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.is_indoor} onChange={(e) => u('is_indoor', e.target.checked)} />
              Indoor
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
              <Button onClick={save} loading={saving}>Save</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </PageTransition>
  );
}
