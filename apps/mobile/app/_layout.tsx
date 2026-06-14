import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { configureNotifications } from '@/lib/notifications';

export default function RootLayout() {
  useEffect(() => {
    configureNotifications();
  }, []);

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#FAFAFA' },
          headerTintColor: '#1C1C1E',
          headerTitleStyle: { fontFamily: 'Plus Jakarta Sans', fontWeight: '700' },
          contentStyle: { backgroundColor: '#FAFAFA' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ title: 'Sign in', headerShown: false }} />
        <Stack.Screen name="auth/signup" options={{ title: 'Create account', headerShown: false }} />
        <Stack.Screen name="pet/[id]" options={{ title: 'Pet' }} />
        <Stack.Screen name="pet/new" options={{ title: 'Add pet' }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
