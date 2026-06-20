import { Tabs } from 'expo-router';
import { useColorScheme, View, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { Home, PawPrint, Sparkles, Package, User } from 'lucide-react-native';
import { light as hLight } from '@/lib/haptics';

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: isDark ? '#8E8E93' : '#AEAEB2',
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 83,
          paddingTop: 8,
          paddingBottom: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={isDark ? 60 : 80}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
        tabBarItemStyle: { paddingVertical: 4 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            focused ? <Pressable onPress={() => hLight()}><Home color={color} size={24} fill={color} /></Pressable> : <Home color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="pets"
        options={{
          title: 'Pets',
          tabBarIcon: ({ color, focused }) => (
            focused ? <Pressable onPress={() => hLight()}><PawPrint color={color} size={24} fill={color} /></Pressable> : <PawPrint color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, focused }) => (
            focused ? <Pressable onPress={() => hLight()}><Sparkles color={color} size={24} fill={color} /></Pressable> : <Sparkles color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Stock',
          tabBarIcon: ({ color, focused }) => (
            focused ? <Pressable onPress={() => hLight()}><Package color={color} size={24} fill={color} /></Pressable> : <Package color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Me',
          tabBarIcon: ({ color, focused }) => (
            focused ? <Pressable onPress={() => hLight()}><User color={color} size={24} fill={color} /></Pressable> : <User color={color} size={24} />
          ),
        }}
      />
      {/* SOS removed — now lives as a prominent card on Home */}
    </Tabs>
  );
}