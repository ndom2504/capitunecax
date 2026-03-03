import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useCapiSession } from '../../context/CapiContext';
import type { CapiEvaluation } from '../../lib/api';

// Évaluation locale heuristique (fallback si pas d'API)
function computeEvaluation(profile: NonNullable<ReturnType<typeof useCapiSession>['session']['profile']>): CapiEvaluation {
  let score = 50;
  const risques: string[] = [];
  const points: string[] = [];

  // Diplôme
  const diplomes = ['Baccalauréat', 'Maîtrise', 'Doctorat'];
  if (diplomes.includes(profile.diplome ?? '')) { score += 10; points.push('Niveau d\'études élevé'); }
  else if (profile.diplome === 'Technique / DEP') { score += 5; }
  else { risques.push('Niveau de diplôme peu compétitif pour certains programmes'); }

  // Expérience
  if ((profile.experience ?? 0) >= 3) { score += 10; points.push('Expérience professionnelle solide'); }
  else if ((profile.experience ?? 0) === 0) { risques.push('Aucune expérience professionnelle déclarée'); }

  // Langues
  const hasEn = (profile.langues ?? []).includes('Anglais');
  const hasFr = (profile.langues ?? []).includes('Français');
  if (hasEn && hasFr) { score += 15; points.push('Bilinguisme français-anglais — atout majeur'); }
  else if (hasEn || hasFr) { score += 8; points.push('Compétences linguistiques acceptables'); }
  else { score -= 5; risques.push('Absence de français ou anglais — obstacle critique'); }

  // Refus
  if (profile.refusAnterieur) { score -= 10; risques.push('Refus antérieur — justification requise'); }
  else { points.push('Pas de refus antérieur'); }

  // Délai
  if (profile.delai === 'urgent') { risques.push('Délai urgent — certains programmes nécessitent 6-24 mois'); score -= 5; }

  const clampedScore = Math.min(95, Math.max(20, score));

  let complexite: CapiEvaluation['complexite'] = 'moyenne';
  if (clampedScore >= 75) complexite = 'faible';
  else if (clampedScore < 50) complexite = 'elevee';

  const DELAI_LABELS: Record<string, string> = {
    visiter: '2-8 semaines',
    travailler: '4-12 semaines',
    etudier: '4-12 semaines',
    residence_permanente: '6-24 mois',
    famille: '12-24 mois',
    entreprendre: '12-36 mois',
    regularisation: '12-48 mois',
  };

  return {
    faisabilite: clampedScore,
    complexite,
    delaiEstime: DELAI_LABELS[profile.motif] ?? '6-12 mois',
    risques,
    points_forts: points,
    disclaimer: 'Cette analyse est indicative. Un conseiller Capitune validera votre profil avant toute soumission officielle.',
  };
}

const COMPLEXITE_CFG = {
  faible:  { label: 'Faible', color: Colors.success, bg: '#dcfce7' },
  moyenne: { label: 'Moyen', color: Colors.warning, bg: '#fef3c7' },
  elevee:  { label: 'Élevée', color: Colors.error, bg: '#fee2e2' },
};

function ScoreCircle({ value }: { value: number }) {
  const color = value >= 70 ? Colors.success : value >= 50 ? Colors.warning : Colors.error;
  return (
    <View style={[scoreStyles.circle, { borderColor: color }]}>
      <Text style={[scoreStyles.value, { color }]}>{value}%</Text>
      <Text style={scoreStyles.label}>Faisabilité</Text>
    </View>
  );
}
const scoreStyles = StyleSheet.create({
  circle: { width: 110, height: 110, borderRadius: 55, borderWidth: 6, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface },
  value: { fontSize: 28, fontWeight: '800' },
  label: { fontSize: 11, color: Colors.textMuted },
});

export default function CapiEvaluationScreen() {
  const router = useRouter();
  const { session, updateSession } = useCapiSession();
  const [evaluation, setEvaluation] = useState<CapiEvaluation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulation délai IA (0.8s) puis calcul heuristique local
    const timer = setTimeout(() => {
      if (session.profile) {
        const result = computeEvaluation(session.profile);
        setEvaluation(result);
        updateSession({ evaluation: result });
      }
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const next = () => {
    router.push('/capi/services');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.progressBarOuter}>
          <View style={[styles.progressBarInner, { width: '50%' }]} />
        </View>
        <Text style={styles.stepLabel}>4 / 8</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.orange} />
          <Text style={styles.loadingText}>CAPI analyse votre profil…</Text>
          <Text style={styles.loadingSubtext}>Calcul de votre score de faisabilité</Text>
        </View>
      ) : evaluation ? (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.capiHeader}>
            <View style={styles.capiAvatar}><Text style={styles.capiEmoji}>🤖</Text></View>
            <View style={styles.bubble}>
              <Text style={styles.bubbleText}>J'ai analysé votre profil ! Voici le résultat de mon évaluation :</Text>
            </View>
          </View>

          {/* Score + complexité */}
          <View style={styles.scoreRow}>
            <ScoreCircle value={evaluation.faisabilite} />
            <View style={styles.scoreRight}>
              <View style={[styles.complexiteBadge, { backgroundColor: COMPLEXITE_CFG[evaluation.complexite].bg }]}>
                <Text style={[styles.complexiteText, { color: COMPLEXITE_CFG[evaluation.complexite].color }]}>
                  Complexité {COMPLEXITE_CFG[evaluation.complexite].label}
                </Text>
              </View>
              <View style={styles.delaiRow}>
                <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
                <Text style={styles.delaiText}>Délai estimé : <Text style={{ color: Colors.text, fontWeight: '600' }}>{evaluation.delaiEstime}</Text></Text>
              </View>
            </View>
          </View>

          {/* Points forts */}
          {evaluation.points_forts.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>✅ Points forts</Text>
              {evaluation.points_forts.map((p, i) => (
                <View key={i} style={styles.listRow}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.listText}>{p}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Risques */}
          {evaluation.risques.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>⚠️ Points d'attention</Text>
              {evaluation.risques.map((r, i) => (
                <View key={i} style={styles.listRow}>
                  <Ionicons name="alert-circle" size={16} color={Colors.warning} />
                  <Text style={styles.listText}>{r}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Disclaimer */}
          <View style={styles.disclaimer}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.disclaimerText}>{evaluation.disclaimer}</Text>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      ) : null}

      {!loading && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.nextBtn} onPress={next} activeOpacity={0.85}>
            <Text style={styles.nextBtnText}>Voir les services recommandés</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.dark },
  scroll: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  progressBarOuter: { flex: 1, height: 4, backgroundColor: Colors.border, borderRadius: 2 },
  progressBarInner: { height: 4, backgroundColor: Colors.orange, borderRadius: 2 },
  stepLabel: { fontSize: 12, color: Colors.textMuted, minWidth: 32 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  loadingText: { fontSize: 16, fontWeight: '600', color: Colors.text },
  loadingSubtext: { fontSize: 13, color: Colors.textMuted },
  capiHeader: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20, gap: 12, alignItems: 'flex-start' },
  capiAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.orange + '25', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  capiEmoji: { fontSize: 22 },
  bubble: { flex: 1, backgroundColor: Colors.surface, borderRadius: 16, borderTopLeftRadius: 4, padding: 14 },
  bubbleText: { fontSize: 14, color: Colors.text, lineHeight: 21 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 20, marginBottom: 20 },
  scoreRight: { flex: 1, gap: 12 },
  complexiteBadge: { borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14, alignSelf: 'flex-start' },
  complexiteText: { fontSize: 13, fontWeight: '600' },
  delaiRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  delaiText: { fontSize: 13, color: Colors.textMuted },
  card: { marginHorizontal: 20, backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  listText: { fontSize: 13, color: Colors.textSecondary, flex: 1, lineHeight: 19 },
  disclaimer: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginTop: 4 },
  disclaimerText: { fontSize: 12, color: Colors.textMuted, flex: 1, lineHeight: 18, fontStyle: 'italic' },
  footer: { padding: 20, paddingBottom: 28 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.orange, borderRadius: 14, paddingVertical: 16, gap: 8 },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
