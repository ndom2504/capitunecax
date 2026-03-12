import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Linking, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/Colors';
import { UI } from '../../constants/UI';
import { dashboardApi, proApi, type Payment, type ProClientRow } from '../../lib/api';
import { LOCAL_PROJECT_KEY } from '../../lib/local-project';
import { useAuth } from '../../context/AuthContext';

type TabKey = 'etapes' | 'documents' | 'services' | 'conseiller';

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'etapes', label: 'Étapes', icon: 'list-outline' },
  { key: 'documents', label: 'Documents', icon: 'document-text-outline' },
  { key: 'services', label: 'Services', icon: 'briefcase-outline' },
  { key: 'conseiller', label: 'Conseiller', icon: 'person-outline' },
];

const STATUS_CFG: Record<string, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  completed:   { label: 'Complété', color: Colors.success, icon: 'checkmark-circle' },
  in_progress: { label: 'En cours', color: Colors.orange, icon: 'time' },
  pending:     { label: 'En attente', color: Colors.textMuted, icon: 'ellipse-outline' },
  blocked:     { label: 'Bloqué', color: Colors.error, icon: 'alert-circle' },
};

export default function ProjetScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const isPro = user?.account_type === 'pro';
  const [project, setProject] = useState<any>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('etapes');

  // Mode Pro: liste des dossiers assignés
  const [q, setQ] = useState('');
  const [clients, setClients] = useState<ProClientRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadPro = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      if (!token) {
        setClients([]);
        return;
      }
      const res = await proApi.listClients(token, { page: 1, q });
      if (res.error) {
        setError(res.error);
        setClients([]);
      } else {
        setClients(res.data?.clients ?? []);
      }
    } catch (e) {
      setError('Impossible de charger les dossiers.');
      setClients([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, q]);

  useEffect(() => {
    if (!isPro) return;
    const t = setTimeout(() => { loadPro(); }, 250);
    return () => clearTimeout(t);
  }, [isPro, q, loadPro]);

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const localRaw = await AsyncStorage.getItem(LOCAL_PROJECT_KEY);
      const localProject = localRaw ? (() => { try { return JSON.parse(localRaw); } catch { return null; } })() : null;

      if (!token) {
        setProject(localProject);
        setPayments([]);
        return;
      }

      const res = await dashboardApi.getProject(token);
      const backendProject = res.data?.project ?? null;
      setProject(backendProject ?? localProject);

      const payRes = await dashboardApi.getPayments(token);
      setPayments(payRes.data?.payments ?? []);
    } catch (err) {
      console.log('MonProjet load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    if (isPro) {
      loadPro();
    } else {
      load();
    }
  }, [isPro, load, loadPro]));

  const onRefresh = () => {
    setRefreshing(true);
    if (isPro) loadPro(true);
    else load(true);
  };

  if (isPro) {
    const dossiers = clients.filter(c => {
      const st = String(c.project_status ?? '').toLowerCase();
      return Boolean(st) && st !== 'annule';
    });

    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 28 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />}
        >
          <View style={styles.proHeader}>
            <Text style={styles.proTitle}>Projet</Text>
            <Text style={styles.proSubtitle}>Dossiers assignés</Text>
          </View>

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

          {loading ? (
            <ActivityIndicator color={Colors.orange} style={{ marginTop: 24 }} />
          ) : error ? (
            <View style={styles.proEmptyBox}>
              <Ionicons name="alert-circle" size={18} color={Colors.error} />
              <Text style={styles.proEmptyText}>{error}</Text>
              <TouchableOpacity style={styles.proRetryBtn} onPress={() => loadPro()} activeOpacity={0.85}>
                <Text style={styles.proRetryText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : dossiers.length === 0 ? (
            <View style={styles.proEmptyBox}>
              <Ionicons name="folder-open" size={18} color={Colors.textMuted} />
              <Text style={styles.proEmptyText}>Aucun dossier pour le moment.</Text>
            </View>
          ) : (
            dossiers.map((c) => {
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
                  style={styles.proClientCard}
                  activeOpacity={0.85}
                  onPress={() => router.push({
                    pathname: '/(tabs)/messagerie' as any,
                    params: { mode: 'pro', clientId: c.id, clientName: displayName, clientEmail: c.email },
                  })}
                >
                  <View style={styles.proClientRow}>
                    <View style={styles.proClientAvatar}>
                      <Text style={styles.proClientInitial}>{(displayName[0] || 'C').toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.proClientName} numberOfLines={1}>{displayName}</Text>
                        {statusLabel ? (
                          <View style={styles.proStatusPill}>
                            <Text style={styles.proStatusText}>{statusLabel}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.proClientPreview} numberOfLines={2}>{preview}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.orange} />
        </View>
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.emptyBox}>
          <Text style={{ fontSize: 52 }}>📋</Text>
          <Text style={styles.emptyTitle}>Aucun projet actif</Text>
          <Text style={styles.emptySubtitle}>
            Démarrez avec CAPITUNE pour créer votre projet d'immigration personnalisé.
          </Text>
          <TouchableOpacity
            style={styles.capiBtn}
            onPress={() => router.push('/capi')}
            activeOpacity={0.85}
          >
            <Ionicons name="rocket-outline" size={18} color="#fff" />
            <Text style={styles.capiBtnText}>Démarrer avec CAPITUNE</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const steps: any[] = project.steps ?? [];
  const documents: any[] = project.documents ?? [];
  const services: any[] = project.services ?? [];
  const advisor = project.advisor;
  const completedSteps = steps.filter((s: any) => s.status === 'completed').length;
  const progress = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;

  const openSupport = () => {
    Linking.openURL('mailto:equipe@capitune.com?subject=Paiement%20CAPITUNE');
  };

  const handlePayNow = (p: Payment) => {
    Alert.alert(
      'Paiement',
      `Le paiement in-app est en cours d'intégration.\n\nFacture: ${p.label}\nMontant: ${p.amount} ${p.currency ?? 'CAD'}`,
      [
        { text: 'OK' },
        { text: 'Contacter le support', onPress: openSupport },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Mon Projet</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{project.programme ?? project.title ?? 'Dossier immigration'}</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Barre de progression globale */}
      <View style={styles.progressSection}>
        <View style={styles.progressTop}>
          <Text style={styles.progressLabel}>Avancement global</Text>
          <Text style={styles.progressPct}>{progress}%</Text>
        </View>
        <View style={styles.progressBarOuter}>
          <View style={[styles.progressBarInner, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressNote}>{completedSteps} / {steps.length} étapes complétées</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.85}
          >
            <Ionicons name={tab.icon} size={14} color={activeTab === tab.key ? Colors.orange : Colors.textMuted} />
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />}
      >
        {/* === ÉTAPES === */}
        {activeTab === 'etapes' && (
          <View style={styles.content}>
            {steps.length === 0 ? (
              <Text style={styles.emptyText}>Aucune étape définie pour l'instant.</Text>
            ) : (
              steps.map((step: any, idx: number) => {
                const cfg = STATUS_CFG[step.status] ?? STATUS_CFG.pending;
                const isLast = idx === steps.length - 1;
                return (
                  <View key={step.id ?? idx} style={styles.stepRow}>
                    <View style={styles.stepLeft}>
                      <View style={[styles.stepDotOuter, { borderColor: cfg.color }]}>
                        <Ionicons name={cfg.icon} size={16} color={cfg.color} />
                      </View>
                      {!isLast && <View style={[styles.stepLine, { borderColor: cfg.color + '40' }]} />}
                    </View>
                    <View style={[styles.stepCard, isLast && { marginBottom: 0 }]}>
                      <View style={styles.stepTop}>
                        <Text style={styles.stepTitle}>{step.title ?? step.titre}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: cfg.color + '18' }]}>
                          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                        </View>
                      </View>
                      {step.description && (
                        <Text style={styles.stepDesc}>{step.description}</Text>
                      )}
                      {step.dueDate && (
                        <View style={styles.dueDateRow}>
                          <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
                          <Text style={styles.dueDate}>{step.dueDate}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}

            {/* Paiements (intégré dans le projet) */}
            {payments.length > 0 && (
              <View style={styles.paymentsCard}>
                <View style={styles.paymentsHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.paymentsTitle}>Paiements</Text>
                    <Text style={styles.paymentsSub}>Les paiements se débloquent quand une étape est validée.</Text>
                  </View>
                  <Ionicons name="card-outline" size={18} color={Colors.textMuted} />
                </View>

                {(() => {
                  const pending = payments.filter(p => p.status === 'pending');
                  const paidCount = payments.filter(p => p.status === 'paid').length;
                  const unlockedCount = Math.max(0, completedSteps - paidCount);

                  if (pending.length === 0) {
                    return <Text style={styles.paymentsEmpty}>Aucun paiement en attente.</Text>;
                  }

                  return pending.map((p, i) => {
                    const enabled = i < unlockedCount;
                    return (
                      <View key={p.id} style={styles.paymentRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.paymentLabel} numberOfLines={2}>{p.label}</Text>
                          <Text style={styles.paymentMeta}>{p.amount} {p.currency ?? 'CAD'} · {enabled ? 'Disponible' : 'Verrouillé'}</Text>
                        </View>
                        {enabled ? (
                          <TouchableOpacity style={styles.payBtn} activeOpacity={0.85} onPress={() => handlePayNow(p)}>
                            <Text style={styles.payBtnText}>Payer</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.lockedPill}>
                            <Ionicons name="lock-closed" size={14} color={Colors.textMuted} />
                          </View>
                        )}
                      </View>
                    );
                  });
                })()}
              </View>
            )}
          </View>
        )}

        {/* === DOCUMENTS === */}
        {activeTab === 'documents' && (
          <View style={styles.content}>
            {documents.length === 0 ? (
              <Text style={styles.emptyText}>Aucun document trouvé.</Text>
            ) : (
              documents.map((doc: any, idx: number) => {
                const isDone = doc.status === 'provided' || doc.received;
                return (
                  <View key={doc.id ?? idx} style={styles.docCard}>
                    <View style={[styles.docIconBox, { backgroundColor: isDone ? Colors.success + '15' : Colors.orange + '15' }]}>
                      <Ionicons
                        name={isDone ? 'checkmark-circle' : 'document-outline'}
                        size={20}
                        color={isDone ? Colors.success : Colors.orange}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docTitle}>{doc.document_name ?? doc.name ?? 'Document'}</Text>
                      <Text style={styles.docStatus}>{isDone ? 'Reçu' : 'À fournir'}</Text>
                    </View>
                    {!isDone && (
                      <TouchableOpacity
                        style={styles.uploadBtn}
                        activeOpacity={0.85}
                        onPress={() => router.push('/(tabs)/documents')}
                      >
                        <Ionicons name="cloud-upload-outline" size={16} color={Colors.orange} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* === SERVICES === */}
        {activeTab === 'services' && (
          <View style={styles.content}>
            {services.length === 0 ? (
              <View style={styles.emptyServicesBox}>
                <Text style={styles.emptyText}>Aucun service actif.</Text>
                <TouchableOpacity style={styles.addServiceBtn} activeOpacity={0.85}>
                  <Ionicons name="add-circle-outline" size={16} color={Colors.orange} />
                  <Text style={styles.addServiceText}>Ajouter des services</Text>
                </TouchableOpacity>
              </View>
            ) : (
              services.map((svc: any, idx: number) => (
                <View key={svc.id ?? idx} style={styles.serviceCard}>
                  <View style={styles.serviceIconBox}>
                    <Ionicons name="briefcase-outline" size={20} color={Colors.orange} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceTitle}>{svc.name ?? svc.nom}</Text>
                    <Text style={styles.serviceStatus}>{svc.status === 'active' ? 'Actif' : 'En attente'}</Text>
                  </View>
                  {svc.amount && (
                    <Text style={styles.serviceAmount}>{svc.amount} $</Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* === CONSEILLER === */}
        {activeTab === 'conseiller' && (
          <View style={styles.content}>
            {!advisor ? (
              <View style={styles.noAdvisorBox}>
                <Text style={{ fontSize: 40 }}>👨‍💼</Text>
                <Text style={styles.noAdvisorTitle}>Aucun conseiller assigné</Text>
                <Text style={styles.noAdvisorSub}>
                  Un conseiller sera assigné après la création de votre projet via CAPI.
                </Text>
              </View>
            ) : (
              <View style={styles.advisorCard}>
                <View style={styles.advisorAvatar}>
                  <Text style={styles.advisorInitial}>{(advisor.name ?? advisor.nom ?? 'C')[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.advisorName}>{advisor.name ?? advisor.nom}</Text>
                  <Text style={styles.advisorTitle}>{advisor.title ?? advisor.titre}</Text>
                </View>
                <TouchableOpacity
                  style={styles.msgBtn}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/messagerie',
                      params: {
                        advisorName: String(advisor.name ?? advisor.nom ?? 'Conseiller'),
                        advisorAvatarKey: String(advisor.avatar_key ?? advisor.avatarKey ?? ''),
                        prefill: '1',
                      },
                    } as any)
                  }
                  accessibilityLabel="Contacter mon conseiller"
                >
                  <Ionicons name="sparkles-outline" size={20} color={Colors.orange} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgLight },
  proHeader: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  proTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  proSubtitle: { marginTop: 2, fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  proSearchRow: {
    marginTop: 6,
    marginHorizontal: 20,
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
    marginTop: 12,
    marginHorizontal: 20,
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
  proClientCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    ...UI.cardBorder,
    ...UI.cardShadow,
  },
  proClientRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  proClientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proClientInitial: { color: '#fff', fontWeight: '800', fontSize: 16 },
  proClientName: { fontSize: 14, fontWeight: '800', color: Colors.text, maxWidth: 220 },
  proClientPreview: { marginTop: 2, fontSize: 12, color: Colors.textMuted },
  proStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Colors.orange + '14',
    borderWidth: 1,
    borderColor: Colors.orange + '35',
  },
  proStatusText: { fontSize: 11, fontWeight: '800', color: Colors.orange },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  capiBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.orange, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, gap: 8, marginTop: 8 },
  capiBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  refreshBtn: { marginTop: 4, padding: 8 },
  progressSection: { marginHorizontal: 20, marginBottom: 16, backgroundColor: Colors.surface, borderRadius: 16, padding: 16, ...UI.cardBorder, ...UI.cardShadow },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 13, fontWeight: '600', color: Colors.text },
  progressPct: { fontSize: 16, fontWeight: '800', color: Colors.orange },
  progressBarOuter: { height: 6, backgroundColor: Colors.border, borderRadius: 3, marginBottom: 6 },
  progressBarInner: { height: 6, backgroundColor: Colors.orange, borderRadius: 3 },
  progressNote: { fontSize: 12, color: Colors.textMuted },
  tabsRow: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: Colors.surface, borderRadius: 12, padding: 4, marginBottom: 12 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 10 },
  tabActive: { backgroundColor: Colors.orange + '20' },
  tabLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' },
  tabLabelActive: { color: Colors.orange, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20 },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', paddingVertical: 20 },
  // Étapes
  stepRow: { flexDirection: 'row', gap: 14 },
  stepLeft: { alignItems: 'center', width: 34 },
  stepDotOuter: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  stepLine: { flex: 1, width: 0, borderLeftWidth: 2, borderStyle: 'dashed', marginVertical: 4 },
  stepCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 14, ...UI.cardBorder, ...UI.cardShadow },
  stepTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  stepTitle: { fontSize: 14, fontWeight: '600', color: Colors.text, flex: 1 },
  statusBadge: { borderRadius: 20, paddingVertical: 3, paddingHorizontal: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  stepDesc: { fontSize: 12, color: Colors.textMuted, marginBottom: 6, lineHeight: 17 },
  dueDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dueDate: { fontSize: 11, color: Colors.textMuted },
  // Documents
  docCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, gap: 12, ...UI.cardBorder, ...UI.cardShadow },
  docIconBox: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  docTitle: { fontSize: 13, fontWeight: '600', color: Colors.text },
  docStatus: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  uploadBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.orange + '15', justifyContent: 'center', alignItems: 'center' },
  // Services
  emptyServicesBox: { alignItems: 'center', gap: 14, paddingVertical: 20 },
  addServiceBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.orange, paddingVertical: 10, paddingHorizontal: 20 },
  addServiceText: { fontSize: 14, fontWeight: '600', color: Colors.orange },
  serviceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, gap: 12, ...UI.cardBorder, ...UI.cardShadow },
  serviceIconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: Colors.orange + '15', justifyContent: 'center', alignItems: 'center' },
  serviceTitle: { fontSize: 13, fontWeight: '600', color: Colors.text },
  serviceStatus: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  serviceAmount: { fontSize: 14, fontWeight: '700', color: Colors.orange },
  // Conseiller
  noAdvisorBox: { alignItems: 'center', gap: 12, paddingVertical: 32 },
  noAdvisorTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  noAdvisorSub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  advisorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 16, padding: 18, gap: 14, ...UI.cardBorder, ...UI.cardShadow },
  advisorAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.orange + '25', justifyContent: 'center', alignItems: 'center' },
  advisorInitial: { fontSize: 26, fontWeight: '800', color: Colors.orange },
  advisorName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  advisorTitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  msgBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.orange + '15', justifyContent: 'center', alignItems: 'center' },

  // Paiements (dans Projet)
  paymentsCard: { marginTop: 10, backgroundColor: Colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: Colors.border, ...UI.cardShadow },
  paymentsHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  paymentsTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },
  paymentsSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2, lineHeight: 17 },
  paymentsEmpty: { fontSize: 13, color: Colors.textMuted, paddingVertical: 6 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  paymentLabel: { fontSize: 13, fontWeight: '700', color: Colors.text },
  paymentMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  payBtn: { backgroundColor: Colors.orange, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 },
  payBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  lockedPill: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.offWhite, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
});
