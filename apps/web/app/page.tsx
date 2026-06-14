import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Activity, Users, Stethoscope, Bell, FileText, Truck } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl gradient-brand flex items-center justify-center text-white text-lg">🐾</div>
          <span className="font-display font-bold text-xl">PawCare</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/auth/login"><Button variant="ghost">Sign in</Button></Link>
          <Link href="/auth/signup"><Button>Get Started Free</Button></Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-12 pb-24">
        <section className="text-center max-w-3xl mx-auto">
          <span className="inline-block px-3 py-1 rounded-full bg-brand-light text-brand-primary text-xs font-medium mb-5">
            🐾 Built for multi-pet families
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold tracking-tight text-ink-900">
            All your pets.<br />
            <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">All their care.</span>
          </h1>
          <p className="mt-5 text-lg text-ink-500 max-w-2xl mx-auto">
            Track health, get reminders, and never miss a vet visit for every cat and dog in your family. Free, private, and shared with the people who help you care.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Link href="/auth/signup"><Button size="lg">Get started free</Button></Link>
            <Link href="#features"><Button size="lg" variant="secondary">See features</Button></Link>
          </div>
          <p className="mt-3 text-xs text-ink-500">No credit card · Works on web, iOS & Android</p>
        </section>

        <section className="mt-20 grid sm:grid-cols-2 lg:grid-cols-3 gap-4" id="features">
          {FEATURES.map((f) => (
            <Card key={f.title} className="p-6">
              <div className="h-10 w-10 rounded-xl bg-brand-light text-brand-primary flex items-center justify-center mb-3">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-ink-900">{f.title}</h3>
              <p className="text-sm text-ink-500 mt-1">{f.desc}</p>
            </Card>
          ))}
        </section>

        <section className="mt-20 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-display font-bold">How it works</h2>
          <div className="mt-8 grid sm:grid-cols-3 gap-4 text-left">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-2xl bg-white p-5 border border-ink-100">
                <div className="h-7 w-7 rounded-full bg-brand-primary text-white text-sm font-semibold flex items-center justify-center">{i + 1}</div>
                <h3 className="font-semibold mt-3">{s.title}</h3>
                <p className="text-sm text-ink-500 mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 rounded-3xl gradient-brand text-white p-10 text-center">
          <h2 className="text-3xl font-display font-bold">Ready to give your pets the care they deserve?</h2>
          <p className="mt-2 text-white/90">Set up takes 2 minutes. Free forever.</p>
          <Link href="/auth/signup" className="inline-block mt-6">
            <Button size="lg" variant="secondary" className="bg-white text-brand-primary hover:bg-white">Create your PawCare account</Button>
          </Link>
        </section>
      </main>

      <footer className="border-t border-ink-100 py-8 text-center text-sm text-ink-500">
        <p>© {new Date().getFullYear()} PawCare. Made with 🐾 for pet families.</p>
      </footer>
    </div>
  );
}

const FEATURES = [
  { icon: Activity, title: 'AI symptom checker', desc: 'Describe what you notice — get an instant urgency assessment and care tips.' },
  { icon: Stethoscope, title: 'Emergency vet finder', desc: 'One tap to find 24/7 vets near you with phone, address, and directions.' },
  { icon: Bell, title: 'Smart reminders', desc: 'Vaccines, deworming, medications, heat cycles — never miss a due date.' },
  { icon: Users, title: 'Family sharing', desc: 'Invite your partner with one code. Everyone sees the same pets and logs.' },
  { icon: FileText, title: 'Medical records', desc: 'Vet visits, vaccinations, weight, mood — all in one searchable history.' },
  { icon: Truck, title: 'Inventory tracker', desc: 'Cat litter, food, treats — get alerts before you run out.' },
];

const STEPS = [
  { title: 'Add your pets', desc: 'Name, species, breed, age, photo. Two minutes each.' },
  { title: 'Log & track', desc: 'Vet visits, vaccines, weight, mood. We auto-create reminders.' },
  { title: 'Share & relax', desc: 'Invite family. They help log, and everyone stays in sync.' },
];
