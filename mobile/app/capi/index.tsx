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
import { CapiAvatar } from '../../components/CapiAvatar';

const STEP_PROGRESS = 1 / 8;

export default function CapiMotifScreen() {
  const router = useRouter();
  const { updateSession } = useCapiSession();

  const selectWhere = (where: 'inside' | 'outside') => {
    updateSession({
      where,
      arrivalStage: undefined,
      arrivalChecklist: undefined,
      step: 1,
      motif: undefined,
      programme: undefined,
      profile: undefined,
      evaluation: undefined,
      services: undefined,
      timeline: undefined,
      advisor: undefined,
    });
    router.push('/capi/objectif' as any);
  };

  const selectNewcomer = () => {
    updateSession({
      where: undefined,
      arrivalStage: undefined,
      arrivalChecklist: undefined,
      step: 1,
      motif: undefined,
      programme: undefined,
      profile: undefined,
      evaluation: undefined,
      services: undefined,
      timeline: undefined,
      advisor: undefined,
    });
    router.push('/capi/nouvel-arrivant' as any);
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
            <Text style={styles.bubbleText}>Bonjour ! Je suis CAPI, votre agent d'orientation immigration.{"\n\n"}Pour mieux vous orienter, j'ai d'abord une question :</Text>
          </View>
        </View>

        <Text style={styles.question}>Où vous trouvez-vous actuellement ?</Text>

        <View style={styles.options}>
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => selectWhere('outside')}
            activeOpacity={0.8}
          >
            <Text style={styles.optionEmoji}>🌍</Text>
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>À l'extérieur du Canada</Text>
              <Text style={styles.optionDesc}>Je vis actuellement dans un autre pays et je souhaite venir au Canada.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={selectNewcomer}
            activeOpacity={0.8}
          >
            <Text style={styles.optionEmoji}>🧳</Text>
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>Nouvel arrivant</Text>
              <Text style={styles.optionDesc}>Je viens d’arriver au Canada (ou j’arrive bientôt) et je veux suivre les étapes d’intégration.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => selectWhere('inside')}
            activeOpacity={0.8}
          >
            <Text style={styles.optionEmoji}>📍</Text>
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>À l'intérieur du Canada</Text>
              <Text style={styles.optionDesc}>Je suis déjà au Canada (visiteur, étudiant, travailleur) et je veux changer mon statut.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
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
