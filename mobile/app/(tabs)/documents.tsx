import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { UI } from '../../constants/UI';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi, type Document } from '../../lib/api';

const STATUS_CONFIG = {
  validated: { label: 'Validé', color: Colors.success, icon: 'checkmark-circle' as const },
  pending:   { label: 'En attente', color: Colors.warning, icon: 'time' as const },
  rejected:  { label: 'À corriger', color: Colors.error, icon: 'alert-circle' as const },
  missing:   { label: 'À envoyer', color: Colors.textMuted, icon: 'cloud-upload' as const },
};

// Données de démonstration si l'API ne renvoie rien
const DEMO_DOCS: Document[] = [
  { id: '1', name: 'Passeport.pdf', type: 'pdf', status: 'validated', uploadedAt: '2026-01-15' },
  { id: '2', name: 'Photo identité.jpg', type: 'image', status: 'validated', uploadedAt: '2026-01-15' },
  { id: '3', name: 'Relevé bancaire.pdf', type: 'pdf', status: 'rejected' },
  { id: '4', name: 'Casier judiciaire.pdf', type: 'pdf', status: 'missing' },
  { id: '5', name: 'Références emploi.pdf', type: 'pdf', status: 'pending', uploadedAt: '2026-02-20' },
  { id: '6', name: 'Diplômes.pdf', type: 'pdf', status: 'missing' },
];

export default function DocumentsScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const isPro = user?.account_type === 'pro';
  const [docs, setDocs] = useState<Document[]>(DEMO_DOCS); // affiché immédiatement
  const [loading, setLoading] = useState(false); // pas de spinner bloquant
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | Document['status']>('all');

  const load = async () => {
    if (!token) return; // DEMO_DOCS déjà affiché
    const res = await dashboardApi.getDocuments(token);
    const fetchedDocs = res.data?.documents;
    if (fetchedDocs?.length) setDocs(fetchedDocs);
    setLoading(false);
  };

  // Chargement silencieux en arrière-plan
  useEffect(() => { load(); }, [token]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const pickAndUpload = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: false });
    if (result.canceled) return;
    Alert.alert(
      'Document sélectionné',
      result.assets[0].name + '\n(Upload à implémenter côté API)',
    );
  };

  const filtered = filter === 'all' ? docs : docs.filter(d => d.status === filter);

  const counts = {
    all: docs.length,
    validated: docs.filter(d => d.status === 'validated').length,
    pending: docs.filter(d => d.status === 'pending').length,
    rejected: docs.filter(d => d.status === 'rejected').length,
    missing: docs.filter(d => d.status === 'missing').length,
  };

  if (isPro) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Documents</Text>
        </View>

        <View style={styles.proInfoBox}>
          <View style={styles.proInfoIcon}>
            <Ionicons name="information-circle" size={18} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.proInfoTitle}>Espace Pro</Text>
            <Text style={styles.proInfoText}>
              Pour consulter les documents, ouvrez un client depuis l’inbox.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.proInfoBtn}
            onPress={() => router.push('/(tabs)/dashboard' as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.proInfoBtnText}>Inbox</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Documents</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={pickAndUpload} activeOpacity={0.8}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.uploadBtnText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* Filtres */}
      <FlatList
        horizontal
        data={(['all', 'validated', 'pending', 'rejected', 'missing'] as const)}
        keyExtractor={i => i}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, filter === item && styles.filterChipActive]}
            onPress={() => setFilter(item)}
          >
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
              {item === 'all' ? `Tous (${counts.all})`
                : `${STATUS_CONFIG[item].label} (${counts[item]})`}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ActivityIndicator color={Colors.orange} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={d => d.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />}
          renderItem={({ item }) => {
            const cfg = STATUS_CONFIG[item.status];
            const canUpload = item.status === 'missing' || item.status === 'rejected';
            return (
              <TouchableOpacity
                style={styles.docCard}
                activeOpacity={canUpload ? 0.75 : 1}
                onPress={canUpload ? pickAndUpload : undefined}
              >
                <View style={[styles.docIcon, { backgroundColor: `${cfg.color}18` }]}>
                  <Ionicons
                    name={item.type === 'image' ? 'image' : 'document-text'}
                    size={22} color={cfg.color}
                  />
                </View>
                <View style={styles.docInfo}>
                  <Text style={styles.docName} numberOfLines={1}>{item.name}</Text>
                  {item.uploadedAt && (
                    <Text style={styles.docDate}>Envoyé le {item.uploadedAt}</Text>
                  )}
                  {canUpload && (
                    <Text style={styles.docHint}>Appuyez pour téléverser</Text>
                  )}
                </View>
                <View style={styles.docStatus}>
                  <Ionicons name={cfg.icon} size={18} color={cfg.color} />
                  <Text style={[styles.docStatusText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>Aucun document dans cette catégorie.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgLight },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.orange, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14,
  },
  uploadBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  filtersRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterChip: {
    paddingVertical: 6, paddingHorizontal: 14,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  list: { padding: 16, gap: 10 },
  docCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    ...UI.cardBorder,
    ...UI.cardShadow,
  },
  docIcon: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  docInfo: { flex: 1 },
  docName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  docDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  docHint: { fontSize: 11, color: Colors.orangeLight, marginTop: 2, fontWeight: '600' },
  docStatus: { alignItems: 'center', gap: 2 },
  docStatusText: { fontSize: 10, fontWeight: '700' },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 60, fontSize: 14 },
  proInfoBox: {
    marginTop: 12,
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...UI.cardBorder,
    ...UI.cardShadow,
  },
  proInfoIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '14',
    borderWidth: 1,
    borderColor: Colors.primary + '35',
  },
  proInfoTitle: { fontSize: 13, fontWeight: '900', color: Colors.text },
  proInfoText: { marginTop: 2, fontSize: 12, color: Colors.textMuted },
  proInfoBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  proInfoBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});
