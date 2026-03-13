import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Linking, ScrollView,
  Modal, Pressable, Image, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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

const { width: SCREEN_W } = Dimensions.get('window');

const EED_COLORS = [
  { bg: '#0f3460', accent: '#4ecdc4' },
  { bg: '#1a1a40', accent: '#a78bfa' },
  { bg: '#183028', accent: '#4ade80' },
  { bg: '#1a1a2e', accent: '#ff9408' },
  { bg: '#2d1540', accent: '#f472b6' },
  { bg: '#0a2744', accent: '#38bdf8' },
];

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

export default function EtudesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<DLIInstitution> | null>(null);

  const [allData, setAllData]           = useState<DLIInstitution[]>([]);
  const [displayed, setDisplayed]       = useState<DLIInstitution[]>([]);
  const [query, setQuery]               = useState('');
  const [province, setProvince]         = useState('');
  const [type, setType]                 = useState('');
  const [loading, setLoading]           = useState(true);
  const [showSearch, setShowSearch]     = useState(false);
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showTypeModal, setShowTypeModal]         = useState(false);
  const [activeIndex, setActiveIndex]   = useState(0);

  useEffect(() => {
    fetchDLIInstitutions().then(data => {
      setAllData(data);
      setDisplayed(data.slice(0, 50));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!allData.length) return;
    const filtered = filterDLI(allData, {
      query: query.trim() || undefined,
      province: (province as ProvinceCode) || undefined,
      type: (type as DLIType) || undefined,
    });
    setDisplayed(filtered.slice(0, 200));
    setActiveIndex(0);
    if (listRef.current && filtered.length > 0) {
      listRef.current.scrollToOffset({ offset: 0, animated: false });
    }
  }, [query, province, type, allData]);

  const hasFilters = !!(query.trim() || province || type);
  const selectedProv = PROVINCES.find(p => p.code === province) ?? PROVINCES[0];
  const selectedType = TYPES.find(t => t.code === type) ?? TYPES[0];

  const handlePrev = () => {
    if (activeIndex <= 0) return;
    const idx = activeIndex - 1;
    setActiveIndex(idx);
    listRef.current?.scrollToIndex({ index: idx, animated: true });
  };

  const handleNext = () => {
    if (activeIndex >= displayed.length - 1) return;
    const idx = activeIndex + 1;
    setActiveIndex(idx);
    listRef.current?.scrollToIndex({ index: idx, animated: true });
  };

  const renderCard = useCallback(({ item, index }: { item: DLIInstitution; index: number }) => {
    const col = EED_COLORS[index % EED_COLORS.length];
    let domain = '';
    try { domain = new URL(item.admissionsUrl || 'https://example.com').hostname.replace('www.', ''); } catch {}
    const logoUrl = domain
      ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
      : null;

    const typeConf = TYPES.find(t => t.code === item.type) ?? TYPES[0];

    const openSite = () => {
      const url = item.admissionsUrl?.trim()
        ? item.admissionsUrl
        : `https://www.google.com/search?q=${encodeURIComponent(item.nom + ' admissions Canada')}`;
      Linking.openURL(url).catch(() => {});
    };

    return (
      <View style={[styles.story, { width: SCREEN_W, backgroundColor: col.bg }]}>
        {/* Bulles deco */}
        <View style={[styles.deco1, { backgroundColor: col.accent + '18' }]} />
        <View style={[styles.deco2, { backgroundColor: col.accent + '10' }]} />

        {/* Overlay sombre */}
        <View style={styles.shade} pointerEvents="none" />

        {/* Barres de progression */}
        <View style={[styles.progressWrap, { paddingTop: insets.top + 80 }]}>
          {displayed.map((_, i) => (
            <View key={i} style={[
              styles.bar,
              i < index    && styles.barDone,
              i === index  && styles.barActive,
            ]} />
          ))}
        </View>

        {/* Contenu bas */}
        <View style={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
          {/* Logo */}
          {logoUrl ? (
            <View style={[styles.logo, { borderColor: col.accent + '44', backgroundColor: col.accent + '1A' }]}>
              <Image
                source={{ uri: logoUrl }}
                style={{ width: 50, height: 50 }}
                resizeMode="contain"
              />
            </View>
          ) : (
            <View style={[styles.logo, { borderColor: col.accent + '44', backgroundColor: col.accent + '1A' }]}>
              <Ionicons name="school" size={28} color={col.accent} />
            </View>
          )}

          {/* Type + Province */}
          <View style={styles.tagsRow}>
            {item.type ? (
              <View style={[styles.tag, { backgroundColor: typeConf.color + '22', borderColor: typeConf.color + '55' }]}>
                <Text style={[styles.tagText, { color: typeConf.color }]}>{typeConf.label}</Text>
              </View>
            ) : null}
            {item.province ? (
              <View style={styles.tag}>
                <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.7)" />
                <Text style={styles.tagText}>{item.province}</Text>
              </View>
            ) : null}
            {item.ville ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.ville}</Text>
              </View>
            ) : null}
          </View>

          {/* Nom (grand titre) */}
          <Text style={styles.name} numberOfLines={3}>{item.nom}</Text>

          {/* Bouton */}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: col.accent }]}
            activeOpacity={0.85}
            onPress={openSite}
          >
            <Ionicons name="school-outline" size={17} color="#fff" />
            <Text style={styles.btnText}>Voir les admissions</Text>
          </TouchableOpacity>

          {/* Compteur */}
          <Text style={styles.counter}>{activeIndex + 1} / {displayed.length}</Text>
        </View>

        {/* Zones tap navigation */}
        <View style={styles.tapZones} pointerEvents="box-none">
          <TouchableOpacity style={styles.tapLeft}  activeOpacity={1} onPress={handlePrev} />
          <TouchableOpacity style={styles.tapRight} activeOpacity={1} onPress={handleNext} />
        </View>
      </View>
    );
  }, [displayed, activeIndex, insets]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={Colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Espace Etudes (EED)</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setShowSearch(s => !s)} activeOpacity={0.8}>
          <Ionicons name={showSearch ? 'close' : 'search'} size={20} color={Colors.surface} />
        </TouchableOpacity>
      </View>

      {/* Tiroir recherche + filtres */}
      {showSearch && (
        <View style={[styles.drawer, { paddingTop: insets.top + 20 }]}>
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={15} color={Colors.textMuted} style={{ marginRight: 6 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Etablissement, ville..."
              placeholderTextColor={Colors.textMuted}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoFocus
            />
            {!!query && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={15} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.filtersRow}>
            <TouchableOpacity
              style={[styles.chip, !!province && styles.chipActive]}
              onPress={() => setShowProvinceModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="map-outline" size={13} color={province ? Colors.orange : Colors.textMuted} />
              <Text style={[styles.chipText, !!province && styles.chipTextActive]} numberOfLines={1}>
                {province ? selectedProv.label : 'Province'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, !!type && styles.chipActive]}
              onPress={() => setShowTypeModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="library-outline" size={13} color={type ? Colors.orange : Colors.textMuted} />
              <Text style={[styles.chipText, !!type && styles.chipTextActive]} numberOfLines={1}>
                {type ? selectedType.label : 'Type'}
              </Text>
            </TouchableOpacity>
            {hasFilters && (
              <TouchableOpacity
                style={styles.chipReset}
                onPress={() => { setQuery(''); setProvince(''); setType(''); }}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle" size={15} color={Colors.error} />
                <Text style={styles.chipResetText}>Effacer</Text>
              </TouchableOpacity>
            )}
          </View>
          {!loading && (
            <Text style={styles.countLabel}>
              {displayed.length} etablissement{displayed.length !== 1 ? 's' : ''}{hasFilters ? ' trouve(s)' : ' recents'}
            </Text>
          )}
        </View>
      )}

      {/* Contenu */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.orange} />
          <Text style={styles.loadingText}>Chargement des etablissements...</Text>
        </View>
      ) : displayed.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="school-outline" size={48} color={Colors.border} />
          <Text style={styles.emptyTitle}>Aucun etablissement trouve</Text>
          <Text style={styles.emptySub}>Modifiez vos criteres de recherche</Text>
        </View>
      ) : (
        <FlatList
          ref={r => { listRef.current = r; }}
          data={displayed}
          keyExtractor={item => item.id}
          renderItem={renderCard}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={SCREEN_W}
          snapToAlignment="start"
          disableIntervalMomentum
          onMomentumScrollEnd={e => {
            const x   = e.nativeEvent.contentOffset.x;
            const idx = Math.round(x / SCREEN_W);
            setActiveIndex(Math.max(0, Math.min(displayed.length - 1, idx)));
          }}
          onScrollToIndexFailed={() => {}}
        />
      )}

      {/* Modal Province */}
      <Modal transparent animationType="slide" visible={showProvinceModal} onRequestClose={() => setShowProvinceModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowProvinceModal(false)}>
          <View style={styles.modalBox}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>Choisir une province</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {PROVINCES.map(p => (
                <TouchableOpacity
                  key={p.code}
                  style={[styles.option, province === p.code && styles.optionActive]}
                  onPress={() => { setProvince(p.code); setShowProvinceModal(false); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.optionText, province === p.code && styles.optionTextActive]}>{p.label}</Text>
                  {province === p.code && <Ionicons name="checkmark" size={18} color={Colors.orange} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Modal Type */}
      <Modal transparent animationType="slide" visible={showTypeModal} onRequestClose={() => setShowTypeModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowTypeModal(false)}>
          <View style={styles.modalBox}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>Type d'etablissement</Text>
            {TYPES.map(t => (
              <TouchableOpacity
                key={t.code}
                style={[styles.option, type === t.code && styles.optionActive]}
                onPress={() => { setType(t.code); setShowTypeModal(false); }}
                activeOpacity={0.8}
              >
                <View style={[styles.typeDot, { backgroundColor: t.color }]} />
                <Text style={[styles.optionText, type === t.code && styles.optionTextActive]}>{t.label}</Text>
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
  root: { flex: 1, backgroundColor: '#0f3460' },

  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: 16, fontWeight: '700', color: Colors.surface,
  },

  drawer: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
    backgroundColor: '#fff', padding: 12, gap: 8,
    borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, elevation: 10,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgLight, borderRadius: 10, paddingHorizontal: 10, height: 40,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  filtersRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, backgroundColor: Colors.bgLight,
    borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { borderColor: Colors.orange, backgroundColor: Colors.orange + '12' },
  chipText: { fontSize: 12, color: Colors.textMuted },
  chipTextActive: { color: Colors.orange, fontWeight: '700' },
  chipReset: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chipResetText: { fontSize: 12, color: Colors.error, fontWeight: '600' },
  countLabel: { fontSize: 12, color: Colors.textMuted, textAlign: 'center' },

  story: { flex: 1 },
  deco1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, top: -80, right: -80 },
  deco2: { position: 'absolute', width: 180, height: 180, borderRadius: 90, bottom: 140, left: -50 },
  shade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.32)' },

  progressWrap: { paddingHorizontal: 12, flexDirection: 'row', gap: 5 },
  bar:       { flex: 1, height: 3, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  barDone:   { backgroundColor: 'rgba(255,255,255,0.55)' },
  barActive: { backgroundColor: Colors.orange },

  content: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 20, gap: 14, paddingTop: 18,
  },
  logo: {
    width: 76, height: 76, borderRadius: 20,
    borderWidth: 2, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  tagText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  name: { fontSize: 26, fontWeight: '900', color: Colors.surface, lineHeight: 32 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16,
    ...UI.cardShadow,
  },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  counter: { textAlign: 'center', fontSize: 12, color: Colors.surface + '88', fontWeight: '600', marginTop: -6 },

  tapZones: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 200, flexDirection: 'row' },
  tapLeft:  { flex: 1 },
  tapRight: { flex: 1 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { fontSize: 14, color: Colors.surface + 'CC' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.surface },
  emptySub: { fontSize: 13, color: Colors.surface + 'AA' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '80%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 18,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 16 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 13, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  optionActive: { backgroundColor: Colors.orange + '0D' },
  optionText: { flex: 1, fontSize: 14, color: Colors.textSecondary },
  optionTextActive: { color: Colors.orange, fontWeight: '700' },
  typeDot: { width: 10, height: 10, borderRadius: 5 },
});
