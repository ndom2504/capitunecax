import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { CapiAvatar } from '../../components/CapiAvatar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/Colors';
import { UI } from '../../constants/UI';
import { useCapiSession } from '../../context/CapiContext';
import { capiApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { buildLocalProjectFromCapiSession, LOCAL_PROJECT_KEY } from '../../lib/local-project';

const MOTIF_LABEL: Record<string, string> = {
  visiter: 'Visiter le Canada',
  travailler: 'Travailler au Canada',
  etudier: 'Étudier au Canada',
  residence_permanente: 'Résidence permanente',
  famille: 'Regroupement familial',
  entreprendre: 'Entreprendre au Canada',
  regularisation: 'Régularisation de statut',
};

export default function CapiActivationScreen() {
  const router = useRouter();
  const { session, resetSession } = useCapiSession();
  const { token } = useAuth();
  const [creating, setCreating] = useState(false);

  const recommendedServices = (session.services ?? []).filter(
    s => s.priorite === 'obligatoire' || s.priorite === 'recommande',
  );
  const score = session.evaluation?.faisabilite ?? 0;

  const activate = async () => {
    setCreating(true);
    try {
      const sessionToken = token ?? await AsyncStorage.getItem('auth_token');
      if (!sessionToken) {
        const localProject = buildLocalProjectFromCapiSession(session);
        await AsyncStorage.setItem(LOCAL_PROJECT_KEY, JSON.stringify(localProject));
        resetSession();
        router.replace('/(tabs)/projet');
        return;
      }

      const payload = {
        session,
        advisorId: session.advisor?.id,
        selectedServiceIds: recommendedServices.map(s => s.id),
      };
      const res = await capiApi.activateProject(sessionToken, payload);
      if (res.status < 200 || res.status >= 300) {
        throw new Error(res.error ?? 'Activation échouée');
      }

      // UX: afficher immédiatement un projet même si la sync backend prend du temps.
      const localProject = buildLocalProjectFromCapiSession(session);
      await AsyncStorage.setItem(LOCAL_PROJECT_KEY, JSON.stringify(localProject));

      resetSession();
      router.replace('/(tabs)/projet');
    } catch (err: any) {
      // Activation OK en mode hors-ligne (fallback)
      console.log('Activation backend skipped:', err.message);

      try {
        const localProject = buildLocalProjectFromCapiSession(session);
        await AsyncStorage.setItem(LOCAL_PROJECT_KEY, JSON.stringify(localProject));
      } catch {}

      resetSession();
      router.replace('/(tabs)/projet');
    } finally {
      setCreating(false);
    }
  };

  const scoreColor = score >= 70 ? Colors.success : score >= 50 ? Colors.warning : Colors.error;

  const SummaryRow = ({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) => (
    <View style={styles.summaryRow}>
      <View style={styles.summaryIcon}>
        <Ionicons name={icon} size={16} color={Colors.orange} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={styles.summaryValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.progressBarOuter}>
          <View style={styles.progressBarFull} />
        </View>
        <Text style={styles.stepLabel}>8 / 8</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Message CAPI */}
        <View style={styles.capiHeader}>
          <CapiAvatar size={44} state="idle" />
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>
              Votre projet est prêt ! Voici le <Text style={{ fontWeight: '700', color: Colors.orange }}>récapitulatif complet</Text> (à titre indicatif). Une fois activé, votre dossier sera créé et votre conseiller notifié.
            </Text>
          </View>
        </View>

        {/* Score faisabilité */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreLeft}>
            <Text style={styles.scoreTitle}>Score de faisabilité</Text>
            <Text style={styles.scoreSubtitle}>{session.evaluation?.complexite === 'faible' ? 'Dossier accessible' : session.evaluation?.complexite === 'moyenne' ? 'Dossier standard' : 'Dossier complexe'}</Text>
          </View>
          <View style={[styles.scoreBubble, { borderColor: scoreColor }]}>
            <Text style={[styles.scoreNum, { color: scoreColor }]}>{score}%</Text>
          </View>
        </View>

        {/* Résumé */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Récapitulatif du profil</Text>
          <View style={styles.summaryCard}>
            <SummaryRow icon="flag-outline" label="Objectif" value={MOTIF_LABEL[session.motif ?? ''] ?? session.motif ?? '—'} />
            <View style={styles.divider} />
            <SummaryRow icon="document-text-outline" label="Programme" value={session.programme ?? '—'} />
            <View style={styles.divider} />
            <SummaryRow icon="earth-outline" label="Nationalité" value={session.profile?.nationalite ?? '—'} />
            <View style={styles.divider} />
            <SummaryRow icon="location-outline" label="Province cible" value={session.profile?.province ?? '—'} />
            <View style={styles.divider} />
            <SummaryRow icon="school-outline" label="Diplôme" value={session.profile?.diplome ?? '—'} />
            <View style={styles.divider} />
            <SummaryRow icon="time-outline" label="Délai estimé" value={session.evaluation?.delaiEstime ?? '—'} />
          </View>
        </View>

        {/* Conseiller */}
        {session.advisor && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Votre conseiller</Text>
            <View style={styles.advisorCard}>
              <View style={styles.advisorAvatar}>
                <Text style={styles.advisorInitial}>{session.advisor.nom[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.advisorName}>{session.advisor.nom}</Text>
                <Text style={styles.advisorTitle}>{session.advisor.titre}</Text>
                <View style={styles.dispo}>
                  <View style={styles.dispoDot} />
                  <Text style={styles.dispoText}>{session.advisor.disponibilite}</Text>
                </View>
              </View>
              <View style={styles.matchBadge}>
                <Text style={styles.matchNum}>{session.advisor.score}%</Text>
                <Text style={styles.matchLabel}>match</Text>
              </View>
            </View>
          </View>
        )}

        {/* Services */}
        {recommendedServices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services recommandés ({recommendedServices.length})</Text>
            <View style={styles.servicesList}>
              {recommendedServices.map((s) => (
                <View key={s.id} style={styles.serviceRow}>
                  <View style={styles.serviceDot} />
                  <Text style={styles.serviceName} numberOfLines={1}>{s.nom}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Points forts */}
        {session.evaluation?.points_forts && session.evaluation.points_forts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Points forts du dossier</Text>
            <View style={styles.pointsList}>
              {session.evaluation.points_forts.map((p, i) => (
                <View key={i} style={styles.pointRow}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.pointText}>{p}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.activateBtn, creating && styles.activateBtnLoading]}
          onPress={activate}
          disabled={creating}
          activeOpacity={0.85}
        >
          {creating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="rocket-outline" size={20} color="#fff" />
              <Text style={styles.activateBtnText}>Créer mon projet</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.footerNote}>
          Votre dossier sera créé et votre conseiller sera notifié immédiatement.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgLight },
  scroll: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  progressBarOuter: { flex: 1, height: 4, backgroundColor: Colors.border, borderRadius: 2 },
  progressBarFull: { height: 4, backgroundColor: Colors.orange, borderRadius: 2, width: '100%' },
  stepLabel: { fontSize: 12, color: Colors.textMuted, minWidth: 32 },
  capiHeader: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 12, alignItems: 'flex-start' },

  bubble: { flex: 1, backgroundColor: Colors.surface, borderRadius: 16, borderTopLeftRadius: 4, padding: 14 },
  bubbleText: { fontSize: 14, color: Colors.text, lineHeight: 21 },
  scoreCard: { marginHorizontal: 20, backgroundColor: Colors.surface, borderRadius: 16, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, ...UI.cardBorder, ...UI.cardShadow },
  scoreLeft: { flex: 1 },
  scoreTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  scoreSubtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  scoreBubble: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
  scoreNum: { fontSize: 22, fontWeight: '800' },
  section: { marginHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  summaryCard: { backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden', ...UI.cardBorder, ...UI.cardShadow },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  summaryIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.orange + '16', justifyContent: 'center', alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
  summaryValue: { fontSize: 14, fontWeight: '600', color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 14 },
  advisorCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, ...UI.cardBorder, ...UI.cardShadow },
  advisorAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.orange + '25', justifyContent: 'center', alignItems: 'center' },
  advisorInitial: { fontSize: 24, fontWeight: '800', color: Colors.orange },
  advisorName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  advisorTitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  dispo: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  dispoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  dispoText: { fontSize: 11, color: Colors.success },
  matchBadge: { alignItems: 'center', backgroundColor: Colors.orange + '16', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 12 },
  matchNum: { fontSize: 18, fontWeight: '800', color: Colors.orange },
  matchLabel: { fontSize: 10, color: Colors.orange, fontWeight: '600' },
  servicesList: { backgroundColor: Colors.surface, borderRadius: 16, padding: 14, gap: 10, ...UI.cardBorder, ...UI.cardShadow },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  serviceDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.orange },
  serviceName: { flex: 1, fontSize: 13, color: Colors.text },
  servicePrice: { fontSize: 13, fontWeight: '700', color: Colors.text },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  totalLabel: { fontSize: 13, color: Colors.textMuted },
  totalAmount: { fontSize: 16, fontWeight: '800', color: Colors.orange },
  pointsList: { backgroundColor: Colors.surface, borderRadius: 16, padding: 14, gap: 10, ...UI.cardBorder, ...UI.cardShadow },
  pointRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  pointText: { fontSize: 13, color: Colors.text, flex: 1, lineHeight: 20 },
  footer: { padding: 20, paddingBottom: 28, gap: 10 },
  activateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.orange, borderRadius: 16, paddingVertical: 18, gap: 10 },
  activateBtnLoading: { opacity: 0.7 },
  activateBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  footerNote: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
});
