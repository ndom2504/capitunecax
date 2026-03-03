import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useCapiSession } from '../../context/CapiContext';
import type { CapiAdvisor, CapiMotif } from '../../lib/api';

// Conseillers mock — en prod ce serait matchAdvisors()
function getMockAdvisors(motif: CapiMotif): CapiAdvisor[] {
  const all: CapiAdvisor[] = [
    {
      id: 'adv1',
      nom: 'Fatima Zahra Benali',
      titre: 'Consultante en immigration agréée (RCIC)',
      score: 94,
      specialites: [
        motif === 'travailler' ? 'Permis de travail' : 'Résidence permanente',
        'Entrée express', 'Programmes Québec',
      ],
      langues: ['Français', 'Arabe', 'Anglais'],
      province: 'Québec',
      tarifConsultation: 180,
      deviseConsultation: 'CAD',
      disponibilite: 'Disponible cette semaine',
      experience: '8 ans',
      nbClients: 312,
      bio: 'Spécialisée dans les dossiers complexes, Fatima accompagne des familles et professionnels de 35 nationalités. Ancienne agent IRCC.',
    },
    {
      id: 'adv2',
      nom: 'Jean-Marc Tremblay',
      titre: 'Avocat en droit de l\'immigration',
      score: 89,
      specialites: ['Résidence permanente', 'Regroupement familial', 'Recours & appels'],
      langues: ['Français', 'Anglais', 'Espagnol'],
      province: 'Ontario',
      tarifConsultation: 250,
      deviseConsultation: 'CAD',
      disponibilite: 'Disponible la semaine prochaine',
      experience: '12 ans',
      nbClients: 640,
      bio: 'Expert en contentieux, Jean-Marc excelle dans les dossiers de recours, les cas de refus et les situations familiales complexes.',
    },
    {
      id: 'adv3',
      nom: 'Amina Coulibaly',
      titre: 'Conseillère en immigration & intégration',
      score: 86,
      specialites: ['Étudiants', 'Visiteurs', 'Installation', 'Programme agro-alimentaire'],
      langues: ['Français', 'Anglais', 'Bambara'],
      province: 'Manitoba',
      tarifConsultation: 120,
      deviseConsultation: 'CAD',
      disponibilite: 'Disponible aujourd\'hui',
      experience: '5 ans',
      nbClients: 198,
      bio: 'Amina se spécialise dans l\'accompagnement des étudiants étrangers et l\'intégration à la vie canadienne.',
    },
  ];
  return all;
}

export default function CapiConseillerScreen() {
  const router = useRouter();
  const { session, updateSession } = useCapiSession();
  const motif = session.motif ?? 'visiter';
  const [loading, setLoading] = useState(true);
  const [advisors, setAdvisors] = useState<CapiAdvisor[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setAdvisors(getMockAdvisors(motif));
      setLoading(false);
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  const next = () => {
    if (!selected) return;
    const advisor = advisors.find(a => a.id === selected);
    updateSession({ advisor, step: 8 });
    router.push('/capi/activation');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.progressBarOuter}>
          <View style={[styles.progressBarInner, { width: '87.5%' }]} />
        </View>
        <Text style={styles.stepLabel}>7 / 8</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.capiHeader}>
          <View style={styles.capiAvatar}><Text style={styles.capiEmoji}>🤖</Text></View>
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>
              J'ai sélectionné les <Text style={{ fontWeight: '700', color: Colors.orange }}>meilleurs conseillers</Text> selon votre profil, votre province cible et votre langue. Choisissez celui qui vous correspond.
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.orange} />
            <Text style={styles.loadingText}>Analyse du profil en cours…</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {advisors.map(adv => {
              const isSelected = selected === adv.id;
              return (
                <TouchableOpacity
                  key={adv.id}
                  style={[styles.card, isSelected && styles.cardSelected]}
                  onPress={() => setSelected(adv.id)}
                  activeOpacity={0.85}
                >
                  {/* Badge score compatibilité */}
                  <View style={styles.scoreCorner}>
                    <Text style={styles.scoreNum}>{adv.score}%</Text>
                    <Text style={styles.scoreLabel}>match</Text>
                  </View>

                  {/* Avatar + nom */}
                  <View style={styles.advisorTop}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarInitial}>{adv.nom[0]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.advisorName}>{adv.nom}</Text>
                      <Text style={styles.advisorTitle}>{adv.titre}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      </View>
                    )}
                  </View>

                  {/* Barre compatibilité */}
                  <View style={styles.matchBar}>
                    <View style={[styles.matchFill, { width: `${adv.score}%` }]} />
                  </View>

                  {/* Bio */}
                  <Text style={styles.bio}>{adv.bio}</Text>

                  {/* Infos */}
                  <View style={styles.metaGrid}>
                    <View style={styles.metaItem}>
                      <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
                      <Text style={styles.metaText}>{adv.province}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
                      <Text style={styles.metaText}>{adv.experience} exp.</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="people-outline" size={13} color={Colors.textMuted} />
                      <Text style={styles.metaText}>{adv.nbClients} clients</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="cash-outline" size={13} color={Colors.textMuted} />
                      <Text style={styles.metaText}>{adv.tarifConsultation} {adv.deviseConsultation}/h</Text>
                    </View>
                  </View>

                  {/* Spécialités */}
                  <View style={styles.tags}>
                    {adv.specialites.map((s, i) => (
                      <View key={i} style={styles.tag}>
                        <Text style={styles.tagText}>{s}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Langues */}
                  <View style={styles.langues}>
                    <Ionicons name="chatbubble-outline" size={12} color={Colors.textMuted} />
                    <Text style={styles.languesText}>{adv.langues.join(' · ')}</Text>
                  </View>

                  {/* Disponibilité */}
                  <View style={styles.dispo}>
                    <View style={styles.dispoDot} />
                    <Text style={styles.dispoText}>{adv.disponibilite}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, !selected && styles.nextBtnDisabled]}
          onPress={next}
          disabled={!selected}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>
            {selected ? 'Confirmer ce conseiller' : 'Sélectionnez un conseiller'}
          </Text>
          {selected && <Ionicons name="arrow-forward" size={18} color="#fff" />}
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
  capiHeader: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 12, alignItems: 'flex-start' },
  capiAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.orange + '25', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  capiEmoji: { fontSize: 22 },
  bubble: { flex: 1, backgroundColor: Colors.surface, borderRadius: 16, borderTopLeftRadius: 4, padding: 14 },
  bubbleText: { fontSize: 14, color: Colors.text, lineHeight: 21 },
  loadingBox: { alignItems: 'center', paddingTop: 60, gap: 16 },
  loadingText: { fontSize: 14, color: Colors.textMuted },
  list: { paddingHorizontal: 20, gap: 14 },
  card: { backgroundColor: Colors.surface, borderRadius: 18, padding: 16, borderWidth: 1.5, borderColor: Colors.border, position: 'relative', overflow: 'hidden' },
  cardSelected: { borderColor: Colors.orange },
  scoreCorner: { position: 'absolute', top: 14, right: 14, backgroundColor: Colors.orange + '18', borderRadius: 10, paddingVertical: 4, paddingHorizontal: 10, alignItems: 'center' },
  scoreNum: { fontSize: 16, fontWeight: '800', color: Colors.orange },
  scoreLabel: { fontSize: 9, color: Colors.orange, fontWeight: '600', letterSpacing: 0.5 },
  advisorTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, paddingRight: 70 },
  avatarCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.orange + '30', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 22, fontWeight: '800', color: Colors.orange },
  advisorName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  advisorTitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  checkCircle: { position: 'absolute', right: 0, top: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.orange, justifyContent: 'center', alignItems: 'center' },
  matchBar: { height: 4, backgroundColor: Colors.border, borderRadius: 2, marginBottom: 12 },
  matchFill: { height: 4, backgroundColor: Colors.orange, borderRadius: 2 },
  bio: { fontSize: 13, color: Colors.textMuted, lineHeight: 19, marginBottom: 12 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.textMuted },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tag: { backgroundColor: Colors.orange + '15', borderRadius: 20, paddingVertical: 3, paddingHorizontal: 10 },
  tagText: { fontSize: 11, color: Colors.orange, fontWeight: '600' },
  langues: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  languesText: { fontSize: 12, color: Colors.textMuted },
  dispo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dispoDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  dispoText: { fontSize: 12, color: Colors.success, fontWeight: '600' },
  footer: { padding: 20, paddingBottom: 28 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.orange, borderRadius: 14, paddingVertical: 16, gap: 8 },
  nextBtnDisabled: { backgroundColor: Colors.border },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
