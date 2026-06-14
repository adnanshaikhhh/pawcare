'use client';

import { SymptomChecker } from '@/components/ai/SymptomChecker';
import { usePets } from '@/hooks/usePets';
import { PageTransition } from '@/components/ui/PageTransition';

export default function SymptomsPage() {
  const { pets, isLoading } = usePets();
  return (
    <PageTransition>
      <div>
        <h1 className="text-3xl font-display font-bold">AI Symptom Checker</h1>
        <p className="text-ink-500 mt-1 mb-6">Describe what you&apos;re noticing. PawCare AI will give you an urgency assessment and next steps.</p>
        {isLoading ? <p className="text-sm text-ink-500">Loading…</p> : <SymptomChecker pets={pets} />}
      </div>
    </PageTransition>
  );
}
