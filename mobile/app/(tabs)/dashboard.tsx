import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  RefreshControl, ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio, ResizeMode, Video } from 'expo-av';
import { Colors } from '../../constants/Colors';
import { UI } from '../../constants/UI';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi, proApi, type ProClientRow, type ProjectData } from '../../lib/api';
import { useRouter } from 'expo-router';
import { getAvatarSource } from '../../lib/avatar';

const STEPS_LABELS = [
  'Analyse du profil',
  'Montage du dossier',
  'Révision',
  'Dépôt officiel',
  'Décision',
];

const DASH_VIDEOS = [
  { id: 'prep', title: 'Préparation du départ', source: require('../../assets/videos/preparation-depart.mp4') },
  { id: 'integ', title: 'Intégration au Canada', source: require('../../assets/videos/integration-canada.mp4') },
] as const;

// ── Tableau de bord Professionnel ─────────────────────────────────────────────
function ProDashboard({ name, avatarKey }: { name: string; avatarKey?: string | null }) {
  const router = useRouter();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'inbox' | 'policy'>('inbox');
  const [q, setQ] = useState('');
  const [clients, setClients] = useState<ProClientRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [walletTotal, setWalletTotal] = useState<number | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);

  const formatCad = (amount: number | null): string => {
    if (amount === null) return '—';
    try {
      return new Intl.NumberFormat('fr-CA', {
        style: 'currency',
        currency: 'CAD',
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} $`;
    }
  };

  const loadWalletTotal = async () => {
    if (!token) { setWalletTotal(null); return; }
    setWalletLoading(true);
    let page = 1;
    let pages = 1;
    let total = 0;
    for (;;) {
      const res = await proApi.listClients(token, { page, q: '' });
      if (res.error) break;
      const data = res.data;
      pages = Math.max(1, Number(data?.pages ?? 1));
      const rows = data?.clients ?? [];
      total += rows.reduce((acc, c) => acc + Number(c.total_paid ?? 0), 0);
      if (page >= pages) break;
      page += 1;
    }
    setWalletTotal(total);
    setWalletLoading(false);
  };

  const load = async (isRefresh = false) => {
    if (!token) { setClients([]); setLoading(false); return; }
    if (!isRefresh) setLoading(true);
    setError(null);
    const res = await proApi.listClients(token, { page: 1, q });
    if (res.error) {
      setError(res.error);
      setClients([]);
    } else {
      setClients(res.data?.clients ?? []);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, [token]);

  useEffect(() => { loadWalletTotal(); }, [token]);

  useEffect(() => {
    const t = setTimeout(() => { load(); }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const onRefresh = () => { setRefreshing(true); load(true); loadWalletTotal(); };

  const counts = clients.reduce(
    (acc, c) => {
      const st = String(c.project_status ?? '').toLowerCase();
      if (st && st !== 'annule') acc.withProject += 1;
      if (st === 'proposition') acc.propositions += 1;
      if (st === 'demarre' || st === 'en_cours') acc.actifs += 1;
      return acc;
    },
    { withProject: 0, propositions: 0, actifs: 0 },
  );

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />}
    >
      {/* En-tête Pro */}
      <View style={styles.header}>
        <Text style={styles.welcome}>Bienvenue sur CAPITUNE</Text>

        <View style={styles.avatarRow}>
          <View style={styles.walletPillInline}>
            <Ionicons name="wallet" size={14} color={Colors.primary} />
            <View style={styles.walletTextCol}>
              <Text style={styles.walletLabel}>Portefeuille</Text>
              <Text style={styles.walletAmount} numberOfLines={1}>
                {walletLoading ? '…' : formatCad(walletTotal)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.avatarCircle, styles.avatarPro]}
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/profil' as any)}
            accessibilityLabel="Ouvrir mon profil"
          >
            {getAvatarSource(avatarKey) ? (
              <Image source={getAvatarSource(avatarKey) as any} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarInitial}>{name[0].toUpperCase()}</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.subtitle, styles.subtitlePro]}>Tableau de bord Professionnel</Text>
      </View>

      {/* Badge Pro */}
      <View style={styles.proBadge}>
        <Ionicons name="briefcase" size={14} color={Colors.primary} />
        <Text style={styles.proBadgeText}>Compte Professionnel</Text>
      </View>

      {/* Onglets Pro */}
      <View style={styles.proTabs}>
        <TouchableOpacity
          style={[styles.proTab, activeTab === 'inbox' && styles.proTabActive]}
          onPress={() => setActiveTab('inbox')}
          activeOpacity={0.85}
          accessibilityLabel="Ouvrir l'onglet Inbox"
        >
          <Ionicons name="mail" size={16} color={activeTab === 'inbox' ? '#fff' : Colors.textMuted} />
          <Text style={[styles.proTabText, activeTab === 'inbox' && styles.proTabTextActive]}>Inbox</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.proTab, activeTab === 'policy' && styles.proTabActive]}
          onPress={() => setActiveTab('policy')}
          activeOpacity={0.85}
          accessibilityLabel="Ouvrir l'onglet Politique de gestion client"
        >
          <Ionicons name="shield-checkmark" size={16} color={activeTab === 'policy' ? '#fff' : Colors.textMuted} />
          <Text style={[styles.proTabText, activeTab === 'policy' && styles.proTabTextActive]}>Politique</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'policy' ? (
        <>
          <Text style={styles.sectionTitle}>Politique de gestion client</Text>

          <View style={styles.policyCard}>
            <Text style={styles.policyTitle}>Objectif</Text>
            <Text style={styles.policyText}>
              Garantir un suivi clair, rapide et traçable: chaque échange doit mener à une prochaine action.
            </Text>
          </View>

          <View style={styles.policyCard}>
            <Text style={styles.policyTitle}>1) Assignation & périmètre</Text>
            <Text style={styles.policyText}>
              Vous ne voyez que les clients qui vous sont assignés. Toute action (message, proposition, mise à jour)
              se fait dans ce périmètre.
            </Text>
          </View>

          <View style={styles.policyCard}>
            <Text style={styles.policyTitle}>2) Messagerie</Text>
            <Text style={styles.policyText}>
              Réponses courtes et concrètes. Structure recommandée: (a) contexte, (b) décision, (c) prochaine étape.
              Évitez les promesses: annoncez un délai si vous devez vérifier.
            </Text>
          </View>

          <View style={styles.policyCard}>
            <Text style={styles.policyTitle}>3) Proposition tarifaire</Text>
            <Text style={styles.policyText}>
              Envoyez une proposition claire (ce qui est inclus / non inclus). Elle peut être ajustée avant acceptation.
              Une fois acceptée, le dossier passe à l’état “Démarré”.
            </Text>
          </View>

          <View style={styles.policyCard}>
            <Text style={styles.policyTitle}>4) Statuts & suivi</Text>
            <Text style={styles.policyText}>
              Statuts clés: Soumis → Proposition → Démarré. Gardez les informations à jour et ajoutez des étapes/services
              uniquement quand cela aide la compréhension du client.
            </Text>
          </View>

          <View style={styles.policyCard}>
            <Text style={styles.policyTitle}>5) Confidentialité</Text>
            <Text style={styles.policyText}>
              Ne partagez jamais de données sensibles en clair (numéros, scans complets) dans la messagerie.
              Utilisez les documents pour les pièces justificatives et restez factuel.
            </Text>
          </View>

          <View style={styles.policyCard}>
            <Text style={styles.policyTitle}>Bonnes pratiques</Text>
            <Text style={styles.policyText}>• Une action par message (max 3 points)</Text>
            <Text style={styles.policyText}>• Toujours une prochaine étape</Text>
            <Text style={styles.policyText}>• Ton professionnel, empathique, sans jargon</Text>
          </View>
        </>
      ) : (
        <>
          {/* Vue d'ensemble */}
          <Text style={styles.sectionTitle}>Inbox</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="people" size={22} color={Colors.primary} />
              <Text style={[styles.statValue, { color: Colors.primary }]}>{clients.length}</Text>
              <Text style={styles.statLabel}>Clients assignés</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="folder-open" size={22} color={Colors.orange} />
              <Text style={[styles.statValue, { color: Colors.orange }]}>{counts.withProject}</Text>
              <Text style={styles.statLabel}>Dossiers</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="file-tray" size={22} color={Colors.warning} />
              <Text style={[styles.statValue, { color: Colors.warning }]}>{counts.propositions}</Text>
              <Text style={styles.statLabel}>Propositions</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
              <Text style={[styles.statValue, { color: Colors.success }]}>{counts.actifs}</Text>
              <Text style={styles.statLabel}>Actifs</Text>
            </View>
          </View>

          {/* Recherche */}
          <View style={styles.proSearchRow}>
            <Ionicons name="search" size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.proSearchInput}
              value={q}
              onChangeText={setQ}
              placeholder="Rechercher un client…"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
          </View>

          {/* Liste clients */}
          <Text style={styles.sectionTitle}>Clients</Text>
          {loading ? (
            <ActivityIndicator color={Colors.orange} style={{ marginTop: 20 }} />
          ) : error ? (
            <View style={styles.proEmptyBox}>
              <Ionicons name="alert-circle" size={18} color={Colors.error} />
              <Text style={styles.proEmptyText}>{error}</Text>
              <TouchableOpacity style={styles.proRetryBtn} onPress={() => load()} activeOpacity={0.85}>
                <Text style={styles.proRetryText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : clients.length === 0 ? (
            <View style={styles.proEmptyBox}>
              <Ionicons name="mail-open" size={18} color={Colors.textMuted} />
              <Text style={styles.proEmptyText}>Aucun client assigné pour le moment.</Text>
            </View>
          ) : (
            clients.map((c) => {
              const displayName = (c.name || c.email || 'Client').trim();
              const preview = (c.last_msg || 'Aucun message').slice(0, 80);
              const status = String(c.project_status || '').toLowerCase();
              const statusLabel = status === 'proposition'
                ? 'Proposition'
                : status === 'demarre'
                  ? 'Démarré'
                  : status === 'soumis'
                    ? 'Soumis'
                    : status ? status : '';

              return (
                <TouchableOpacity
                  key={c.id}
                  style={styles.clientCard}
                  activeOpacity={0.85}
                  onPress={() => router.push({
                    pathname: '/(tabs)/messagerie' as any,
                    params: { mode: 'pro', clientId: c.id, clientName: displayName, clientEmail: c.email },
                  })}
                >
                  <View style={styles.clientRow}>
                    <View style={styles.clientAvatar}>
                      <Text style={styles.clientInitial}>{(displayName[0] || 'C').toUpperCase()}</Text>
                    </View>
                    <View style={styles.clientInfo}>
                      <View style={styles.clientNameRow}>
                        <Text style={styles.clientName} numberOfLines={1}>{displayName}</Text>
                        {statusLabel ? (
                          <View style={styles.proStatusPill}>
                            <Text style={styles.proStatusText}>{statusLabel}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.clientStep} numberOfLines={2}>{preview}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </>
      )}
    </ScrollView>
  );
}

// ── Tableau de bord Client ─────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(false); // pas de spinner bloquant au démarrage
  const [refreshing, setRefreshing] = useState(false);
  const [playing, setPlaying] = useState<Record<string, boolean>>({});
  const [unmuted, setUnmuted] = useState<Record<string, boolean>>({});

  const load = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    if (!token) { setLoading(false); return; }
    const res = await dashboardApi.getProject(token);
    if (res.data?.project) setProject(res.data.project);
    setLoading(false);
  };

  // Chargement silencieux en arrière-plan (n'bloque pas l'affichage)
  useEffect(() => { load(); }, [token]);

  useEffect(() => {
    // Permet audio même si switch silencieux (iOS)
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const isPro = user?.account_type === 'pro';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {isPro ? (
        <ProDashboard name={user?.name ?? 'Pro'} avatarKey={user?.avatar ?? null} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />}
        >
          {/* En-tête */}
          <View style={styles.header}>
            <Text style={styles.welcome}>Bienvenue sur CAPITUNE</Text>

            <TouchableOpacity
              style={styles.avatarCircle}
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/profil' as any)}
              accessibilityLabel="Ouvrir mon profil"
            >
              {getAvatarSource(user?.avatar) ? (
                <Image source={getAvatarSource(user?.avatar) as any} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarInitial}>{(user?.name ?? 'U')[0].toUpperCase()}</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.subtitle}>Voici l'état de votre dossier</Text>
          </View>

          {loading ? (
            <ActivityIndicator color={Colors.orange} style={{ marginTop: 60 }} />
          ) : (
            <>
              {project ? (
                <View style={styles.progressCard}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressTitle}>Avancement du dossier</Text>
                    <Text style={styles.progressPct}>{project?.progress ?? 0}%</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${project?.progress ?? 0}%` }]} />
                  </View>
                  {project?.steps?.map(step => (
                    <View key={step.id} style={styles.stepRow}>
                      <Ionicons
                        name={step.status === 'done' ? 'checkmark-circle' : step.status === 'active' ? 'time' : 'ellipse-outline'}
                        size={16}
                        color={step.status === 'done' ? Colors.success : step.status === 'active' ? Colors.orange : 'rgba(255,255,255,0.3)'}
                      />
                      <Text style={[styles.stepLabel, step.status === 'done' && styles.stepDone, step.status === 'active' && styles.stepActive]}>
                        {step.label}
                      </Text>
                      {step.date && <Text style={styles.stepDate}>{step.date}</Text>}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyProjectCard}>
                  <View style={styles.emptyProjectTop}>
                    <View style={styles.emptyProjectIcon}>
                      <Ionicons name="sparkles" size={18} color={Colors.orange} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.emptyProjectTitle}>Créez votre dossier</Text>
                      <Text style={styles.emptyProjectSub}>
                        Répondez à quelques questions avec CAPI pour générer votre plan et activer votre projet.
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.emptyProjectCta}
                    activeOpacity={0.85}
                    onPress={() => router.push('/capi')}
                  >
                    <Ionicons name="rocket-outline" size={18} color="#fff" />
                    <Text style={styles.emptyProjectCtaText}>Démarrer avec CAPI</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={styles.findAdvisorBtn}
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/conseillers' as any)}
              >
                <View style={styles.findAdvisorIcon}>
                  <Ionicons name="people" size={18} color={Colors.orange} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.findAdvisorTitle}>Trouvez votre conseiller</Text>
                  <Text style={styles.findAdvisorSub}>Swipez les profils et contactez</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </TouchableOpacity>

              {!isPro && (
              <TouchableOpacity
                style={styles.careerBtn}
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/carriere' as any)}
              >
                <View style={styles.careerIcon}>
                  <Ionicons name="school" size={18} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.findAdvisorTitle}>Espace Carrière & Études</Text>
                  <Text style={styles.findAdvisorSub}>Écoles, Emplois, CV et Match</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
              )}

              {/* Raccourcis */}
              <Text style={styles.sectionTitle}>Accès rapide</Text>
              <View style={styles.shortcutsGrid}>
                {[
                  { icon: 'document-text' as const, label: 'Documents', color: Colors.primary, route: '/(tabs)/documents' },
                  { icon: 'sparkles' as const, label: 'Inside', color: Colors.orange, route: '/(tabs)/inside' },
                  { icon: 'folder-open' as const, label: 'Mon Projet', color: Colors.primaryDark, route: '/(tabs)/projet' },
                ].map(item => (
                  <TouchableOpacity
                    key={item.label}
                    style={styles.shortcut}
                    activeOpacity={0.75}
                    onPress={() => router.push(item.route as any)}
                  >
                    <View style={styles.shortcutTopRow}>
                      <View style={[styles.shortcutIcon, { backgroundColor: `${item.color}18` }]}>
                        <Ionicons name={item.icon} size={22} color={item.color} />
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                    </View>
                    <Text style={styles.shortcutLabel}>{item.label}</Text>
                    <Text style={styles.shortcutHint}>Ouvrir</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Vidéos (Accueil) */}
              <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Vidéos</Text>
              <View style={styles.videosGrid}>
                {DASH_VIDEOS.map(v => (
                  <View key={v.id} style={styles.videoCard}>
                    <Video
                      source={v.source}
                      style={styles.video}
                      resizeMode={ResizeMode.COVER}
                      shouldPlay={!!playing[v.id]}
                      isLooping
                      isMuted={!unmuted[v.id]}
                    />
                    <TouchableOpacity
                      style={styles.videoPlayBtn}
                      activeOpacity={0.85}
                      onPress={() => setPlaying(prev => ({ ...prev, [v.id]: !prev[v.id] }))}
                      accessibilityLabel={playing[v.id] ? 'Pause' : 'Lecture'}
                    >
                      <Ionicons name={playing[v.id] ? 'pause' : 'play'} size={16} color={Colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.videoMuteBtn}
                      activeOpacity={0.85}
                      onPress={() => setUnmuted(prev => ({ ...prev, [v.id]: !prev[v.id] }))}
                      accessibilityLabel={unmuted[v.id] ? 'Couper le son' : 'Activer le son'}
                    >
                      <Ionicons name={unmuted[v.id] ? 'volume-high' : 'volume-mute'} size={16} color={Colors.text} />
                    </TouchableOpacity>
                    <View style={styles.videoCaption}>
                      <Text style={styles.videoTitle}>{v.title}</Text>
                    </View>
                  </View>
                ))}
              </View>

            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgLight },
  scroll: { padding: 20 },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 10,
  },
  welcome: { fontSize: 22, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  subtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 3 },
  avatarCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.orange, justifyContent: 'center', alignItems: 'center',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 6,
  },
  walletPillInline: {
    minWidth: 150,
    maxWidth: 190,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    marginTop: -12,
    ...UI.cardBorder,
    ...UI.cardShadow,
  },
  walletLabel: { fontSize: 10, fontWeight: '900', color: Colors.textMuted },
  walletTextCol: { alignItems: 'center' },
  walletAmount: { marginTop: 2, fontSize: 12, fontWeight: '900', color: Colors.text, textAlign: 'center' },
  avatarImg: { width: 64, height: 64, borderRadius: 32 },
  avatarInitial: { color: '#fff', fontSize: 24, fontWeight: '800' },
  progressCard: {
    backgroundColor: Colors.primary,
    borderRadius: 18, padding: 20, marginBottom: 28,
  },
  progressHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  progressTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  progressPct: { color: Colors.orangeLight, fontSize: 26, fontWeight: '800' },
  progressBarBg: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 6, height: 8, marginBottom: 18,
  },
  progressBarFill: {
    height: '100%', borderRadius: 6,
    backgroundColor: Colors.orange,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  stepLabel: { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.45)' },
  stepDone: { color: 'rgba(255,255,255,0.75)' },
  stepActive: { color: Colors.orangeLight, fontWeight: '700' },
  stepDate: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 14 },
  shortcutsGrid: { flexDirection: 'row', gap: 12 },
  shortcut: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    gap: 8,
    ...UI.cardBorder,
    ...UI.cardShadow,
  },
  shortcutTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shortcutIcon: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  shortcutLabel: { fontSize: 13, fontWeight: '800', color: Colors.text },
  shortcutHint: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },

  videosGrid: { gap: 12 },
  videoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...UI.cardShadow,
  },
  video: { width: '100%', height: 210, backgroundColor: '#000' },
  videoPlayBtn: {
    position: 'absolute',
    left: 12,
    bottom: 44,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoMuteBtn: {
    position: 'absolute',
    right: 12,
    bottom: 44,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoCaption: { paddingHorizontal: 14, paddingVertical: 10 },
  videoTitle: { fontSize: 13, fontWeight: '800', color: Colors.text },

  emptyProjectCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    ...UI.cardShadow,
  },
  emptyProjectTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  emptyProjectIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.orange + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyProjectTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  emptyProjectSub: { fontSize: 12, color: Colors.textMuted, marginTop: 4, lineHeight: 18 },
  emptyProjectCta: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.orange,
    borderRadius: 14,
    paddingVertical: 12,
  },
  emptyProjectCtaText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  // Pro
  findAdvisorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 14,
    marginTop: 16,
    marginBottom: 8,
    ...UI.cardShadow,
  },
  findAdvisorIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.orange + '18',
    borderWidth: 1,
    borderColor: Colors.orange + '35',
  },
  findAdvisorTitle: { fontSize: 14, fontWeight: '900', color: Colors.text },
  findAdvisorSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  careerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 8,
    ...UI.cardShadow,
  },
  careerIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '18',
    borderWidth: 1,
    borderColor: Colors.primary + '35',
  },
  avatarPro: { backgroundColor: Colors.primary },
  proBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary + '14',
    borderWidth: 1, borderColor: Colors.primary + '35',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
    alignSelf: 'center', marginBottom: 24,
  },
  proBadgeText: { color: Colors.primary, fontSize: 12, fontWeight: '700' },
  subtitlePro: { color: Colors.primary },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  statCard: {
    width: '46.5%', backgroundColor: Colors.surface,
    borderRadius: 14, padding: 16, alignItems: 'center', gap: 6,
    ...UI.cardBorder,
    ...UI.cardShadow,
  },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', fontWeight: '600' },
  clientCard: {
    backgroundColor: Colors.surface, borderRadius: 14,
    padding: 16, marginBottom: 12,
    ...UI.cardBorder,
    ...UI.cardShadow,
  },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  clientAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  clientInitial: { color: '#fff', fontWeight: '800', fontSize: 16 },
  clientInfo: { flex: 1 },
  clientNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clientName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  urgentBadge: {
    backgroundColor: 'rgba(245,158,11,0.2)', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  urgentText: { fontSize: 10, color: Colors.warning, fontWeight: '700' },
  clientStep: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  clientPct: { fontSize: 18, fontWeight: '800', color: Colors.text },

  proSearchRow: {
    marginTop: 6,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    ...UI.cardBorder,
  },
  proSearchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  proEmptyBox: {
    marginTop: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...UI.cardBorder,
  },
  proEmptyText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  proRetryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.orange,
  },
  proRetryText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
  proStatusPill: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Colors.orange + '14',
    borderWidth: 1,
    borderColor: Colors.orange + '35',
  },
  proStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.orange,
  },

  proTabs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  proTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    ...UI.cardBorder,
  },
  proTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  proTabText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMuted,
  },
  proTabTextActive: {
    color: '#fff',
  },

  policyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    ...UI.cardBorder,
    ...UI.cardShadow,
  },
  policyTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.text,
  },
  policyText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textMuted,
    fontWeight: '600',
  },
});
