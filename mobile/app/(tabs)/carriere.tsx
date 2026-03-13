import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { UI } from '../../constants/UI';
import { useRouter } from 'expo-router';

// ── Données pour les catégories Carrière & Études ──
const CARRIER_TABS = [
  {
    id: 'ecole',
    title: 'Espace Études (EED)',
    desc: 'Trouvez votre Établissement d\'Enseignement Désigné et programmez vos études au Canada.',
    icon: 'school',
    color: Colors.primary,
    comingSoon: false,
  },
  {
    id: 'emploi',
    title: 'Marché de l\'Emploi',
    desc: 'Explorez les offres d\'emploi ciblées et trouvez des employeurs canadiens.',
    icon: 'briefcase',
    color: Colors.orange,
    comingSoon: false,
  },
  {
    id: 'cv',
    title: 'Créateur de CV Canadien',
    desc: 'Adaptez votre CV au format canadien pour maximiser vos chances de recrutement.',
    icon: 'document-text',
    color: '#3b82f6',
    comingSoon: false,
  },
  {
    id: 'match',
    title: 'Système de Match',
    desc: 'Découvrez votre taux de compatibilité avec les différents programmes et provinces.',
    icon: 'git-network',
    color: '#8b5cf6',
    comingSoon: true,
  },
];

export default function CarriereScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.root}>
      {/* Header compact, style retour */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Carrière & Études</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.heroBox}>
          <View style={styles.heroIconBox}>
            <Ionicons name="compass" size={28} color={Colors.orange} />
          </View>
          <Text style={styles.heroTitle}>Préparez votre avenir au Canada</Text>
          <Text style={styles.heroDesc}>
            Que vous choisissiez la voie des études ou du travail, explorez nos outils conçus pour optimiser votre parcours d'intégration.
          </Text>
        </View>

        {/* Liste des modules Carrière */}
        <View style={styles.modulesList}>
          {CARRIER_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.moduleCard, tab.comingSoon && { opacity: 0.6 }]}
              activeOpacity={0.8}
              onPress={() => {
                if (tab.comingSoon) return;
                // router.push(`/(tabs)/carriere/${tab.id}`) par la suite
                alert('Cette section sera bientôt disponible !');
              }}
            >
              <View style={[styles.iconContainer, { backgroundColor: tab.color + '1A' }]}>
                <Ionicons name={tab.icon as any} size={28} color={tab.color} />
              </View>
              <View style={styles.moduleTextCol}>
                <View style={styles.moduleTitleRow}>
                  <Text style={styles.moduleTitle}>{tab.title}</Text>
                  {tab.comingSoon && (
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>À venir</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.moduleDesc}>{tab.desc}</Text>
              </View>
              {!tab.comingSoon && (
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  heroBox: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    ...UI.cardShadow,
  },
  heroIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.orange + '1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  modulesList: {
    gap: 16,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...UI.cardShadow,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  moduleTextCol: {
    flex: 1,
  },
  moduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  moduleDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  comingSoonBadge: {
    backgroundColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
});
