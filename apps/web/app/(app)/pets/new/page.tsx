import { AddPetWizard } from '@/components/pets/AddPetWizard';
import { PageTransition } from '@/components/ui/PageTransition';

export default function NewPetPage() {
  return (
    <PageTransition>
      <div>
        <h1 className="text-3xl font-display font-bold">Add a new pet</h1>
        <p className="text-ink-500 mt-1 mb-6">Tell us a little about your furry friend.</p>
        <AddPetWizard />
      </div>
    </PageTransition>
  );
}
