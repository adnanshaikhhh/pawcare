'use client';

import { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Input';
import { Pill } from '../ui/Pill';
import { URGENCY_COLORS, type Pet, type SymptomCheckResult } from '@/lib/shared';
import { cn } from '@/lib/utils';

interface SymptomCheckerProps {
  pets: Pet[];
}

export function SymptomChecker({ pets }: SymptomCheckerProps) {
  const [selectedPet, setSelectedPet] = useState<string>(pets[0]?.id ?? '');
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SymptomCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPet && pets[0]) setSelectedPet(pets[0].id);
  }, [pets, selectedPet]);

  async function check() {
    if (!selectedPet || symptoms.trim().length < 5) {
      setError('Please describe the symptoms in more detail (at least 5 characters).');
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch('/api/ai/symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pet_id: selectedPet, symptoms_described: symptoms }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed');
      setResult(json.data.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to check');
    } finally {
      setLoading(false);
    }
  }

  if (pets.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-3xl mb-2">🐾</p>
        <h3 className="font-semibold">Add a pet first</h3>
        <p className="text-sm text-ink-500 mt-1">You need at least one pet profile to use the symptom checker.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-1">Describe what you&apos;re noticing</h2>
        <p className="text-sm text-ink-500 mb-4">PawCare AI will assess urgency and suggest next steps. It&apos;s not a vet — always verify with a licensed professional.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Which pet?</label>
            <div className="flex flex-wrap gap-2">
              {pets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPet(p.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm border transition',
                    selectedPet === p.id ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-ink-700 border-ink-100 hover:border-ink-300'
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            label="Symptoms"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="e.g. Smokey has been vomiting since morning, refuses food, seems lethargic…"
            rows={5}
          />

          {error ? <p className="text-sm text-semantic-danger">{error}</p> : null}

          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-500">{symptoms.length} characters · 10 free checks per day</p>
            <Button onClick={check} loading={loading} size="lg">Check symptoms</Button>
          </div>
        </div>
      </Card>

      {result ? (
        <Card className="p-6 animate-fade-in">
          <div
            className="rounded-xl p-4 mb-4 border"
            style={{ background: URGENCY_COLORS[result.urgency].bg, borderColor: URGENCY_COLORS[result.urgency].border }}
          >
            <p className="font-semibold" style={{ color: URGENCY_COLORS[result.urgency].text }}>
              {URGENCY_COLORS[result.urgency].label}
            </p>
            <p className="text-sm mt-1 text-ink-700">{result.when_to_go_to_vet}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-ink-900 mb-2">Possible causes</h3>
              <ul className="text-sm text-ink-700 space-y-1.5">
                {result.possible_causes.map((c, i) => (
                  <li key={i} className="flex gap-2"><span className="text-brand-primary">•</span>{c}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-ink-900 mb-2">Recommended actions</h3>
              <ul className="text-sm text-ink-700 space-y-1.5">
                {result.recommended_actions.map((a, i) => (
                  <li key={i} className="flex gap-2"><span className="text-semantic-info">→</span>{a}</li>
                ))}
              </ul>
            </div>
            <div className="sm:col-span-2">
              <h3 className="font-semibold text-ink-900 mb-2">Home care tips</h3>
              <div className="flex flex-wrap gap-2">
                {result.home_care_tips.map((t, i) => <Pill key={i} variant="brand">{t}</Pill>)}
              </div>
            </div>
          </div>

          {result.urgency === 'emergency' ? (
            <a href="/emergency" className="mt-4 block">
              <Button variant="danger" size="lg" className="w-full">🚨 Find Emergency Vet</Button>
            </a>
          ) : null}

          <p className="text-xs text-ink-500 mt-4 italic">{result.disclaimer}</p>
        </Card>
      ) : null}
    </div>
  );
}
