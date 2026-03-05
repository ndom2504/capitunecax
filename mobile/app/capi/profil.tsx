import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, FlatList,
} from 'react-native';
import { CapiAvatar } from '../../components/CapiAvatar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useCapiSession } from '../../context/CapiContext';
import type { CapiProfileData } from '../../lib/api';
import { searchPays, getPaysParCode } from '../../lib/pays-data';
import type { PaysInfo } from '../../lib/pays-data';

const DIPLOMES = ['Aucun', 'Secondaire', 'Technique / DEP', 'Baccalauréat', 'Maîtrise', 'Doctorat'];
const LANGUES_OPTIONS = ['Français', 'Anglais', 'Espagnol', 'Arabe', 'Autre'];
const DELAIS = [
  { id: 'urgent', label: 'Urgent (< 3 mois)' },
  { id: '6mois', label: 'Dans 6 mois' },
  { id: '1an', label: 'Dans 1 an' },
  { id: 'flexible', label: 'Flexible' },
];
const BUDGETS = [
  { id: 'moins_2000', label: '< 2 000 $' },
  { id: '2000_5000', label: '2 000 – 5 000 $' },
  { id: 'plus_5000', label: '> 5 000 $' },
];
const PROVINCES = [
  'Québec', 'Ontario', 'Colombie-Britannique', 'Alberta',
  'Manitoba', 'Saskatchewan', 'Nouvelle-Écosse', 'Autre',
];
const NB_PERSONNES = [1, 2, 3, 4, 5, 6];
const DUREES_SEJOUR = [
  { id: '7', label: '7 jours' },
  { id: '14', label: '14 jours' },
  { id: '21', label: '21 jours' },
  { id: '30', label: '30 jours' },
  { id: '60', label: '60 jours' },
  { id: '90', label: '90 jours' },
];

const REGION_EMOJI: Record<string, string> = {
  afrique: '🌍', europe: '🌎', moyen_orient: '🌏', asie: '🌏', ameriques: '🌎', autre: '🌐',
};
const REGION_LABELS: Record<string, string> = {
  afrique: 'Afrique', europe: 'Europe', moyen_orient: 'Moyen-Orient',
  asie: 'Asie', ameriques: 'Amériques', autre: 'Autre',
};

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function CapiProfilScreen() {
  const router = useRouter();
  const { session, updateSession } = useCapiSession();
  const init = session.profile;
  const isVisiteur = session.motif === 'visiter';

  const [nationalite, setNationalite] = useState(init?.nationalite ?? '');
  const [age, setAge] = useState(init?.age ? String(init.age) : '');
  const [diplome, setDiplome] = useState(init?.diplome ?? '');
  const [experience, setExperience] = useState(init?.experience ? String(init.experience) : '');
  const [langues, setLangues] = useState<string[]>(init?.langues ?? []);
  const [province, setProvince] = useState(init?.province ?? '');
  const [delai, setDelai] = useState(init?.delai ?? '');
  const [budget, setBudget] = useState(init?.budget ?? '');
  const [refus, setRefus] = useState(init?.refusAnterieur ?? false);

  // Champs spécifiques visa visiteur
  const [nombrePersonnes, setNombrePersonnes] = useState<number>(init?.nombrePersonnes ?? 1);
  const [dureeSejour, setDureeSejour] = useState<string>(init?.dureeSejour ? String(init.dureeSejour) : '');
  const [paysResidence, setPaysResidence] = useState(init?.paysResidence ?? '');

  // Sélecteur de pays
  const [paysQuery, setPaysQuery] = useState(init?.nationalite ?? '');
  const [paysResults, setPaysResults] = useState<PaysInfo[]>([]);
  const [selectedPays, setSelectedPays] = useState<PaysInfo | null>(
    init?.paysCode ? (getPaysParCode(init.paysCode) ?? null) : null,
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef<TextInput>(null);

  const handlePaysQuery = (text: string) => {
    setPaysQuery(text);
    setSelectedPays(null);
    setNationalite(text);
    if (text.length >= 1) {
      setPaysResults(searchPays(text));
      setDropdownOpen(true);
    } else {
      setPaysResults([]);
      setDropdownOpen(false);
    }
  };

  const handleSelectPays = (pays: PaysInfo) => {
    setSelectedPays(pays);
    setPaysQuery(pays.nom);
    setNationalite(pays.nom);
    setPaysResidence(pays.region);
    setPaysResults([]);
    setDropdownOpen(false);
    searchRef.current?.blur();
  };

  const toggleLangue = (l: string) =>
    setLangues(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);

  const isValid = isVisiteur
    ? (selectedPays !== null || nationalite.trim().length > 0) && dureeSejour
    : age && diplome && langues.length > 0 && province && delai && budget;

  const next = () => {
    const profile: CapiProfileData = {
      motif: session.motif!,
      programme: session.programme,
      nationalite,
      age: age ? Number(age) : undefined,
      diplome: isVisiteur ? undefined : diplome,
      experience: isVisiteur ? undefined : (Number(experience) || 0),
      langues: isVisiteur ? [] : langues,
      province: isVisiteur ? undefined : province,
      delai: isVisiteur ? 'urgent' : delai,
      budget: isVisiteur ? 'moins_2000' : budget,
      refusAnterieur: refus,
      // paysCode et crdvVille s'appliquent à TOUS les motifs
      paysCode: selectedPays?.code,
      crdvVille: selectedPays?.crdv,
      paysResidence: selectedPays?.region ?? paysResidence,
      ...(isVisiteur && {
        nombrePersonnes,
        dureeSejour: Number(dureeSejour),
      }),
    };
    updateSession({ profile, step: 4 });
    router.push('/capi/evaluation');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.progressBarOuter}>
            <View style={[styles.progressBarInner, { width: '37.5%' }]} />
          </View>
          <Text style={styles.stepLabel}>3 / 8</Text>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.capiHeader}>
            <CapiAvatar size={44} state="idle" />
            <View style={styles.bubble}>
              <Text style={styles.bubbleText}>
                {isVisiteur
                  ? "Pour votre visa visiteur, sélectionnez votre pays pour obtenir les frais, le centre biométrique (CRDV) et un plan complet personnalisé."
                  : "Sélectionnez votre pays pour obtenir votre centre biométrique (CRDV) et un plan personnalisé. Remplissez ensuite votre profil pour l'évaluation."}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Informations personnelles</Text>

          {/* ── Sélecteur pays réactif ────────────────────────────── */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              {isVisiteur ? 'Pays de résidence / Nationalité *' : '🌍 Votre pays d’origine (optionnel — active le CRDV et le plan détaillé)'}
            </Text>
            <View>
              <View style={styles.searchWrapper}>
                <Ionicons name="search" size={16} color={Colors.textMuted} style={styles.searchIcon} />
                <TextInput
                  ref={searchRef}
                  style={styles.searchInput}
                  value={paysQuery}
                  onChangeText={handlePaysQuery}
                  placeholder="Tapez votre pays (ex: Maroc, France…)"
                  placeholderTextColor={Colors.textMuted}
                  autoCorrect={false}
                />
                {paysQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => { setPaysQuery(''); setNationalite(''); setSelectedPays(null); setDropdownOpen(false); }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Dropdown résultats */}
              {dropdownOpen && paysResults.length > 0 && (
                <View style={styles.dropdown}>
                  <FlatList
                    data={paysResults}
                    keyExtractor={item => item.code}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => handleSelectPays(item)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.dropdownItemText}>{item.nom}</Text>
                        <Text style={styles.dropdownItemRegion}>{REGION_EMOJI[item.region]} {REGION_LABELS[item.region]}</Text>
                      </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.border }} />}
                  />
                </View>
              )}

              {/* Carte infos CRDV après sélection */}
              {selectedPays && (
                <View style={styles.paysCard}>
                  <View style={styles.paysCardHeader}>
                    <Ionicons name="flag-outline" size={16} color={Colors.primary} />
                    <Text style={styles.paysCardNom}>{selectedPays.nom}</Text>
                    <View style={styles.paysRegionBadge}>
                      <Text style={styles.paysRegionText}>{REGION_EMOJI[selectedPays.region]} {REGION_LABELS[selectedPays.region]}</Text>
                    </View>
                  </View>
                  <View style={styles.paysInfoRow}>
                    <Ionicons name="finger-print" size={14} color={Colors.textMuted} />
                    <Text style={styles.paysInfoLabel}>Centre biométrie :</Text>
                    <Text style={styles.paysInfoValue} numberOfLines={2}>{selectedPays.crdv}</Text>
                  </View>
                  <View style={styles.paysInfoRow}>
                    <Ionicons name="cash-outline" size={14} color={Colors.textMuted} />
                    <Text style={styles.paysInfoLabel}>{isVisiteur ? 'Frais visa :' : 'Frais gouvernementaux :'}</Text>
                    <Text style={styles.paysInfoValue}>
                      {isVisiteur
                        ? `${selectedPays.fraisVisa} $ / biométrie ${selectedPays.fraisBiometrie} $ CAD / pers.`
                        : `Biométrie ${selectedPays.fraisBiometrie} $ CAD / pers.`}
                    </Text>
                  </View>
                  <View style={styles.paysInfoRow}>
                    <Ionicons name="medkit-outline" size={14} color={selectedPays.examMedicalRisque ? Colors.orange : Colors.success} />
                    <Text style={styles.paysInfoLabel}>Examen médical :</Text>
                    <Text style={[styles.paysInfoValue, { color: selectedPays.examMedicalRisque ? Colors.orange : Colors.success }]}>
                      {isVisiteur
                        ? (selectedPays.examMedicalRisque ? 'Souvent requis \u26a0\ufe0f' : 'Requis si s\u00e9jour > 6 mois seulement')
                        : session.motif === 'etudier'
                          ? 'Requis si dur\u00e9e du permis > 6 mois \u26a0\ufe0f'
                          : (selectedPays.examMedicalRisque ? 'Souvent requis pour ce pays \u26a0\ufe0f' : 'G\u00e9n\u00e9ralement non requis')}
                    </Text>
                  </View>
                  {selectedPays.note && (
                    <View style={styles.paysNote}>
                      <Ionicons name="information-circle-outline" size={13} color={Colors.primary} />
                      <Text style={styles.paysNoteText}>{selectedPays.note}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>

          {!isVisiteur && (
            <View style={styles.fieldRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Âge *</Text>
                <TextInput
                  style={styles.input}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  placeholder="Ex: 32"
                  placeholderTextColor={Colors.textMuted}
                  maxLength={3}
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Années d'expérience</Text>
                <TextInput
                  style={styles.input}
                  value={experience}
                  onChangeText={setExperience}
                  keyboardType="numeric"
                  placeholder="Ex: 5"
                  placeholderTextColor={Colors.textMuted}
                  maxLength={2}
                />
              </View>
            </View>
          )}

          {/* ── Bloc spécifique Visa Visiteur ─────────────────────────── */}
          {isVisiteur && (
            <>
              <Text style={styles.sectionTitle}>Détails du voyage</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nombre de personnes *</Text>
                <View style={styles.chips}>
                  {NB_PERSONNES.map(n => (
                    <Chip
                      key={n}
                      label={n === 6 ? '6+' : String(n)}
                      selected={nombrePersonnes === n}
                      onPress={() => setNombrePersonnes(n)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Durée du séjour * *</Text>
                <View style={styles.chips}>
                  {DUREES_SEJOUR.map(d => (
                    <Chip key={d.id} label={d.label} selected={dureeSejour === d.id} onPress={() => setDureeSejour(d.id)} />
                  ))}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <TouchableOpacity style={styles.toggleRow} onPress={() => setRefus(!refus)} activeOpacity={0.8}>
                  <View style={[styles.checkbox, refus && styles.checkboxChecked]}>
                    {refus && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <Text style={styles.label}>J'ai eu un refus de visa/permis antérieur</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ── Bloc général (non-visiteur) ────────────────────────────── */}
          {!isVisiteur && (
            <>
              <Text style={styles.sectionTitle}>Formation & Langues</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Niveau de diplôme *</Text>
                <View style={styles.chips}>
                  {DIPLOMES.map(d => (
                    <Chip key={d} label={d} selected={diplome === d} onPress={() => setDiplome(d)} />
                  ))}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Langues parlées * (plusieurs possible)</Text>
                <View style={styles.chips}>
                  {LANGUES_OPTIONS.map(l => (
                    <Chip key={l} label={l} selected={langues.includes(l)} onPress={() => toggleLangue(l)} />
                  ))}
                </View>
              </View>

              <Text style={styles.sectionTitle}>Projet</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Province visée *</Text>
                <View style={styles.chips}>
                  {PROVINCES.map(p => (
                    <Chip key={p} label={p} selected={province === p} onPress={() => setProvince(p)} />
                  ))}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Délai souhaité *</Text>
                <View style={styles.chips}>
                  {DELAIS.map(d => (
                    <Chip key={d.id} label={d.label} selected={delai === d.id} onPress={() => setDelai(d.id)} />
                  ))}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Budget services immigration *</Text>
                <View style={styles.chips}>
                  {BUDGETS.map(b => (
                    <Chip key={b.id} label={b.label} selected={budget === b.id} onPress={() => setBudget(b.id)} />
                  ))}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <TouchableOpacity style={styles.toggleRow} onPress={() => setRefus(!refus)} activeOpacity={0.8}>
                  <View style={[styles.checkbox, refus && styles.checkboxChecked]}>
                    {refus && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <Text style={styles.label}>J'ai eu un refus de visa/permis antérieur</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextBtn, !isValid && styles.nextBtnDisabled]}
            onPress={next}
            disabled={!isValid}
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>Évaluer mon profil</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgLight },
  scroll: { flex: 1, paddingHorizontal: 20 },
  // ── Sélecteur pays ──
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, paddingVertical: 10 },
  dropdown: {
    marginTop: 4, backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden', zIndex: 100,
  },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 12 },
  dropdownItemText: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  dropdownItemRegion: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  paysCard: {
    marginTop: 10, backgroundColor: Colors.primary + '08',
    borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.primary + '30',
  },
  paysCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  paysCardNom: { fontSize: 14, fontWeight: '700', color: Colors.text, flex: 1 },
  paysRegionBadge: { backgroundColor: Colors.orange + '20', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  paysRegionText: { fontSize: 11, color: Colors.orange, fontWeight: '600' },
  paysInfoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 6 },
  paysInfoLabel: { fontSize: 12, color: Colors.textMuted, width: 110 },
  paysInfoValue: { fontSize: 12, color: Colors.text, fontWeight: '500', flex: 1, lineHeight: 16 },
  paysNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 6, backgroundColor: Colors.primary + '12', borderRadius: 8, padding: 8 },
  paysNoteText: { fontSize: 11, color: Colors.primary, flex: 1, lineHeight: 16 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  progressBarOuter: { flex: 1, height: 4, backgroundColor: Colors.border, borderRadius: 2 },
  progressBarInner: { height: 4, backgroundColor: Colors.orange, borderRadius: 2 },
  stepLabel: { fontSize: 12, color: Colors.textMuted, minWidth: 32 },
  capiHeader: { flexDirection: 'row', paddingTop: 8, paddingBottom: 20, gap: 12, alignItems: 'flex-start' },

  bubble: { flex: 1, backgroundColor: Colors.surface, borderRadius: 16, borderTopLeftRadius: 4, padding: 14 },
  bubbleText: { fontSize: 14, color: Colors.text, lineHeight: 21 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.orange, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 8, marginBottom: 12 },
  fieldGroup: { marginBottom: 18 },
  fieldRow: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 13, color: Colors.textSecondary, marginBottom: 8 },
  input: { backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 20, paddingVertical: 7, paddingHorizontal: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  chipSelected: { backgroundColor: Colors.orange + '20', borderColor: Colors.orange },
  chipText: { fontSize: 13, color: Colors.textMuted },
  chipTextSelected: { color: Colors.orange, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: Colors.orange, borderColor: Colors.orange },
  footer: { padding: 20, paddingBottom: 28 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.orange, borderRadius: 14, paddingVertical: 16, gap: 8 },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
