import { Tabs } from 'expo-router';
import { Home, PawPrint, AlertTriangle, Package, Settings as Cog, Sparkles } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#AEAEB2',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: '#E8E8ED',
          height: 60,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: '#FAFAFA' },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <Home color={color} size={22} /> }} />
      <Tabs.Screen name="pets" options={{ title: 'Pets', tabBarIcon: ({ color }) => <PawPrint color={color} size={22} /> }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights', tabBarIcon: ({ color }) => <Sparkles color={color} size={22} /> }} />
      <Tabs.Screen name="emergency" options={{ title: 'SOS', tabBarIcon: ({ color }) => <AlertTriangle color={color} size={22} /> }} />
      <Tabs.Screen name="inventory" options={{ title: 'Stock', tabBarIcon: ({ color }) => <Package color={color} size={22} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Me', tabBarIcon: ({ color }) => <Cog color={color} size={22} /> }} />
    </Tabs>
  );
}
