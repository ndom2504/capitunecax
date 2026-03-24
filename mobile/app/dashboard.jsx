import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Données mockées pour Capitune
const mockData = {
  stats: {
    clients: 24,
    dossiers: 18,
    success: 92,
    revenue: 3200000,
  },
  performance: {
    satisfaction: 4.8,
    responseTime: '2h',
    completion: 87,
  },
  recentActivity: [
    { id: '1', type: 'client', name: 'Marie Dubois', action: 'Nouveau dossier', time: 'Il y a 2h' },
    { id: '2', type: 'revenue', name: 'Pierre Martin', action: 'Paiement reçu', time: 'Il y a 4h' },
    { id: '3', type: 'document', name: 'Sophie Laurent', action: 'Document validé', time: 'Il y a 6h' },
  ],
  notifications: [
    { id: '1', title: 'Nouveau message de Marie Dubois', read: false },
    { id: '2', title: 'Rappel: Document requis', read: false },
    { id: '3', title: 'Mise à jour tarifaire', read: true },
  ],
};

export default function DashboardScreen() {
  const { user, token } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(mockData.stats);
  const [performance, setPerformance] = useState(mockData.performance);
  const [recentActivity, setRecentActivity] = useState(mockData.recentActivity);
  const [notifications, setNotifications] = useState(mockData.notifications);

  // Charger les données depuis l'API
  useEffect(() => {
    loadDashboardData();
  }, [token]);

  const loadDashboardData = async () => {
    try {
      if (!token) {
        console.log('Pas de token, utilisation des données mockées');
        return;
      }

      // TODO: Implémenter l'appel API réel
      console.log('Données dashboard chargées (mock)');
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header avec gradient */}
      <LinearGradient
        colors={[Colors.primary, Colors.dark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcomeText}>Bonjour</Text>
            <Text style={styles.userName}>{user?.name || 'Utilisateur'}</Text>
          </View>
          <View style={styles.notificationContainer}>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => console.log('Navigate to notifications')}
            >
              <Ionicons name="notifications" size={24} color="white" />
              {unreadNotifications > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadNotifications}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Cartes de statistiques */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="people" size={24} color={Colors.primary} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{stats.clients}</Text>
              <Text style={styles.statLabel}>Clients</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="folder" size={24} color={Colors.primary} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{stats.dossiers}</Text>
              <Text style={styles.statLabel}>Dossiers</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{stats.success}%</Text>
              <Text style={styles.statLabel}>Succès</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="cash" size={24} color={Colors.primary} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{formatCurrency(stats.revenue)}</Text>
              <Text style={styles.statLabel}>Revenus</Text>
            </View>
          </View>
        </View>

        {/* Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.performanceContainer}>
            <View style={styles.performanceItem}>
              <View style={styles.performanceHeader}>
                <Text style={styles.performanceLabel}>Satisfaction</Text>
                <Ionicons name="star" size={16} color={Colors.warning} />
              </View>
              <Text style={styles.performanceValue}>{performance.satisfaction}/5</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(performance.satisfaction / 5) * 100}%` }]} />
              </View>
            </View>

            <View style={styles.performanceItem}>
              <View style={styles.performanceHeader}>
                <Text style={styles.performanceLabel}>Temps de réponse</Text>
                <Ionicons name="time" size={16} color={Colors.textSecondary} />
              </View>
              <Text style={styles.performanceValue}>{performance.responseTime}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '80%', backgroundColor: Colors.textSecondary }]} />
              </View>
            </View>

            <View style={styles.performanceItem}>
              <View style={styles.performanceHeader}>
                <Text style={styles.performanceLabel}>Taux de complétion</Text>
                <Ionicons name="trending-up" size={16} color={Colors.success} />
              </View>
              <Text style={styles.performanceValue}>{performance.completion}%</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${performance.completion}%`, backgroundColor: Colors.success }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Activité récente */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Activité récente</Text>
            <TouchableOpacity onPress={() => console.log('Navigate to notifications')}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.activityContainer}>
            {recentActivity.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={[
                  styles.activityIcon,
                  { backgroundColor: 
                    activity.type === 'client' ? Colors.primary :
                    activity.type === 'revenue' ? Colors.success :
                    Colors.textSecondary
                  }
                ]}>
                  <Ionicons 
                    name={
                      activity.type === 'client' ? 'person-add' :
                      activity.type === 'revenue' ? 'cash' :
                      'document-text'
                    } 
                    size={16} 
                    color="white" 
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityName}>{activity.name}</Text>
                  <Text style={styles.activityAction}>{activity.action}</Text>
                </View>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <TouchableOpacity onPress={() => console.log('Navigate to notifications')}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.notificationList}>
            {notifications.slice(0, 3).map((notification) => (
              <TouchableOpacity 
                key={notification.id} 
                style={[
                  styles.notificationItem,
                  !notification.read && styles.unreadNotification
                ]}
              >
                <View style={[
                  styles.notificationDot,
                  { backgroundColor: !notification.read ? Colors.primary : Colors.border }
                ]} />
                <Text style={[
                  styles.notificationText,
                  !notification.read && styles.unreadText
                ]}>
                  {notification.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgLight,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 10,
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 4,
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 20,
    gap: 15,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statContent: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  seeAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  performanceContainer: {
    gap: 16,
  },
  performanceItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  performanceLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  activityContainer: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  activityAction: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  notificationList: {
    gap: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: Colors.primary + '10',
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  unreadText: {
    fontWeight: '600',
    color: Colors.text,
  },
});
