import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';

const CV_SERVICES = [
  {
    id: 'cv_canada',
    icon: '🍁',
    label: 'CV Canada',
    desc: 'CV standard canadien, bilingue, adapté au marché national.',
    price: 10,
    priceForfait: 2,
    bg: '#e8f4ec',
    border: '#a8d5b5',
  },
  {
    id: 'cv_quebec',
    icon: '⚜️',
    label: 'CV Québec',
    desc: 'Marché québécois, en français, normes du Québec.',
    price: 10,
    priceForfait: 2,
    bg: '#eef2fb',
    border: '#b8caf5',
  },
  {
    id: 'cv_etudiant',
    icon: '🎓',
    label: 'CV Étudiant',
    desc: "Premier emploi ou stage — formations et bénévolat mis en avant.",
    price: 8,
    priceForfait: 2,
    bg: '#fdf5e8',
    border: '#f5d58a',
  },
  {
    id: 'cv_immigration',
    icon: '✈️',
    label: 'CV Immigration',
    desc: 'Entrée Express, PNP — profil immigration optimisé.',
    price: 12,
    priceForfait: 3,
    bg: '#fff0ec',
    border: '#f5b8a0',
  },
  {
    id: 'cover_letter',
    icon: '✉️',
    label: 'Lettre de motivation',
    desc: 'Cover letter bilingue percutante pour le marché canadien.',
    price: 10,
    priceForfait: 2,
    bg: '#f0f9ff',
    border: '#93c5fd',
  },
  {
    id: 'letter_ircc',
    icon: '🏛️',
    label: 'Lettre IRCC',
    desc: "Lettre officielle pour dossier d'immigration IRCC.",
    price: 15,
    priceForfait: 3,
    bg: '#faf5ff',
    border: '#c4b5fd',
  },
];

export default function CvLandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CV Canadien IA</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Choisissez votre service</Text>
          <Text style={styles.heroSub}>
            L'IA Capitune analyse et optimise votre CV selon les normes canadiennes.
          </Text>
        </View>

        {/* Grille services */}
        {CV_SERVICES.map(svc => (
          <TouchableOpacity
            key={svc.id}
            style={[styles.card, { backgroundColor: svc.bg, borderColor: svc.border }]}
            onPress={() => router.push(`/carriere/cv-service?service=${svc.id}` as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.cardIcon}>{svc.icon}</Text>
            <View style={styles.cardBody}>
              <Text style={styles.cardLabel}>{svc.label}</Text>
              <Text style={styles.cardDesc}>{svc.desc}</Text>
              <View style={styles.cardPrices}>
                <View style={styles.priceBadge}>
                  <Text style={styles.priceForfait}>{svc.priceForfait}$/service</Text>
                  <Text style={styles.priceForfaitSub}>avec forfait</Text>
                </View>
                <Text style={styles.priceBase}>{svc.price}$ sans forfait</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#aaa" />
          </TouchableOpacity>
        ))}

        {/* Bandeau forfait */}
        <View style={styles.forfaitBanner}>
          <Text style={styles.forfaitTitle}>💡 Économisez avec un forfait Capitune</Text>
          <Text style={styles.forfaitSub}>
            Accédez à tous les services CV à partir de 2$/service — téléchargement PDF inclus.
          </Text>
          <TouchableOpacity
            style={styles.forfaitBtn}
            onPress={() => router.push('/(tabs)/projet')}
            activeOpacity={0.85}
          >
            <Text style={styles.forfaitBtnText}>🎯 Voir les forfaits</Text>
          </TouchableOpacity>
        </View>

        {/* Comment ça marche */}
        <Text style={styles.stepsTitle}>Comment ça marche ?</Text>
        {[
          { n: '1', label: 'Choisissez un service', desc: 'CV Canada, Québec, Étudiant ou Immigration.' },
          { n: '2', label: 'Importez ou collez votre CV', desc: 'Formats PDF, DOCX, TXT acceptés.' },
          { n: '3', label: "L'IA analyse et optimise", desc: 'Score ATS, suggestions, lettre de motivation.' },
          { n: '4', label: 'Téléchargez en PDF', desc: 'Disponible avec un forfait Capitune.' },
        ].map(step => (
          <View key={step.n} style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>{step.n}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepLabel}>{step.label}</Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.offWhite },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingBottom: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn:     { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgLight },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '600', color: Colors.text },

  scroll: { padding: 16, gap: 16, paddingBottom: 60 },

  hero: { alignItems: 'center', paddingVertical: 8 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 6 },
  heroSub:   { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 19, maxWidth: 300 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, borderWidth: 1.5, padding: 16,
  },
  cardIcon:  { fontSize: 32, flexShrink: 0 },
  cardBody:  { flex: 1, gap: 4 },
  cardLabel: { fontSize: 15, fontWeight: '700', color: Colors.text },
  cardDesc:  { fontSize: 12, color: Colors.textMuted, lineHeight: 17 },

  cardPrices:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  priceBadge:     { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignItems: 'center' },
  priceForfait:   { fontSize: 12, fontWeight: '700', color: '#1f4b6e' },
  priceForfaitSub:{ fontSize: 10, color: '#888' },
  priceBase:      { fontSize: 11, color: '#aaa' },

  forfaitBanner: {
    backgroundColor: '#0a1628', borderRadius: 18, padding: 20, alignItems: 'center', gap: 10,
  },
  forfaitTitle:   { fontSize: 14, fontWeight: '800', color: '#fff', textAlign: 'center' },
  forfaitSub:     { fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 18 },
  forfaitBtn:     { backgroundColor: '#ff9408', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  forfaitBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  stepsTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, textAlign: 'center', marginTop: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: '#fff', borderRadius: 14, padding: 14 },
  stepNum: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#1f4b6e', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  stepLabel: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  stepDesc:  { fontSize: 12, color: Colors.textMuted, lineHeight: 17 },
});
