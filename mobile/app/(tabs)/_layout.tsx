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
        contentStyle: { backgroundColor: Colors.primaryDark },
        tabBarStyle: {
          backgroundColor: Colors.dark,
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

      {/* ── Messages (tous) ── */}
      <Tabs.Screen
        name="messagerie"
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} />,
        }}
      />

      {/* ── Paiements (client seulement) ── */}
      <Tabs.Screen
        name="paiements"
        options={isPro
          ? { href: null }  // masqué pour les pros
          : {
              tabBarLabel: 'Paiements',
              tabBarIcon: ({ color, size }) => <Ionicons name="card" size={size} color={color} />,
            }
        }
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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.primaryDark },
        tabBarStyle: {
          backgroundColor: Colors.dark,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: Colors.orange,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="projet"
        options={{
          tabBarLabel: 'Mon Projet',
          tabBarIcon: ({ color, size }) => <Ionicons name="folder-open" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messagerie"
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="paiements"
        options={{
          tabBarLabel: 'Paiements',
          tabBarIcon: ({ color, size }) => <Ionicons name="card" size={size} color={color} />,
        }}
      />
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
