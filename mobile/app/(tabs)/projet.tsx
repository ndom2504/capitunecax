import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/Colors';
import { dashboardApi } from '../../lib/api';

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
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('etapes');

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;
      const res = await dashboardApi.getProject(token);
      setProject(res.data?.project ?? null);
    } catch (err) {
      console.log('MonProjet load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(true); };

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
            Parlez à CAPI depuis le Dashboard pour créer votre projet d'immigration personnalisé.
          </Text>
          <TouchableOpacity
            style={styles.capiBtn}
            onPress={() => router.push('/(tabs)/dashboard')}
            activeOpacity={0.85}
          >
            <Ionicons name="home-outline" size={18} color="#fff" />
            <Text style={styles.capiBtnText}>Aller au Dashboard</Text>
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
                <TouchableOpacity style={styles.msgBtn} activeOpacity={0.85} onPress={() => router.push('/(tabs)/messagerie')}>
                  <Ionicons name="chatbubble-outline" size={20} color={Colors.orange} />
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
  root: { flex: 1, backgroundColor: Colors.primaryDark },
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
  progressSection: { marginHorizontal: 20, marginBottom: 16, backgroundColor: Colors.surface, borderRadius: 16, padding: 16 },
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
  stepCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 14 },
  stepTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  stepTitle: { fontSize: 14, fontWeight: '600', color: Colors.text, flex: 1 },
  statusBadge: { borderRadius: 20, paddingVertical: 3, paddingHorizontal: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  stepDesc: { fontSize: 12, color: Colors.textMuted, marginBottom: 6, lineHeight: 17 },
  dueDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dueDate: { fontSize: 11, color: Colors.textMuted },
  // Documents
  docCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, gap: 12 },
  docIconBox: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  docTitle: { fontSize: 13, fontWeight: '600', color: Colors.text },
  docStatus: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  uploadBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.orange + '15', justifyContent: 'center', alignItems: 'center' },
  // Services
  emptyServicesBox: { alignItems: 'center', gap: 14, paddingVertical: 20 },
  addServiceBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.orange, paddingVertical: 10, paddingHorizontal: 20 },
  addServiceText: { fontSize: 14, fontWeight: '600', color: Colors.orange },
  serviceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, gap: 12 },
  serviceIconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: Colors.orange + '15', justifyContent: 'center', alignItems: 'center' },
  serviceTitle: { fontSize: 13, fontWeight: '600', color: Colors.text },
  serviceStatus: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  serviceAmount: { fontSize: 14, fontWeight: '700', color: Colors.orange },
  // Conseiller
  noAdvisorBox: { alignItems: 'center', gap: 12, paddingVertical: 32 },
  noAdvisorTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  noAdvisorSub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  advisorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 16, padding: 18, gap: 14 },
  advisorAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.orange + '25', justifyContent: 'center', alignItems: 'center' },
  advisorInitial: { fontSize: 26, fontWeight: '800', color: Colors.orange },
  advisorName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  advisorTitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  msgBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.orange + '15', justifyContent: 'center', alignItems: 'center' },
});
