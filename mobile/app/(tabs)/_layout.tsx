import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';

export default function TabsLayout() {
  const { user, isLoading } = useAuth();

  if (!isLoading && !user) {
    return <Redirect href="/(auth)/connexion" />;
  }

  const isPro = user?.account_type === 'pro';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopColor: isPro ? Colors.primary : Colors.border,
          borderTopWidth: isPro ? 2 : 1,
          height: 62,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: isPro ? Colors.primary : Colors.orange,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      {/* ── 1. Dashboard ── */}
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />

      {/* ── 2. Projet ── */}
      <Tabs.Screen
        name="projet"
        options={{
          tabBarLabel: 'Projet',
          tabBarIcon: ({ color, size }) => <Ionicons name="folder-open" size={size} color={color} />,
        }}
      />

      {/* ── 3. Inside (Communauté CAPITUNE) ── */}
      <Tabs.Screen
        name="inside"
        options={{
          tabBarLabel: 'Inside',
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles" size={size} color={color} />,
        }}
      />

      {/* ── 4. Documents ── */}
      <Tabs.Screen
        name="documents"
        options={{
          tabBarLabel: 'Documents',
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text" size={size} color={color} />,
        }}
      />

      {/* ── 5. Profil ── */}
      <Tabs.Screen
        name="profil"
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />

      {/* ── Routes masquées (accessibles via deep-link/navigation interne) ── */}
      <Tabs.Screen name="messagerie" options={{ href: null }} />
      <Tabs.Screen name="conseillers" options={{ href: null }} />
      <Tabs.Screen name="paiements" options={{ href: null }} />
      <Tabs.Screen name="carriere" options={{ href: null }} />
    </Tabs>
  );
}
