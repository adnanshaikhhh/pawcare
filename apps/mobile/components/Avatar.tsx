import { View, Text, Image } from 'react-native';
import { cn } from '@/lib/utils';

function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ src, name, size = 'md' }: { src?: string | null; name: string | null | undefined; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizeClasses = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-base', xl: 'h-20 w-20 text-xl' };
  return (
    <View className={cn('rounded-full overflow-hidden bg-gradient-to-br from-brand-light to-brand-primary/30 items-center justify-center', sizeClasses[size])}>
      {src ? (
        <Image source={{ uri: src }} className="h-full w-full" resizeMode="cover" />
      ) : (
        <Text className="font-semibold text-brand-primary">{initials(name)}</Text>
      )}
    </View>
  );
}
