import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi, type ProjectData } from '../../lib/api';

const STEPS_LABELS = [
  'Analyse du profil',
  'Montage du dossier',
  'Révision',
  'Dépôt officiel',
  'Décision',
];

export default function DashboardScreen() {
  const { user, token } = useAuth();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!token) return;
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

  const progress = project?.progress ?? 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />}
      >
        {/* En-tête */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour, {user?.name?.split(' ')[0] ?? 'vous'} 👋</Text>
            <Text style={styles.subtitle}>Voici l'état de votre dossier</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{(user?.name ?? 'U')[0].toUpperCase()}</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.orange} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* Carte progression */}
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Avancement du dossier</Text>
                <Text style={styles.progressPct}>{progress}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
              </View>
              {project?.steps?.map(step => (
                <View key={step.id} style={styles.stepRow}>
                  <Ionicons
                    name={
                      step.status === 'done' ? 'checkmark-circle' :
                      step.status === 'active' ? 'time' : 'ellipse-outline'
                    }
                    size={16}
                    color={
                      step.status === 'done' ? Colors.success :
                      step.status === 'active' ? Colors.orange : 'rgba(255,255,255,0.3)'
                    }
                  />
                  <Text style={[
                    styles.stepLabel,
                    step.status === 'done' && styles.stepDone,
                    step.status === 'active' && styles.stepActive,
                  ]}>
                    {step.label}
                  </Text>
                  {step.date && (
                    <Text style={styles.stepDate}>{step.date}</Text>
                  )}
                </View>
              )) ?? STEPS_LABELS.map((label, i) => (
                <View key={i} style={styles.stepRow}>
                  <Ionicons
                    name={i < 2 ? 'checkmark-circle' : i === 2 ? 'time' : 'ellipse-outline'}
                    size={16}
                    color={i < 2 ? Colors.success : i === 2 ? Colors.orange : 'rgba(255,255,255,0.3)'}
                  />
                  <Text style={[
                    styles.stepLabel,
                    i < 2 && styles.stepDone,
                    i === 2 && styles.stepActive,
                  ]}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Raccourcis */}
            <Text style={styles.sectionTitle}>Accès rapide</Text>
            <View style={styles.shortcutsGrid}>
              {[
                { icon: 'folder' as const, label: 'Documents', color: '#3b82f6' },
                { icon: 'chatbubbles' as const, label: 'Messagerie', color: Colors.orange },
                { icon: 'card' as const, label: 'Paiements', color: Colors.success },
                { icon: 'people' as const, label: 'Mon équipe', color: '#a855f7' },
              ].map(item => (
                <TouchableOpacity key={item.label} style={styles.shortcut} activeOpacity={0.75}>
                  <View style={[styles.shortcutIcon, { backgroundColor: `${item.color}22` }]}>
                    <Ionicons name={item.icon} size={22} color={item.color} />
                  </View>
                  <Text style={styles.shortcutLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primaryDark },
  scroll: { padding: 20 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 3 },
  avatarCircle: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: Colors.orange, justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { color: '#fff', fontSize: 18, fontWeight: '800' },
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
  shortcutsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  shortcut: {
    width: '46.5%', backgroundColor: Colors.surface,
    borderRadius: 14, padding: 16, alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 2,
  },
  shortcutIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  shortcutLabel: { fontSize: 13, fontWeight: '600', color: Colors.text },
});
