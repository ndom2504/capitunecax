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
      {/* ── Onglet Accueil (tous) ── */}
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />

      {/* ── Projet (tous) ── */}
      <Tabs.Screen
        name="projet"
        options={{
          tabBarLabel: isPro ? 'Projet' : 'Mon Projet',
          tabBarIcon: ({ color, size }) => <Ionicons name="folder-open" size={size} color={color} />,
        }}
      />

      {/* ── Messagerie ── */}
      <Tabs.Screen
        name="messagerie"
        options={{
          tabBarLabel: 'Messagerie',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses" size={size} color={color} />,
        }}
      />

      {/* ── Inside (communauté) — client seulement, absent du web pro ── */}
      <Tabs.Screen
        name="inside"
        options={isPro ? { href: null } : {
          tabBarLabel: 'Inside',
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles" size={size} color={color} />,
        }}
      />

      {/* ── Route masquée (compat deep-link) ── */}
      <Tabs.Screen name="paiements" options={{ href: null }} />

      {/* ── Notre Équipe (pro) / Conseillers (client) — aligné sur le web ── */}
      <Tabs.Screen
        name="conseillers"
        options={{
          tabBarLabel: isPro ? 'Équipe' : 'Conseillers',
          tabBarIcon: ({ color, size }) => <Ionicons name={isPro ? 'people' : 'person-add'} size={size} color={color} />,
        }}
      />

      {/* ── Documents (tous) ── */}
      <Tabs.Screen
        name="documents"
        options={{
          tabBarLabel: 'Documents',
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text" size={size} color={color} />,
        }}
      />

      {/* ── Profil (tous) ── */}
      <Tabs.Screen
        name="profil"
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
