'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePet } from '@/hooks/usePets';
import { useVaccinations, useMedications, useDeworming, useWeightLogs, useVetVisits, useMoodLogs } from '@/hooks/useMedical';
import { PetProfileHeader } from '@/components/pets/PetProfileHeader';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Pill } from '@/components/ui/Pill';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageTransition } from '@/components/ui/PageTransition';
import { Plus, Download, FileDown, Edit, Trash } from 'lucide-react';
import { formatDate, formatInr } from '@/lib/shared';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import toast from 'react-hot-toast';

const TABS = ['Overview', 'Vaccines', 'Medications', 'Deworming', 'Vet Visits', 'Weight', 'Mood'] as const;
type Tab = (typeof TABS)[number];

export default function PetDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const [tab, setTab] = useState<Tab>('Overview');

  const { pet, isLoading } = usePet(id ?? null);
  const { vaccinations } = useVaccinations(id ?? null);
  const { medications } = useMedications(id ?? null);
  const { deworming } = useDeworming(id ?? null);
  const { visits } = useVetVisits(id ?? null);
  const { weights } = useWeightLogs(id ?? null);
  const { moods } = useMoodLogs(id ?? null);

  if (isLoading) return <p className="text-sm text-ink-500">Loading…</p>;
  if (!pet) return <p className="text-sm text-semantic-danger">Pet not found.</p>;

  async function deletePet() {
    if (!confirm(`Delete ${pet?.name}? This cannot be undone.`)) return;
    const res = await fetch(`/api/pets/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Pet deleted');
      router.push('/pets');
    } else {
      toast.error('Failed to delete');
    }
  }

  return (
    <PageTransition>
      <div className="space-y-5">
        <PetProfileHeader pet={pet} vaccinations={vaccinations} deworming={deworming} />

        <div className="flex items-center gap-2 flex-wrap">
          <a href={`/api/export/${id}`} target="_blank" rel="noreferrer">
            <Button variant="secondary" size="sm" icon={<FileDown className="h-4 w-4" />}>Export PDF</Button>
          </a>
          <Link href={`/pets/${id}/edit`}>
            <Button variant="ghost" size="sm" icon={<Edit className="h-4 w-4" />}>Edit</Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={deletePet} icon={<Trash className="h-4 w-4" />}>Delete</Button>
        </div>

        <div className="border-b border-ink-100 overflow-x-auto">
          <div className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === t ? 'border-brand-primary text-brand-primary' : 'border-transparent text-ink-500 hover:text-ink-900'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {tab === 'Overview' ? <OverviewTab petId={id!} /> : null}
        {tab === 'Vaccines' ? <VaccinesTab petId={id!} data={vaccinations} onChange={() => {}} /> : null}
        {tab === 'Medications' ? <MedicationsTab petId={id!} data={medications} onChange={() => {}} /> : null}
        {tab === 'Deworming' ? <DewormingTab petId={id!} data={deworming} onChange={() => {}} /> : null}
        {tab === 'Vet Visits' ? <VetVisitsTab petId={id!} data={visits} onChange={() => {}} /> : null}
        {tab === 'Weight' ? <WeightTab data={weights} petId={id!} onChange={() => {}} /> : null}
        {tab === 'Mood' ? <MoodTab data={moods} petId={id!} onChange={() => {}} /> : null}
      </div>
    </PageTransition>
  );
}

function OverviewTab({ petId }: { petId: string }) {
  const { vaccinations } = useVaccinations(petId);
  const { medications } = useMedications(petId);
  const { weights } = useWeightLogs(petId);
  const latestWeight = weights[0];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card><CardBody>
        <p className="text-xs text-ink-500">Current weight</p>
        <p className="text-3xl font-bold mt-1">{latestWeight ? `${latestWeight.weight_kg} kg` : '—'}</p>
        {latestWeight ? <p className="text-xs text-ink-500 mt-1">Last logged {formatDate(latestWeight.measured_at)}</p> : null}
      </CardBody></Card>
      <Card><CardBody>
        <p className="text-xs text-ink-500">Active medications</p>
        <p className="text-3xl font-bold mt-1">{medications.filter((m) => m.is_active).length}</p>
      </CardBody></Card>
      <Card><CardBody>
        <p className="text-xs text-ink-500">Total vaccines</p>
        <p className="text-3xl font-bold mt-1">{vaccinations.length}</p>
      </CardBody></Card>
    </div>
  );
}

function VaccinesTab({ petId, data, onChange }: { petId: string; data: ReturnType<typeof useVaccinations>['vaccinations']; onChange: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('core');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [next, setNext] = useState('');
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!name || !date) {
      toast.error('Name and date are required');
      return;
    }
    setSaving(true);
    const res = await fetch('/api/vaccinations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pet_id: petId, vaccine_name: name, vaccine_type: type, date_given: date, next_due_date: next || null }),
    });
    setSaving(false);
    if (res.ok) {
      setName(''); setNext('');
      toast.success('Vaccine logged');
      onChange();
    } else {
      toast.error('Failed to log');
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Log a vaccine</CardTitle></CardHeader>
        <CardBody>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input label="Vaccine name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rabies" />
            <Select label="Type" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="core">Core</option>
              <option value="non_core">Non-core</option>
              <option value="booster">Booster</option>
              <option value="rabies">Rabies</option>
              <option value="combo">Combo</option>
            </Select>
            <Input type="date" label="Date given" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input type="date" label="Next due (optional)" value={next} onChange={(e) => setNext(e.target.value)} />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={add} loading={saving} icon={<Plus className="h-4 w-4" />}>Log vaccine</Button>
          </div>
        </CardBody>
      </Card>

      {data.length === 0 ? (
        <Card><CardBody><EmptyState emoji="💉" title="No vaccines logged yet" /></CardBody></Card>
      ) : (
        <div className="space-y-2">
          {data.map((v) => (
            <Card key={v.id}>
              <CardBody className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-semibold">{v.vaccine_name}</p>
                  <p className="text-xs text-ink-500">{formatDate(v.date_given)} · {v.vaccine_type}</p>
                </div>
                {v.next_due_date ? <Pill variant={new Date(v.next_due_date) < new Date() ? 'danger' : 'brand'}>Next: {formatDate(v.next_due_date)}</Pill> : null}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function MedicationsTab({ petId, data, onChange }: { petId: string; data: ReturnType<typeof useMedications>['medications']; onChange: () => void }) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!name) {
      toast.error('Name required');
      return;
    }
    setSaving(true);
    const res = await fetch('/api/medications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pet_id: petId, medicine_name: name, dosage, frequency }),
    });
    setSaving(false);
    if (res.ok) { setName(''); setDosage(''); toast.success('Medication added'); onChange(); }
    else toast.error('Failed');
  }

  async function logGiven(medId: string) {
    const res = await fetch('/api/medication-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medication_id: medId, pet_id: petId, given_at: new Date().toISOString() }),
    });
    if (res.ok) toast.success('Logged as given');
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Add medication</CardTitle></CardHeader>
        <CardBody>
          <div className="grid sm:grid-cols-3 gap-3">
            <Input label="Medicine name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Apoquel" />
            <Input label="Dosage" value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="e.g. 5mg" />
            <Select label="Frequency" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              <option value="once">Once</option>
              <option value="daily">Daily</option>
              <option value="twice_daily">Twice daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="as_needed">As needed</option>
            </Select>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={add} loading={saving} icon={<Plus className="h-4 w-4" />}>Add medication</Button>
          </div>
        </CardBody>
      </Card>

      {data.length === 0 ? (
        <Card><CardBody><EmptyState emoji="💊" title="No medications yet" /></CardBody></Card>
      ) : (
        <div className="space-y-2">
          {data.map((m) => (
            <Card key={m.id}>
              <CardBody className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-semibold">{m.medicine_name}</p>
                  <p className="text-xs text-ink-500">{m.dosage ?? '—'} · {m.frequency} {m.is_ongoing ? ' · ongoing' : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!m.is_active ? <Pill variant="neutral">Inactive</Pill> : null}
                  <Button size="sm" onClick={() => logGiven(m.id)}>Give now</Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function DewormingTab({ petId, data, onChange }: { petId: string; data: ReturnType<typeof useDeworming>['deworming']; onChange: () => void }) {
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [next, setNext] = useState('');
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!name) return;
    setSaving(true);
    const res = await fetch(`/api/medical/deworming/${petId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_name: name, date_given: date, next_due_date: next || null }),
    });
    setSaving(false);
    if (res.ok) { setName(''); setNext(''); toast.success('Logged'); onChange(); }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Log deworming</CardTitle></CardHeader>
        <CardBody>
          <div className="grid sm:grid-cols-3 gap-3">
            <Input label="Product name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Drontal" />
            <Input type="date" label="Date given" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input type="date" label="Next due" value={next} onChange={(e) => setNext(e.target.value)} />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={add} loading={saving} icon={<Plus className="h-4 w-4" />}>Log deworming</Button>
          </div>
        </CardBody>
      </Card>
      {data.length === 0 ? (
        <Card><CardBody><EmptyState emoji="🐛" title="No deworming records yet" /></CardBody></Card>
      ) : (
        <div className="space-y-2">
          {data.map((d) => (
            <Card key={d.id}>
              <CardBody className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-semibold">{d.product_name}</p>
                  <p className="text-xs text-ink-500">{formatDate(d.date_given)}</p>
                </div>
                {d.next_due_date ? <Pill variant={new Date(d.next_due_date) < new Date() ? 'danger' : 'brand'}>Next: {formatDate(d.next_due_date)}</Pill> : null}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function VetVisitsTab({ petId, data, onChange }: { petId: string; data: ReturnType<typeof useVetVisits>['visits']; onChange: () => void }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [vet, setVet] = useState('');
  const [clinic, setClinic] = useState('');
  const [reason, setReason] = useState('');
  const [cost, setCost] = useState('');
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!date) return;
    setSaving(true);
    const res = await fetch('/api/vet-visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pet_id: petId, visit_date: date, vet_name: vet || null, clinic_name: clinic || null, reason: reason || null, cost_inr: cost ? Number(cost) : null,
      }),
    });
    setSaving(false);
    if (res.ok) { setVet(''); setClinic(''); setReason(''); setCost(''); toast.success('Visit logged'); onChange(); }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Log vet visit</CardTitle></CardHeader>
        <CardBody>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Input type="date" label="Visit date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input label="Vet name" value={vet} onChange={(e) => setVet(e.target.value)} />
            <Input label="Clinic" value={clinic} onChange={(e) => setClinic(e.target.value)} />
            <Input label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} className="sm:col-span-2 lg:col-span-2" />
            <Input label="Cost ₹" type="number" value={cost} onChange={(e) => setCost(e.target.value)} />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={add} loading={saving} icon={<Plus className="h-4 w-4" />}>Log visit</Button>
          </div>
        </CardBody>
      </Card>
      {data.length === 0 ? (
        <Card><CardBody><EmptyState emoji="🏥" title="No vet visits yet" /></CardBody></Card>
      ) : (
        <div className="space-y-2">
          {data.map((v) => (
            <Card key={v.id}>
              <CardBody>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-semibold">{v.reason ?? 'Visit'}</p>
                    <p className="text-xs text-ink-500">{v.clinic_name ?? v.vet_name ?? '—'} · {formatDate(v.visit_date)}</p>
                  </div>
                  {v.cost_inr ? <Pill variant="brand">{formatInr(v.cost_inr)}</Pill> : null}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function WeightTab({ data, petId, onChange }: { data: ReturnType<typeof useWeightLogs>['weights']; petId: string; onChange: () => void }) {
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const chartData = [...data].reverse().map((w) => ({ date: formatDate(w.measured_at, 'MMM d'), kg: w.weight_kg }));

  async function add() {
    if (!weight) return;
    setSaving(true);
    const res = await fetch(`/api/medical/weight/${petId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight_kg: Number(weight), measured_at: date }),
    });
    setSaving(false);
    if (res.ok) { setWeight(''); toast.success('Weight logged'); onChange(); }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Log weight</CardTitle></CardHeader>
        <CardBody>
          <div className="grid sm:grid-cols-3 gap-3">
            <Input type="number" step="0.1" label="Weight (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="4.2" />
            <Input type="date" label="Measured at" value={date} onChange={(e) => setDate(e.target.value)} />
            <div className="flex items-end">
              <Button onClick={add} loading={saving} icon={<Plus className="h-4 w-4" />}>Log</Button>
            </div>
          </div>
        </CardBody>
      </Card>
      {chartData.length > 1 ? (
        <Card><CardBody>
          <h3 className="font-semibold mb-3">Weight trend</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F5" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                <Tooltip />
                <Line type="monotone" dataKey="kg" stroke="#FF6B6B" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardBody></Card>
      ) : null}
      {data.length === 0 ? <Card><CardBody><EmptyState emoji="⚖️" title="No weight logs yet" /></CardBody></Card> : null}
    </div>
  );
}

function MoodTab({ data, petId, onChange }: { data: ReturnType<typeof useMoodLogs>['moods']; petId: string; onChange: () => void }) {
  const [mood, setMood] = useState('happy');
  const [appetite, setAppetite] = useState('good');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const moods = [
    { value: 'happy', emoji: '😸', label: 'Happy' },
    { value: 'playful', emoji: '😺', label: 'Playful' },
    { value: 'calm', emoji: '😌', label: 'Calm' },
    { value: 'tired', emoji: '😴', label: 'Tired' },
    { value: 'anxious', emoji: '😟', label: 'Anxious' },
    { value: 'sick', emoji: '🤒', label: 'Sick' },
  ];

  async function add() {
    setSaving(true);
    const res = await fetch(`/api/medical/mood/${petId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mood, appetite, notes: notes || null }),
    });
    setSaving(false);
    if (res.ok) { setNotes(''); toast.success('Mood logged for today'); onChange(); }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>How is {`your pet`} today?</CardTitle></CardHeader>
        <CardBody>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {moods.map((m) => (
              <button
                key={m.value}
                onClick={() => setMood(m.value)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition ${mood === m.value ? 'border-brand-primary bg-brand-light' : 'border-ink-100 hover:border-ink-300'}`}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-xs">{m.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <Select label="Appetite" value={appetite} onChange={(e) => setAppetite(e.target.value)}>
              <option value="excellent">🍖 Excellent</option>
              <option value="good">🍗 Good</option>
              <option value="poor">🥣 Poor</option>
              <option value="none">🚫 None</option>
            </Select>
            <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything to remember?" />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={add} loading={saving} icon={<Plus className="h-4 w-4" />}>Log today</Button>
          </div>
        </CardBody>
      </Card>

      {data.length === 0 ? <Card><CardBody><EmptyState emoji="😊" title="No mood logs yet" /></CardBody></Card> : (
        <Card>
          <CardHeader><CardTitle>Recent moods</CardTitle></CardHeader>
          <CardBody className="grid grid-cols-7 gap-2">
            {data.slice(0, 14).map((m) => {
              const md = moods.find((x) => x.value === m.mood);
              return (
                <div key={m.id} className="flex flex-col items-center text-center">
                  <span className="text-2xl">{md?.emoji ?? '🙂'}</span>
                  <span className="text-[10px] text-ink-500 mt-1">{formatDate(m.logged_date, 'MMM d')}</span>
                </div>
              );
            })}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
