// Tailwind doesn't have these class names in the standard set; we map to colors.
export const COLORS = {
  brandPrimary: '#FF6B6B',
  brandSecondary: '#FF8E53',
  brandLight: '#FFF0EE',
  success: '#34C759',
  warning: '#FF9F0A',
  danger: '#FF3B30',
  info: '#007AFF',
  textPrimary: '#1C1C1E',
  textSecondary: '#6E6E73',
  textMuted: '#AEAEB2',
  bgPrimary: '#FAFAFA',
  bgCard: '#FFFFFF',
  border: '#E8E8ED',
};

export function cn(...inputs: (string | false | null | undefined | 0)[]): string {
  return inputs.filter(Boolean).join(' ');
}
