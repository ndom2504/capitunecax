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
          <Text style={styles.heroTitle}>CV Canada IA</Text>
          <Text style={styles.heroSub}>
            L'IA Capitune analyse et optimise votre CV selon les normes canadiennes.
          </Text>
        </View>

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
});
