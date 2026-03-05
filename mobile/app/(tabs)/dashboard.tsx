import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { UI } from '../../constants/UI';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi, type ProjectData } from '../../lib/api';
import { useRouter } from 'expo-router';
import { getAvatarSource } from '../../lib/avatar';

const STEPS_LABELS = [
  'Analyse du profil',
  'Montage du dossier',
  'Révision',
  'Dépôt officiel',
  'Décision',
];

// ── Tableau de bord Professionnel ─────────────────────────────────────────────
function ProDashboard({ name, avatarKey }: { name: string; avatarKey?: string | null }) {
  const STATS = [
    { label: 'Dossiers actifs', value: '8', icon: 'folder-open' as const, color: '#3b9eff' },
    { label: 'Inside — Actus', value: '3', icon: 'sparkles' as const, color: Colors.orange },
    { label: 'Docs en attente', value: '5', icon: 'document-text' as const, color: Colors.warning },
    { label: 'Complétés ce mois', value: '2', icon: 'checkmark-circle' as const, color: Colors.success },
  ];

  const CLIENTS = [
    { name: 'Sophie Martin', step: 'Révision', progress: 62, urgent: true },
    { name: 'Jean Kouassi', step: 'Montage du dossier', progress: 35, urgent: false },
    { name: 'Amina Benali', step: 'Dépôt officiel', progress: 85, urgent: false },
  ];

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {/* En-tête Pro */}
      <View style={styles.header}>
        <Text style={styles.welcome}>Bienvenue sur Capitune</Text>

        <View style={[styles.avatarCircle, styles.avatarPro]}>
          {getAvatarSource(avatarKey) ? (
            <Image source={getAvatarSource(avatarKey) as any} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarInitial}>{name[0].toUpperCase()}</Text>
          )}
        </View>

        <Text style={[styles.subtitle, styles.subtitlePro]}>Tableau de bord Professionnel</Text>
      </View>

      {/* Badge Pro */}
      <View style={styles.proBadge}>
        <Ionicons name="briefcase" size={14} color="#3b9eff" />
        <Text style={styles.proBadgeText}>Compte Professionnel</Text>
      </View>

      {/* Stats */}
      <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
      <View style={styles.statsGrid}>
        {STATS.map(s => (
          <View key={s.label} style={styles.statCard}>
            <Ionicons name={s.icon} size={22} color={s.color} />
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Clients récents */}
      <Text style={styles.sectionTitle}>Dossiers clients</Text>
      {CLIENTS.map(c => (
        <TouchableOpacity key={c.name} style={styles.clientCard} activeOpacity={0.8}>
          <View style={styles.clientRow}>
            <View style={styles.clientAvatar}>
              <Text style={styles.clientInitial}>{c.name[0]}</Text>
            </View>
            <View style={styles.clientInfo}>
              <View style={styles.clientNameRow}>
                <Text style={styles.clientName}>{c.name}</Text>
                {c.urgent && (
                  <View style={styles.urgentBadge}>
                    <Text style={styles.urgentText}>Action requise</Text>
                  </View>
                )}
              </View>
              <Text style={styles.clientStep}>Étape : {c.step}</Text>
            </View>
            <Text style={styles.clientPct}>{c.progress}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${c.progress}%`, backgroundColor: c.urgent ? Colors.warning : '#3b9eff' }]} />
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ── Tableau de bord Client ─────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!token) { setLoading(false); return; }
    const res = await dashboardApi.getProject(token);
    if (res.data?.project) setProject(res.data.project);
    setLoading(false);
  };

  useEffect(() => { load(); }, [token]);

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
            <Text style={styles.welcome}>Bienvenue sur Capitune</Text>

            <View style={styles.avatarCircle}>
              {getAvatarSource(user?.avatar) ? (
                <Image source={getAvatarSource(user?.avatar) as any} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarInitial}>{(user?.name ?? 'U')[0].toUpperCase()}</Text>
              )}
            </View>

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

              {/* Raccourcis */}
              <Text style={styles.sectionTitle}>Accès rapide</Text>
              <View style={styles.shortcutsGrid}>
                {[
                  { icon: 'folder' as const, label: 'Documents', color: '#3b82f6', route: '/(tabs)/documents' },
                  { icon: 'sparkles' as const, label: 'Inside', color: Colors.orange, route: '/(tabs)/inside' },
                  { icon: 'folder-open' as const, label: 'Mon Projet', color: '#a855f7', route: '/(tabs)/projet' },
                ].map(item => (
                  <TouchableOpacity
                    key={item.label}
                    style={styles.shortcut}
                    activeOpacity={0.75}
                    onPress={() => router.push(item.route as any)}
                  >
                    <View style={[styles.shortcutIcon, { backgroundColor: `${item.color}22` }]}>
                      <Ionicons name={item.icon} size={22} color={item.color} />
                    </View>
                    <Text style={styles.shortcutLabel}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

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
    borderRadius: 14, padding: 16, alignItems: 'center', gap: 8,
    ...UI.cardBorder,
    ...UI.cardShadow,
  },
  shortcutIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  shortcutLabel: { fontSize: 13, fontWeight: '600', color: Colors.text, textAlign: 'center' },

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
  subtitlePro: { color: '#3b9eff' },
  avatarPro: { backgroundColor: Colors.primary },
  proBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(59,158,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(59,158,255,0.3)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
    alignSelf: 'flex-start', marginBottom: 24,
  },
  proBadgeText: { color: '#3b9eff', fontSize: 12, fontWeight: '700' },
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
});
