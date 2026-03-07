import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Dimensions, Image,
} from 'react-native';
import { CapiAvatar } from '../../components/CapiAvatar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { UI } from '../../constants/UI';
import { useCapiSession } from '../../context/CapiContext';
import type { CapiAdvisor, CapiMotif } from '../../lib/api';
import { buildAutonomieProject } from '../../lib/autonomie-steps';
import { useAuth } from '../../context/AuthContext';
import { teamApi, type TeamMember } from '../../lib/api';
import { getAvatarSource } from '../../lib/avatar';

const { width: SCREEN_W } = Dimensions.get('window');

type Mode = 'choix' | 'conseiller' | 'autonomie';
type FilterMode = 'recommandes' | 'tous';

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

function mapTeamMemberToAdvisor(m: TeamMember): CapiAdvisor {
  const specialites = Array.isArray(m.pro_services) ? m.pro_services.filter(Boolean) : [];
  const titre = String(m.pro_diploma ?? '').trim() || 'Conseiller Pro CAPITUNE';
  const province = String(m.location ?? '').trim() || 'Canada';

  return {
    id: String(m.id),
    nom: String(m.name ?? '').trim() || 'Conseiller',
    titre,
    avatar: String(m.avatar_key ?? '').trim() || undefined,
    score: 80,
    specialites: specialites.length ? specialites.slice(0, 8) : ['Immigration', 'Installation'],
    langues: ['Français'],
    province,
    tarifConsultation: undefined,
    deviseConsultation: 'CAD',
    disponibilite: 'Disponible',
    experience: m.pro_experience_years ? `${m.pro_experience_years} ans` : undefined,
    nbClients: undefined,
    bio: String(m.bio ?? '').trim() || 'Conseiller professionnel CAPITUNE.',
  };
}

function scoreAdvisor(adv: CapiAdvisor, ctx: { motif: CapiMotif; provinceHint?: string | null }): number {
  const provinceHint = String(ctx.provinceHint ?? '').trim().toLowerCase();
  const province = String(adv.province ?? '').trim().toLowerCase();
  const specialites = adv.specialites ?? [];

  let score = 70;
  score += Math.min(10, specialites.length);
  if (provinceHint && province && province.includes(provinceHint)) score += 15;
  if (ctx.motif === 'visiter') score += specialites.some((s) => /vis|tour|visiteur/i.test(s)) ? 8 : 0;
  if (ctx.motif === 'etudier') score += specialites.some((s) => /etud|study|étud/i.test(s)) ? 8 : 0;
  if (ctx.motif === 'travailler') score += specialites.some((s) => /travail|work|emploi/i.test(s)) ? 8 : 0;
  if (ctx.motif === 'residence_permanente') score += specialites.some((s) => /rp|perman|express|entrée/i.test(s)) ? 8 : 0;
  if (ctx.motif === 'famille') score += specialites.some((s) => /famill|parrain|conjoint/i.test(s)) ? 8 : 0;
  if (ctx.motif === 'entreprendre') score += specialites.some((s) => /entrepr|business|startup|suv/i.test(s)) ? 8 : 0;
  if (ctx.motif === 'regularisation') score += specialites.some((s) => /régul|hc|erar/i.test(s)) ? 8 : 0;

  return Math.max(0, Math.min(99, score));
}

export default function CapiConseillerScreen() {
  const router = useRouter();
  const { session, updateSession } = useCapiSession();
  const { token, user } = useAuth();
  const motif = session.motif ?? 'visiter';
  const [mode, setMode] = useState<Mode>('choix');
  const [loading, setLoading] = useState(false);
  const [advisors, setAdvisors] = useState<CapiAdvisor[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('recommandes');
  const [activeIndex, setActiveIndex] = useState(0);

  const swipeData = filterMode === 'recommandes' ? advisors.slice(0, 5) : advisors;
  const cardW = Math.min(SCREEN_W - 40, 440);
  const cardGap = 12;

  const loadAdvisors = async () => {
    setLoading(true);
    setSelected(null);
    try {
      const sessionToken = String(token ?? '').trim();
      if (!sessionToken) {
        const list = getMockAdvisors(motif);
        setAdvisors(list);
        setSelected(list[0]?.id ?? null);
        return;
      }

      const res = await teamApi.list(sessionToken);
      const team = res.status === 200 ? (res.data?.team ?? []) : [];
      if (!team.length) {
        const list = getMockAdvisors(motif);
        setAdvisors(list);
        setSelected(list[0]?.id ?? null);
        return;
      }

      const provinceHint = (session.profile as any)?.province ?? (session.profile as any)?.provinceCible ?? null;
      const mapped = team.map(mapTeamMemberToAdvisor);
      const scored = mapped
        .map((a) => ({ ...a, score: scoreAdvisor(a, { motif, provinceHint }) }))
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      setAdvisors(scored);
      setSelected(scored[0]?.id ?? null);
    } catch {
      const list = getMockAdvisors(motif);
      setAdvisors(list);
      setSelected(list[0]?.id ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!swipeData.length) return;
    if (!selected || !swipeData.some((a) => a.id === selected)) {
      setActiveIndex(0);
      setSelected(swipeData[0].id);
    }
  }, [filterMode, advisors]);

  const handleChooseConseiller = () => {
    setMode('conseiller');
    void loadAdvisors();
  };

  const handleChooseAutonomie = () => {
    const project = buildAutonomieProject(motif);
    updateSession({ autonomie: project, step: 8 });
    router.push('/capi/autonomie' as never);
  };

  const confirmAdvisor = () => {
    if (!selected) return;
    const advisor = advisors.find(a => a.id === selected);
    updateSession({ advisor, step: 8 });
    router.push('/capi/activation');
  };

  /* ── Écran de choix ─────────────────────────────────────────────────── */
  const renderChoix = () => (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.capiHeader}>
        <CapiAvatar size={44} state="speaking" />
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>
            Comment souhaitez-vous <Text style={{ fontWeight: '700', color: Colors.orange }}>avancer dans votre démarche</Text> ? Vous pouvez choisir un conseiller qui vous accompagne, ou gérer vous-même votre dossier étape par étape.
          </Text>
        </View>
      </View>

      <View style={styles.choixContainer}>
        {/* Carte Conseiller */}
        <TouchableOpacity style={styles.choixCard} onPress={handleChooseConseiller} activeOpacity={0.88}>
          <View style={[styles.choixIconWrap, { backgroundColor: Colors.orange + '20' }]}>
            <Text style={styles.choixIcon}>🧑‍💼</Text>
          </View>
          <Text style={styles.choixTitle}>Choisir un conseiller</Text>
          <Text style={styles.choixDesc}>
            Un expert en immigration vous accompagne personnellement, prépare votre dossier et répond à toutes vos questions.
          </Text>
          <View style={styles.choixPills}>
            <View style={[styles.pill, { backgroundColor: Colors.orange + '18' }]}>
              <Text style={[styles.pillText, { color: Colors.orange }]}>✓ Suivi personnalisé</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: Colors.orange + '18' }]}>
              <Text style={[styles.pillText, { color: Colors.orange }]}>✓ Dossier préparé</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: Colors.orange + '18' }]}>
              <Text style={[styles.pillText, { color: Colors.orange }]}>✓ Représentation IRCC</Text>
            </View>
          </View>
          <View style={styles.choixArrow}>
            <Ionicons name="arrow-forward" size={16} color={Colors.orange} />
          </View>
        </TouchableOpacity>

        {/* Séparateur */}
        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>OU</Text>
          <View style={styles.orLine} />
        </View>

        {/* Carte Autonomie */}
        <TouchableOpacity style={[styles.choixCard, styles.choixCardPrimary]} onPress={handleChooseAutonomie} activeOpacity={0.88}>
          <View style={[styles.choixIconWrap, { backgroundColor: Colors.primary + '25' }]}>
            <Text style={styles.choixIcon}>🗺️</Text>
          </View>
          <Text style={[styles.choixTitle, { color: Colors.primary }]}>Mode autonomie guidée</Text>
          <Text style={styles.choixDesc}>
            Gérez votre demande vous-même grâce à un plan d'action personnalisé, des ressources officielles et un suivi de progression.
          </Text>
          <View style={styles.choixPills}>
            <View style={[styles.pill, { backgroundColor: Colors.primary + '18' }]}>
              <Text style={[styles.pillText, { color: Colors.primary }]}>✓ Plan étape par étape</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: Colors.primary + '18' }]}>
              <Text style={[styles.pillText, { color: Colors.primary }]}>✓ Liens officiels</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: Colors.primary + '18' }]}>
              <Text style={[styles.pillText, { color: Colors.primary }]}>✓ Score de préparation</Text>
            </View>
          </View>
          <View style={[styles.choixArrow, { borderColor: Colors.primary + '30' }]}>
            <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  /* ── Liste des conseillers ───────────────────────────────────────────── */
  const renderConseiller = () => (
    <>
      <View style={styles.scroll}>
        <View style={styles.capiHeader}>
          <CapiAvatar size={44} state="speaking" />
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>
              J'ai sélectionné les <Text style={{ fontWeight: '700', color: Colors.orange }}>meilleurs conseillers</Text> selon votre profil. Vous pouvez aussi afficher <Text style={{ fontWeight: '700' }}>tous les profils</Text> et choisir vous-même.
            </Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterBtn, filterMode === 'recommandes' && styles.filterBtnActive]}
            onPress={() => setFilterMode('recommandes')}
            activeOpacity={0.85}
          >
            <Text style={[styles.filterText, filterMode === 'recommandes' && styles.filterTextActive]}>
              Recommandés
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, filterMode === 'tous' && styles.filterBtnActive]}
            onPress={() => setFilterMode('tous')}
            activeOpacity={0.85}
          >
            <Text style={[styles.filterText, filterMode === 'tous' && styles.filterTextActive]}>
              Tous
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.orange} />
            <Text style={styles.loadingText}>Analyse du profil en cours…</Text>
          </View>
        ) : (
          <FlatList
            data={swipeData}
            keyExtractor={(a) => a.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={cardW + cardGap}
            snapToAlignment="start"
            disableIntervalMomentum
            contentContainerStyle={{ paddingHorizontal: 20 }}
            ItemSeparatorComponent={() => <View style={{ width: cardGap }} />}
            onMomentumScrollEnd={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              const idx = Math.round(x / (cardW + cardGap));
              const nextIndex = Math.max(0, Math.min(swipeData.length - 1, idx));
              setActiveIndex(nextIndex);
              setSelected(swipeData[nextIndex]?.id ?? null);
            }}
            renderItem={({ item: adv }) => {
              const isSelected = selected === adv.id;
              const tags = adv.specialites ?? [];
              const shownTags = tags.slice(0, 3);
              const extraTags = Math.max(0, tags.length - shownTags.length);
              const src = getAvatarSource(adv.avatar);

              return (
                <TouchableOpacity
                  style={[styles.card, { width: cardW }, isSelected && styles.cardSelected]}
                  onPress={() => setSelected(adv.id)}
                  activeOpacity={0.9}
                >
                  <View style={styles.scoreCorner}>
                    <Text style={styles.scoreNum}>{adv.score}%</Text>
                    <Text style={styles.scoreLabel}>match</Text>
                  </View>

                  <View style={styles.advisorTop}>
                    <View style={styles.avatarCircle}>
                      {src ? (
                        <Image source={src} style={styles.avatarImg} />
                      ) : (
                        <Text style={styles.avatarInitial}>{adv.nom[0]}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.advisorName} numberOfLines={1}>{adv.nom}</Text>
                      <Text style={styles.advisorTitle} numberOfLines={1}>{adv.titre}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      </View>
                    )}
                  </View>

                  <View style={styles.matchBar}>
                    <View style={[styles.matchFill, { width: `${adv.score}%` }]} />
                  </View>

                  {!!adv.bio && (
                    <Text style={styles.bio} numberOfLines={3} ellipsizeMode="tail">{adv.bio}</Text>
                  )}

                  <View style={styles.metaGrid}>
                    {!!adv.province && (
                      <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
                        <Text style={styles.metaText}>{adv.province}</Text>
                      </View>
                    )}
                    {!!adv.experience && (
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
                        <Text style={styles.metaText}>{adv.experience}</Text>
                      </View>
                    )}
                    {typeof adv.nbClients === 'number' && (
                      <View style={styles.metaItem}>
                        <Ionicons name="people-outline" size={13} color={Colors.textMuted} />
                        <Text style={styles.metaText}>{adv.nbClients} clients</Text>
                      </View>
                    )}
                    {typeof adv.tarifConsultation === 'number' && (
                      <View style={styles.metaItem}>
                        <Ionicons name="cash-outline" size={13} color={Colors.textMuted} />
                        <Text style={styles.metaText}>{adv.tarifConsultation} {adv.deviseConsultation}/h</Text>
                      </View>
                    )}
                  </View>

                  {(shownTags.length > 0 || extraTags > 0) && (
                    <View style={styles.tags}>
                      {shownTags.map((s, i) => (
                        <View key={`${adv.id}-tag-${i}`} style={styles.tag}>
                          <Text style={styles.tagText} numberOfLines={1}>{s}</Text>
                        </View>
                      ))}
                      {extraTags > 0 && (
                        <View style={styles.tag}>
                          <Text style={styles.tagText}>+{extraTags}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {!!adv.langues?.length && (
                    <View style={styles.langues}>
                      <Ionicons name="chatbubble-outline" size={12} color={Colors.textMuted} />
                      <Text style={styles.languesText} numberOfLines={1}>{adv.langues.join(' · ')}</Text>
                    </View>
                  )}

                  {!!adv.disponibilite && (
                    <View style={styles.dispo}>
                      <View style={styles.dispoDot} />
                      <Text style={styles.dispoText} numberOfLines={1}>{adv.disponibilite}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, !selected && styles.nextBtnDisabled]}
          onPress={confirmAdvisor}
          disabled={!selected}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>
            {selected ? 'Confirmer ce conseiller' : 'Sélectionnez un conseiller'}
          </Text>
          {selected && <Ionicons name="arrow-forward" size={18} color="#fff" />}
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={mode === 'conseiller' ? () => setMode('choix') : () => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.progressBarOuter}>
          <View style={[styles.progressBarInner, { width: '87.5%' }]} />
        </View>
        <Text style={styles.stepLabel}>7 / 8</Text>
      </View>

      {mode === 'choix' ? renderChoix() : renderConseiller()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgLight },
  scroll: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  progressBarOuter: { flex: 1, height: 4, backgroundColor: Colors.border, borderRadius: 2 },
  progressBarInner: { height: 4, backgroundColor: Colors.orange, borderRadius: 2 },
  stepLabel: { fontSize: 12, color: Colors.textMuted, minWidth: 32 },
  capiHeader: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 12, alignItems: 'flex-start' },

  bubble: { flex: 1, backgroundColor: Colors.surface, borderRadius: 16, borderTopLeftRadius: 4, padding: 14 },
  bubbleText: { fontSize: 14, color: Colors.text, lineHeight: 21 },
  loadingBox: { alignItems: 'center', paddingTop: 60, gap: 16 },
  loadingText: { fontSize: 14, color: Colors.textMuted },
  list: { paddingHorizontal: 20, gap: 14 },
  card: { backgroundColor: Colors.surface, borderRadius: 18, padding: 14, borderWidth: 1.5, borderColor: Colors.border, position: 'relative', overflow: 'hidden', ...UI.cardShadow },
  cardSelected: { borderColor: Colors.orange },
  scoreCorner: { position: 'absolute', top: 14, right: 14, backgroundColor: Colors.orange + '18', borderRadius: 10, paddingVertical: 4, paddingHorizontal: 10, alignItems: 'center' },
  scoreNum: { fontSize: 16, fontWeight: '800', color: Colors.orange },
  scoreLabel: { fontSize: 9, color: Colors.orange, fontWeight: '600', letterSpacing: 0.5 },
  advisorTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, paddingRight: 70 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.orange + '30', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  avatarInitial: { fontSize: 18, fontWeight: '800', color: Colors.orange },
  advisorName: { fontSize: 15, fontWeight: '800', color: Colors.text },
  advisorTitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  checkCircle: { position: 'absolute', right: 0, top: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.orange, justifyContent: 'center', alignItems: 'center' },
  matchBar: { height: 4, backgroundColor: Colors.border, borderRadius: 2, marginBottom: 12 },
  matchFill: { height: 4, backgroundColor: Colors.orange, borderRadius: 2 },
  bio: { fontSize: 13, color: Colors.textMuted, lineHeight: 19, marginBottom: 10 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.textMuted },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tag: { backgroundColor: Colors.orange + '15', borderRadius: 20, paddingVertical: 3, paddingHorizontal: 10 },
  tagText: { fontSize: 11, color: Colors.orange, fontWeight: '600', maxWidth: 230 },
  langues: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  languesText: { fontSize: 12, color: Colors.textMuted },
  dispo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dispoDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  dispoText: { fontSize: 12, color: Colors.success, fontWeight: '600' },
  footer: { padding: 20, paddingBottom: 28 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.orange, borderRadius: 14, paddingVertical: 16, gap: 8 },
  nextBtnDisabled: { backgroundColor: Colors.border },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  // Mode choix
  choixContainer: { paddingHorizontal: 20, gap: 6 },
  choixCard: { backgroundColor: Colors.surface, borderRadius: 18, padding: 20, borderWidth: 1.5, borderColor: Colors.border, ...UI.cardShadow },
  choixCardPrimary: { borderColor: Colors.primary + '50' },
  choixIconWrap: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  choixIcon: { fontSize: 26 },
  choixTitle: { fontSize: 17, fontWeight: '800', color: Colors.orange, marginBottom: 8 },
  choixDesc: { fontSize: 14, color: Colors.textMuted, lineHeight: 21, marginBottom: 14 },
  choixPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  pill: { borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 },
  pillText: { fontSize: 12, fontWeight: '600' },
  choixArrow: { alignSelf: 'flex-end', width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.orange + '30', justifyContent: 'center', alignItems: 'center' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  orLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  orText: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },

  // Filtre (recommandés / tous)
  filterRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 10 },
  filterBtn: { flex: 1, backgroundColor: Colors.surface, borderRadius: 14, paddingVertical: 10, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border },
  filterBtnActive: { borderColor: Colors.orange },
  filterText: { fontSize: 13, fontWeight: '800', color: Colors.textMuted },
  filterTextActive: { color: Colors.orange },
});
