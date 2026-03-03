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
import { useAuth } from '../../context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

// ── Remplacez ces valeurs par vos vrais identifiants OAuth ──────────────────
const GOOGLE_WEB_CLIENT_ID     = 'VOTRE_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = 'VOTRE_ANDROID_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID     = 'VOTRE_IOS_CLIENT_ID.apps.googleusercontent.com';
const MICROSOFT_CLIENT_ID      = 'VOTRE_AZURE_APP_CLIENT_ID';
// ────────────────────────────────────────────────────────────────────────────

export default function ConnexionScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'microsoft' | null>(null);

  // ── Google OAuth ───────────────────────────────────────────────────────────
  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    webClientId:     GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId:     GOOGLE_IOS_CLIENT_ID,
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { authentication } = googleResponse;
      handleOAuthToken('google', authentication?.accessToken ?? '');
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
    {
      clientId:         MICROSOFT_CLIENT_ID,
      scopes:           ['openid', 'profile', 'email'],
      redirectUri,
      responseType:     AuthSession.ResponseType.Token,
    },
    microsoftDiscovery
  );

  useEffect(() => {
    if (msResponse?.type === 'success') {
      handleOAuthToken('microsoft', msResponse.params?.access_token ?? '');
    } else if (msResponse?.type === 'error' || msResponse?.type === 'dismiss') {
      setOauthLoading(null);
    }
  }, [msResponse]);

  // ── Envoi du token OAuth au backend ───────────────────────────────────────
  const handleOAuthToken = async (provider: 'google' | 'microsoft', token: string) => {
    if (!token) { setOauthLoading(null); return; }
    try {
      const res = await fetch(`https://capitunecax.vercel.app/api/auth/${provider}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        // Le contexte auth gère la redirection via son state
      } else {
        Alert.alert('Connexion échouée', data.message ?? `Erreur ${provider}`);
      }
    } catch {
      Alert.alert('Erreur réseau', 'Impossible de contacter le serveur.');
    } finally {
      setOauthLoading(null);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Champs requis', 'Veuillez remplir l\'email et le mot de passe.');
      return;
    }

    setLoading(true);
    const result = await login(email.trim().toLowerCase(), password);
    setLoading(false);

    if (result.pending) {
      router.push(`/(auth)/verification-en-attente?email=${encodeURIComponent(email)}`);
      return;
    }

    if (!result.ok) {
      Alert.alert('Connexion échouée', result.message ?? 'Identifiants incorrects.');
    }
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

        {/* Carte */}
        <View style={styles.card}>
          <Text style={styles.title}>Connexion</Text>

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
            style={[styles.btn, loading && styles.btnDisabled]}
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
            style={[styles.oauthBtn, (!googleRequest || oauthLoading !== null) && styles.btnDisabled]}
            onPress={() => { setOauthLoading('google'); promptGoogleAsync(); }}
            disabled={!googleRequest || oauthLoading !== null}
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
            style={[styles.oauthBtn, styles.oauthBtnMs, (!msRequest || oauthLoading !== null) && styles.btnDisabled]}
            onPress={() => { setOauthLoading('microsoft'); promptMsAsync(); }}
            disabled={!msRequest || oauthLoading !== null}
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
  root: { flex: 1, backgroundColor: Colors.primaryDark },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 36 },
  logoText: { fontSize: 34, fontWeight: '800', color: Colors.white, letterSpacing: 3 },
  logoSub: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4, letterSpacing: 1 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20, padding: 28,
  },
  title: { fontSize: 22, fontWeight: '700', color: Colors.white, marginBottom: 24 },
  field: { marginBottom: 18 },
  label: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 10, padding: 14,
    color: Colors.white, fontSize: 15,
  },
  btn: {
    backgroundColor: Colors.orange, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  linkRow: { alignItems: 'center', marginTop: 14 },
  linkText: { color: Colors.orangeLight, fontSize: 13 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { color: 'rgba(255,255,255,0.55)', fontSize: 14 },
  footerLink: { color: Colors.orange, fontSize: 14, fontWeight: '700' },
  // OAuth
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
