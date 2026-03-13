import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  TextInput, ScrollView, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';

const GEMINI_API = 'https://www.capitune.com/api/ai-suggest';

const TIPS_CANADIEN = [
  { icon: 'document-text-outline', title: 'Pas de photo', desc: 'Au Canada, ne mettez pas de photo sur votre CV. Ce n\'est pas la norme.' },
  { icon: 'flag-outline', title: 'Format chronologique', desc: 'Listez vos experiences du plus recent au plus ancien.' },
  { icon: 'language-outline', title: 'Langue de la region', desc: 'En Ontario/BC, redigez en anglais. Au Quebec, en francais.' },
  { icon: 'trophy-outline', title: 'Chiffrez vos reussites', desc: 'Ex : "Augmente les ventes de 30%" plutot que "Ameliore les ventes".' },
  { icon: 'person-outline', title: 'Pas d\'infos personnelles', desc: 'Ne mentionnez pas votre age, etat civil ou numero d\'assurance sociale.' },
  { icon: 'star-outline', title: 'Resume professionnel', desc: 'Commencez par un resume de 2-3 lignes adapte pour chaque poste.' },
];

export default function CVScreen() {
  const router = useRouter();

  const [cvText, setCvText]     = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!cvText.trim()) {
      Alert.alert('Champ vide', 'Collez votre texte de CV pour l\'analyser.');
      return;
    }
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const res = await fetch(GEMINI_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cvText, task: 'analyze_cv_canadian' }),
      });
      if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
      const data = await res.json();
      setAnalysis(data?.suggestion || data?.result || JSON.stringify(data));
    } catch (e: any) {
      setError(e?.message ?? 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const openWebVersion = () => {
    Linking.openURL('https://www.capitune.com/carriere/cv').catch(() => {});
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CV Canadien</Text>
        <TouchableOpacity style={styles.webBtn} onPress={openWebVersion} activeOpacity={0.8}>
          <Ionicons name="globe-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Banniere */}
        <View style={styles.banner}>
          <View style={styles.bannerIconWrap}>
            <Ionicons name="document-text" size={28} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Createur de CV Canadien</Text>
            <Text style={styles.bannerSub}>Adaptez votre CV au format canadien et maximisez vos chances.</Text>
          </View>
        </View>

        {/* Conseils */}
        <Text style={styles.sectionTitle}>Conseils pour un CV Canadien</Text>
        <View style={styles.tipsGrid}>
          {TIPS_CANADIEN.map((tip, i) => (
            <View key={i} style={styles.tipCard}>
              <Ionicons name={tip.icon as any} size={20} color={Colors.primary} />
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <Text style={styles.tipDesc}>{tip.desc}</Text>
            </View>
          ))}
        </View>

        {/* Analyse IA */}
        <Text style={styles.sectionTitle}>Analyse IA de votre CV</Text>
        <Text style={styles.sectionSub}>Collez le texte de votre CV ci-dessous pour obtenir des suggestions.</Text>

        <TextInput
          style={styles.cvInput}
          placeholder="Collez votre CV ici (texte brut)..."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={8}
          value={cvText}
          onChangeText={setCvText}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.analyzeBtn, (!cvText.trim() || loading) && styles.analyzeBtnDisabled]}
          onPress={handleAnalyze}
          activeOpacity={0.8}
          disabled={!cvText.trim() || loading}
        >
          {loading ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.analyzeBtnText}>Analyse en cours...</Text>
            </>
          ) : (
            <>
              <Ionicons name="sparkles-outline" size={17} color="#fff" />
              <Text style={styles.analyzeBtnText}>Analyser mon CV</Text>
            </>
          )}
        </TouchableOpacity>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="warning-outline" size={20} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {analysis ? (
          <View style={styles.resultBox}>
            <View style={styles.resultHeader}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.resultTitle}>Analyse complete</Text>
            </View>
            <Text style={styles.resultText}>{analysis}</Text>
          </View>
        ) : null}

        {/* Lien vers version complete */}
        <TouchableOpacity style={styles.fullVersionBtn} onPress={openWebVersion} activeOpacity={0.85}>
          <Ionicons name="open-outline" size={16} color={Colors.primary} />
          <Text style={styles.fullVersionText}>Version complete avec import PDF/DOCX</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.offWhite },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: '#fff',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgLight,
  },
  headerTitle: {
    flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: Colors.text,
  },
  webBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgLight,
  },

  scroll: { padding: 16, gap: 16, paddingBottom: 40 },

  banner: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  bannerIconWrap: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: Colors.bgLight, alignItems: 'center', justifyContent: 'center',
  },
  bannerTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  bannerSub:   { fontSize: 12, color: Colors.textMuted, lineHeight: 17, marginTop: 2 },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  sectionSub:   { fontSize: 13, color: Colors.textMuted, marginTop: -10 },

  tipsGrid: { gap: 8 },
  tipCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 4,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  tipTitle: { fontSize: 13, fontWeight: '700', color: Colors.text, marginTop: 2 },
  tipDesc:  { fontSize: 12, color: Colors.textMuted, lineHeight: 17 },

  cvInput: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border, padding: 12, minHeight: 140,
    fontSize: 13, color: Colors.text, lineHeight: 19,
  },

  analyzeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 13, gap: 8,
  },
  analyzeBtnDisabled: { opacity: 0.5 },
  analyzeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fef2f2', borderRadius: 10, padding: 12,
  },
  errorText: { flex: 1, fontSize: 13, color: Colors.error },

  resultBox: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1,
    borderColor: '#d1fae5', padding: 14, gap: 8,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultTitle:  { fontSize: 14, fontWeight: '700', color: Colors.text },
  resultText:   { fontSize: 13, color: Colors.text, lineHeight: 19 },

  fullVersionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border, padding: 14,
  },
  fullVersionText: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.primary },
});
