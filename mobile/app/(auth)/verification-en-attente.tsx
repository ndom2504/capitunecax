import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { authApi } from '../../lib/api';
import { UI } from '../../constants/UI';

export default function VerificationEnAttenteScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const resend = async () => {
    if (!email) return;
    setLoading(true);
    const res = await authApi.resendVerification(email);
    setLoading(false);
    if (res.status === 200) {
      setSent(true);
    } else {
      Alert.alert('Erreur', (res.data as any)?.error ?? 'Impossible de renvoyer l\'email.');
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.icon}>📧</Text>
        <Text style={styles.title}>Vérifiez votre courriel</Text>
        <Text style={styles.desc}>
          Un lien de confirmation a été envoyé à :
        </Text>
        <Text style={styles.email}>{email}</Text>
        <Text style={styles.hint}>
          Cliquez sur le lien dans l'email pour activer votre compte.{'\n'}
          Pensez à vérifier vos courriers indésirables.
        </Text>

        {sent ? (
          <Text style={styles.sentMsg}>✓ Email renvoyé !</Text>
        ) : (
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={resend}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.btnText}>Renvoyer l'email</Text>
            }
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => router.replace('/(auth)/connexion')} style={styles.backBtn}>
          <Text style={styles.backText}>← Retour à la connexion</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1, backgroundColor: Colors.bgLight,
    justifyContent: 'center', padding: 24,
  },
  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.orange + '35',
    borderRadius: 20, padding: 32, alignItems: 'center',
    ...UI.cardShadow,
  },
  icon: { fontSize: 52, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 12, textAlign: 'center' },
  desc: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  email: { fontSize: 16, fontWeight: '700', color: Colors.orange, marginVertical: 8, textAlign: 'center' },
  hint: {
    fontSize: 13, color: Colors.textMuted,
    textAlign: 'center', lineHeight: 20, marginBottom: 24,
  },
  btn: {
    backgroundColor: Colors.orange, borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 28, marginBottom: 16,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  sentMsg: { color: '#4ade80', fontWeight: '700', marginBottom: 16, fontSize: 14 },
  backBtn: { marginTop: 8 },
  backText: { color: Colors.textMuted, fontSize: 13 },
});
