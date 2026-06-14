import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signup() {
    if (!name || !email || password.length < 6) {
      Alert.alert('Check your details', 'Name, email and 6+ char password are required.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } },
    });
    setLoading(false);
    if (error) { Alert.alert('Signup failed', error.message); return; }
    Alert.alert('Account created', 'Check your email to verify, then sign in.');
    router.replace('/auth/login');
  }

  return (
    <ScrollView className="flex-1 bg-canvas" contentContainerStyle={{ padding: 24, paddingTop: 80 }}>
      <View className="items-center mb-8">
        <View className="h-14 w-14 rounded-2xl gradient-brand items-center justify-center"><Text className="text-white text-2xl">🐾</Text></View>
        <Text className="text-3xl font-bold mt-3">PawCare</Text>
      </View>
      <Text className="text-2xl font-bold mb-1">Create your account</Text>
      <Text className="text-ink-500 mb-6">Free forever.</Text>

      <Text className="text-sm font-medium text-ink-700 mb-1.5">Your name</Text>
      <TextInput className="bg-white border border-ink-100 rounded-xl px-4 h-13 mb-3" value={name} onChangeText={setName} placeholder="e.g. Priya" />
      <Text className="text-sm font-medium text-ink-700 mb-1.5">Email</Text>
      <TextInput className="bg-white border border-ink-100 rounded-xl px-4 h-13 mb-3" value={email} onChangeText={setEmail} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" />
      <Text className="text-sm font-medium text-ink-700 mb-1.5">Password</Text>
      <TextInput className="bg-white border border-ink-100 rounded-xl px-4 h-13 mb-5" value={password} onChangeText={setPassword} placeholder="At least 6 characters" secureTextEntry />

      <Pressable onPress={signup} disabled={loading} className="bg-brand-primary py-3.5 rounded-full items-center mb-4">
        {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-semibold">Create account</Text>}
      </Pressable>

      <Text className="text-center text-sm text-ink-500">Already have an account? <Link href="/auth/login" className="text-brand-primary font-medium">Sign in</Link></Text>
    </ScrollView>
  );
}
