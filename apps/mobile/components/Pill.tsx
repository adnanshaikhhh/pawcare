import { View, Text } from 'react-native';
import { cn } from '@/lib/utils';

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'neutral';
const variants: Record<Variant, string> = {
  success: 'bg-green-50 text-semantic-success',
  warning: 'bg-amber-50 text-semantic-warning',
  danger: 'bg-red-50 text-semantic-danger',
  info: 'bg-blue-50 text-semantic-info',
  brand: 'bg-brand-light text-brand-primary',
  neutral: 'bg-canvas-sunken text-ink-700',
};

export function Pill({ children, variant = 'neutral', className }: { children: React.ReactNode; variant?: Variant; className?: string }) {
  return (
    <View className={cn('self-start px-2.5 py-1 rounded-full', variants[variant], className)}>
      <Text className={cn('text-xs font-medium', variants[variant].split(' ')[1])}>{children}</Text>
    </View>
  );
}
