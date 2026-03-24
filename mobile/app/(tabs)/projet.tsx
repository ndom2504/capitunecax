import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Linking, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
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
      const res = await proApi.getDossiers(token || '');
      if (res.error) {
        setError(res.error);
      } else {
        setClients(res.data || []);
      }
    } catch (err) {
      setError('Erreur de chargement');
    } finally {
      if (!isRefresh) setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPro(true);
  }, [loadPro]);

  useEffect(() => {
    loadPro();
  }, [loadPro]);

  const publish = async (title: string, content: string) => {
    if (!token) return;
    try {
      const res = await dashboardApi.publish(token, { title, content });
      if (res.error) {
        Alert.alert('Erreur', res.error);
      } else {
        Alert.alert('Publié', 'Votre publication a été partagée');
      }
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de publier');
    }
  };

  const openSupport = () => {
    Linking.openURL('https://capitune.com/support');
  };

  const openCAPI = () => {
    router.push('/(tabs)/dashboard' as any);
  };

  // Mode Pro: liste des dossiers assignés
  if (isPro) {
    const dossiers = clients.filter(c => {
      const st = String(c.project_status ?? '').toLowerCase();
      return Boolean(st) && st !== 'annule';
    });

    return (
      <>
        <StatusBar style="light" backgroundColor={Colors.primary} />
        <SafeAreaView style={styles.root}>
          
          {/* HEADER */}
          <LinearGradient
            colors={['#1e3a8a', '#143FA8']}
            style={styles.headerGradient}
          >
            <View style={styles.header}>
              <View style={styles.headerCenter}>
                <Text style={styles.title}>PROJET</Text>
                <Text style={styles.subtitle}>Dossiers assignés</Text>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="search" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="notifications-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>

          {/* BARRES */}
          <View style={styles.barsContainer}>
            <View style={styles.bar}>
              <Text style={styles.barText}>📋 Étapes</Text>
            </View>
            <View style={styles.bar}>
              <Text style={styles.barText}>📄 Documents</Text>
            </View>
            <View style={styles.bar}>
              <Text style={styles.barText}>💼 Services</Text>
            </View>
            <View style={styles.bar}>
              <Text style={styles.barText}>👤 Conseiller</Text>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />}
          >
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
              />
            </View>

            {loading ? (
              <ActivityIndicator color={Colors.orange} style={{ marginTop: 24 }} />
            ) : error ? (
              <View style={styles.proEmptyBox}>
                <Ionicons name="alert-circle" size={18} color={Colors.error} />
                <Text style={styles.proEmptyText}>{error}</Text>
                <TouchableOpacity style={styles.proRetryBtn} onPress={() => loadPro()} activeOpacity={0.85}>
                  <Ionicons name="refresh" size={14} color="#fff" />
                  <Text style={styles.proRetryText}>Réessayer</Text>
                </TouchableOpacity>
              </View>
            ) : dossiers.length === 0 ? (
              <View style={styles.proEmptyBox}>
                <Ionicons name="folder-open" size={18} color={Colors.textMuted} />
                <Text style={styles.proEmptyText}>Aucun dossier pour le moment.</Text>
              </View>
            ) : (
              dossiers.map((c, idx) => {
                const displayName = c.first_name + ' ' + c.last_name;
                const statusKey = String(c.project_status ?? '').toLowerCase();
                const statusLabel = STATUS_CFG[statusKey]?.label;
                const statusColor = STATUS_CFG[statusKey]?.color;
                const statusIcon = STATUS_CFG[statusKey]?.icon;

                return (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.proClientCard}
                    activeOpacity={0.85}
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/dashboard',
                        params: {
                          mode: 'pro',
                          clientId: c.id,
                          clientName: displayName,
                          clientEmail: c.email,
                        },
                      } as any)
                    }
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
                        <Text style={styles.proClientPreview}>{c.email}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </>
    );
  }

  // Mode Client: affichage du projet individuel
  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.orange} />
        </View>
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.emptyBox}>
          <Text style={{ fontSize: 52 }}>📋</Text>
          <Text style={styles.emptyTitle}>Aucun projet actif</Text>
          <Text style={styles.emptySubtitle}>
            Commencez votre projet via CAPI pour suivre votre progression.
          </Text>
          <TouchableOpacity style={styles.capiBtn} activeOpacity={0.85} onPress={openCAPI}>
            <Text style={styles.capiBtnText}>Commencer avec CAPI</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const steps = project.steps || [];
  const completedSteps = steps.filter((s: any) => s.status === 'completed').length;
  const progress = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" backgroundColor={Colors.primary} />
      
      {/* HEADER */}
      <LinearGradient
        colors={['#1e3a8a', '#143FA8']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>PROJET</Text>
            <Text style={styles.subtitle}>Mon projet</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="search" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* BARRES */}
      <View style={styles.barsContainer}>
        <View style={styles.bar}>
          <Text style={styles.barText}>📋 Étapes</Text>
        </View>
        <View style={styles.bar}>
          <Text style={styles.barText}>📄 Documents</Text>
        </View>
        <View style={styles.bar}>
          <Text style={styles.barText}>💼 Services</Text>
        </View>
        <View style={styles.bar}>
          <Text style={styles.barText}>👤 Conseiller</Text>
        </View>
      </View>

      {/* Contenu du projet */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
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
              <Ionicons
                name={tab.icon}
                size={16}
                color={activeTab === tab.key ? Colors.orange : Colors.textMuted}
              />
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contenu selon tab active */}
        <View style={styles.content}>
          {activeTab === 'etapes' && (
            steps.length === 0 ? (
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
            )
          )}

          {activeTab === 'documents' && (
            <Text style={styles.emptyText}>Aucun document trouvé.</Text>
          )}

          {activeTab === 'services' && (
            <Text style={styles.emptyText}>Aucun service actif.</Text>
          )}

          {activeTab === 'conseiller' && (
            <Text style={styles.emptyText}>Aucun conseiller assigné</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Header styles (adaptés du dashboard)
  headerGradient: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },

  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },

  subtitle: {
    color: '#cbd5f5',
    fontSize: 14,
    marginTop: 2,
  },

  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Barres styles
  barsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  bar: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    marginHorizontal: 5,
  },

  barText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e3a8a',
  },

  // Styles existants (conservés)
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
});
