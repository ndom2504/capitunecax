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
        tabBarActiveTintColor: isPro ? '#3b9eff' : Colors.orange,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      {/* ── Onglet Accueil (tous) ── */}
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarLabel: isPro ? 'Tableau' : 'Accueil',
          tabBarIcon: ({ color, size }) => <Ionicons name={isPro ? 'grid' : 'home'} size={size} color={color} />,
        }}
      />

      {/* ── Mon Projet (client seulement) ── */}
      <Tabs.Screen
        name="projet"
        options={isPro
          ? { href: null }  // masqué pour les pros
          : {
              tabBarLabel: 'Mon Projet',
              tabBarIcon: ({ color, size }) => <Ionicons name="folder-open" size={size} color={color} />,
            }
        }
      />

      {/* ── Inside (communauté) (tous) ── */}
      <Tabs.Screen
        name="inside"
        options={isPro
          ? { href: null }
          : {
              tabBarLabel: 'Inside',
              tabBarIcon: ({ color, size }) => <Ionicons name="sparkles" size={size} color={color} />,
            }
        }
      />

      {/* ── Anciennes routes masquées (compat deep-link) ── */}
      <Tabs.Screen name="paiements" options={{ href: null }} />
      <Tabs.Screen name="messagerie" options={{ href: null }} />

      {/* ── Route cachée : Trouver un conseiller ── */}
      <Tabs.Screen name="conseillers" options={{ href: null }} />

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
