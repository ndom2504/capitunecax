import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Colors } from '../../constants/Colors';
import { UI } from '../../constants/UI';
import { useAuth } from '../../context/AuthContext';
import type { UserInfo } from '../../lib/api';

const BACKEND = 'https://www.capitune.com';

type AccountType = 'client' | 'pro';

function homeRoute(accountType?: string) {
  return accountType === 'pro' ? '/(tabs)/dashboard' : '/(tabs)/dashboard';
}

export default function ConnexionScreen() {
  const router = useRouter();
  const { login, setSession } = useAuth();

  const [accountType, setAccountType] = useState<AccountType>('client');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'microsoft' | null>(null);

  // ── Traitement du deep link capitune://oauth?token=...&email=...&name=...&role=...
  const handleOAuthDeepLink = async (url: string) => {
    try {
      const parsed = Linking.parse(url);
      const token       = parsed.queryParams?.token as string | undefined;
      const emailParam  = parsed.queryParams?.email as string | undefined;
      const nameParam   = parsed.queryParams?.name  as string | undefined;
      const roleParam   = (parsed.queryParams?.role as string | undefined) ?? accountType;
      const atParam     = (parsed.queryParams?.account_type as string | undefined) ?? accountType;

      if (!token || !emailParam) {
        Alert.alert('Connexion incomplète', 'Token ou email manquant après OAuth.');
        return;
      }

      const user: UserInfo = {
        id: '',
        email: decodeURIComponent(emailParam),
        name:  decodeURIComponent(nameParam ?? emailParam),
        role:  roleParam as UserInfo['role'],
        account_type: atParam as UserInfo['account_type'],
      };

      await setSession(decodeURIComponent(token), user);
      router.replace(homeRoute(atParam) as any);
    } catch {
      Alert.alert('Erreur', 'Impossible de finaliser la connexion OAuth.');
    }
  };

  // ── Google OAuth via WebBrowser (SDK 51 compatible) ───────────────────
  const handleGoogle = async () => {
    setOauthLoading('google');
    const redirectUri = Linking.createURL('oauth');
    try {
      const result = await WebBrowser.openAuthSessionAsync(
        `${BACKEND}/api/oauth/signin/google?mobile=true&accountType=${accountType}&redirect_uri=${encodeURIComponent(redirectUri)}`,
        redirectUri
      );
      if (result.type === 'success' && result.url) {
        await handleOAuthDeepLink(result.url);
      }
    } catch {
      Alert.alert('Erreur réseau', 'Impossible de contacter le serveur.');
    } finally {
      setOauthLoading(null);
    }
  };

  // ── Microsoft OAuth via WebBrowser (SDK 51 compatible) ────────────────
  const handleMicrosoft = async () => {
    setOauthLoading('microsoft');
    const redirectUri = Linking.createURL('oauth');
    try {
      const result = await WebBrowser.openAuthSessionAsync(
        `${BACKEND}/api/oauth/signin/microsoft?mobile=true&accountType=${accountType}&redirect_uri=${encodeURIComponent(redirectUri)}`,
        redirectUri
      );
      if (result.type === 'success' && result.url) {
        await handleOAuthDeepLink(result.url);
      }
    } catch {
      Alert.alert('Erreur réseau', 'Impossible de contacter le serveur.');
    } finally { setOauthLoading(null); }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Champs requis', 'Veuillez remplir l\'email et le mot de passe.');
      return;
    }

    setLoading(true);
    const result = await login(email.trim().toLowerCase(), password, accountType);
    setLoading(false);

    if (result.pending) {
      router.push(`/(auth)/verification-en-attente?email=${encodeURIComponent(email)}`);
      return;
    }

    if (!result.ok) {
      Alert.alert('Connexion échouée', result.message ?? 'Identifiants incorrects.');
      return;
    }

    // Redirect selon le type renvoyé par le serveur (ou le toggle si absent)
    const at = result.accountType ?? accountType;
    router.replace(homeRoute(at) as any);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoText}>CAPITUNE</Text>
          <Text style={styles.logoSub}>Votre projet Canada</Text>
        </View>

        {/* Toggle Client / Pro */}
        <View style={styles.typeRow}>
          {(['client', 'pro'] as AccountType[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.typeBtn, accountType === t && styles.typeBtnActive]}
              onPress={() => setAccountType(t)}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeText, accountType === t && styles.typeTextActive]}>
                {t === 'client' ? '👤 Client' : '💼 Professionnel'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Carte */}
        <View style={[styles.card, accountType === 'pro' && styles.cardPro]}>
          <Text style={styles.title}>
            {accountType === 'client' ? 'Connexion Client' : 'Connexion Professionnel'}
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Adresse courriel</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="vous@exemple.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, accountType === 'pro' && styles.btnPro, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Se connecter</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow}>
            <Text style={styles.linkText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          {/* ── Séparateur ── */}
          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>ou</Text>
            <View style={styles.separatorLine} />
          </View>

          {/* ── Google ── */}
          <TouchableOpacity
            style={[styles.oauthBtn, oauthLoading !== null && styles.btnDisabled]}
            onPress={handleGoogle}
            disabled={oauthLoading !== null}
            activeOpacity={0.8}
          >
            {oauthLoading === 'google'
              ? <ActivityIndicator color={Colors.white} size="small" />
              : <>
                  <Text style={styles.googleG}>G</Text>
                  <Text style={styles.oauthBtnText}>Continuer avec Google</Text>
                </>
            }
          </TouchableOpacity>

          {/* ── Microsoft ── */}
          <TouchableOpacity
            style={[styles.oauthBtn, styles.oauthBtnMs, oauthLoading !== null && styles.btnDisabled]}
            onPress={handleMicrosoft}
            disabled={oauthLoading !== null}
            activeOpacity={0.8}
          >
            {oauthLoading === 'microsoft'
              ? <ActivityIndicator color={Colors.white} size="small" />
              : <>
                  <Ionicons name="logo-windows" size={18} color="#00a4ef" />
                  <Text style={styles.oauthBtnText}>Continuer avec Microsoft</Text>
                </>
            }
          </TouchableOpacity>
        </View>

        {/* Pied */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Pas encore de compte ? </Text>
          <Link href="/(auth)/inscription" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Créer un compte</Text>
            </TouchableOpacity>
          </Link>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgLight },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 24 },
  logoText: { fontSize: 34, fontWeight: '800', color: Colors.primary, letterSpacing: 3 },
  logoSub: { fontSize: 13, color: Colors.textMuted, marginTop: 4, letterSpacing: 1 },
  // Toggle type
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: {
    flex: 1, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingVertical: 12, alignItems: 'center',
    backgroundColor: Colors.white,
  },
  typeBtnActive: { borderColor: Colors.orange, backgroundColor: Colors.orange + '12' },
  typeText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  typeTextActive: { color: Colors.orange, fontWeight: '800' },
  // Carte
  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20, padding: 28,
    ...UI.cardShadow,
  },
  cardPro: {
    borderColor: Colors.primary + '35',
    backgroundColor: Colors.primary + '08',
  },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 24 },
  field: { marginBottom: 18 },
  label: { fontSize: 12, color: Colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: {
    backgroundColor: Colors.offWhite,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10, padding: 14,
    color: Colors.text, fontSize: 15,
  },
  btn: {
    backgroundColor: Colors.orange, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginTop: 8,
  },
  btnPro: { backgroundColor: Colors.primary },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  linkRow: { alignItems: 'center', marginTop: 14 },
  linkText: { color: Colors.orange, fontSize: 13 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { color: Colors.textMuted, fontSize: 14 },
  footerLink: { color: Colors.orange, fontSize: 14, fontWeight: '700' },
  // OAuth
  separator: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  separatorLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  separatorText: { color: Colors.textMuted, fontSize: 12, marginHorizontal: 12 },
  oauthBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12, paddingVertical: 14, marginBottom: 12,
    ...UI.cardShadow,
  },
  oauthBtnMs: { marginBottom: 0 },
  oauthBtnText: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  googleG: { fontSize: 16, fontWeight: '800', color: '#EA4335' },
});
