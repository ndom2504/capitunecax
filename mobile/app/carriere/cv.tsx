import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';

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

        <View style={styles.disabledCard}>
          <Text style={styles.disabledIcon}>🛠️</Text>
          <Text style={styles.disabledTitle}>Créateur de CV indisponible</Text>
          <Text style={styles.disabledSub}>
            Cette fonctionnalité est temporairement désactivée.
          </Text>

          <TouchableOpacity
            style={styles.disabledBtn}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={styles.disabledBtnText}>Retour</Text>
          </TouchableOpacity>
        </View>

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


  disabledCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 10,
  },
  disabledIcon: { fontSize: 34 },
  disabledTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  disabledSub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
  disabledBtn: {
    marginTop: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  disabledBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});
