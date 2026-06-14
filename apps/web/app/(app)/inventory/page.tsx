'use client';

import { useState } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Pill } from '@/components/ui/Pill';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageTransition } from '@/components/ui/PageTransition';
import { INVENTORY_CATEGORIES, type InventoryCategory } from '@/lib/shared';
import { Plus, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function InventoryPage() {
  const { items, refresh } = useInventory();
  const [filter, setFilter] = useState<InventoryCategory | 'all'>('all');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ item_name: '', category: 'food_dry' as InventoryCategory, unit: 'kg', current_quantity: '', minimum_quantity: '' });
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!form.item_name) return;
    setSaving(true);
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_name: form.item_name,
        category: form.category,
        unit: form.unit,
        current_quantity: form.current_quantity ? Number(form.current_quantity) : null,
        minimum_quantity: form.minimum_quantity ? Number(form.minimum_quantity) : null,
      }),
    });
    setSaving(false);
    if (res.ok) { setForm({ item_name: '', category: 'food_dry', unit: 'kg', current_quantity: '', minimum_quantity: '' }); setAdding(false); toast.success('Item added'); refresh(); }
  }

  async function logPurchase(itemId: string) {
    const qty = prompt('Quantity purchased?');
    if (!qty) return;
    const cost = prompt('Cost in ₹?');
    await fetch('/api/inventory-purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: itemId, purchase_date: new Date().toISOString().split('T')[0], quantity: Number(qty), cost_inr: cost ? Number(cost) : null }),
    });
    toast.success('Purchase logged');
    refresh();
  }

  const filtered = filter === 'all' ? items : items.filter((i) => i.category === filter);

  const total = items.reduce((acc, i) => acc + (i.last_purchased_cost_inr ?? 0), 0);

  return (
    <PageTransition>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-display font-bold">Inventory</h1>
            <p className="text-ink-500 mt-1">Track food, litter, medicine, and supplies</p>
          </div>
          <Button onClick={() => setAdding(!adding)} icon={<Plus className="h-4 w-4" />}>{adding ? 'Cancel' : 'Add item'}</Button>
        </div>

        <Card>
          <CardBody>
            <p className="text-xs text-ink-500">Total spend (last purchase tracked)</p>
            <p className="text-2xl font-bold mt-1">₹{total.toLocaleString('en-IN')}</p>
          </CardBody>
        </Card>

        {adding ? (
          <Card>
            <CardHeader><CardTitle>Add new item</CardTitle></CardHeader>
            <CardBody>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Input label="Item name" value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} placeholder="e.g. Royal Canin Adult" />
                <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as InventoryCategory })}>
                  {INVENTORY_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>)}
                </Select>
                <Select label="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                  <option value="kg">kg</option>
                  <option value="g">grams</option>
                  <option value="packs">packs</option>
                  <option value="liters">liters</option>
                  <option value="pieces">pieces</option>
                  <option value="bags">bags</option>
                </Select>
                <Input label="Current qty" type="number" value={form.current_quantity} onChange={(e) => setForm({ ...form, current_quantity: e.target.value })} />
                <Input label="Min qty (alert below)" type="number" value={form.minimum_quantity} onChange={(e) => setForm({ ...form, minimum_quantity: e.target.value })} />
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={add} loading={saving}>Save item</Button>
              </div>
            </CardBody>
          </Card>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilter('all')} className={cn('px-3 py-1.5 rounded-full text-sm border', filter === 'all' ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white border-ink-100')}>
            All
          </button>
          {INVENTORY_CATEGORIES.map((c) => (
            <button key={c.key} onClick={() => setFilter(c.key)} className={cn('px-3 py-1.5 rounded-full text-sm border', filter === c.key ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white border-ink-100')}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <Card><CardBody><EmptyState emoji="📦" title="No items yet" /></CardBody></Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((i) => {
              const days = i.estimated_days_remaining ?? 0;
              const isLow = days <= (i.alert_days_before ?? 2);
              const isOut = days <= 0;
              const cat = INVENTORY_CATEGORIES.find((c) => c.key === i.category);
              return (
                <Card key={i.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xl">{cat?.emoji}</p>
                      <p className="font-semibold mt-1">{i.item_name}</p>
                      {i.brand ? <p className="text-xs text-ink-500">{i.brand}</p> : null}
                    </div>
                    {isOut ? <Pill variant="danger">Out</Pill> : isLow ? <Pill variant="warning">Low</Pill> : <Pill variant="success">OK</Pill>}
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-canvas-sunken overflow-hidden">
                    <div className={cn('h-full', isOut ? 'bg-semantic-danger' : isLow ? 'bg-semantic-warning' : 'bg-semantic-success')} style={{ width: `${Math.min(100, Math.max(0, (days / 30) * 100))}%` }} />
                  </div>
                  <p className="text-xs text-ink-500 mt-1">~{days} day(s) remaining</p>
                  <div className="mt-3 flex justify-between items-center">
                    <p className="text-xs text-ink-500">{i.current_quantity ?? '—'} {i.unit}</p>
                    <Button size="sm" variant="ghost" onClick={() => logPurchase(i.id)} icon={<ShoppingCart className="h-3.5 w-3.5" />}>Bought</Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
