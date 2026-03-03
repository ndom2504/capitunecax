import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { type ComponentProps } from 'react';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, color, size }: { name: IoniconsName; color: string; size: number }) {
  return <Ionicons name={name} color={color} size={size} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopColor: 'rgba(255,255,255,0.08)',
          height: 62,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: Colors.tabBarActive,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => <TabIcon name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Documents',
          tabBarIcon: ({ color, size }) => <TabIcon name="folder" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="messagerie"
        options={{
          title: 'Messagerie',
          tabBarIcon: ({ color, size }) => <TabIcon name="chatbubbles" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="paiements"
        options={{
          title: 'Paiements',
          tabBarIcon: ({ color, size }) => <TabIcon name="card" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <TabIcon name="person-circle" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
