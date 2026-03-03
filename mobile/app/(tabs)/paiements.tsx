import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi, type Payment } from '../../lib/api';

const DEMO_PAYMENTS: Payment[] = [
  { id: '1', label: 'Pack Essentiel — Analyse du profil', amount: 249, currency: 'CAD', status: 'paid', date: '2026-01-10' },
  { id: '2', label: 'Pack Standard — Montage du dossier', amount: 799, currency: 'CAD', status: 'paid', date: '2026-02-01' },
  { id: '3', label: 'Suivi administratif — Mensuel', amount: 149, currency: 'CAD', status: 'pending', date: '2026-03-01' },
  { id: '4', label: 'Aide à l\'intégration', amount: 349, currency: 'CAD', status: 'pending', date: '2026-04-01' },
];

const STATUS_CFG = {
  paid:    { label: 'Payé', color: Colors.success, icon: 'checkmark-circle' as const, bg: '#dcfce7' },
  pending: { label: 'En attente', color: Colors.warning, icon: 'time' as const, bg: '#fef3c7' },
  failed:  { label: 'Échoué', color: Colors.error, icon: 'close-circle' as const, bg: '#fee2e2' },
};

export default function PaiementsScreen() {
  const { token } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!token) { setPayments(DEMO_PAYMENTS); setLoading(false); return; }
    const res = await dashboardApi.getPayments(token);
    const fetchedPayments = res.data?.payments;
    setPayments(fetchedPayments?.length ? fetchedPayments : DEMO_PAYMENTS);
    setLoading(false);
  };

  useEffect(() => { load(); }, [token]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const total = payments.reduce((s, p) => s + p.amount, 0);
  const paid  = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const due   = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Text style={styles.title}>Paiements</Text>

      {/* Résumé */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderTopColor: Colors.success }]}>
          <Text style={styles.summaryLabel}>Payé</Text>
          <Text style={[styles.summaryAmount, { color: Colors.success }]}>{paid} $</Text>
        </View>
        <View style={[styles.summaryCard, { borderTopColor: Colors.warning }]}>
          <Text style={styles.summaryLabel}>À payer</Text>
          <Text style={[styles.summaryAmount, { color: Colors.warning }]}>{due} $</Text>
        </View>
        <View style={[styles.summaryCard, { borderTopColor: Colors.primary }]}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={[styles.summaryAmount, { color: Colors.primary }]}>{total} $</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.orange} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={p => p.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />}
          renderItem={({ item }) => {
            const cfg = STATUS_CFG[item.status];
            const isPending = item.status === 'pending';
            return (
              <View style={styles.payCard}>
                <View style={styles.payLeft}>
                  <Text style={styles.payLabel} numberOfLines={2}>{item.label}</Text>
                  <Text style={styles.payDate}>{item.date}</Text>
                </View>
                <View style={styles.payRight}>
                  <Text style={styles.payAmount}>{item.amount} $</Text>
                  <View style={[styles.payBadge, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon} size={12} color={cfg.color} />
                    <Text style={[styles.payBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                  {isPending && (
                    <TouchableOpacity style={styles.payNowBtn} activeOpacity={0.8}>
                      <Text style={styles.payNowText}>Payer</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgLight },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  summaryRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 20 },
  summaryCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 14,
    padding: 14, borderTopWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 1,
  },
  summaryLabel: { fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryAmount: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  list: { padding: 16, gap: 10 },
  payCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    backgroundColor: Colors.white, borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  payLeft: { flex: 1, paddingRight: 12 },
  payLabel: { fontSize: 14, fontWeight: '600', color: Colors.text, lineHeight: 20 },
  payDate: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  payRight: { alignItems: 'flex-end', gap: 6 },
  payAmount: { fontSize: 18, fontWeight: '800', color: Colors.text },
  payBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  payBadgeText: { fontSize: 11, fontWeight: '700' },
  payNowBtn: {
    backgroundColor: Colors.orange, borderRadius: 8,
    paddingVertical: 6, paddingHorizontal: 14,
  },
  payNowText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
