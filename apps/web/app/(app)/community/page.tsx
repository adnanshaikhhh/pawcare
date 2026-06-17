'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { PageTransition } from '@/components/ui/PageTransition';
import { Plus, X, MapPin, User as UserIcon, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

type Post = {
  id: string;
  title: string;
  body?: string | null;
  category?: string | null;
  city?: string | null;
  created_at: string;
  author_id?: string;
  profiles?: { full_name?: string; avatar_url?: string } | null;
  pets?: { name?: string } | null;
};

const CATEGORIES = [
  { value: 'question', label: 'Question', emoji: '❓', variant: 'info' as const },
  { value: 'story', label: 'Story', emoji: '📖', variant: 'brand' as const },
  { value: 'advice', label: 'Advice', emoji: '💡', variant: 'success' as const },
  { value: 'lost_found', label: 'Lost & found', emoji: '🔍', variant: 'warning' as const },
];

function categoryMeta(value?: string | null) {
  return CATEGORIES.find((c) => c.value === value) ?? { value: value ?? '', label: value ?? 'Post', emoji: '📝', variant: 'neutral' as const };
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');
  const [activeCity, setActiveCity] = useState('');
  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', category: 'story', city: '' });
  const [saving, setSaving] = useState(false);

  async function load(cityFilter?: string) {
    setLoading(true);
    try {
      const url = cityFilter ? `/api/community?city=${encodeURIComponent(cityFilter)}` : '/api/community';
      const res = await fetch(url, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to load');
      setPosts(json.data ?? []);
    } catch (e: any) {
      toast.error(e.message ?? 'Could not load posts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function applyFilter() {
    setActiveCity(city.trim());
    load(city.trim());
  }

  function clearFilter() {
    setCity('');
    setActiveCity('');
    load();
  }

  async function submit() {
    if (form.title.trim().length < 5) {
      toast.error('Title must be at least 5 characters');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: form.title.trim(),
          body: form.body.trim() || undefined,
          category: form.category,
          city: form.city.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to post');
      setForm({ title: '', body: '', category: 'story', city: '' });
      setComposing(false);
      toast.success('Post published');
      load(activeCity);
    } catch (e: any) {
      toast.error(e.message ?? 'Could not publish post');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <PageTransition>
        <div className="space-y-6">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-display font-bold">🌍 Community</h1>
              <p className="text-ink-500 mt-1">Stories, questions, and lost/found posts from pet parents</p>
            </div>
            <Button onClick={() => setComposing((v) => !v)} icon={composing ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}>
              {composing ? 'Cancel' : 'New post'}
            </Button>
          </div>

          {composing ? (
            <Card>
              <CardHeader><CardTitle>New post</CardTitle></CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <Input
                    label="Title"
                    placeholder="e.g. Found a friendly stray near Indiranagar"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    maxLength={200}
                  />
                  <Textarea
                    label="Body"
                    placeholder="Share details, photos, or questions…"
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    maxLength={2000}
                  />
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                      ))}
                    </Select>
                    <Input
                      label="City"
                      placeholder="e.g. Bengaluru"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={submit} loading={saving}>Publish</Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardBody>
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex-1">
                  <Input
                    label="Filter by city"
                    placeholder="e.g. Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') applyFilter(); }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={applyFilter}>Apply</Button>
                  {activeCity ? <Button variant="ghost" onClick={clearFilter}>Clear</Button> : null}
                </div>
              </div>
              {activeCity ? (
                <p className="mt-2 text-xs text-ink-500">Showing posts matching “{activeCity}”.</p>
              ) : null}
            </CardBody>
          </Card>

          {loading ? (
            <p className="text-sm text-ink-500">Loading…</p>
          ) : posts.length === 0 ? (
            <Card>
              <CardBody>
                <EmptyState
                  emoji="🌍"
                  title="No posts yet"
                  description="Be the first to share a story, ask a question, or post a lost/found notice."
                  action={<Button onClick={() => setComposing(true)} icon={<Plus className="h-4 w-4" />}>New post</Button>}
                />
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-3">
              {posts.map((p) => {
                const cat = categoryMeta(p.category);
                return (
                  <Card key={p.id}>
                    <CardBody>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Pill variant={cat.variant}>
                            <span aria-hidden>{cat.emoji}</span>
                            {cat.label}
                          </Pill>
                          {p.city ? (
                            <Pill variant="neutral">
                              <MapPin className="h-3 w-3" />
                              {p.city}
                            </Pill>
                          ) : null}
                          <Pill variant="neutral">
                            <Clock className="h-3 w-3" />
                            {new Date(p.created_at).toLocaleString()}
                          </Pill>
                        </div>
                        <h2 className="text-lg font-semibold text-ink-900">{p.title}</h2>
                        {p.body ? <p className="text-sm text-ink-700 whitespace-pre-wrap">{p.body}</p> : null}
                        <div className="flex items-center gap-1.5 text-xs text-ink-500">
                          <UserIcon className="h-3 w-3" />
                          <span>{p.profiles?.full_name ?? 'Anonymous'}</span>
                          {p.pets?.name ? <span>· 🐾 {p.pets.name}</span> : null}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </PageTransition>
    </AppShell>
  );
}
