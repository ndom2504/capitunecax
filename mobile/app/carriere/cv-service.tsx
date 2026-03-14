import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  TextInput, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Colors } from '../../constants/Colors';

const CV_API = 'https://www.capitune.com/api/cv-analyze';

const CV_SERVICES: Record<string, { icon: string; label: string; price: number; priceForfait: number }> = {
  cv_canada:      { icon: '🍁', label: 'CV Canada',         price: 10, priceForfait: 2 },
  cv_quebec:      { icon: '⚜️', label: 'CV Québec',         price: 10, priceForfait: 2 },
  cv_etudiant:    { icon: '🎓', label: 'CV Étudiant',       price: 8,  priceForfait: 2 },
  cv_immigration: { icon: '✈️', label: 'CV Immigration',    price: 12, priceForfait: 3 },
  cover_letter:   { icon: '✉️', label: 'Lettre motivation', price: 10, priceForfait: 2 },
  letter_ircc:    { icon: '🏛️', label: 'Lettre IRCC',      price: 15, priceForfait: 3 },
};

interface Analysis {
  name: string;
  experience_years: number;
  top_skills: string[];
  recommended_programs: string[];
  compatibility_score: number;
  ats_score?: number;
  missing_keywords?: string[];
  suggestions: string;
}

export default function CvServiceScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const params  = useLocalSearchParams<{ service?: string }>();
  const service = params.service ?? 'cv_canada';
  const svc     = CV_SERVICES[service] ?? CV_SERVICES.cv_canada;

  const [cvText,            setCvText]            = useState('');
  const [targetJob,         setTargetJob]          = useState('');
  const [importedFile,      setImportedFile]       = useState<string | null>(null);
  const [importedB64,       setImportedB64]        = useState<string>('');
  const [importedMime,      setImportedMime]       = useState<string>('');
  const [loadingFile,       setLoadingFile]        = useState(false);
  const [analysis,          setAnalysis]           = useState<Analysis | null>(null);
  const [optimizedRaw,      setOptimizedRaw]       = useState<string | null>(null);
  const [loadingAnalysis,   setLoadingAnalysis]    = useState(false);
  const [loadingOptimize,   setLoadingOptimize]    = useState(false);
  const [error,             setError]              = useState<string | null>(null);
  const [step,              setStep]               = useState<'input' | 'result'>('input');
  const [coverLetter,       setCoverLetter]        = useState<any>(null);
  const [loadingCoverLetter, setLoadingCoverLetter] = useState(false);
  const [showCoverLetter,   setShowCoverLetter]    = useState(false);

  // ── Import fichier ─────────────────────────────────────────────────────────
  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['*/*'], copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      const ext   = asset.name.split('.').pop()?.toLowerCase() ?? '';
      const mime  = asset.mimeType ?? '';
      setLoadingFile(true);
      if (['txt', 'text', 'md'].includes(ext)) {
        const text = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
        if (!text.trim()) { Alert.alert('Fichier vide', 'Le fichier ne contient pas de texte lisible.'); return; }
        setCvText(text); setImportedFile(asset.name); setImportedB64(''); setImportedMime('');
      } else if (['pdf', 'docx', 'doc'].includes(ext)) {
        const b64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
        setImportedB64(b64);
        setImportedMime(mime || (ext === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'));
        setImportedFile(asset.name); setCvText('');
      } else {
        Alert.alert('Format non supporté', 'Formats acceptés : PDF, DOCX, TXT.'); return;
      }
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Impossible de lire le fichier.');
    } finally {
      setLoadingFile(false);
    }
  };

  const buildBody = (extra: Record<string, unknown>) => {
    if (importedB64) return { fileBase64: importedB64, mimeType: importedMime, fileName: importedFile ?? 'cv', service, ...extra };
    return { cvText, service, ...extra };
  };

  // ── Analyse ────────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!cvText.trim() && !importedB64) { Alert.alert('Champ vide', 'Importez un fichier ou collez le texte de votre CV.'); return; }
    setLoadingAnalysis(true); setError(null); setAnalysis(null); setOptimizedRaw(null);
    try {
      const res  = await fetch(CV_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task: 'analyze', ...buildBody({}) }) });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data); setStep('result');
    } catch (e: any) { setError(e?.message ?? 'Erreur inconnue'); }
    finally { setLoadingAnalysis(false); }
  };

  // ── Optimisation ───────────────────────────────────────────────────────────
  const handleOptimize = async () => {
    if (!cvText.trim() && !importedB64) return;
    setLoadingOptimize(true); setError(null);
    try {
      const res  = await fetch(CV_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task: 'optimize', ...buildBody({ targetJob, suggestions: analysis?.suggestions ?? '' }) }) });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setOptimizedRaw(JSON.stringify(data, null, 2));
    } catch (e: any) { setError(e?.message ?? 'Erreur inconnue'); }
    finally { setLoadingOptimize(false); }
  };

  // ── Lettre ─────────────────────────────────────────────────────────────────
  const handleCoverLetter = async () => {
    if (!cvText.trim() && !importedB64) return;
    setLoadingCoverLetter(true); setError(null);
    try {
      const res  = await fetch(CV_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task: 'cover_letter', ...buildBody({ targetJob }) }) });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCoverLetter(data); setShowCoverLetter(true);
    } catch (e: any) { setError(e?.message ?? 'Erreur inconnue'); }
    finally { setLoadingCoverLetter(false); }
  };

  const handleReset = () => {
    setCvText(''); setTargetJob(''); setAnalysis(null); setOptimizedRaw(null);
    setError(null); setStep('input'); setImportedFile(null);
    setImportedB64(''); setImportedMime(''); setCoverLetter(null); setShowCoverLetter(false);
  };

  // ── Paywall ────────────────────────────────────────────────────────────────
  const handleDownload = () => {
    Alert.alert(
      '🔒 Forfait requis',
      `Téléchargez votre document généré en activant un forfait Capitune.\n\nÀ partir de ${svc.priceForfait}$/service avec forfait — vs ${svc.price}$ sans.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: '🎯 Voir les forfaits', onPress: () => router.push('/(tabs)/projet') },
      ]
    );
  };

  // ── RENDU ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{svc.icon} {svc.label}</Text>
        {step === 'result' ? (
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        ) : <View style={styles.resetBtn} />}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Étape 1 : Saisie ── */}
        {step === 'input' && (
          <>
            {/* Badge service */}
            <View style={styles.serviceBadge}>
              <Text style={styles.serviceBadgeIcon}>{svc.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceBadgeLabel}>{svc.label}</Text>
                <Text style={styles.serviceBadgePrice}>{svc.priceForfait}$/service avec forfait · {svc.price}$ sans forfait</Text>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 4 }]}>📄 Votre CV</Text>
            <Text style={styles.sectionSub}>Importez un fichier ou collez le texte ci-dessous.</Text>

            {/* Bouton import */}
            <TouchableOpacity style={styles.importBtn} onPress={handlePickFile} activeOpacity={0.8} disabled={loadingFile}>
              {loadingFile
                ? <ActivityIndicator size="small" color={Colors.primary} />
                : <Ionicons name="cloud-upload-outline" size={18} color={Colors.primary} />}
              <Text style={styles.importBtnText}>
                {importedFile ? `📎 ${importedFile}` : 'Importer un fichier (PDF, DOCX, TXT)'}
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
              multiline numberOfLines={10}
              value={cvText} onChangeText={setCvText}
              textAlignVertical="top"
            />

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="warning-outline" size={18} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryBtn, ((!cvText.trim() && !importedB64) || loadingAnalysis) && styles.btnDisabled]}
              onPress={handleAnalyze} activeOpacity={0.85}
              disabled={(!cvText.trim() && !importedB64) || loadingAnalysis}
            >
              {loadingAnalysis
                ? <><ActivityIndicator size="small" color="#fff" /><Text style={styles.primaryBtnText}>Analyse en cours…</Text></>
                : <><Ionicons name="sparkles-outline" size={17} color="#fff" /><Text style={styles.primaryBtnText}>✨ Analyser mon CV</Text></>}
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

            {/* ATS */}
            {analysis.ats_score !== undefined && (
              <View style={styles.card}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
                  <View>
                    <Text style={styles.analysisLabel}>Score ATS</Text>
                    <Text style={[styles.scoreValue, { color: analysis.ats_score >= 70 ? '#22c55e' : analysis.ats_score >= 50 ? Colors.primary : '#ef4444' }]}>{analysis.ats_score}%</Text>
                  </View>
                  {(analysis.missing_keywords ?? []).length > 0 && (
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>Mots-clés manquants</Text>
                      <View style={[styles.tagsWrap, { marginTop: 8 }]}>
                        {(analysis.missing_keywords ?? []).map((k: string, i: number) => (
                          <View key={i} style={[styles.tag, styles.tagRed]}><Text style={[styles.tagText, { color: '#ef4444' }]}>{k}</Text></View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Lettre de motivation */}
            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>✉️ Lettre de motivation</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Poste visé (facultatif)…"
              placeholderTextColor={Colors.textMuted}
              value={targetJob} onChangeText={setTargetJob}
            />
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: '#1e3a5f' }, loadingCoverLetter && styles.btnDisabled]}
              onPress={handleCoverLetter} activeOpacity={0.85} disabled={loadingCoverLetter}
            >
              {loadingCoverLetter
                ? <><ActivityIndicator size="small" color="#fff" /><Text style={styles.primaryBtnText}>Génération…</Text></>
                : <><Ionicons name="mail-outline" size={17} color="#fff" /><Text style={styles.primaryBtnText}>Générer la lettre</Text></>}
            </TouchableOpacity>

            {coverLetter && (
              <View style={styles.coverLetterBox}>
                <TouchableOpacity style={styles.coverLetterHeader} onPress={() => setShowCoverLetter(!showCoverLetter)} activeOpacity={0.8}>
                  <Text style={styles.coverLetterSubject}>{coverLetter.subject}</Text>
                  <Ionicons name={showCoverLetter ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textMuted} />
                </TouchableOpacity>
                {showCoverLetter && (
                  <View style={styles.coverLetterBody}>
                    <Text style={styles.coverLetterText}>{coverLetter.greeting}</Text>
                    <Text style={styles.coverLetterText}>{coverLetter.intro}</Text>
                    <Text style={styles.coverLetterText}>{coverLetter.body}</Text>
                    <Text style={styles.coverLetterText}>{coverLetter.closing}</Text>
                    <Text style={styles.coverLetterText}>{coverLetter.signature}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Section optimisation */}
            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>🪄 Optimisation CV</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Ex : Développeur, Infirmier, Comptable…"
              placeholderTextColor={Colors.textMuted}
              value={targetJob} onChangeText={setTargetJob}
            />

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="warning-outline" size={18} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryBtn, loadingOptimize && styles.btnDisabled]}
              onPress={handleOptimize} activeOpacity={0.85} disabled={loadingOptimize}
            >
              {loadingOptimize
                ? <><ActivityIndicator size="small" color="#fff" /><Text style={styles.primaryBtnText}>Optimisation…</Text></>
                : <><Ionicons name="color-wand-outline" size={17} color="#fff" /><Text style={styles.primaryBtnText}>✨ Générer mon CV optimisé</Text></>}
            </TouchableOpacity>

            {/* Résultat optimisé + paywall */}
            {optimizedRaw && (
              <View style={styles.resultBox}>
                <View style={styles.resultHeader}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  <Text style={styles.resultTitle}>CV optimisé généré ✓</Text>
                </View>
                <Text style={styles.resultSub}>Aperçu de votre document IA — activez un forfait pour télécharger en PDF.</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Text style={styles.rawPre}>{optimizedRaw}</Text>
                </ScrollView>
                {/* ── Paywall ── */}
                <TouchableOpacity style={styles.paywallBtn} onPress={handleDownload} activeOpacity={0.85}>
                  <Ionicons name="lock-closed-outline" size={16} color="#fff" />
                  <Text style={styles.paywallBtnText}>Télécharger le PDF — {svc.priceForfait}$/forfait</Text>
                </TouchableOpacity>
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

  scroll: { padding: 16, gap: 14, paddingBottom: 60 },

  serviceBadge: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 12, elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
  },
  serviceBadgeIcon:  { fontSize: 32 },
  serviceBadgeLabel: { fontSize: 15, fontWeight: '700', color: Colors.text },
  serviceBadgePrice: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  sectionTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  sectionSub:   { fontSize: 12, color: Colors.textMuted, lineHeight: 17, marginTop: -8 },

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

  primaryBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, gap: 8 },
  btnDisabled:    { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  importBtn:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1.5, borderColor: Colors.primary, borderStyle: 'dashed' },
  importBtnText: { flex: 1, fontSize: 13, fontWeight: '500', color: Colors.primary },

  scoreCard:    { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 18, alignItems: 'center', gap: 12 },
  scoreBadge:   { alignItems: 'center', backgroundColor: '#f0f7ff', borderRadius: 12, padding: 12, minWidth: 70 },
  scoreLabel:   { fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  scoreValue:   { fontSize: 26, fontWeight: '900', color: Colors.primary },
  analysisLabel:{ fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  analysisName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  analysisExp:  { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  card:        { backgroundColor: '#fff', borderRadius: 14, padding: 16 },
  cardOrange:  { backgroundColor: '#fff9f2' },
  cardTitle:   { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  suggText:    { fontSize: 13, color: Colors.text, lineHeight: 19 },

  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:      { backgroundColor: Colors.bgLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  tagOrange:{ backgroundColor: '#fff3e0' },
  tagRed:   { backgroundColor: '#fef2f2' },
  tagText:  { fontSize: 12, fontWeight: '500', color: Colors.text },

  coverLetterBox:     { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden' },
  coverLetterHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  coverLetterSubject: { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.text },
  coverLetterBody:    { padding: 14, paddingTop: 0, gap: 6 },
  coverLetterText:    { fontSize: 13, color: Colors.text, lineHeight: 19 },

  resultBox:    { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 12 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultTitle:  { fontSize: 14, fontWeight: '700', color: Colors.success ?? '#22c55e' },
  resultSub:    { fontSize: 12, color: Colors.textMuted, lineHeight: 17 },
  rawPre:       { fontSize: 11, color: Colors.text, fontFamily: 'monospace', lineHeight: 16, padding: 8, backgroundColor: Colors.bgLight, borderRadius: 8 },

  paywallBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ff9408', borderRadius: 12, paddingVertical: 13, gap: 8, marginTop: 4 },
  paywallBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
