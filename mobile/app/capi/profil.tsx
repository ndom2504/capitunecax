import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useCapiSession } from '../../context/CapiContext';
import type { CapiProfileData } from '../../lib/api';

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

  const [nationalite, setNationalite] = useState(init?.nationalite ?? '');
  const [age, setAge] = useState(init?.age ? String(init.age) : '');
  const [diplome, setDiplome] = useState(init?.diplome ?? '');
  const [experience, setExperience] = useState(init?.experience ? String(init.experience) : '');
  const [langues, setLangues] = useState<string[]>(init?.langues ?? []);
  const [province, setProvince] = useState(init?.province ?? '');
  const [delai, setDelai] = useState(init?.delai ?? '');
  const [budget, setBudget] = useState(init?.budget ?? '');
  const [refus, setRefus] = useState(init?.refusAnterieur ?? false);

  const toggleLangue = (l: string) =>
    setLangues(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);

  const isValid = nationalite.trim() && age && diplome && langues.length > 0 && province && delai && budget;

  const next = () => {
    const profile: CapiProfileData = {
      motif: session.motif!,
      programme: session.programme,
      nationalite,
      age: Number(age),
      diplome,
      experience: Number(experience) || 0,
      langues,
      province,
      delai,
      budget,
      refusAnterieur: refus,
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
            <View style={styles.capiAvatar}><Text style={styles.capiEmoji}>🤖</Text></View>
            <View style={styles.bubble}>
              <Text style={styles.bubbleText}>Maintenant, parlons de vous. Ces informations permettront d'évaluer votre profil avec précision. Prenez votre temps — tout sera sauvegardé.</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Informations personnelles</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nationalité *</Text>
            <TextInput
              style={styles.input}
              value={nationalite}
              onChangeText={setNationalite}
              placeholder="Ex: Marocain, Français, Algérien..."
              placeholderTextColor={Colors.textMuted}
            />
          </View>

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
  root: { flex: 1, backgroundColor: Colors.dark },
  scroll: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  progressBarOuter: { flex: 1, height: 4, backgroundColor: Colors.border, borderRadius: 2 },
  progressBarInner: { height: 4, backgroundColor: Colors.orange, borderRadius: 2 },
  stepLabel: { fontSize: 12, color: Colors.textMuted, minWidth: 32 },
  capiHeader: { flexDirection: 'row', paddingTop: 8, paddingBottom: 20, gap: 12, alignItems: 'flex-start' },
  capiAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.orange + '25', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  capiEmoji: { fontSize: 22 },
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
