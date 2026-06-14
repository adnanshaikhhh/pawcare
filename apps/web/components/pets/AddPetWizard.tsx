'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/Button';
import { Input, Select, Textarea } from '../ui/Input';
import { POPULAR_CAT_BREEDS, POPULAR_DOG_BREEDS, SPECIES_LABELS } from '@/lib/shared';
import type { Species } from '@/lib/shared';
import toast from 'react-hot-toast';

const STEPS = ['Basics', 'Birth & Adoption', 'Medical', 'Photo', 'Confirm'] as const;

export function AddPetWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    species: 'cat' as Species,
    breed: '',
    gender: 'unknown' as 'male' | 'female' | 'unknown',
    date_of_birth: '',
    adoption_date: '',
    is_birthday_known: true,
    is_neutered: false,
    microchip_number: '',
    photo_url: '',
    bio: '',
    is_indoor: true,
  });

  const breeds = form.species === 'cat' ? POPULAR_CAT_BREEDS : form.species === 'dog' ? POPULAR_DOG_BREEDS : ['Other'];

  function update<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function next() { setStep((s) => Math.min(STEPS.length - 1, s + 1)); }
  function back() { setStep((s) => Math.max(0, s - 1)); }

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          species: form.species,
          breed: form.breed || null,
          gender: form.gender,
          date_of_birth: form.date_of_birth || null,
          adoption_date: form.adoption_date || null,
          is_birthday_known: form.is_birthday_known,
          is_neutered: form.is_neutered,
          microchip_number: form.microchip_number || null,
          photo_url: form.photo_url || null,
          bio: form.bio || null,
          is_indoor: form.is_indoor,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to create');
      toast.success(`${form.name} added!`);
      router.push(`/pets/${json.data.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold ${i <= step ? 'bg-brand-primary text-white' : 'bg-canvas-sunken text-ink-500'}`}>
              {i + 1}
            </div>
            <span className={`text-xs hidden sm:inline ${i <= step ? 'text-ink-900' : 'text-ink-300'}`}>{s}</span>
            {i < STEPS.length - 1 ? <div className={`flex-1 h-px ${i < step ? 'bg-brand-primary' : 'bg-ink-100'}`} /> : null}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 shadow-card p-6">
        {step === 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Tell us about your pet</h2>
            <Input label="Name" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Smokey" />
            <Select label="Species" value={form.species} onChange={(e) => update('species', e.target.value as Species)}>
              {Object.entries(SPECIES_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.emoji} {v.label}</option>
              ))}
            </Select>
            <Select label="Breed" value={form.breed} onChange={(e) => update('breed', e.target.value)}>
              <option value="">— select —</option>
              {breeds.map((b) => <option key={b} value={b}>{b}</option>)}
            </Select>
            <Select label="Gender" value={form.gender} onChange={(e) => update('gender', e.target.value as 'male' | 'female' | 'unknown')}>
              <option value="unknown">Unknown</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </Select>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">When was {form.name || 'your pet'} born?</h2>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_birthday_known} onChange={(e) => update('is_birthday_known', e.target.checked)} />
              I know the exact date of birth
            </label>
            {form.is_birthday_known ? (
              <Input type="date" label="Date of birth" value={form.date_of_birth} onChange={(e) => update('date_of_birth', e.target.value)} />
            ) : (
              <Input label="Approximate age (years)" type="number" min={0} onChange={(e) => update('date_of_birth', '')} />
            )}
            <Input type="date" label="Adoption date (optional)" value={form.adoption_date} onChange={(e) => update('adoption_date', e.target.value)} />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Medical info</h2>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_neutered} onChange={(e) => update('is_neutered', e.target.checked)} />
              Neutered / spayed
            </label>
            <Input label="Microchip number (optional)" value={form.microchip_number} onChange={(e) => update('microchip_number', e.target.value)} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_indoor} onChange={(e) => update('is_indoor', e.target.checked)} />
              Indoor pet
            </label>
            <Textarea label="Bio (optional)" value={form.bio} onChange={(e) => update('bio', e.target.value)} placeholder="Personality, quirks, favourite snacks…" />
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Add a photo</h2>
            <p className="text-sm text-ink-500">Paste an image URL for now (Supabase storage upload coming via mobile camera). You can add photos later.</p>
            <Input label="Photo URL (optional)" value={form.photo_url} onChange={(e) => update('photo_url', e.target.value)} placeholder="https://…" />
            {form.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.photo_url} alt="preview" className="h-32 w-32 rounded-2xl object-cover" />
            ) : null}
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Confirm</h2>
            <div className="rounded-xl bg-canvas-sunken p-4 text-sm space-y-1">
              <p><strong>Name:</strong> {form.name}</p>
              <p><strong>Species:</strong> {SPECIES_LABELS[form.species].label}</p>
              <p><strong>Breed:</strong> {form.breed || '—'}</p>
              <p><strong>Gender:</strong> {form.gender}</p>
              <p><strong>Date of birth:</strong> {form.date_of_birth || 'unknown'}</p>
              <p><strong>Neutered:</strong> {form.is_neutered ? 'yes' : 'no'}</p>
              <p><strong>Indoor:</strong> {form.is_indoor ? 'yes' : 'no'}</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={back} disabled={step === 0}>Back</Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next} disabled={step === 0 && !form.name}>Continue</Button>
        ) : (
          <Button onClick={submit} loading={submitting}>Add {form.name || 'pet'}</Button>
        )}
      </div>
    </div>
  );
}
