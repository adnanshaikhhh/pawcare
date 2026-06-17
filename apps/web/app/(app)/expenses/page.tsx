import { AppShell } from '@/components/layout/AppShell';
import { CatEconomicsWidget } from '@/components/v2/CatEconomicsWidget';

export default function ExpensesPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">💸 Pet Expenses</h1>
          <p className="text-ink-500 mt-1">Track every rupee spent on your pets.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <CatEconomicsWidget />
        </div>
      </div>
    </AppShell>
  );
}
