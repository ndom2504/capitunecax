import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, Switch, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';

export default function ProfilScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [notifEnabled, setNotifEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter', style: 'destructive',
          onPress: async () => { await logout(); },
        },
      ],
    );
  };

  const MenuItem = ({
    icon, label, value, onPress, danger = false, right,
  }: {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    value?: string;
    onPress?: () => void;
    danger?: boolean;
    right?: React.ReactNode;
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Ionicons name={icon} size={18} color={danger ? Colors.error : Colors.primary} />
      </View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      {value && <Text style={styles.menuValue}>{value}</Text>}
      {right ?? (onPress && !right && (
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      ))}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Avatar + nom */}
        <View style={styles.profileBlock}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{(user?.name ?? 'U')[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user?.name ?? '—'}</Text>
          <Text style={styles.email}>{user?.email ?? '—'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user?.account_type === 'pro' ? '💼 Professionnel' : '👤 Client'}
            </Text>
          </View>
        </View>

        {/* Section : Compte */}
        <Text style={styles.sectionTitle}>Mon compte</Text>
        <View style={styles.card}>
          <MenuItem icon="person" label="Modifier mes informations" onPress={() => Alert.alert('À venir', 'Modification du profil bientôt disponible.')} />
          <View style={styles.divider} />
          <MenuItem icon="lock-closed" label="Changer le mot de passe" onPress={() => Alert.alert('À venir', 'Modification du mot de passe bientôt disponible.')} />
          <View style={styles.divider} />
          <MenuItem icon="phone-portrait" label="Biométrie" value="Face ID / Empreinte" onPress={() => Alert.alert('À venir', 'Biométrie bientôt disponible.')} />
        </View>

        {/* Section : Notifications */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          <MenuItem
            icon="notifications"
            label="Notifications push"
            right={
              <Switch
                value={notifEnabled}
                onValueChange={setNotifEnabled}
                trackColor={{ false: Colors.border, true: Colors.orange }}
                thumbColor="#fff"
              />
            }
          />
        </View>

        {/* Section : Support */}
        <Text style={styles.sectionTitle}>Aide & Support</Text>
        <View style={styles.card}>
          <MenuItem
            icon="chatbubble-ellipses"
            label="Contacter le support"
            onPress={() => Linking.openURL('mailto:equipe@capitune.com')}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="globe"
            label="Site web Capitune"
            onPress={() => Linking.openURL('https://capitune.com')}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="shield-checkmark"
            label="Politique de confidentialité"
            onPress={() => Linking.openURL('https://capitunecax.vercel.app/confidentialite')}
          />
        </View>

        {/* Déconnexion */}
        <View style={[styles.card, { marginTop: 8 }]}>
          <MenuItem
            icon="log-out"
            label="Se déconnecter"
            onPress={handleLogout}
            danger
          />
        </View>

        <Text style={styles.version}>Capitune Mobile v1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primaryDark },
  scroll: { padding: 20, paddingBottom: 40 },
  profileBlock: { alignItems: 'center', marginBottom: 28 },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  avatarInitial: { color: '#fff', fontSize: 32, fontWeight: '800' },
  name: { fontSize: 20, fontWeight: '800', color: Colors.text },
  email: { fontSize: 13, color: Colors.textMuted, marginTop: 3 },
  roleBadge: {
    marginTop: 8, backgroundColor: 'rgba(31,75,110,0.1)',
    paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20,
  },
  roleText: { fontSize: 12, color: Colors.primary, fontWeight: '700' },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 20 },
  card: {
    backgroundColor: Colors.white, borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(31,75,110,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  menuIconDanger: { backgroundColor: 'rgba(239,68,68,0.1)' },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text },
  menuLabelDanger: { color: Colors.error },
  menuValue: { fontSize: 12, color: Colors.textMuted },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 66 },
  version: { textAlign: 'center', color: Colors.textMuted, fontSize: 11, marginTop: 28 },
});
