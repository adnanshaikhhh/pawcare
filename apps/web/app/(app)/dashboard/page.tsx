'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePets } from '@/hooks/usePets';
import { useReminders } from '@/hooks/useInventory';
import { useInventory } from '@/hooks/useInventory';
import { useProfile } from '@/hooks/useFamily';
import { PetCard } from '@/components/pets/PetCard';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageTransition, Stagger, StaggerItem } from '@/components/ui/PageTransition';
import { Plus, Activity, Stethoscope, Pill as PillIcon, Bell, Sparkles, Truck, ChevronRight } from 'lucide-react';
import { formatRelativeDays } from '@/lib/utils';
import { formatInr } from '@/lib/shared';
import { differenceInDays, parseISO } from 'date-fns';
import { StoriesCarousel } from '@/components/v2/StoriesCarousel';
import { MoodWeatherCard } from '@/components/v2/MoodWeatherCard';
import { BehaviorAlertBanner } from '@/components/v2/BehaviorAlertBanner';
import { CatEconomicsWidget } from '@/components/v2/CatEconomicsWidget';

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { pets, isLoading: petsLoading } = usePets();
  const { reminders } = useReminders();
  const { items } = useInventory();
  const { profile } = useProfile();

  const lowStock = items.filter((i) => (i.estimated_days_remaining ?? 999) <= (i.alert_days_before ?? 2)).slice(0, 3);
  const upcoming = reminders.slice(0, 5);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">{timeOfDay()}{profile?.full_name ? `, ${profile.full_name}` : ''} 👋</h1>
          <p className="text-ink-500 mt-1">Here&apos;s how your family is doing today.</p>
        </div>

        {/* V2: Behavior Alert Banner — shows only if alerts exist */}
        <BehaviorAlertBanner />

        {/* V2: Stories Carousel — Instagram-style pet stories */}
        <StoriesCarousel stories={[]} />

        {/* V2: Mood Weather + Economics */}
        <div className="grid sm:grid-cols-2 gap-4">
          <MoodWeatherCard />
          <CatEconomicsWidget />
        </div>

        <Stagger className="grid sm:grid-cols-3 gap-4">
          <StaggerItem>
            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-ink-500">Total pets</p>
                    <p className="text-3xl font-display font-bold mt-1">{pets.length}</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-brand-light text-brand-primary flex items-center justify-center">🐾</div>
                </div>
              </CardBody>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-ink-500">Pending reminders</p>
                    <p className="text-3xl font-display font-bold mt-1">{reminders.length}</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-amber-50 text-semantic-warning flex items-center justify-center"><Bell className="h-5 w-5" /></div>
                </div>
              </CardBody>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-ink-500">Low stock items</p>
                    <p className="text-3xl font-display font-bold mt-1">{lowStock.length}</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-semantic-info flex items-center justify-center"><Truck className="h-5 w-5" /></div>
                </div>
              </CardBody>
            </Card>
          </StaggerItem>
        </Stagger>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Your pets</h2>
            <Link href="/pets/new">
              <Button size="sm" icon={<Plus className="h-4 w-4" />}>Add pet</Button>
            </Link>
          </div>
          {petsLoading ? (
            <p className="text-sm text-ink-500">Loading pets…</p>
          ) : pets.length === 0 ? (
            <Card>
              <CardBody>
                <EmptyState
                  emoji="🐾"
                  title="Add your first pet"
                  description="Start by adding a profile for one of your cats or dogs. Takes 2 minutes."
                  action={<Link href="/pets/new"><Button>Add a pet</Button></Link>}
                />
              </CardBody>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pets.map((p) => {
                const petReminders = reminders.filter((r) => r.pet_id === p.id);
                const next = petReminders[0];
                return (
                  <PetCard
                    key={p.id}
                    pet={p}
                    nextEvent={next ? { label: next.title, daysAway: differenceInDays(parseISO(next.due_date), new Date()) } : null}
                  />
                );
              })}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Quick actions</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link href="/symptoms">
              <Card hover className="p-4 text-center">
                <Activity className="h-6 w-6 mx-auto text-brand-primary" />
                <p className="text-sm font-medium mt-2">Check symptoms</p>
              </Card>
            </Link>
            <Link href="/emergency">
              <Card hover className="p-4 text-center">
                <Stethoscope className="h-6 w-6 mx-auto text-semantic-danger" />
                <p className="text-sm font-medium mt-2">Find vet</p>
              </Card>
            </Link>
            <Link href="/reminders">
              <Card hover className="p-4 text-center">
                <Bell className="h-6 w-6 mx-auto text-semantic-warning" />
                <p className="text-sm font-medium mt-2">Reminders</p>
              </Card>
            </Link>
            <Link href="/inventory">
              <Card hover className="p-4 text-center">
                <Truck className="h-6 w-6 mx-auto text-semantic-info" />
                <p className="text-sm font-medium mt-2">Inventory</p>
              </Card>
            </Link>
          </div>
        </section>

        {upcoming.length > 0 ? (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Sparkles className="h-5 w-5 text-brand-primary" /> Upcoming</h2>
              <Link href="/reminders" className="text-sm text-brand-primary font-medium hover:underline flex items-center">View all <ChevronRight className="h-4 w-4" /></Link>
            </div>
            <Card>
              <CardBody className="divide-y divide-ink-100 p-0">
                {upcoming.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 p-4">
                    <div className="h-9 w-9 rounded-full bg-brand-light text-brand-primary flex items-center justify-center text-sm">⏰</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink-900 truncate">{r.title}</p>
                      {r.description ? <p className="text-xs text-ink-500 truncate">{r.description}</p> : null}
                    </div>
                    <Pill variant={differenceInDays(parseISO(r.due_date), new Date()) <= 1 ? 'danger' : 'brand'}>
                      {formatRelativeDays(differenceInDays(parseISO(r.due_date), new Date()))}
                    </Pill>
                  </div>
                ))}
              </CardBody>
            </Card>
          </section>
        ) : null}

        {lowStock.length > 0 ? (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Truck className="h-5 w-5 text-semantic-warning" /> Low stock</h2>
              <Link href="/inventory" className="text-sm text-brand-primary font-medium hover:underline flex items-center">Manage <ChevronRight className="h-4 w-4" /></Link>
            </div>
            <Card>
              <CardBody className="divide-y divide-ink-100 p-0">
                {lowStock.map((i) => (
                  <div key={i.id} className="flex items-center gap-3 p-4">
                    <div className="h-9 w-9 rounded-full bg-amber-50 text-semantic-warning flex items-center justify-center">📦</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink-900 truncate">{i.item_name}</p>
                      <p className="text-xs text-ink-500">~{i.estimated_days_remaining ?? 0} day(s) left</p>
                    </div>
                    <Pill variant="warning">Order soon</Pill>
                  </div>
                ))}
              </CardBody>
            </Card>
          </section>
        ) : null}
      </div>
    </PageTransition>
  );
}
