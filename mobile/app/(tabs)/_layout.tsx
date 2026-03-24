import { Tabs, Redirect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useState } from 'react';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import CreatePostModal from '../../components/CreatePostModal';

// Composant BottomBar personnalisé
function BottomBar() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();

  const handlePublish = async (content: string, tags?: string, media?: any[], location?: any, link?: string) => {
    // TODO: Connecter à l'API admin avec les médias, localisation et lien
    console.log('Nouveau post:', { content, tags, media, location, link, author: user?.name });
    setShowModal(false);
    setActiveTab('inside');
    router.push('/(tabs)/inside');
  };
  
  return (
    <View style={bottomBarStyles.container}>
      
      {/* Bottom Bar */}
      <View style={bottomBarStyles.bottomBar}>
        <TouchableOpacity 
          onPress={() => {
            setActiveTab('dashboard');
            router.push('/(tabs)/dashboard');
          }}
        >
          <Ionicons 
            name="home" 
            size={24} 
            color={activeTab === 'dashboard' ? Colors.orange : '#9CA3AF'} 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => {
            setActiveTab('projet');
            router.push('/(tabs)/projet');
          }}
        >
          <Ionicons 
            name="grid-outline" 
            size={24} 
            color={activeTab === 'projet' ? Colors.orange : '#9CA3AF'} 
          />
        </TouchableOpacity>

        {/* espace pour le bouton */}
        <View style={{ width: 60 }} />

        <TouchableOpacity 
          onPress={() => {
            setActiveTab('documents');
            router.push('/(tabs)/documents');
          }}
        >
          <Ionicons 
            name="folder" 
            size={24} 
            color={activeTab === 'documents' ? Colors.orange : '#9CA3AF'} 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => {
            setActiveTab('profil');
            router.push('/(tabs)/profil');
          }}
        >
          <Ionicons 
            name="person-outline" 
            size={24} 
            color={activeTab === 'profil' ? Colors.orange : '#9CA3AF'} 
          />
        </TouchableOpacity>
      </View>

      {/* Bouton + */}
      <TouchableOpacity 
        style={bottomBarStyles.fab}
        onPress={() => setOpen(!open)}
      >
        <Text style={{ color: '#fff', fontSize: 26, transform: [{ rotate: open ? '45deg' : '0deg' }] }}>+</Text>
      </TouchableOpacity>

      {/* Menu flottant */}
      {open && (
        <View style={bottomBarStyles.floatingMenu}>
          <TouchableOpacity
            style={bottomBarStyles.publishBtn}
            onPress={() => {
              setOpen(false);
              setShowModal(true);
            }}
          >
            <Text style={{ color: '#fff' }}>Publier</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={bottomBarStyles.insideBtn}
            onPress={() => {
              setOpen(false);
              setActiveTab('inside');
              router.push('/(tabs)/inside');
            }}
          >
            <Text style={{ color: '#fff' }}>Inside</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de publication */}
      <CreatePostModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handlePublish}
        user={user}
      />

    </View>
  );
}

const bottomBarStyles = StyleSheet.create({
  container: {
    position: 'relative',
  },

  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 70,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    elevation: 10,
  },

  fab: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 35, // 🔥 clé pour le centrer
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },

  // Styles du menu flottant
  floatingMenu: {
    position: 'absolute',
    bottom: 110,
    alignSelf: 'center',
    alignItems: 'center',
  },

  publishBtn: {
    backgroundColor: '#143FA8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 5,
    marginBottom: 10,
  },

  insideBtn: {
    backgroundColor: '#F97316',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 5,
  },

  // Styles de la modal
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    height: 120,
  },

  publishMainBtn: {
    backgroundColor: '#143FA8',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
});

export default function TabsLayout() {
  const { user, isLoading } = useAuth();

  if (!isLoading && !user) {
    return <Redirect href="/(auth)/connexion" />;
  }

  const isPro = user?.account_type === 'pro';

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none', height: 0 }, // Cacher complètement la barre par défaut
        }}
      >
        {/* ── 1. Dashboard ── */}
        <Tabs.Screen
          name="dashboard"
          options={{
            href: isPro ? '/(tabs)/dashboard' : null,
          }}
        />

        {/* ── 2. Projet ── */}
        <Tabs.Screen
          name="projet"
          options={{
            href: null,
          }}
        />

        {/* ── 3. Inside (Communauté CAPITUNE) ── */}
        <Tabs.Screen
          name="inside"
          options={{
            href: '/(tabs)/inside',
          }}
        />

        {/* ── 4. Documents ── */}
        <Tabs.Screen
          name="documents"
          options={{
            href: '/(tabs)/documents',
          }}
        />

        {/* ── 5. Profil ── */}
        <Tabs.Screen
          name="profil"
          options={{
            href: '/(tabs)/profil',
          }}
        />

        {/* ── 6. Rendez-vous ── */}
        <Tabs.Screen
          name="rendezvous"
          options={{
            href: null,
          }}
        />

        {/* ── 7. Rapport Mensuel ── */}
        <Tabs.Screen
          name="rapport-mensuel"
          options={{
            href: null,
          }}
        />

        {/* ── Routes masquées (accessibles via deep-link/navigation interne) ── */}
        <Tabs.Screen name="messagerie" options={{ href: null }} />
        <Tabs.Screen name="conseillers" options={{ href: null }} />
        <Tabs.Screen name="paiements" options={{ href: null }} />
        <Tabs.Screen name="carriere" options={{ href: null }} />
      </Tabs>

      {/* BottomBar personnalisée */}
      <BottomBar />
    </View>
  );
}
