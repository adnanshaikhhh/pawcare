import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme, View } from 'react-native';
import { configureNotifications } from '@/lib/notifications';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    configureNotifications();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#0C0C0F' : '#F7F7F9' }}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: isDark ? '#0C0C0F' : '#F7F7F9',
          },
          headerTintColor: isDark ? '#F2F2F7' : '#1A1A1E',
          headerTitleStyle: { fontFamily: 'Plus Jakarta Sans', fontWeight: '700' },
          contentStyle: {
            backgroundColor: isDark ? '#0C0C0F' : '#F7F7F9',
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ title: 'Sign in', headerShown: false }} />
        <Stack.Screen name="auth/signup" options={{ title: 'Create account', headerShown: false }} />
        <Stack.Screen name="pet/[id]" options={{ title: 'Pet' }} />
        <Stack.Screen name="pet/new" options={{ title: 'Add pet' }} />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </View>
  );
}