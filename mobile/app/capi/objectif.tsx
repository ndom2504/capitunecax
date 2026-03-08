import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { UI } from '../../constants/UI';
import { useCapiSession } from '../../context/CapiContext';
import type { CapiMotif } from '../../lib/api';
import { CapiAvatar } from '../../components/CapiAvatar';

const STEP_PROGRESS = 1 / 8;

type ObjectiveOption = {
  id: string;
  motif: CapiMotif;
  programmeId?: string;
  emoji: string;
  label: string;
  desc: string;
};

const OUTSIDE_OBJECTIVES: ObjectiveOption[] = [
  { id: 'visiter', motif: 'visiter', emoji: '✈️', label: 'Visiter / Tourisme', desc: 'Voyager ou visiter de la famille' },
  { id: 'travailler', motif: 'travailler', emoji: '💼', label: 'Travailler', desc: 'Permis de travail temporaire ou ouvert' },
  { id: 'etudier', motif: 'etudier', emoji: '🎓', label: 'Étudier', desc: 'Permis d’études, établissement canadien' },
  { id: 'residence_permanente', motif: 'residence_permanente', emoji: '🏡', label: 'Immigrer (Résidence permanente)', desc: 'Entrée Express, PNP, RNIP…' },
  { id: 'famille', motif: 'famille', emoji: '👨‍👩‍👧', label: 'Rejoindre la famille', desc: 'Parrainage conjoint ou enfant' },
  { id: 'entreprendre', motif: 'entreprendre', emoji: '🚀', label: 'Investir / Entreprendre', desc: 'Créer ou développer une entreprise' },
  {
    id: 'protection_refugie',
    motif: 'regularisation',
    emoji: '🛡️',
    label: 'Protection (réfugié / asile)',
    desc: 'Les demandes d’asile se font au Canada (à l’arrivée ou depuis le Canada). Depuis l’extérieur : réinstallation/parrainage.',
  },
  // NB: “Régularisation / Recours” est volontairement côté “intérieur du Canada” (orientation).
];

const INSIDE_OBJECTIVES: ObjectiveOption[] = [
  { id: 'prolonger', motif: 'visiter', programmeId: 'imm5708', emoji: '⏳', label: 'Prolonger mon séjour (visiteur)', desc: 'Extension du séjour visiteur au Canada (Visitor Record — IMM 5708)' },
  { id: 'renouv_etudes', motif: 'etudier', programmeId: 'imm5709', emoji: '🎓', label: 'Renouveler mon permis d’études', desc: 'Prorogation du permis d’études depuis le Canada (IMM 5709)' },
  { id: 'changer_statut', motif: 'travailler', emoji: '🔁', label: 'Changer de statut / permis', desc: 'Options courantes: PTPD (post‑diplôme) ou changement d’employeur (IMM 5710)' },
  { id: 'rp', motif: 'residence_permanente', emoji: '🏡', label: 'Devenir Résident Permanent', desc: 'Demander la RP depuis le Canada (CEC, PEQ…)' },
  { id: 'parrainer', motif: 'famille', emoji: '❤️', label: 'Parrainer un proche', desc: 'Faire venir un membre de la famille au Canada' },
  { id: 'asile_en_ligne', motif: 'regularisation', programmeId: 'asile_en_ligne', emoji: '🛡️', label: 'Demander l’asile', desc: 'Démarches en ligne depuis le Canada (selon votre situation)' },
  { id: 'recours', motif: 'regularisation', emoji: '⚖️', label: 'Régularisation / Recours', desc: 'Refus, appel, motifs humanitaires, situation complexe' },
  { id: 'retablir', motif: 'regularisation', programmeId: 'retablissement_statut', emoji: '🧾', label: 'Rétablir mon statut', desc: 'Statut expiré récemment : options de rétablissement / démarches urgentes' },
];

export default function CapiObjectifScreen() {
  const router = useRouter();
  const { session, updateSession } = useCapiSession();

  const where = session.where ?? null;

  const options = useMemo(() => {
    if (where === 'inside') return INSIDE_OBJECTIVES;
    return OUTSIDE_OBJECTIVES;
  }, [where]);

  const select = (opt: ObjectiveOption) => {
    updateSession({
      motif: opt.motif,
      step: 2,
      programme: opt.programmeId ?? undefined,
      profile: undefined,
      evaluation: undefined,
      services: undefined,
      timeline: undefined,
      advisor: undefined,
    });
    router.push('/capi/programme');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.progressBarOuter}>
          <View style={[styles.progressBarInner, { width: `${STEP_PROGRESS * 100}%` }]} />
        </View>
        <Text style={styles.stepLabel}>1 / 8</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.capiHeader}>
          <CapiAvatar size={44} state="idle" />
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>
              {where === 'inside'
                ? "Parfait. Vous êtes déjà au Canada — on va clarifier votre objectif principal."
                : where === 'outside'
                  ? "Parfait. Vous êtes à l’extérieur du Canada — on va clarifier votre objectif principal."
                  : "Choisissez votre objectif principal."}
            </Text>
          </View>
        </View>

        <Text style={styles.question}>Quel est votre objectif principal ?</Text>

        <View style={styles.options}>
          {options.map(o => (
            <TouchableOpacity
              key={o.id}
              style={styles.optionCard}
              onPress={() => select(o)}
              activeOpacity={0.8}
            >
              <Text style={styles.optionEmoji}>{o.emoji}</Text>
              <View style={styles.optionText}>
                <Text style={styles.optionLabel}>{o.label}</Text>
                <Text style={styles.optionDesc}>{o.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgLight },
  scroll: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  progressBarOuter: { flex: 1, height: 4, backgroundColor: Colors.border, borderRadius: 2 },
  progressBarInner: { height: 4, backgroundColor: Colors.orange, borderRadius: 2 },
  stepLabel: { fontSize: 12, color: Colors.textMuted, minWidth: 32, textAlign: 'right' },

  capiHeader: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20, gap: 12, alignItems: 'flex-start' },
  bubble: { flex: 1, backgroundColor: Colors.surface, borderRadius: 16, borderTopLeftRadius: 4, padding: 14 },
  bubbleText: { fontSize: 14, color: Colors.text, lineHeight: 21 },

  question: { fontSize: 20, fontWeight: '700', color: Colors.text, paddingHorizontal: 20, marginBottom: 16 },
  options: { paddingHorizontal: 20, gap: 10 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...UI.cardShadow,
  },
  optionEmoji: { fontSize: 26 },
  optionText: { flex: 1 },
  optionLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  optionDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});
