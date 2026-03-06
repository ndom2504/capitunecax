import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, Switch, Linking, TextInput, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/Colors';
import { UI } from '../../constants/UI';
import { useAuth } from '../../context/AuthContext';
import { saveSession } from '../../lib/auth';
import { getAvatarSource } from '../../lib/avatar';
import { userApi, type UserProfile, type UserProfileUpdate, authApi, type UserInfo } from '../../lib/api';

export default function ProfilScreen() {
  const { user, token, logout, setUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [draft, setDraft] = useState<UserProfileUpdate>({});
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickingAvatar, setPickingAvatar] = useState(false);

  const handlePickAvatar = async () => {
    if (pickingAvatar) return;
    if (!token) {
      Alert.alert('Connexion requise', 'Connectez-vous pour modifier votre photo de profil.');
      return;
    }

    setPickingAvatar(true);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Autorisation requise',
          "Activez l'accès aux photos pour importer votre avatar.",
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Ouvrir les réglages', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.35,
        base64: true,
      });
      if (result.canceled) return;

      const asset = result.assets?.[0];
      const base64 = asset?.base64;
      const mime = asset?.mimeType ?? 'image/jpeg';

      if (!base64) {
        Alert.alert('Erreur', "Impossible de lire l'image.");
        return;
      }

      const dataUri = `data:${mime};base64,${base64}`;
      if (dataUri.length > 307200) {
        Alert.alert('Image trop lourde', 'Choisissez une image plus petite (limite ~300 Ko).');
        return;
      }

      setDraft(d => ({ ...d, avatar_key: dataUri }));

      // Mise à jour immédiate dans l'app (Dashboard/Inside/etc.)
      if (user) {
        const nextUser: UserInfo = { ...user, avatar: dataUri };
        await saveSession(token, nextUser);
        setUser(nextUser);
      }
    } catch (e) {
      Alert.alert('Erreur', `Impossible d'ouvrir la galerie. ${String(e)}`);
    } finally {
      setPickingAvatar(false);
    }
  };

  const canSave = useMemo(() => {
    if (!profile) return false;
    const nextName = String(draft.name ?? profile.name).trim();
    return nextName.length >= 2;
  }, [draft.name, profile]);

  const loadProfile = async () => {
    setLoadingProfile(true);
    try {
      if (!token) {
        setProfile(null);
        setDraft({});
        return;
      }

      const res = await userApi.getProfile(token);
      if (res.status === 200 && res.data) {
        setProfile(res.data);
        setDraft({
          name: res.data.name,
          phone: res.data.phone,
          location: res.data.location,
          bio: res.data.bio,
          avatar_key: res.data.avatar_key,
          notif_email: res.data.notif_email,
          notif_rdv: res.data.notif_rdv,
          notif_msg: res.data.notif_msg,
          currency_code: res.data.currency_code,
        });
        return;
      }

      // fallback si l'API n'est pas accessible
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [token]);

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
          <TouchableOpacity
            style={styles.avatarCircle}
            activeOpacity={0.85}
            onPress={handlePickAvatar}
          >
            {(() => {
              const src = getAvatarSource(String(draft.avatar_key ?? profile?.avatar_key ?? user?.avatar ?? ''));
              if (src) return <Image source={src} style={styles.avatarImg} />;
              return <Text style={styles.avatarInitial}>{(user?.name ?? 'U')[0].toUpperCase()}</Text>;
            })()}

            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{user?.name ?? '—'}</Text>
          <Text style={styles.email}>{user?.email ?? '—'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user?.account_type === 'pro' ? '💼 Professionnel' : '👤 Client'}
            </Text>
          </View>
        </View>

        {/* Edition profil */}
        <Text style={styles.sectionTitle}>Profil</Text>
        <View style={styles.card}>
          {loadingProfile ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={Colors.orange} />
              <Text style={styles.loadingText}>Chargement du profil…</Text>
            </View>
          ) : (
            <>
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Nom</Text>
                <TextInput
                  style={styles.formInput}
                  value={String(draft.name ?? '')}
                  onChangeText={(v) => setDraft(d => ({ ...d, name: v }))}
                  placeholder={user?.name ?? 'Votre nom'}
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Téléphone</Text>
                <TextInput
                  style={styles.formInput}
                  value={String(draft.phone ?? '')}
                  onChangeText={(v) => setDraft(d => ({ ...d, phone: v }))}
                  placeholder="Ex: +1 514 …"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Ville</Text>
                <TextInput
                  style={styles.formInput}
                  value={String(draft.location ?? '')}
                  onChangeText={(v) => setDraft(d => ({ ...d, location: v }))}
                  placeholder="Ex: Montréal"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Bio</Text>
                <TextInput
                  style={[styles.formInput, styles.formInputBio]}
                  value={String(draft.bio ?? '')}
                  onChangeText={(v) => setDraft(d => ({ ...d, bio: v }))}
                  placeholder="Quelques mots…"
                  placeholderTextColor={Colors.textMuted}
                  multiline
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>Emails</Text>
                  <Text style={styles.switchSub}>Recevoir les emails importants</Text>
                </View>
                <Switch
                  value={!!draft.notif_email}
                  onValueChange={(v) => setDraft(d => ({ ...d, notif_email: v }))}
                  trackColor={{ false: Colors.border, true: Colors.orange }}
                  thumbColor="#fff"
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>Rendez-vous</Text>
                  <Text style={styles.switchSub}>Rappels et confirmations</Text>
                </View>
                <Switch
                  value={!!draft.notif_rdv}
                  onValueChange={(v) => setDraft(d => ({ ...d, notif_rdv: v }))}
                  trackColor={{ false: Colors.border, true: Colors.orange }}
                  thumbColor="#fff"
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>Actus Inside</Text>
                  <Text style={styles.switchSub}>Mises à jour et annonces</Text>
                </View>
                <Switch
                  value={!!draft.notif_msg}
                  onValueChange={(v) => setDraft(d => ({ ...d, notif_msg: v }))}
                  trackColor={{ false: Colors.border, true: Colors.orange }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.currencyRow}>
                <Text style={styles.switchLabel}>Devise</Text>
                <View style={styles.currencyChips}>
                  {(['CAD', 'USD', 'EUR'] as const).map(code => {
                    const selected = String(draft.currency_code ?? 'CAD') === code;
                    return (
                      <TouchableOpacity
                        key={code}
                        style={[styles.currencyChip, selected && styles.currencyChipSelected]}
                        activeOpacity={0.85}
                        onPress={() => setDraft(d => ({ ...d, currency_code: code }))}
                      >
                        <Text style={[styles.currencyChipText, selected && styles.currencyChipTextSelected]}>{code}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, (!canSave || saving || !token) && styles.saveBtnDisabled]}
                activeOpacity={0.85}
                disabled={!canSave || saving || !token}
                onPress={async () => {
                  if (!token) return;
                  setSaving(true);
                  try {
                    const res = await userApi.updateProfile(token, draft);
                    if (res.status < 200 || res.status >= 300) {
                      Alert.alert('Erreur', res.data?.error ?? 'Impossible de sauvegarder le profil.');
                      return;
                    }

                    // Mettre à jour le nom dans le contexte Auth (et persister)
                    const meRes = await authApi.me(token);
                    const savedAvatar = String(draft.avatar_key ?? profile?.avatar_key ?? user?.avatar ?? '').trim();
                    const nextUser: UserInfo = meRes.status === 200 && meRes.data
                      ? ({
                          ...(meRes.data as UserInfo),
                          avatar: (meRes.data as UserInfo).avatar ?? (savedAvatar || null),
                        })
                      : {
                          id: user?.id ?? '',
                          email: user?.email ?? '',
                          name: String(draft.name ?? user?.name ?? '').trim() || (user?.name ?? ''),
                          role: (user?.role ?? 'client') as any,
                          account_type: (user?.account_type ?? 'client') as any,
                          avatar: savedAvatar || null,
                        };
                    await saveSession(token, nextUser);
                    setUser(nextUser);

                    await loadProfile();
                    Alert.alert('Enregistré', 'Votre profil a été mis à jour.');
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={16} color="#fff" />
                    <Text style={styles.saveBtnText}>Enregistrer</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Section : Compte */}
        <Text style={styles.sectionTitle}>Mon compte</Text>
        <View style={styles.card}>
          <MenuItem icon="lock-closed" label="Changer le mot de passe" onPress={() => Alert.alert('À venir', 'Modification du mot de passe bientôt disponible.')} />
          <View style={styles.divider} />
          <MenuItem icon="phone-portrait" label="Biométrie" value="Face ID / Empreinte" onPress={() => Alert.alert('À venir', 'Biométrie bientôt disponible.')} />
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
            label="Site web CAPI"
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

        <Text style={styles.version}>CAPI Mobile v1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgLight },
  scroll: { padding: 20, paddingBottom: 40 },
  profileBlock: { alignItems: 'center', marginBottom: 28 },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  avatarImg: { width: 80, height: 80, borderRadius: 40 },
  avatarEditBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.bgLight,
  },
  avatarInitial: { color: '#fff', fontSize: 32, fontWeight: '800' },
  name: { fontSize: 20, fontWeight: '800', color: Colors.text },
  email: { fontSize: 13, color: Colors.textMuted, marginTop: 3 },
  roleBadge: {
    marginTop: 8, backgroundColor: 'rgba(31,75,110,0.12)',
    paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20,
  },
  roleText: { fontSize: 12, color: Colors.text, fontWeight: '700' },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 20 },
  card: {
    ...UI.card,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(31,75,110,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  menuIconDanger: { backgroundColor: 'rgba(239,68,68,0.1)' },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text },
  menuLabelDanger: { color: Colors.error },
  menuValue: { fontSize: 12, color: Colors.textMuted },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 66 },
  version: { textAlign: 'center', color: Colors.textMuted, fontSize: 11, marginTop: 28 },

  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 },
  loadingText: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },

  formRow: { paddingHorizontal: 16, paddingTop: 14 },
  formLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '700', marginBottom: 8 },
  formInput: {
    backgroundColor: Colors.offWhite,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  formInputBio: { minHeight: 90, textAlignVertical: 'top' },

  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  switchLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  switchSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  currencyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  currencyChips: { flexDirection: 'row', gap: 8 },
  currencyChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.offWhite,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currencyChipSelected: { borderColor: Colors.orange, backgroundColor: Colors.orange + '18' },
  currencyChipText: { fontSize: 12, fontWeight: '800', color: Colors.textMuted },
  currencyChipTextSelected: { color: Colors.orange },

  saveBtn: {
    margin: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.orange,
    borderRadius: 12,
    paddingVertical: 12,
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: { color: Colors.white, fontSize: 14, fontWeight: '800' },
});
