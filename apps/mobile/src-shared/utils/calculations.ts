import { differenceInDays, differenceInMonths, differenceInYears, addDays, format } from 'date-fns';

/**
 * Calculate pet age as a human-readable string.
 */
export function calculateAge(dobIso: string | null): string {
  if (!dobIso) return 'Unknown age';
  const dob = new Date(dobIso);
  if (isNaN(dob.getTime())) return 'Unknown age';

  const now = new Date();
  const years = differenceInYears(now, dob);
  const months = differenceInMonths(now, dob) % 12;

  if (years === 0) {
    if (months === 0) {
      const days = differenceInDays(now, dob);
      return `${days} day${days === 1 ? '' : 's'} old`;
    }
    return `${months} month${months === 1 ? '' : 's'} old`;
  }
  return `${years} year${years === 1 ? '' : 's'} ${months} month${months === 1 ? '' : 's'} old`;
}

/**
 * Calculate age in months (numeric).
 */
export function ageInMonths(dobIso: string | null): number | null {
  if (!dobIso) return null;
  const dob = new Date(dobIso);
  if (isNaN(dob.getTime())) return null;
  return differenceInMonths(new Date(), dob);
}

/**
 * Predict next heat cycle based on species.
 * Cats: ~21 days cycle
 * Dogs: ~180 days cycle
 */
export function predictNextHeatCycle(
  startDateIso: string,
  species: 'cat' | 'dog' | 'other'
): { predicted: string; confidence: 'low' | 'medium' | 'high' } {
  const cycleLength = species === 'cat' ? 21 : species === 'dog' ? 180 : 60;
  const start = new Date(startDateIso);
  const predicted = addDays(start, cycleLength);
  return {
    predicted: predicted.toISOString(),
    confidence: species === 'cat' || species === 'dog' ? 'high' : 'low',
  };
}

/**
 * Calculate health score (0-100) based on overdue items.
 */
export function calculateHealthScore(args: {
  isVaccinationOverdue: boolean;
  isDewormingOverdue: boolean;
  isVetCheckOverdue: boolean;
  hasRecentMoodIssues: boolean;
  hasWeightIssue: boolean;
}): number {
  let score = 100;
  if (args.isVaccinationOverdue) score -= 25;
  if (args.isDewormingOverdue) score -= 15;
  if (args.isVetCheckOverdue) score -= 20;
  if (args.hasRecentMoodIssues) score -= 20;
  if (args.hasWeightIssue) score -= 20;
  return Math.max(0, Math.min(100, score));
}

export function healthScoreColor(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 80) return 'green';
  if (score >= 50) return 'yellow';
  return 'red';
}

export function healthScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 50) return 'Attention needed';
  return 'Overdue items';
}

/**
 * Calculate days remaining for an inventory item.
 */
export function calculateDaysRemaining(
  currentQuantity: number,
  minimumQuantity: number,
  lastPurchaseDateIso: string | null,
  estimatedRefillDays: number
): number {
  if (!lastPurchaseDateIso || currentQuantity <= 0) return 0;
  const daysSinceLastPurchase = differenceInDays(new Date(), new Date(lastPurchaseDateIso));
  if (daysSinceLastPurchase >= estimatedRefillDays) return 0;
  return Math.max(0, estimatedRefillDays - daysSinceLastPurchase);
}

/**
 * Generate a 6-character family invite code.
 */
export function generateFamilyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Format ISO date for display.
 */
export function formatDate(iso: string | null | undefined, fmt = 'PP'): string {
  if (!iso) return '—';
  try {
    return format(new Date(iso), fmt);
  } catch {
    return '—';
  }
}

/**
 * Currency formatter (INR).
 */
export function formatInr(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Days between two dates.
 */
export function daysBetween(fromIso: string, toIso: string): number {
  return differenceInDays(new Date(toIso), new Date(fromIso));
}

/**
 * Generate a 6-char invite code (legacy alias).
 */
export function generateInviteCode(): string {
  return generateFamilyCode();
}
