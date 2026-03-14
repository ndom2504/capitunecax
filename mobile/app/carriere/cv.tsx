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
const CV_SERVICES = [
  { id: 'cv_canada',      icon: '🍁', label: 'CV Canada',        price: 10 },
  { id: 'cv_quebec',      icon: '⚜️', label: 'CV Québec',        price: 10 },
  { id: 'cv_etudiant',    icon: '🎓', label: 'CV Étudiant',      price: 8  },
  { id: 'cv_immigration', icon: '✈️', label: 'CV Immigration',   price: 12 },
  { id: 'cover_letter',   icon: '✉️', label: 'Lettre motivation',price: 10 },
  { id: 'letter_ircc',    icon: '🏛️', label: 'Lettre IRCC',     price: 15 },
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
  const [importedB64,     setImportedB64]      = useState<string>('');
  const [importedMime,    setImportedMime]     = useState<string>('');
  const [loadingFile,     setLoadingFile]      = useState(false);
  const [analysis,        setAnalysis]         = useState<Analysis | null>(null);
  const [optimizedRaw,    setOptimizedRaw]     = useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis]  = useState(false);
  const [loadingOptimize, setLoadingOptimize]  = useState(false);
  const [error,           setError]            = useState<string | null>(null);
  const [step,            setStep]             = useState<'input' | 'result'>('input');
  const [service,         setService]          = useState('cv_canada');
  const [coverLetter,     setCoverLetter]      = useState<any>(null);
  const [loadingCoverLetter, setLoadingCoverLetter] = useState(false);
  const [showCoverLetter, setShowCoverLetter]  = useState(false);

  // ── Import fichier ────────────────────────────────────────────────────────
  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      const ext   = asset.name.split('.').pop()?.toLowerCase() ?? '';
      const mime  = asset.mimeType ?? '';
      setLoadingFile(true);
      if (['txt', 'text', 'md', 'csv'].includes(ext)) {
        const text = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
        if (!text.trim()) { Alert.alert('Fichier vide', 'Le fichier ne contient pas de texte lisible.'); return; }
        setCvText(text); setImportedFile(asset.name); setImportedB64(''); setImportedMime('');
      } else if (['pdf', 'docx', 'doc'].includes(ext)) {
        const b64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
        setImportedB64(b64);
        setImportedMime(mime || (ext === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'));
        setImportedFile(asset.name); setCvText('');
      } else {
        Alert.alert('Format non supporté', 'Formats acceptés : PDF, DOCX, TXT.');
        return;
      }
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Impossible de lire le fichier.');
    } finally {
      setLoadingFile(false);
    }
  };

  // construit le body commun selon la source (texte vs fichier)
  const buildBody = (extra: Record<string, unknown>) => {
    if (importedB64) {
      return { fileBase64: importedB64, mimeType: importedMime, fileName: importedFile ?? 'cv', service, ...extra };
    }
    return { cvText, service, ...extra };
  };

  // ── Analyse ────────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!cvText.trim() && !importedB64) {
      Alert.alert('Champ vide', 'Importez un fichier ou collez le texte de votre CV.');
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
        body:    JSON.stringify({ task: 'analyze', ...buildBody({}) }),
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
    if (!cvText.trim() && !importedB64) return;
    setLoadingOptimize(true);
    setError(null);
    try {
      const res = await fetch(CV_API, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          task: 'optimize',
          ...buildBody({ targetJob, suggestions: analysis?.suggestions ?? '' }),
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
    setImportedB64(''); setImportedMime('');
    setCoverLetter(null); setShowCoverLetter(false);
  };

  // ── Lettre de motivation ───────────────────────────────────────────────────
  const handleCoverLetter = async () => {
    if (!cvText.trim()) return;
    setLoadingCoverLetter(true);
    setError(null);
    try {
      const res = await fetch(CV_API, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ task: 'cover_letter', ...buildBody({ targetJob }) }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCoverLetter(data);
      setShowCoverLetter(true);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur inconnue');
    } finally {
      setLoadingCoverLetter(false);
    }
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
            {/* Sélecteur de service */}
            <Text style={styles.sectionTitle}>🔧 Type de service</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 4 }}>
                {CV_SERVICES.map(s => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.serviceChip, service === s.id && styles.serviceChipActive]}
                    onPress={() => setService(s.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.serviceChipIcon}>{s.icon}</Text>
                    <View>
                      <Text style={[styles.serviceChipLabel, service === s.id && { color: Colors.primary }]}>{s.label}</Text>
                      <Text style={styles.serviceChipPrice}>{Math.round(s.price / 5)}$/forfait · {s.price}$ sans</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

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
                {importedFile
                  ? `📎 ${importedFile}`
                  : 'Importer un fichier (PDF, DOCX, TXT)'}
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
              style={[styles.primaryBtn, (!cvText.trim() && !importedB64 || loadingAnalysis) && styles.btnDisabled]}
              onPress={handleAnalyze}
              activeOpacity={0.85}
              disabled={(!cvText.trim() && !importedB64) || loadingAnalysis}
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

            {/* ATS */}
            {analysis.ats_score !== undefined && (
              <View style={styles.card}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
                  <View>
                    <Text style={styles.analysisLabel}>Score ATS</Text>
                    <Text style={[
                      styles.scoreValue,
                      { color: analysis.ats_score >= 70 ? '#22c55e' : analysis.ats_score >= 50 ? Colors.primary : '#ef4444' }
                    ]}>{analysis.ats_score}%</Text>
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
              value={targetJob}
              onChangeText={setTargetJob}
            />
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: '#1e3a5f' }, loadingCoverLetter && styles.btnDisabled]}
              onPress={handleCoverLetter}
              activeOpacity={0.85}
              disabled={loadingCoverLetter}
            >
              {loadingCoverLetter
                ? <><ActivityIndicator size="small" color="#fff" /><Text style={styles.primaryBtnText}>Génération…</Text></>
                : <><Ionicons name="mail-outline" size={17} color="#fff" /><Text style={styles.primaryBtnText}>Générer la lettre</Text></>
              }
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

  // Services
  serviceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  serviceChipActive: { borderColor: Colors.primary, backgroundColor: 'rgba(31,75,110,0.05)' },
  serviceChipIcon:   { fontSize: 18 },
  serviceChipLabel:  { fontSize: 12, fontWeight: '600', color: Colors.text },
  serviceChipPrice:  { fontSize: 10, color: Colors.textMuted, marginTop: 1 },

  // ATS tag rouge
  tagRed: { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' },

  // Lettre de motivation
  coverLetterBox:     { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  coverLetterHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: '#fafafa', borderBottomWidth: 1, borderBottomColor: Colors.border },
  coverLetterSubject: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.text },
  coverLetterBody:    { padding: 16, gap: 12 },
  coverLetterText:    { fontSize: 13, color: '#444', lineHeight: 20 },
});
