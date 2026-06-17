import { AppShell } from '@/components/layout/AppShell';
import { WhoFedWhoTimeline } from '@/components/v2/WhoFedWhoTimeline';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';

export default function TimelinePage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">📖 Activity Timeline</h1>
          <p className="text-ink-500 mt-1">Every feeding, walk, and medication — across all your cats, in one feed.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardBody>
            <WhoFedWhoTimeline />
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
