import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Linking, ScrollView,
  Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { UI } from '../../constants/UI';
import {
  fetchDLIInstitutions,
  filterDLI,
  type DLIInstitution,
  type ProvinceCode,
  type DLIType,
} from '../../lib/dli-service';

// ── Constantes de labels ───────────────────────────────────────────────────────

const PROVINCES: { code: string; label: string }[] = [
  { code: '', label: 'Toutes les provinces' },
  { code: 'AB', label: 'Alberta' },
  { code: 'BC', label: 'Colombie-Britannique' },
  { code: 'MB', label: 'Manitoba' },
  { code: 'NB', label: 'Nouveau-Brunswick' },
  { code: 'NL', label: 'Terre-Neuve' },
  { code: 'NS', label: 'Nouvelle-Ecosse' },
  { code: 'ON', label: 'Ontario' },
  { code: 'PE', label: 'Ile-du-Prince-Edouard' },
  { code: 'QC', label: 'Quebec' },
  { code: 'SK', label: 'Saskatchewan' },
  { code: 'NT', label: 'Territoires du Nord-Ouest' },
  { code: 'NU', label: 'Nunavut' },
  { code: 'YT', label: 'Yukon' },
];

const TYPES: { code: string; label: string; color: string }[] = [
  { code: '', label: 'Tous types', color: Colors.textMuted },
  { code: 'universite', label: 'Universite', color: Colors.primary },
  { code: 'cegep', label: 'CEGEP', color: '#8b5cf6' },
  { code: 'college', label: 'College', color: Colors.orange },
  { code: 'technique', label: 'Technique', color: '#22c55e' },
  { code: 'ecole_langue', label: 'Ecole de langue', color: '#3b82f6' },
];

function getTypeConfig(type: string) {
  return TYPES.find(t => t.code === type) ?? TYPES[0];
}

// ── Composant carte institution ───────────────────────────────────────────────

const InstitutionCard = React.memo(({ item }: { item: DLIInstitution }) => {
  const typeConfig = getTypeConfig(item.type);

  const openSite = () => {
    const url = item.admissionsUrl?.trim()
      ? item.admissionsUrl
      : `https://www.google.com/search?q=${encodeURIComponent(item.nom + ' admissions Canada')}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.top}>
        <View style={[cardStyles.typeBadge, { backgroundColor: typeConfig.color + '1A' }]}>
          <Text style={[cardStyles.typeText, { color: typeConfig.color }]}>{typeConfig.label}</Text>
        </View>
        {item.province ? (
          <View style={cardStyles.provinceBadge}>
            <Text style={cardStyles.provinceText}>{item.province}</Text>
          </View>
        ) : null}
      </View>
      <Text style={cardStyles.name} numberOfLines={2}>{item.nom}</Text>
      {item.ville ? (
        <View style={cardStyles.villeRow}>
          <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
          <Text style={cardStyles.ville}>{item.ville}</Text>
        </View>
      ) : null}
      <TouchableOpacity style={cardStyles.btn} onPress={openSite} activeOpacity={0.8}>
        <Text style={cardStyles.btnText}>Voir les admissions</Text>
        <Ionicons name="open-outline" size={14} color={Colors.surface} />
      </TouchableOpacity>
    </View>
  );
});

const cardStyles = StyleSheet.create({
  card: {
    ...UI.card,
    padding: 14,
    marginBottom: 12,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  provinceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: Colors.primary + '1A',
  },
  provinceText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 6,
    lineHeight: 20,
  },
  villeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  ville: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.surface,
  },
});

// ── Ecran principal ───────────────────────────────────────────────────────────

export default function EtudesScreen() {
  const router = useRouter();
  const [allData, setAllData] = useState<DLIInstitution[]>([]);
  const [displayed, setDisplayed] = useState<DLIInstitution[]>([]);
  const [query, setQuery] = useState('');
  const [province, setProvince] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);

  // Chargement initial
  useEffect(() => {
    fetchDLIInstitutions().then(data => {
      setAllData(data);
      setDisplayed(data.slice(0, 50));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Filtre réactif
  useEffect(() => {
    if (!allData.length) return;
    const filtered = filterDLI(allData, {
      query: query.trim() || undefined,
      province: (province as ProvinceCode) || undefined,
      type: (type as DLIType) || undefined,
    });
    setDisplayed(filtered.slice(0, 200));
  }, [query, province, type, allData]);

  const hasFilters = !!(query.trim() || province || type);
  const selectedProv = PROVINCES.find(p => p.code === province) ?? PROVINCES[0];
  const selectedType = TYPES.find(t => t.code === type) ?? TYPES[0];

  const renderItem = useCallback(({ item }: { item: DLIInstitution }) => (
    <InstitutionCard item={item} />
  ), []);

  const keyExtractor = useCallback((item: DLIInstitution) => item.id, []);

  const ListHeader = (
    <>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroIconWrap}>
          <Ionicons name="school" size={26} color={Colors.orange} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Etablissements d'Enseignement Designes</Text>
          <Text style={styles.heroSub}>
            {loading ? 'Chargement...' : `${allData.length.toLocaleString()} etablissements reconnus par l'IRCC`}
          </Text>
        </View>
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={{ marginLeft: 12 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un etablissement, une ville..."
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filtres */}
      <View style={styles.filtersRow}>
        <TouchableOpacity
          style={[styles.filterChip, !!province && styles.filterChipActive]}
          onPress={() => setShowProvinceModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="map-outline" size={14} color={province ? Colors.orange : Colors.textMuted} />
          <Text style={[styles.filterChipText, !!province && styles.filterChipTextActive]} numberOfLines={1}>
            {province ? selectedProv.label : 'Province'}
          </Text>
          <Ionicons name="chevron-down" size={13} color={province ? Colors.orange : Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, !!type && styles.filterChipActive]}
          onPress={() => setShowTypeModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="library-outline" size={14} color={type ? Colors.orange : Colors.textMuted} />
          <Text style={[styles.filterChipText, !!type && styles.filterChipTextActive]} numberOfLines={1}>
            {type ? selectedType.label : 'Type'}
          </Text>
          <Ionicons name="chevron-down" size={13} color={type ? Colors.orange : Colors.textMuted} />
        </TouchableOpacity>

        {hasFilters && (
          <TouchableOpacity
            style={styles.filterReset}
            onPress={() => { setQuery(''); setProvince(''); setType(''); }}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle" size={16} color={Colors.error} />
            <Text style={styles.filterResetText}>Effacer</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Compteur */}
      {!loading && (
        <Text style={styles.countLabel}>
          {displayed.length} etablissement{displayed.length !== 1 ? 's' : ''}{hasFilters ? ' trouve(s)' : ' recents'}
        </Text>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Espace Etudes (EED)</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.orange} />
          <Text style={styles.loadingText}>Chargement des etablissements...</Text>
        </View>
      ) : (
        <FlatList
          data={displayed}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={ListHeader}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="school-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>Aucun etablissement trouve</Text>
              <Text style={styles.emptySub}>Modifiez vos criteres de recherche</Text>
            </View>
          }
        />
      )}

      {/* Modal Province */}
      <Modal transparent animationType="slide" visible={showProvinceModal} onRequestClose={() => setShowProvinceModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowProvinceModal(false)}>
          <View style={styles.modalBox}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Choisir une province</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {PROVINCES.map(p => (
                <TouchableOpacity
                  key={p.code}
                  style={[styles.modalOption, province === p.code ? styles.modalOptionActive : undefined]}
                  onPress={() => { setProvince(p.code); setShowProvinceModal(false); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modalOptionText, province === p.code ? styles.modalOptionTextActive : undefined]}>{p.label}</Text>
                  {province === p.code && <Ionicons name="checkmark" size={18} color={Colors.orange} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Modal Type */}
      <Modal transparent animationType="slide" visible={showTypeModal} onRequestClose={() => setShowTypeModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowTypeModal(false)}>
          <View style={styles.modalBox}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Type d'etablissement</Text>
            {TYPES.map(t => (
              <TouchableOpacity
                key={t.code}
                style={[styles.modalOption, type === t.code && styles.modalOptionActive]}
                onPress={() => { setType(t.code); setShowTypeModal(false); }}
                activeOpacity={0.8}
              >
                <View style={[styles.typeColorDot, { backgroundColor: t.color }]} />
                <Text style={[styles.modalOptionText, type === t.code && styles.modalOptionTextActive]}>{t.label}</Text>
                {type === t.code && <Ionicons name="checkmark" size={18} color={Colors.orange} />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgLight },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.bgLight,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },

  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 14, color: Colors.textMuted },

  listContent: { padding: 16, paddingBottom: 40 },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...UI.cardShadow,
  },
  heroIconWrap: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: Colors.orange + '1A',
    justifyContent: 'center', alignItems: 'center',
  },
  heroTitle: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  heroSub: { fontSize: 12, color: Colors.textMuted, lineHeight: 16 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    ...UI.cardShadow,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
  },

  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    borderColor: Colors.orange,
    backgroundColor: Colors.orange + '12',
  },
  filterChipText: { fontSize: 13, color: Colors.textMuted, maxWidth: 110 },
  filterChipTextActive: { color: Colors.orange, fontWeight: '700' },
  filterReset: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 8,
  },
  filterResetText: { fontSize: 12, color: Colors.error, fontWeight: '600' },

  countLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 12,
    fontWeight: '500',
  },

  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },
  emptySub: { fontSize: 13, color: Colors.textMuted },

  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '80%',
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center', marginBottom: 18,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 16 },
  modalOption: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 13, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalOptionActive: { backgroundColor: Colors.orange + '0D' },
  modalOptionText: { flex: 1, fontSize: 14, color: Colors.textSecondary },
  modalOptionTextActive: { color: Colors.orange, fontWeight: '700' },
  typeColorDot: { width: 10, height: 10, borderRadius: 5 },
});
