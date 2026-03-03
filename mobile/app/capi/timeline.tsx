import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useCapiSession } from '../../context/CapiContext';
import type { CapiMotif, CapiTimelineStep } from '../../lib/api';

type Responsable = 'client' | 'conseiller' | 'gouvernement';

function buildTimeline(motif: CapiMotif, programme?: string): CapiTimelineStep[] {
  const base: CapiTimelineStep[] = [
    {
      id: 't1',
      titre: 'Analyse stratégique',
      description: 'Étude complète de votre profil, évaluation des critères et sélection de la meilleure voie.',
      responsable: 'conseiller',
      dureeEstimee: '3–5 jours',
      documents: [],
      statut: 'a_faire',
    },
    {
      id: 't2',
      titre: 'Collecte des documents',
      description: 'Réunir et faire certifier tous les documents requis : état civil, diplômes, preuves d\'emploi.',
      responsable: 'client',
      dureeEstimee: '2–4 semaines',
      documents: ['Passeport valide', 'Diplômes certifiés', 'Relevés de notes', 'Preuve d\'emploi', 'Extrait de casier judiciaire'],
      statut: 'a_faire',
    },
    {
      id: 't3',
      titre: 'Préparation et vérification du dossier',
      description: 'Révision complète du dossier, correction des lacunes, traductions si nécessaire.',
      responsable: 'conseiller',
      dureeEstimee: '1–2 semaines',
      documents: ['Formulaires gouvernementaux', 'Traductions certifiées'],
      statut: 'a_faire',
    },
    {
      id: 't4',
      titre: 'Soumission de la demande',
      description: 'Dépôt officiel auprès de l\'IRCC ou du Québec selon votre programme.',
      responsable: 'conseiller',
      dureeEstimee: '1–2 jours',
      documents: [],
      statut: 'a_faire',
    },
    {
      id: 't5',
      titre: 'Traitement gouvernemental',
      description: 'L\'autorité compétente étudie votre demande. Des informations complémentaires peuvent être demandées.',
      responsable: 'gouvernement',
      dureeEstimee: motif === 'visiter' ? '2–8 semaines' : motif === 'travailler' ? '1–6 mois' : '6–24 mois',
      documents: [],
      statut: 'a_faire',
    },
    {
      id: 't6',
      titre: 'Décision finale',
      description: 'Réception de l\'approbation (ou refus). En cas d\'approbation, préparation à l\'arrivée.',
      responsable: 'gouvernement',
      dureeEstimee: '1–3 jours',
      documents: ['Visa / permis / résidence', 'Lettre d\'approbation'],
      statut: 'a_faire',
    },
    {
      id: 't7',
      titre: 'Installation au Canada',
      description: 'Accompagnement à l\'arrivée, logement, banque, NAS, assurance et intégration.',
      responsable: 'conseiller',
      dureeEstimee: '2–4 semaines',
      documents: [],
      statut: 'a_faire',
    },
  ];
  return base;
}

const RESP_CFG: Record<Responsable, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  client:       { label: 'Vous', color: '#3b82f6', icon: 'person' },
  conseiller:   { label: 'Votre conseiller', color: Colors.orange, icon: 'briefcase' },
  gouvernement: { label: 'Gouvernement', color: '#8b5cf6', icon: 'business' },
};

export default function CapiTimelineScreen() {
  const router = useRouter();
  const { session, updateSession } = useCapiSession();
  const motif = session.motif ?? 'visiter';
  const steps = buildTimeline(motif, session.programme);

  const next = () => {
    const timeline = steps;
    updateSession({ timeline, step: 7 });
    router.push('/capi/conseiller');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.progressBarOuter}>
          <View style={[styles.progressBarInner, { width: '75%' }]} />
        </View>
        <Text style={styles.stepLabel}>6 / 8</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.capiHeader}>
          <View style={styles.capiAvatar}><Text style={styles.capiEmoji}>🤖</Text></View>
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>Voici votre <Text style={{ fontWeight: '700', color: Colors.orange }}>feuille de route</Text> complète. Chaque étape est clairement définie — vous saurez toujours où vous en êtes.</Text>
          </View>
        </View>

        {/* Légende responsables */}
        <View style={styles.legend}>
          {(Object.entries(RESP_CFG) as [Responsable, typeof RESP_CFG[Responsable]][]).map(([key, cfg]) => (
            <View key={key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: cfg.color }]} />
              <Text style={styles.legendText}>{cfg.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.timeline}>
          {steps.map((step, idx) => {
            const cfg = RESP_CFG[step.responsable];
            const isLast = idx === steps.length - 1;
            return (
              <View key={step.id} style={styles.timelineRow}>
                {/* Colonne gauche — ligne + cercle */}
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, { borderColor: cfg.color, backgroundColor: cfg.color + '20' }]}>
                    <Text style={styles.timelineNum}>{idx + 1}</Text>
                  </View>
                  {!isLast && <View style={[styles.timelineLine, { borderColor: cfg.color + '40' }]} />}
                </View>

                {/* Contenu de l'étape */}
                <View style={[styles.timelineCard, isLast && { marginBottom: 0 }]}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle}>{step.titre}</Text>
                    <View style={[styles.respBadge, { backgroundColor: cfg.color + '18' }]}>
                      <Ionicons name={cfg.icon} size={11} color={cfg.color} />
                      <Text style={[styles.respText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardDesc}>{step.description}</Text>
                  <View style={styles.cardMeta}>
                    <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
                    <Text style={styles.cardDuration}>{step.dureeEstimee}</Text>
                  </View>
                  {step.documents && step.documents.length > 0 && (
                    <View style={styles.docList}>
                      {step.documents.map((d, i) => (
                        <View key={i} style={styles.docItem}>
                          <Ionicons name="document-text-outline" size={12} color={Colors.textMuted} />
                          <Text style={styles.docText}>{d}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextBtn} onPress={next} activeOpacity={0.85}>
          <Text style={styles.nextBtnText}>Choisir mon conseiller</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
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
  capiHeader: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 12, alignItems: 'flex-start' },
  capiAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.orange + '25', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  capiEmoji: { fontSize: 22 },
  bubble: { flex: 1, backgroundColor: Colors.surface, borderRadius: 16, borderTopLeftRadius: 4, padding: 14 },
  bubbleText: { fontSize: 14, color: Colors.text, lineHeight: 21 },
  legend: { flexDirection: 'row', gap: 16, paddingHorizontal: 20, marginBottom: 16, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: Colors.textMuted },
  timeline: { paddingHorizontal: 20 },
  timelineRow: { flexDirection: 'row', gap: 14 },
  timelineLeft: { alignItems: 'center', width: 36 },
  timelineDot: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  timelineNum: { fontSize: 13, fontWeight: '700', color: Colors.text },
  timelineLine: { flex: 1, width: 0, borderLeftWidth: 2, borderStyle: 'dashed', marginVertical: 4 },
  timelineCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, flex: 1 },
  respBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingVertical: 3, paddingHorizontal: 8 },
  respText: { fontSize: 10, fontWeight: '600' },
  cardDesc: { fontSize: 12, color: Colors.textMuted, lineHeight: 18, marginBottom: 8 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardDuration: { fontSize: 12, color: Colors.textMuted },
  docList: { marginTop: 10, gap: 5, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  docItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  docText: { fontSize: 11, color: Colors.textMuted },
  footer: { padding: 20, paddingBottom: 28 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.orange, borderRadius: 14, paddingVertical: 16, gap: 8 },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
