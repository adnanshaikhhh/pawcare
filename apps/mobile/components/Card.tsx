import { View, Text, type ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

interface CardProps extends ViewProps {
  className?: string;
}

export function Card({ className, children, ...rest }: CardProps) {
  return (
    <View
      className={cn('bg-white rounded-2xl border border-ink-100 shadow-card', className)}
      {...rest}
    >
      {children}
    </View>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <Text className={cn('text-lg font-semibold text-ink-900', className)}>{children}</Text>;
}
