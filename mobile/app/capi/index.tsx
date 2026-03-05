import React from 'react';
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

const MOTIFS: {
  id: CapiMotif;
  emoji: string;
  label: string;
  desc: string;
}[] = [
  { id: 'visiter', emoji: '✈️', label: 'Visiter', desc: 'Voyage touristique, visite famille' },
  { id: 'travailler', emoji: '💼', label: 'Travailler', desc: 'Permis de travail, transfert intra-entreprise' },
  { id: 'etudier', emoji: '🎓', label: 'Étudier', desc: 'Permis d\'étudiant, programme universitaire' },
  { id: 'residence_permanente', emoji: '🏡', label: 'Résidence permanente', desc: 'Entrée Express, PNP, RNIP…' },
  { id: 'famille', emoji: '👨‍👩‍👧', label: 'Regroupement familial', desc: 'Parrainage conjoint ou enfant' },
  { id: 'entreprendre', emoji: '🚀', label: 'Entreprendre', desc: 'Visa entrepreneur, démarrer une entreprise' },
  { id: 'regularisation', emoji: '⚖️', label: 'Régularisation / Recours', desc: 'Demande humanitaire, appel, prolongation' },
];

const STEP_PROGRESS = 1 / 8;

export default function CapiMotifScreen() {
  const router = useRouter();
  const { updateSession } = useCapiSession();

  const select = (motif: CapiMotif) => {
    updateSession({ motif, step: 2, profile: undefined, evaluation: undefined, services: undefined, timeline: undefined });
    router.push('/capi/programme');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
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
        {/* CAPI Avatar */}
        <View style={styles.capiHeader}>
          <CapiAvatar size={44} state="idle" />
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>Bonjour ! Je suis CAPI, votre agent d'orientation immigration.{'\n\n'}Commençons par le plus important :</Text>
          </View>
        </View>

        <Text style={styles.question}>Quel est votre projet au Canada ?</Text>

        <View style={styles.options}>
          {MOTIFS.map(m => (
            <TouchableOpacity
              key={m.id}
              style={styles.optionCard}
              onPress={() => select(m.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.optionEmoji}>{m.emoji}</Text>
              <View style={styles.optionText}>
                <Text style={styles.optionLabel}>{m.label}</Text>
                <Text style={styles.optionDesc}>{m.desc}</Text>
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
  optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 16, gap: 14, borderWidth: 1, borderColor: Colors.border, ...UI.cardShadow },
  optionEmoji: { fontSize: 26 },
  optionText: { flex: 1 },
  optionLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  optionDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});
