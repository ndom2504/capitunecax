import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  TextInput, ScrollView, Alert, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Colors } from '../../constants/Colors';

const CV_API = 'https://www.capitune.com/api/cv-analyze';

const TIPS = [
  { icon: 'camera-off-outline' as const,   title: 'Pas de photo',           desc: "Au Canada, ne mettez jamais de photo. Ce n'est pas la norme." },
  { icon: 'calendar-outline' as const,     title: 'Format chronologique',   desc: 'Listez vos expériences du plus récent au plus ancien.' },
  { icon: 'language-outline' as const,     title: 'Langue de la région',    desc: 'En Ontario/BC → anglais. Au Québec → français.' },
  { icon: 'trophy-outline' as const,       title: 'Chiffrez vos réussites', desc: '« Augmenté les ventes de 30 % » plutôt que « Amélioré ».' },
  { icon: 'shield-off-outline' as const,   title: 'Pas d\'infos perso',     desc: "Ne mentionnez pas l'âge, l'état civil ni le NAS." },
  { icon: 'star-outline' as const,         title: 'Résumé professionnel',   desc: 'Commencez par 2-3 lignes adaptées pour chaque poste.' },
];

interface Analysis {
  name: string;
  experience_years: number;
  top_skills: string[];
  recommended_programs: string[];
  compatibility_score: number;
  suggestions: string;
}

export default function CVScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  const [cvText,          setCvText]          = useState('');
  const [targetJob,       setTargetJob]        = useState('');
  const [importedFile,    setImportedFile]     = useState<string | null>(null);
  const [loadingFile,     setLoadingFile]      = useState(false);
  const [analysis,        setAnalysis]         = useState<Analysis | null>(null);
  const [optimizedRaw,    setOptimizedRaw]     = useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis]  = useState(false);
  const [loadingOptimize, setLoadingOptimize]  = useState(false);
  const [error,           setError]            = useState<string | null>(null);
  const [step,            setStep]             = useState<'input' | 'result'>('input');

  // ── Import fichier ────────────────────────────────────────────────────────
  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'text/*', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      const ext   = asset.name.split('.').pop()?.toLowerCase() ?? '';
      if (!['txt', 'text', 'csv', 'md'].includes(ext)) {
        Alert.alert(
          'Format non supporté',
          'Sur mobile, seuls les fichiers .txt sont lisibles automatiquement.\nPour les PDF / DOCX, utilisez la version web.',
        );
        return;
      }
      setLoadingFile(true);
      const text = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
      if (!text.trim()) {
        Alert.alert('Fichier vide', 'Le fichier sélectionné ne contient pas de texte lisible.');
        return;
      }
      setCvText(text);
      setImportedFile(asset.name);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Impossible de lire le fichier.');
    } finally {
      setLoadingFile(false);
    }
  };

  // ── Analyse ────────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!cvText.trim()) {
      Alert.alert('Champ vide', 'Collez le texte de votre CV pour l\'analyser.');
      return;
    }
    setLoadingAnalysis(true);
    setError(null);
    setAnalysis(null);
    setOptimizedRaw(null);
    try {
      const res = await fetch(CV_API, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ task: 'analyze', cvText }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data);
      setStep('result');
    } catch (e: any) {
      setError(e?.message ?? 'Erreur inconnue');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // ── Optimisation CV ────────────────────────────────────────────────────────
  const handleOptimize = async () => {
    const text = cvText || (analysis ? 'CV de ' + analysis.name : '');
    if (!text) return;
    setLoadingOptimize(true);
    setError(null);
    try {
      const res = await fetch(CV_API, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          task:        'optimize',
          cvText:      text,
          targetJob,
          suggestions: analysis?.suggestions ?? '',
        }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setOptimizedRaw(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setError(e?.message ?? 'Erreur inconnue');
    } finally {
      setLoadingOptimize(false);
    }
  };

  const handleReset = () => {
    setCvText(''); setTargetJob(''); setAnalysis(null);
    setOptimizedRaw(null); setError(null); setStep('input'); setImportedFile(null);
  };

  // ── RENDU ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CV Canadien</Text>
        {step === 'result' ? (
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.resetBtn} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Étape 1 : Saisie ── */}
        {step === 'input' && (
          <>
            {/* Banner */}
            <View style={styles.banner}>
              <View style={styles.bannerIcon}>
                <Ionicons name="document-text" size={26} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>Créateur de CV Canadien</Text>
                <Text style={styles.bannerSub}>Diagnostic IA + optimisation pour le marché canadien.</Text>
              </View>
            </View>

            {/* Tips */}
            <Text style={styles.sectionTitle}>📋 Règles clés du CV canadien</Text>
            {TIPS.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <View style={styles.tipIconWrap}>
                  <Ionicons name={tip.icon} size={18} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Text style={styles.tipDesc}>{tip.desc}</Text>
                </View>
              </View>
            ))}

            {/* Saisie CV */}
            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>📄 Votre CV</Text>
            <Text style={styles.sectionSub}>Importez un fichier .txt ou collez le texte de votre CV ci-dessous.</Text>

            {/* Bouton import */}
            <TouchableOpacity style={styles.importBtn} onPress={handlePickFile} activeOpacity={0.8} disabled={loadingFile}>
              {loadingFile
                ? <ActivityIndicator size="small" color={Colors.primary} />
                : <Ionicons name="cloud-upload-outline" size={18} color={Colors.primary} />
              }
              <Text style={styles.importBtnText}>
                {importedFile ? `📎 ${importedFile}` : 'Importer un fichier (.txt)'}
              </Text>
              {importedFile && (
                <TouchableOpacity onPress={() => { setImportedFile(null); setCvText(''); }} hitSlop={10}>
                  <Ionicons name="close-circle" size={17} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.cvInput}
              placeholder="Collez le texte de votre CV ici..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={10}
              value={cvText}
              onChangeText={setCvText}
              textAlignVertical="top"
            />

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="warning-outline" size={18} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryBtn, (!cvText.trim() || loadingAnalysis) && styles.btnDisabled]}
              onPress={handleAnalyze}
              activeOpacity={0.85}
              disabled={!cvText.trim() || loadingAnalysis}
            >
              {loadingAnalysis
                ? <><ActivityIndicator size="small" color="#fff" /><Text style={styles.primaryBtnText}>Analyse en cours…</Text></>
                : <><Ionicons name="sparkles-outline" size={17} color="#fff" /><Text style={styles.primaryBtnText}>✨ Analyser mon CV</Text></>
              }
            </TouchableOpacity>
          </>
        )}

        {/* ── Étape 2 : Résultats ── */}
        {step === 'result' && analysis && (
          <>
            {/* Score */}
            <View style={styles.scoreCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.analysisLabel}>Candidat</Text>
                <Text style={styles.analysisName}>{analysis.name}</Text>
                <Text style={styles.analysisExp}>{analysis.experience_years} ans d'expérience</Text>
              </View>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreLabel}>Score</Text>
                <Text style={styles.scoreValue}>{analysis.compatibility_score}%</Text>
              </View>
            </View>

            {/* Compétences */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>💡 Compétences clés</Text>
              <View style={styles.tagsWrap}>
                {(analysis.top_skills ?? []).map((s, i) => (
                  <View key={i} style={styles.tag}><Text style={styles.tagText}>{s}</Text></View>
                ))}
              </View>
            </View>

            {/* Programmes */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🎯 Programmes recommandés</Text>
              <View style={styles.tagsWrap}>
                {(analysis.recommended_programs ?? []).map((p, i) => (
                  <View key={i} style={[styles.tag, styles.tagOrange]}><Text style={[styles.tagText, { color: Colors.primary }]}>{p}</Text></View>
                ))}
              </View>
            </View>

            {/* Suggestions */}
            <View style={[styles.card, styles.cardOrange]}>
              <Text style={styles.cardTitle}>💬 Suggestions IA</Text>
              <Text style={styles.suggText}>{analysis.suggestions}</Text>
            </View>

            {/* Section optimisation */}
            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>🪄 CV Magic — Optimisation</Text>
            <Text style={styles.sectionSub}>Poste cible (facultatif) :</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Ex : Développeur, Infirmier, Comptable…"
              placeholderTextColor={Colors.textMuted}
              value={targetJob}
              onChangeText={setTargetJob}
            />

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="warning-outline" size={18} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryBtn, loadingOptimize && styles.btnDisabled]}
              onPress={handleOptimize}
              activeOpacity={0.85}
              disabled={loadingOptimize}
            >
              {loadingOptimize
                ? <><ActivityIndicator size="small" color="#fff" /><Text style={styles.primaryBtnText}>Optimisation…</Text></>
                : <><Ionicons name="color-wand-outline" size={17} color="#fff" /><Text style={styles.primaryBtnText}>Générer mon CV canadien</Text></>
              }
            </TouchableOpacity>

            {/* Résultat optimisé */}
            {optimizedRaw && (
              <View style={styles.resultBox}>
                <View style={styles.resultHeader}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  <Text style={styles.resultTitle}>CV optimisé généré ✓</Text>
                </View>
                <Text style={styles.resultSub}>Pour la mise en page complète et le téléchargement PDF, ouvrez la version web.</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Text style={styles.rawPre}>{optimizedRaw}</Text>
                </ScrollView>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.offWhite },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingBottom: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn:     { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgLight },
  resetBtn:    { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgLight },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '600', color: Colors.text },

  scroll: { padding: 16, gap: 14, paddingBottom: 50 },

  banner: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 12, elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
  },
  bannerIcon:  { width: 50, height: 50, borderRadius: 14, backgroundColor: Colors.bgLight, alignItems: 'center', justifyContent: 'center' },
  bannerTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  bannerSub:   { fontSize: 12, color: Colors.textMuted, lineHeight: 17, marginTop: 2 },

  sectionTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  sectionSub:   { fontSize: 12, color: Colors.textMuted, lineHeight: 17, marginTop: -8 },

  tipRow:     { flexDirection: 'row', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'flex-start', elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4 },
  tipIconWrap:{ width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.bgLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tipTitle:   { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  tipDesc:    { fontSize: 12, color: Colors.textMuted, lineHeight: 17 },

  cvInput: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border, padding: 12, minHeight: 160,
    fontSize: 13, color: Colors.text, lineHeight: 19,
  },
  inputField: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border, padding: 12, fontSize: 13, color: Colors.text,
  },

  errorBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', borderRadius: 10, padding: 12 },
  errorText: { flex: 1, fontSize: 13, color: Colors.error },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, gap: 8,
  },
  btnDisabled:    { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  importBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14,
    borderWidth: 1.5, borderColor: Colors.primary, borderStyle: 'dashed',
  },
  importBtnText: { flex: 1, fontSize: 13, fontWeight: '500', color: Colors.primary },

  // Résultats analyse
  scoreCard: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14,
    padding: 18, alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: Colors.border,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
  },
  analysisLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', color: Colors.textMuted, letterSpacing: 0.8 },
  analysisName:  { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 2 },
  analysisExp:   { fontSize: 12, color: Colors.textMuted, marginTop: 3 },
  scoreBadge:    { alignItems: 'flex-end' },
  scoreLabel:    { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', color: Colors.primary, letterSpacing: 0.8 },
  scoreValue:    { fontSize: 30, fontWeight: '800', color: Colors.primary },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: Colors.border, elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4 },
  cardOrange:  { borderColor: 'rgba(255,148,8,0.25)', backgroundColor: 'rgba(255,148,8,0.04)' },
  cardTitle:   { fontSize: 13, fontWeight: '600', color: Colors.text },
  tagsWrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  tag:         { paddingVertical: 4, paddingHorizontal: 12, backgroundColor: Colors.bgLight, borderRadius: 999, borderWidth: 1, borderColor: Colors.border },
  tagOrange:   { backgroundColor: 'rgba(255,148,8,0.1)', borderColor: 'rgba(255,148,8,0.3)' },
  tagText:     { fontSize: 12, color: Colors.text },
  suggText:    { fontSize: 13, color: Colors.text, lineHeight: 19 },

  resultBox:    { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#d1fae5', padding: 14, gap: 10 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultTitle:  { fontSize: 14, fontWeight: '600', color: Colors.text },
  resultSub:    { fontSize: 12, color: Colors.textMuted, lineHeight: 17 },
  rawPre:       { fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: '#555', lineHeight: 17 },
});
