'use client';

import { EmergencyVetFinder } from '@/components/emergency/EmergencyVetFinder';
import { PageTransition } from '@/components/ui/PageTransition';

export default function EmergencyPage() {
  return (
    <PageTransition>
      <div>
        <h1 className="text-3xl font-display font-bold">Emergency Vet Finder</h1>
        <p className="text-ink-500 mt-1 mb-6">Find 24/7 veterinary clinics near you, instantly.</p>
        <EmergencyVetFinder />
      </div>
    </PageTransition>
  );
}
