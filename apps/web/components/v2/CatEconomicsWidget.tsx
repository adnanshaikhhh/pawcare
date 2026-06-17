'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Target, Receipt, AlertCircle, Heart, Users, Calendar } from 'lucide-react';

interface Expense {
  id: string;
  category: string;
  amount_inr: number;
  purchase_date: string;
  pet_id?: string;
  pets?: { name: string };
}

export function CatEconomicsWidget() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/expenses')
      .then((r) => r.json())
      .then((j) => setExpenses(j.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="glass-card-light dark:glass-card p-6 h-32 skeleton" />;

  const now = new Date();
  const thisMonth = expenses.filter((e) => {
    const d = new Date(e.purchase_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const lastMonth = expenses.filter((e) => {
    const d = new Date(e.purchase_date);
    const lm = new Date(now);
    lm.setMonth(lm.getMonth() - 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
  });

  const thisTotal = thisMonth.reduce((s, e) => s + e.amount_inr, 0);
  const lastTotal = lastMonth.reduce((s, e) => s + e.amount_inr, 0);
  const trend = lastTotal > 0 ? ((thisTotal - lastTotal) / lastTotal) * 100 : 0;

  // Category breakdown
  const byCategory: Record<string, number> = {};
  thisMonth.forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount_inr;
  });
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card-light dark:glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-500 dark:text-dark-text-muted font-medium">This month</p>
          <p className="text-3xl font-display font-bold text-ink-900 dark:text-dark-text mt-1">
            ₹{thisTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="text-right">
          <div className={`flex items-center gap-1 text-sm ${trend > 0 ? 'text-red-500' : 'text-semantic-success'}`}>
            {trend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span className="font-mono">{Math.abs(trend).toFixed(0)}%</span>
          </div>
          <p className="text-xs text-ink-500 dark:text-dark-text-muted mt-1">vs last month</p>
        </div>
      </div>

      {topCategory && (
        <div className="pt-3 border-t border-ink-100 dark:border-dark-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-500 dark:text-dark-text-muted">Top category</span>
            <span className="font-medium text-ink-900 dark:text-dark-text">
              {topCategory[0]} · ₹{topCategory[1].toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      )}

      <Link href="/expenses" className="text-xs text-brand-primary mt-3 inline-block hover:underline">
        View all expenses →
      </Link>
    </motion.div>
  );
}
