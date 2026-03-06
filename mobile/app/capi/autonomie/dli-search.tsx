import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ScrollView, Linking, Alert, ActivityIndicator, Keyboard, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../../constants/Colors';
import { UI } from '../../../constants/UI';
import { useCapiSession } from '../../../context/CapiContext';
import { PROVINCE_LABELS, TYPE_LABELS, TYPE_EMOJI } from '../../../lib/dli-data';
import {
  fetchDLIInstitutions, filterDLI,
  type DLIInstitution, type ProvinceCode, type DLIType,
} from '../../../lib/dli-service';

// ---------------------------------------------------------------------------
// Constante AsyncStorage
// ---------------------------------------------------------------------------
const DLI_SELECTED_KEY = 'capi_selected_dli';

// ---------------------------------------------------------------------------
// Composant province chip
// ---------------------------------------------------------------------------
function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[chipStyles.chip, active && chipStyles.chipActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[chipStyles.label, active && chipStyles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}
const chipStyles = StyleSheet.create({
  chip: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, marginRight: 8,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  labelActive: { color: '#fff' },
});

// ---------------------------------------------------------------------------
// Composant carte institution
// ---------------------------------------------------------------------------
function InstitutionCard({
  item, selected, canAdd, onViewAdmission, onValidate,
}: {
  item: DLIInstitution;
  selected: boolean;
  canAdd: boolean;          // false si déjà 3 choix et cet item n'est pas sélectionné
  onViewAdmission: () => void;
  onValidate: () => void;
}) {
  const typeEmoji = TYPE_EMOJI[item.type as DLIType] ?? '🏫';
  const typeLabel = TYPE_LABELS[item.type as DLIType] ?? item.type;
  const provLabel = PROVINCE_LABELS[item.province as ProvinceCode] ?? item.province;

  return (
    <View style={[cardStyles.card, selected && cardStyles.cardSelected]}>
      {/* Badge choix validé */}
      {selected && (
        <View style={cardStyles.selectedBadge}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={cardStyles.selectedText}>Choix validé ✓</Text>
        </View>
      )}

      <View style={cardStyles.top}>
        <View style={cardStyles.iconWrap}>
          <Text style={cardStyles.emoji}>{typeEmoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={cardStyles.nom} numberOfLines={2}>{item.nom}</Text>
          <Text style={cardStyles.ville}>
            📍 {item.ville} · {provLabel}
          </Text>
        </View>
      </View>

      {/* Métadonnées */}
      <View style={cardStyles.meta}>
        <View style={cardStyles.badge}>
          <Text style={cardStyles.badgeText}>{typeLabel}</Text>
        </View>
        {item.source === 'live' && (
          <View style={cardStyles.liveBadge}>
            <Text style={cardStyles.liveBadgeText}>● Données live</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={cardStyles.actions}>
        {/* Voir l'admission — ouvre le site, n'affecte pas la sélection */}
        <TouchableOpacity style={cardStyles.viewBtn} onPress={onViewAdmission} activeOpacity={0.8}>
          <Ionicons name="open-outline" size={13} color={Colors.primary} />
          <Text style={cardStyles.viewBtnText}>Voir l'admission</Text>
        </TouchableOpacity>

        {/* Valider ce choix */}
        <TouchableOpacity
          style={[
            cardStyles.validateBtn,
            selected && cardStyles.validateBtnSelected,
            !canAdd && !selected && cardStyles.validateBtnDisabled,
          ]}
          onPress={onValidate}
          activeOpacity={0.8}
          disabled={!canAdd && !selected}
        >
          <Ionicons
            name={selected ? 'close-circle-outline' : 'checkmark-circle-outline'}
            size={15}
            color={selected ? Colors.textMuted : (canAdd ? '#fff' : Colors.textMuted)}
          />
          <Text style={[
            cardStyles.validateBtnText,
            selected && { color: Colors.textMuted },
            !canAdd && !selected && { color: Colors.textMuted },
          ]}>
            {selected ? 'Retirer' : 'Valider ce choix'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: Colors.border, marginBottom: 12, ...UI.cardShadow,
  },
  cardSelected: { borderColor: Colors.success, backgroundColor: Colors.success + '08' },
  selectedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  selectedText: { fontSize: 12, fontWeight: '700', color: Colors.success },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  iconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary + '12', justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  emoji: { fontSize: 22 },
  nom: { fontSize: 14, fontWeight: '800', color: Colors.text, lineHeight: 20, marginBottom: 4 },
  ville: { fontSize: 12, color: Colors.textMuted },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  badge: { backgroundColor: Colors.primary + '15', borderRadius: 10, paddingVertical: 3, paddingHorizontal: 8 },
  badgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  liveBadge: { backgroundColor: '#22c55e15', borderRadius: 8, paddingVertical: 2, paddingHorizontal: 7, borderWidth: 1, borderColor: '#22c55e40' },
  liveBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.success },
  actions: { flexDirection: 'row', gap: 8 },
  viewBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 12, paddingVertical: 10,
  },
  viewBtnText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  validateBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.success, borderRadius: 12, paddingVertical: 10,
  },
  validateBtnSelected: { backgroundColor: Colors.border },
  validateBtnDisabled: { backgroundColor: Colors.border, opacity: 0.5 },
  validateBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});

// ---------------------------------------------------------------------------
// Screen principal
// ---------------------------------------------------------------------------

export default function DLISearchScreen() {
  const router = useRouter();
  const { session } = useCapiSession();
  const project = session.autonomie;

  const [query, setQuery] = useState('');
  const [province, setProvince] = useState<ProvinceCode | null>(null);
  const [typeFilter, setTypeFilter] = useState<DLIType | null>(null);
  // Jusqu'à 3 établissements sélectionnés (CAPI recommande 3 candidatures)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedQ, setDebouncedQ] = useState('');

  // État asynchrone : liste complète DLI
  const [allInstitutions, setAllInstitutions] = useState<DLIInstitution[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchDLIInstitutions()
      .then(data => { if (!cancelled) { setAllInstitutions(data); setLoading(false); } })
      .catch(() => { if (!cancelled) { setLoadError(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  // Debounce : met à jour debouncedQ après 300 ms sans frappe
  const onChangeQuery = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQ(text), 300);
  }, []);

  const results = useMemo(
    () => filterDLI(allInstitutions, { query: debouncedQ, province: province ?? undefined, type: typeFilter ?? undefined }),
    [allInstitutions, debouncedQ, province, typeFilter],
  );

  // Provinces disponibles (uniques dans le dataset chargé)
  const provincesDisponibles = useMemo<ProvinceCode[]>(
    () => Array.from(new Set(allInstitutions.map(i => i.province as ProvinceCode))).sort(),
    [allInstitutions],
  );

  // Ouvrir uniquement la page d'admission — sans marquer comme sélectionné
  const handleViewAdmission = useCallback(async (inst: DLIInstitution) => {
    try {
      const ok = await Linking.canOpenURL(inst.admissionsUrl);
      await Linking.openURL(ok ? inst.admissionsUrl : 'https://www.cicic.ca/869/resultats.canada?search=');
    } catch {
      Alert.alert("Erreur", "Impossible d'ouvrir le lien d'admission.");
    }
  }, []);

  // Valider / retirer un choix (max 3)
  const handleToggleSelect = useCallback(async (inst: DLIInstitution) => {
    setSelectedIds(prev => {
      if (prev.includes(inst.id)) {
        return prev.filter(id => id !== inst.id);
      }
      if (prev.length >= 3) return prev; // déjà 3 choix
      return [...prev, inst.id];
    });
    // Sauvegarder dans AsyncStorage la sélection courante
    try {
      const newIds = selectedIds.includes(inst.id)
        ? selectedIds.filter(id => id !== inst.id)
        : selectedIds.length < 3 ? [...selectedIds, inst.id] : selectedIds;
      const selectedInsts = allInstitutions.filter(i => newIds.includes(i.id));
      await AsyncStorage.setItem(DLI_SELECTED_KEY, JSON.stringify(selectedInsts));
    } catch { /* silencieux */ }
  }, [selectedIds, allInstitutions]);

  // Continuer vers étape suivante
  const handleContinue = useCallback(async () => {
    setSaving(true);
    const nextStep = project?.steps.find(s => s.id === 'demande-admission');
    setTimeout(() => {
      setSaving(false);
      if (nextStep) {
        router.replace(`/capi/autonomie/${nextStep.id}` as never);
      } else {
        router.back();
      }
    }, 600);
  }, [project, router]);

  const hasSelection = selectedIds.length > 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Trouver un établissement</Text>
          <Text style={styles.headerSub}>
            {loading ? 'Chargement…' : `${results.length} / ${allInstitutions.length} DLI`}
          </Text>
        </View>
        {/* Compteur de choix */}
        {hasSelection && (
          <View style={styles.choixBadge}>
            <Text style={styles.choixBadgeText}>{selectedIds.length}/3</Text>
          </View>
        )}
      </View>

      {/* ── Section fixe : bannière + recherche + filtres ──
           IMPORTANT : cette section est HORS du FlatList pour éviter
           le démontage/remontage du TextInput à chaque frappe. */}
      <View style={styles.fixedTop}>
        {/* Bannière info */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={15} color={Colors.primary} />
          <Text style={styles.infoText} numberOfLines={2}>
            {loading
              ? 'Chargement de la liste officielle DLI…'
              : loadError
              ? 'Liste partielle (hors-ligne). Vérifiez votre connexion.'
              : `${allInstitutions.length} établissements IRCC · CAPI recommande 3 candidatures.`
            }
          </Text>
          {loading && <ActivityIndicator size="small" color={Colors.primary} />}
        </View>

        {/* Barre de recherche — toujours dans le même arbre de composants */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Nom, ville, province…"
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={onChangeQuery}
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setDebouncedQ(''); }}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtre province */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContent}
          keyboardShouldPersistTaps="handled"
        >
          <FilterChip label="Tout" active={province === null} onPress={() => setProvince(null)} />
          {provincesDisponibles.map(p => (
            <FilterChip key={p} label={PROVINCE_LABELS[p] ?? p} active={province === p} onPress={() => setProvince(p === province ? null : p)} />
          ))}
        </ScrollView>

        {/* Filtre type */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.chipsScroll, { marginTop: 0, marginBottom: 6 }]}
          contentContainerStyle={styles.chipsContent}
          keyboardShouldPersistTaps="handled"
        >
          <FilterChip label="Tous types" active={typeFilter === null} onPress={() => setTypeFilter(null)} />
          {(['universite', 'college', 'cegep', 'technique', 'ecole_langue'] as DLIType[]).map(t => (
            <FilterChip key={t} label={`${TYPE_EMOJI[t]} ${TYPE_LABELS[t]}`} active={typeFilter === t} onPress={() => setTypeFilter(t === typeFilter ? null : t)} />
          ))}
        </ScrollView>

        {/* Bandeau choix validés */}
        {hasSelection && (
          <View style={styles.choixBanner}>
            <Text style={styles.choixBannerIcon}>🎯</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.choixBannerTitle}>{selectedIds.length}/3 établissement{selectedIds.length > 1 ? 's' : ''} choisi{selectedIds.length > 1 ? 's' : ''}</Text>
              <Text style={styles.choixBannerSub}>
                {selectedIds.length < 3 ? `Ajoutez encore ${3 - selectedIds.length} choix pour maximiser vos chances.` : 'Objectif 3 candidatures atteint !'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* ── Liste des résultats ── */}
      <FlatList
        data={results}
        keyExtractor={item => item.id}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          loading ? null : (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>Aucun établissement trouvé pour cette recherche.</Text>
            </View>
          )
        )}
        renderItem={({ item }) => (
          <InstitutionCard
            item={item}
            selected={selectedIds.includes(item.id)}
            canAdd={selectedIds.length < 3 || selectedIds.includes(item.id)}
            onViewAdmission={() => handleViewAdmission(item)}
            onValidate={() => handleToggleSelect(item)}
          />
        )}
        ListFooterComponent={() => (
          <View style={styles.footer}>
            {/* Bouton continuer */}
            {hasSelection && (
              <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <>
                    <Text style={styles.continueBtnText}>Passer à la demande d'admission</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </>
                }
              </TouchableOpacity>
            )}

            {/* Lien liste complète */}
            <TouchableOpacity
              style={styles.externalLink}
              onPress={async () => {
                const url = 'https://www.cicic.ca/869/resultats.canada?search=';
                try { await Linking.openURL(url); }
                catch { Alert.alert('Erreur', "Impossible d'ouvrir le navigateur."); }
              }}
            >
              <Ionicons name="list-outline" size={15} color={Colors.primary} />
              <Text style={styles.externalLinkText}>Voir la liste complète — CICIC / IRCC</Text>
              <Ionicons name="open-outline" size={14} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgLight },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingVertical: 14, gap: 12, backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  choixBadge: {
    backgroundColor: Colors.success, borderRadius: 14, paddingHorizontal: 10,
    paddingVertical: 4, minWidth: 36, alignItems: 'center',
  },
  choixBadgeText: { fontSize: 13, fontWeight: '800', color: '#fff' },

  // Section fixe au-dessus de la liste
  fixedTop: {
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4,
  },
  infoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary + '10', borderRadius: 10, padding: 10,
    borderLeftWidth: 3, borderLeftColor: Colors.primary, marginBottom: 10,
  },
  infoText: { flex: 1, fontSize: 11, color: Colors.text, lineHeight: 16 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.bgLight, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1.5, borderColor: Colors.border, marginBottom: 10, ...UI.cardShadow,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, padding: 0, height: Platform.OS === 'ios' ? 22 : 24 },
  chipsScroll: { marginBottom: 8 },
  chipsContent: { paddingVertical: 2, paddingRight: 12 },

  choixBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.success + '12', borderRadius: 12, padding: 12,
    borderWidth: 1.5, borderColor: Colors.success + '50', marginBottom: 10,
  },
  choixBannerIcon: { fontSize: 22 },
  choixBannerTitle: { fontSize: 13, fontWeight: '800', color: Colors.success, marginBottom: 2 },
  choixBannerSub: { fontSize: 11, color: Colors.textMuted, lineHeight: 16 },

  listContent: { paddingHorizontal: 16, paddingTop: 12 },

  continueBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.success, borderRadius: 16, paddingVertical: 17, marginBottom: 12,
  },
  continueBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  externalLink: {
    flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center',
    paddingVertical: 14, backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  externalLinkText: { fontSize: 12, fontWeight: '600', color: Colors.primary },

  footer: { paddingBottom: 24 },

  empty: { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
});
