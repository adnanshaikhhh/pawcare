'use client';

import { FamilyPanel } from '@/components/family/FamilyPanel';
import { PageTransition } from '@/components/ui/PageTransition';

export default function FamilyPage() {
  return (
    <PageTransition>
      <div>
        <h1 className="text-3xl font-display font-bold">Family Sharing</h1>
        <p className="text-ink-500 mt-1 mb-6">Invite your partner or family to share pet care.</p>
        <FamilyPanel />
      </div>
    </PageTransition>
  );
}
