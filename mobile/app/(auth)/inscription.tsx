import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { authApi, type SignupPayload } from '../../lib/api';

type AccountType = 'client' | 'pro';

export default function InscriptionScreen() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    password: '', confirmPassword: '', phone: '',
  });
  const [accountType, setAccountType] = useState<AccountType>('client');
  const [loading, setLoading] = useState(false);

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
});
