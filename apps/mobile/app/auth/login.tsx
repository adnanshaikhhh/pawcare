import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function login() {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Enter your email and password.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Sign in failed', error.message);
      return;
    }
    router.replace('/(tabs)');
  }

  return (
    <ScrollView className="flex-1 bg-canvas" contentContainerStyle={{ padding: 24, paddingTop: 80, justifyContent: 'center' }}>
      <View className="items-center mb-8">
        <View className="h-14 w-14 rounded-2xl gradient-brand items-center justify-center"><Text className="text-white text-2xl">🐾</Text></View>
        <Text className="text-3xl font-bold mt-3">PawCare</Text>
      </View>
      <Text className="text-2xl font-bold mb-1">Welcome back</Text>
      <Text className="text-ink-500 mb-6">Sign in to care for your pets.</Text>

      <Text className="text-sm font-medium text-ink-700 mb-1.5">Email</Text>
      <TextInput className="bg-white border border-ink-100 rounded-xl px-4 h-13 mb-3" value={email} onChangeText={setEmail} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" />
      <Text className="text-sm font-medium text-ink-700 mb-1.5">Password</Text>
      <TextInput className="bg-white border border-ink-100 rounded-xl px-4 h-13 mb-5" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />

      <Pressable onPress={login} disabled={loading} className="bg-brand-primary py-3.5 rounded-full items-center mb-4">
        {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-semibold">Sign in</Text>}
      </Pressable>

      <Text className="text-center text-sm text-ink-500">New to PawCare? <Link href="/auth/signup" className="text-brand-primary font-medium">Create an account</Link></Text>
    </ScrollView>
  );
}
