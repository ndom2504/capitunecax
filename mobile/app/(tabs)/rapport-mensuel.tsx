import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function RapportMensuel() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" backgroundColor={Colors.primary} />
      
      {/* HEADER */}
      <LinearGradient
        colors={['#143FA8', '#1E63D6']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Rapport Mensuel</Text>
          <TouchableOpacity>
            <Ionicons name="download" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* CONTENU */}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* MOIS ACTUEL */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={24} color="#143FA8" />
            <Text style={styles.cardTitle}>Mars 2026</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>245</Text>
              <Text style={styles.statLabel}>Dossiers traités</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>92%</Text>
              <Text style={styles.statLabel}>Taux de réussite</Text>
            </View>
          </View>
        </View>

        {/* REVENUS */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="cash" size={24} color="#059669" />
            <Text style={styles.cardTitle}>Revenus</Text>
          </View>
          <View style={styles.revenueRow}>
            <Text style={styles.revenueLabel}>Total généré</Text>
            <Text style={styles.revenueValue}>2,450,000 XAF</Text>
          </View>
          <View style={styles.revenueRow}>
            <Text style={styles.revenueLabel}>Payé</Text>
            <Text style={styles.revenueValuePaid}>2,150,000 XAF</Text>
          </View>
          <View style={styles.revenueRow}>
            <Text style={styles.revenueLabel}>En attente</Text>
            <Text style={styles.revenueValuePending}>300,000 XAF</Text>
          </View>
        </View>

        {/* PERFORMANCES */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="trending-up" size={24} color="#7C3AED" />
            <Text style={styles.cardTitle}>Performances</Text>
          </View>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Temps moyen de traitement</Text>
            <Text style={styles.performanceValue}>2.5 jours</Text>
          </View>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Taux de conversion</Text>
            <Text style={styles.performanceValue}>87%</Text>
          </View>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Satisfaction client</Text>
            <Text style={styles.performanceValue}>4.8/5</Text>
          </View>
        </View>

        {/* EXPORT */}
        <TouchableOpacity style={styles.exportButton}>
          <Ionicons name="document-text" size={20} color="#fff" />
          <Text style={styles.exportButtonText}>Exporter le rapport</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#143FA8',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  revenueLabel: {
    fontSize: 16,
    color: '#374151',
  },
  revenueValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  revenueValuePaid: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  revenueValuePending: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
  },
  performanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  performanceLabel: {
    fontSize: 16,
    color: '#374151',
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
  },
  exportButton: {
    backgroundColor: '#143FA8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
