export const APP_NAME = 'PawCare';
export const APP_TAGLINE = 'Every pet. Every moment. Every detail.';
export const APP_DESCRIPTION =
  'Track health, get reminders, and never miss a vet visit for every cat and dog in your family.';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', emoji: '🏠' },
  { href: '/pets', label: 'My Pets', emoji: '🐾' },
  { href: '/symptoms', label: 'Symptom Checker', emoji: '🤖' },
  { href: '/emergency', label: 'Emergency Vet', emoji: '🚨' },
  { href: '/inventory', label: 'Inventory', emoji: '📦' },
  { href: '/reminders', label: 'Reminders', emoji: '⏰' },
  { href: '/family', label: 'Family', emoji: '👨‍👩‍👧' },
  { href: '/settings', label: 'Settings', emoji: '⚙️' },
] as const;
