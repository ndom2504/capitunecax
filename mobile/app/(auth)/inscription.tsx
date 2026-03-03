import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { Colors } from '../../constants/Colors';
import { authApi, type SignupPayload } from '../../lib/api';

WebBrowser.maybeCompleteAuthSession();

// Lus depuis mobile/.env (préfixe EXPO_PUBLIC_ = exposé côté client Expo SDK 49+)
const GOOGLE_WEB_CLIENT_ID     = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID     ?? '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';
const GOOGLE_IOS_CLIENT_ID     = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID     ?? '';
const MICROSOFT_CLIENT_ID      = process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_ID      ?? '';

type AccountType = 'client' | 'pro';

export default function InscriptionScreen() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    password: '', confirmPassword: '', phone: '',
  });
  const [accountType, setAccountType] = useState<AccountType>('client');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'microsoft' | null>(null);

  // ── Google OAuth ───────────────────────────────────────────────────────────
  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    webClientId:     GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId:     GOOGLE_IOS_CLIENT_ID,
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      handleOAuthToken('google', googleResponse.authentication?.accessToken ?? '');
    } else if (googleResponse?.type === 'error' || googleResponse?.type === 'dismiss') {
      setOauthLoading(null);
    }
  }, [googleResponse]);

  // ── Microsoft OAuth ────────────────────────────────────────────────────────
  const microsoftDiscovery = AuthSession.useAutoDiscovery(
    'https://login.microsoftonline.com/common/v2.0'
  );
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'capitune' });

  const [msRequest, msResponse, promptMsAsync] = AuthSession.useAuthRequest(
    { clientId: MICROSOFT_CLIENT_ID, scopes: ['openid', 'profile', 'email'], redirectUri, responseType: AuthSession.ResponseType.Token },
    microsoftDiscovery
  );

  useEffect(() => {
    if (msResponse?.type === 'success') {
      handleOAuthToken('microsoft', msResponse.params?.access_token ?? '');
    } else if (msResponse?.type === 'error' || msResponse?.type === 'dismiss') {
      setOauthLoading(null);
    }
  }, [msResponse]);

  const handleOAuthToken = async (provider: 'google' | 'microsoft', token: string) => {
    if (!token) { setOauthLoading(null); return; }
    try {
      const res = await fetch(`https://capitunecax.vercel.app/api/auth/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) Alert.alert('Erreur', data.message ?? `Erreur ${provider}`);
    } catch {
      Alert.alert('Erreur réseau', 'Impossible de contacter le serveur.');
    } finally {
      setOauthLoading(null);
    }
  };

  const set = (key: keyof typeof form) => (val: string) =>
    setForm(f => ({ ...f, [key]: val }));

  const handleSignup = async () => {
    const { firstName, lastName, email, password, confirmPassword } = form;

    if (!firstName || !lastName || !email || !password) {
      Alert.alert('Champs requis', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    const payload: SignupPayload = {
      firstName, lastName,
      email: email.toLowerCase().trim(),
      password, phone: form.phone,
      accountType,
    };

    setLoading(true);
    const res = await authApi.signup(payload);
    setLoading(false);

    if (res.data?.pending) {
      router.replace(
        `/(auth)/verification-en-attente?email=${encodeURIComponent(res.data.email ?? email)}`
      );
      return;
    }

    if (res.status === 200 || res.status === 201) {
      router.replace('/(tabs)/dashboard');
      return;
    }

    Alert.alert('Erreur', res.data?.message ?? 'Une erreur est survenue.');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.logoWrap}>
          <Text style={styles.logoText}>CAPITUNE</Text>
          <Text style={styles.logoSub}>Créer un compte</Text>
        </View>

        <View style={styles.card}>
          {/* Type de compte */}
          <Text style={styles.sectionLabel}>Je souhaite :</Text>
          <View style={styles.toggleRow}>
            {(['client', 'pro'] as AccountType[]).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.toggleBtn, accountType === t && styles.toggleBtnActive]}
                onPress={() => setAccountType(t)}
              >
                <Text style={[styles.toggleText, accountType === t && styles.toggleTextActive]}>
                  {t === 'client' ? '👤 Demander un service' : '💼 Offrir un service'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Champs */}
          {[
            { key: 'firstName', label: 'Prénom *', placeholder: 'Marie' },
            { key: 'lastName', label: 'Nom *', placeholder: 'Tremblay' },
            { key: 'email', label: 'Courriel *', placeholder: 'vous@exemple.com', keyboard: 'email-address' as const },
            { key: 'phone', label: 'Téléphone', placeholder: '+1 514 000 0000', keyboard: 'phone-pad' as const },
            { key: 'password', label: 'Mot de passe *', placeholder: '8 caractères minimum', secure: true },
            { key: 'confirmPassword', label: 'Confirmer le mot de passe *', placeholder: '••••••••', secure: true },
          ].map(({ key, label, placeholder, keyboard, secure }) => (
            <View key={key} style={styles.field}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                value={form[key as keyof typeof form]}
                onChangeText={set(key as keyof typeof form)}
                placeholder={placeholder}
                placeholderTextColor="#94a3b8"
                keyboardType={keyboard ?? 'default'}
                autoCapitalize={key === 'email' ? 'none' : 'words'}
                secureTextEntry={secure}
                autoCorrect={false}
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Créer mon compte</Text>
            }
          </TouchableOpacity>

          {/* ── Séparateur ── */}
          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>ou</Text>
            <View style={styles.separatorLine} />
          </View>

          {/* ── Google ── */}
          <TouchableOpacity
            style={[styles.oauthBtn, (!googleRequest || oauthLoading !== null) && styles.btnDisabled]}
            onPress={() => { setOauthLoading('google'); promptGoogleAsync(); }}
            disabled={!googleRequest || oauthLoading !== null}
            activeOpacity={0.8}
          >
            {oauthLoading === 'google'
              ? <ActivityIndicator color={Colors.white} size="small" />
              : <><Text style={styles.googleG}>G</Text><Text style={styles.oauthBtnText}>Continuer avec Google</Text></>
            }
          </TouchableOpacity>

          {/* ── Microsoft ── */}
          <TouchableOpacity
            style={[styles.oauthBtn, styles.oauthBtnMs, (!msRequest || oauthLoading !== null) && styles.btnDisabled]}
            onPress={() => { setOauthLoading('microsoft'); promptMsAsync(); }}
            disabled={!msRequest || oauthLoading !== null}
            activeOpacity={0.8}
          >
            {oauthLoading === 'microsoft'
              ? <ActivityIndicator color={Colors.white} size="small" />
              : <><Ionicons name="logo-windows" size={18} color="#00a4ef" /><Text style={styles.oauthBtnText}>Continuer avec Microsoft</Text></>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Déjà un compte ? </Text>
          <Link href="/(auth)/connexion" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Se connecter</Text>
            </TouchableOpacity>
          </Link>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primaryDark },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60 },
  logoWrap: { alignItems: 'center', marginBottom: 28 },
  logoText: { fontSize: 30, fontWeight: '800', color: Colors.white, letterSpacing: 3 },
  logoSub: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20, padding: 24,
  },
  sectionLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  toggleRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  toggleBtn: {
    flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10, padding: 10, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  toggleBtnActive: { borderColor: Colors.orange, backgroundColor: 'rgba(232,119,34,0.15)' },
  toggleText: { color: 'rgba(255,255,255,0.55)', fontSize: 12, textAlign: 'center' },
  toggleTextActive: { color: Colors.orangeLight, fontWeight: '700' },
  field: { marginBottom: 16 },
  label: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 10, padding: 13,
    color: Colors.white, fontSize: 14,
  },
  btn: {
    backgroundColor: Colors.orange, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginTop: 10,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, marginBottom: 40 },
  footerText: { color: 'rgba(255,255,255,0.55)', fontSize: 14 },
  footerLink: { color: Colors.orange, fontSize: 14, fontWeight: '700' },
  separator: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  separatorLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  separatorText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginHorizontal: 12 },
  oauthBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 12, paddingVertical: 14, marginBottom: 12,
  },
  oauthBtnMs: { marginBottom: 0 },
  oauthBtnText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  googleG: { fontSize: 16, fontWeight: '800', color: '#EA4335' },
});
