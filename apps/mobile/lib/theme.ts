/**
 * PawCare Design System — single source of truth for spacing, radii,
 * shadows, typography sizes. Imported wherever a screen needs a token.
 *
 * Color tokens live in tailwind.config.js (NativeWind reads them).
 * These constants are for style props (StyleSheet) and inline use.
 */

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const RADIUS = {
  card: 20,
  button: 14,
  pill: 9999,
  avatar: 9999,
  input: 12,
  modal: 24,
} as const;

export const FONT_SIZE = {
  hero: 32,
  title: 24,
  heading: 20,
  subheading: 17,
  body: 15,
  caption: 13,
  micro: 11,
} as const;

export const FONT_WEIGHT = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const TAB_BAR_HEIGHT = 83;

export const COLORS = {
  // Light
  light: {
    bgPrimary: '#F7F7F9',
    bgCard: '#FFFFFF',
    bgCardSubtle: '#F2F2F7',
    brand: '#FF6B6B',
    brandLight: '#FFF0EE',
    brandDark: '#E85555',
    textPrimary: '#1A1A1E',
    textSecondary: '#6E6E73',
    textMuted: '#AEAEB2',
    success: '#34C759',
    warning: '#FF9F0A',
    danger: '#FF3B30',
    border: 'rgba(0,0,0,0.08)',
    shadow: 'rgba(0,0,0,0.06)',
  },
  // Dark
  dark: {
    bgPrimary: '#0C0C0F',
    bgCard: '#1C1C1E',
    bgCardSubtle: '#2C2C2E',
    brand: '#FF6B6B',
    brandLight: 'rgba(255,107,107,0.15)',
    textPrimary: '#F2F2F7',
    textSecondary: '#8E8E93',
    textMuted: '#48484A',
    success: '#34C759',
    warning: '#FF9F0A',
    danger: '#FF3B30',
    border: 'rgba(255,255,255,0.08)',
    shadow: 'rgba(0,0,0,0.3)',
  },
} as const;

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 6,
  },
} as const;

export function timeBasedGreeting(date: Date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning ☀️';
  if (h < 17) return 'Good afternoon 👋';
  return 'Good evening 🌙';
}

export function greetingSubtext(petCount: number): string {
  if (petCount === 0) return "Let's add your first pet to get started.";
  if (petCount === 1) return "Here's how your family is doing.";
  return `Here's how your ${petCount} pets are doing.`;
}