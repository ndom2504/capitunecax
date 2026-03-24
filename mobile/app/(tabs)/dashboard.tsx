import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { RefreshControl } from 'react-native';
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
    processed: 45,
    avgTime: 3.2,
    conversion: 68,
  },
  alerts: {
    late: 3,
    unpaid: 2,
    urgent: 4,
  },
  upcoming: [
    { name: "Jean Dupont", step: "Signature contrat" },
    { name: "Marie Laurent", step: "Validation dossier" },
    { name: "Paul Martin", step: "Documents requis" },
  ],
};

// Carte KPI Premium (sans gradient)
function StatCard({ title, value, percent, type = 'line' }: {
  title: string;
  value: string | number;
  percent: number;
  type?: 'line' | 'bar' | 'circle';
}) {
  const renderChart = () => {
    if (type === 'circle') {
      return (
        <View style={cardStyles.circle}>
          <Text style={cardStyles.circleText}>{value}%</Text>
        </View>
      );
    }

    if (type === 'bar') {
      return (
        <View style={cardStyles.barChart}>
          {[40, 65, 45, 80, 55, 70].map((height, i) => (
            <View key={i} style={[cardStyles.bar, { height: `${height}%` }]} />
          ))}
        </View>
      );
    }

    // Line chart (default)
    return (
      <View style={cardStyles.lineChart}>
        <View style={cardStyles.lineCurve} />
        <View style={cardStyles.linePoints}>
          {[20, 45, 30, 70, 50, 85].map((height, i) => (
            <View key={i} style={[cardStyles.point, { top: `${100 - height}%` }]} />
          ))}
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#143FA8', '#1E63D6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={cardStyles.card}
    >
      <View style={alertStyles.header}>
        <Text style={alertStyles.title}>{title}</Text>
        <View style={alertStyles.icon}>
          <Ionicons name="warning" size={16} color="#fff" />
        </View>
      </View>

      <Text style={alertStyles.value}>{value}</Text>

      <Text style={alertStyles.action}>Action requise</Text>
    </LinearGradient>
  );
}

// Carte Action Premium (avec gradient)
function ActionCard({ title, icon, color = '#143FA8', onPress }: {
  title: string;
  icon: React.ReactNode;
  color?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={actionStyles.card} onPress={onPress}>
      <LinearGradient
        colors={[color, `${color}DD`]}
        style={actionStyles.iconContainer}
      >
        {icon}
      </LinearGradient>
      <Text style={actionStyles.title}>{title}</Text>
    </TouchableOpacity>
  );
}

// Client Item Premium
function ClientItem({ name, step }: { name: string; step: string }) {
  const router = useRouter();

  return (
    <TouchableOpacity style={clientStyles.card} onPress={() => router.push('/(tabs)/inside')}>
      <View style={clientStyles.avatar}>
        <Text style={clientStyles.avatarText}>
          {name.slice(0, 2).toUpperCase()}
        </Text>
      </View>

      <View style={clientStyles.info}>
        <Text style={clientStyles.name}>{name}</Text>
        <Text style={clientStyles.step}>Étape: {step}</Text>
      </View>

      <View style={clientStyles.arrow}>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);
  const [data, setData] = React.useState(mockData);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // États pour les nouvelles fonctionnalités
  const [headerNotifications, setHeaderNotifications] = React.useState<Array<{
    id: string;
    title: string;
    message: string;
    time: string;
    type: 'urgent' | 'info' | 'message' | 'publication' | 'admin';
  }>>([]);
  const [headerUnreadCount, setHeaderUnreadCount] = React.useState(0);

  // État simplifié pour éviter les boucles
const [isLoading, setIsLoading] = React.useState(false);
const [apiError, setApiError] = React.useState<string | null>(null);
const [dashboardData, setDashboardData] = React.useState(mockData);

// Fonction pour charger les données avec gestion d'erreur robuste
const loadDashboardData = React.useCallback(async () => {
    // Éviter les appels multiples
    if (isLoading) return;

    setIsLoading(true);
    setApiError(null);

    try {
      const token = await AsyncStorage.getItem('capitune_session');
      if (!token) {
        setApiError('Non connecté');
        return;
      }

      const response = await fetch('https://api.capitune.com/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const result = await response.json();

      if (result.ok) {
        const isPro = user?.account_type === 'pro';
        if (isPro && result.pro) {
          setDashboardData({
            stats: {
              clients: result.pro.clients || 0,
              dossiers: result.pro.projects_total || 0,
              success: Math.round((result.pro.projects_completed / result.pro.projects_total) * 100) || 0,
              revenue: result.pro.revenue_paid || 0,
            },
            performance: {
              processed: result.pro.projects_completed || 0,
              avgTime: result.pro.processing_rate || 0,
              conversion: result.pro.reactivity_rate || 0,
            },
            alerts: {
              late: result.pro.pending_conversations || 0,
              unpaid: 0,
              urgent: 0,
            },
            upcoming: [],
          });
        } else if (!isPro && result.client) {
          setDashboardData({
            stats: {
              clients: 0,
              dossiers: result.client.my_requests_total || 0,
              success: 0,
              revenue: result.client.my_revenue_paid || 0,
            },
            performance: {
              processed: 0,
              avgTime: 0,
              conversion: 0,
            },
            alerts: {
              late: 0,
              unpaid: 0,
              urgent: 0,
            },
            upcoming: [],
          });
        }
      } else {
        setApiError(result.error || 'Erreur inconnue');
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setApiError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

// Timeout pour éviter les boucles infinies
const timeoutId = React.useRef<NodeJS.Timeout | undefined>(undefined);

  // Ajouter de nouvelles fonctionnalités au dashboard
const [selectedPeriod, setSelectedPeriod] = React.useState('week'); // Par défaut: semaine
const [notifications, setNotifications] = React.useState<Array<{
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'urgent' | 'info' | 'message' | 'publication' | 'admin';
}>>([]);
const [unreadCount, setUnreadCount] = React.useState(0);

// Fonctions pour les nouvelles fonctionnalités du header
const loadHeaderNotifications = React.useCallback(async () => {
  try {
    const token = await AsyncStorage.getItem('capitune_session');
    if (!token) return;

    const response = await fetch('https://api.capitune.com/api/notifications', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      setHeaderNotifications(data.notifications || []);
      setHeaderUnreadCount(data.unreadCount || 0);
    }
  } catch (error) {
    console.error('Header notifications error:', error);
  }
}, []);

const handleProjectsPress = React.useCallback(() => {
  router.push('/(tabs)/documents');
}, [router]);

const handleNotificationsPress = React.useCallback(() => {
  router.push('/(tabs)/inside');
}, [router]);

// Fonctions pour les boutons d'action rapide
const handleAddDocument = React.useCallback(() => {
  router.push('/(tabs)/documents');
}, [router]);

const handleNewFolder = React.useCallback(() => {
  router.push('/(tabs)/messagerie');
}, [router]);

const handleSendMessage = React.useCallback(() => {
  router.push('/(tabs)/messagerie');
}, [router]);

const handlePlanRDV = React.useCallback(() => {
  router.push('/(tabs)/rendezvous');
}, [router]);

const handleRapportMensuel = React.useCallback(() => {
  router.push('/(tabs)/rapport-mensuel');
}, [router]);

const onRefresh = React.useCallback(() => {
  setRefreshing(true);
  loadDashboardData().finally(() => setRefreshing(false));
}, [loadDashboardData]);

// Charger les notifications header au montage
React.useEffect(() => {
  loadHeaderNotifications();
}, [loadHeaderNotifications]);

  const isPro = user?.account_type === 'pro';

  // Fonctions utilitaires pour devise
  const getCurrencySymbol = (currency?: string) => {
    switch (currency?.toUpperCase()) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'XAF': return 'XAF';
      case 'CAD':
      default: return '';
    }
  };

  const formatRevenue = (amount: number, currency?: string) => {
    const currencyCode = currency?.toUpperCase() || 'CAD';
    const symbol = getCurrencySymbol(currency);

    if (currencyCode === 'CAD') {
      return `$${amount.toLocaleString()} CAD`;
    }

    return `${symbol}${amount.toLocaleString()} ${currencyCode}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="light" backgroundColor={Colors.primary} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement du dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (apiError) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="light" backgroundColor={Colors.primary} />
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#DC2626" />
          <Text style={styles.errorText}>{apiError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!isPro) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="light" backgroundColor={Colors.primary} />

        {/* HEADER */}
        <LinearGradient
          colors={['#143FA8', '#1E63D6']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <Text style={styles.title}>MON DOSSIER</Text>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="grid-outline" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="notifications-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* CONTENU CLIENT */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* KPI PRINCIPAUX CLIENT */}
          <View style={styles.row}>
            <StatCard title="Dossiers en cours" value="3" percent={12} type="bar" />
            <StatCard title="Progression" value="72" percent={8} type="circle" />
          </View>

          <View style={styles.row}>
            <StatCard title="Documents" value="12" percent={15} type="line" />
            <StatCard title="Rendez-vous" value="2" percent={5} type="bar" />
          </View>

          {/* ÉTAT DU DOSSIER */}
          <Text style={styles.section}>État du dossier</Text>
          <LinearGradient
            colors={['#143FA8', '#1E63D6']}
            style={statusCard.statusCard}
          >
            <Text style={statusCard.statusTitle}>Immigration Canada</Text>
            <View style={statusCard.progressContainer}>
              <View style={statusCard.progressBar}>
                <View style={[statusCard.progressFill, { width: '72%' }]} />
              </View>
              <Text style={statusCard.progressPercent}>72%</Text>
            </View>
            <Text style={statusCard.statusSub}>Étape actuelle: Validation documents</Text>
          </LinearGradient>

          {/* ACTIONS CLIENT */}
          <Text style={styles.section}>Actions rapides</Text>
          <View style={styles.row}>
            <ActionCard
              title="Téléverser"
              icon={<Ionicons name="cloud-upload" size={24} color="#fff" />}
              color="#059669"
            />
            <ActionCard
              title="Prendre RDV"
              icon={<Ionicons name="calendar" size={24} color="#fff" />}
              color="#7C3AED"
            />
          </View>

          {/* ALERTES CLIENT */}
          <Text style={styles.section}>Alertes</Text>
          <View style={styles.row}>
            <AlertCard title="Documents manquants" value={3} color="yellow" />
            <AlertCard title="Paiement en cours" value={1} color="red" />
          </View>

        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" backgroundColor={Colors.primary} />

      {/* HEADER */}
      <LinearGradient
        colors={['#143FA8', '#1E63D6']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>TABLEAU DE BORD</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton} onPress={handleProjectsPress}>
              <Ionicons name="folder" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleNotificationsPress}>
              <Ionicons name="notifications" size={24} color="#fff" />
              {headerUnreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{headerUnreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* CONTENU PRO */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* KPI PRINCIPAUX */}
        <View style={styles.row}>
          <StatCard title="Clients actifs" value={data.stats.clients} percent={12} type="line" />
          <StatCard title="Dossiers" value={data.stats.dossiers} percent={8} type="bar" />
        </View>

        <View style={styles.row}>
          <StatCard title="Succès" value={data.stats.success} percent={3} type="circle" />
          <StatCard
            title="Revenus"
            value={formatRevenue(data.stats.revenue, (user as any)?.currency_code)}
            percent={15}
            type="line"
          />
        </View>

        {/* PERFORMANCE */}
        <Text style={styles.section}>Performance</Text>
        <View style={styles.row}>
          <StatCard title="Traités/mois" value={mockData.performance.processed} percent={20} type="bar" />
          <StatCard title="Temps moyen" value={`${mockData.performance.avgTime}`} percent={5} type="line" />
        </View>
        <View style={styles.row}>
          <StatCard title="Conversion" value={mockData.performance.conversion} percent={12} type="circle" />
          <StatCard title="Score qualité" value="A+" percent={8} type="bar" />
        </View>

        {/* ALERTES */}
        <Text style={styles.section}>Alertes ⚠️</Text>
        <View style={styles.row}>
          <AlertCard title="Dossiers en retard" value={data.alerts.late} color="red" />
          <AlertCard title="Paiements en cours" value={data.alerts.unpaid} color="yellow" />
        </View>
        <View style={styles.row}>
          <AlertCard title="Actions urgentes" value={mockData.alerts.urgent} color="red" />
          <AlertCard title="Messages non lus" value={7} color="orange" />
        </View>

        {/* ACTIONS RAPIDES */}
        <Text style={styles.section}>Actions rapides</Text>
        <View style={styles.row}>
          <ActionCard
            title="Nouveau dossier"
            icon={<Ionicons name="folder" size={24} color="#fff" />}
            color="#143FA8"
            onPress={handleNewFolder}
          />
          <ActionCard
            title="Ajouter document"
            icon={<Ionicons name="document" size={24} color="#fff" />}
            color="#059669"
            onPress={handleAddDocument}
          />
        </View>
        <View style={styles.row}>
          <ActionCard
            title="Envoyer message"
            icon={<Ionicons name="mail" size={24} color="#fff" />}
            color="#7C3AED"
            onPress={handleSendMessage}
          />
          <ActionCard
            title="Planifier RDV"
            icon={<Ionicons name="calendar" size={24} color="#fff" />}
            color="#DC2626"
            onPress={handlePlanRDV}
          />
        </View>

        {/* CLIENTS RÉCENTS */}
        <Text style={styles.section}>Clients récents</Text>
        {mockData.upcoming.map((client, index) => (
          <ClientItem key={index} {...client} />
        ))}

        {/* NOTIFICATIONS */}
        <Text style={styles.section}>Notifications</Text>
        <View style={styles.notificationsContainer}>
          {notifications.slice(0, 3).map((notification, index) => (
            <TouchableOpacity key={index} style={styles.notificationItem}>
              <View style={styles.notificationIcon}>
                <Ionicons
                  name={notification.type === 'urgent' ? 'warning' : 'information-circle'}
                  size={20}
                  color={notification.type === 'urgent' ? '#DC2626' : '#143FA8'}
                />
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* PÉRIODE SÉLECTEUR */}
        <View style={styles.periodSelector}>
          <Text style={styles.periodLabel}>Période:</Text>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'day' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('day')}
          >
            <Text style={styles.periodButtonText}>Aujourd'hui</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text style={styles.periodButtonText}>Semaine</Text>
          </TouchableOpacity>
        </View>

        {/* RAPPORT MENSUEL */}
        <Text style={styles.section}>Rapport mensuel</Text>
        <TouchableOpacity style={reportCard.reportCard} onPress={handleRapportMensuel}>
          <LinearGradient
            colors={['#143FA8', '#1E63D6']}
            style={reportCard.reportIcon}
          >
            <Ionicons name="bar-chart" size={24} color="#fff" />
          </LinearGradient>
          <View style={reportCard.reportInfo}>
            <Text style={reportCard.reportTitle}>Voir le rapport complet</Text>
            <Text style={reportCard.reportSub}>Performance du mois dernier</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
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
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },

  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },

  section: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    marginTop: 24,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  // Loading et Error styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },

  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 20,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 40,
  },

  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },

  retryButton: {
    backgroundColor: '#143FA8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },

  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Header notification badge styles
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },

  // Notifications styles
  notificationsContainer: {
    marginBottom: 20,
  },

  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  notificationIcon: {
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  notificationContent: {
    flex: 1,
  },

  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },

  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },

  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // Period selector styles
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  periodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 16,
  },

  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },

  periodButtonActive: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#143FA8',
  },

  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
});

// Card Styles
const cardStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 6,
    height: 140,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  title: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
    fontWeight: '600',
  },

  value: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },

  percent: {
    color: '#00FF9D',
    fontSize: 12,
    fontWeight: '600',
  },

  // Circle
  circle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 5,
    borderColor: '#4DA6FF',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 4,
  },

  circleText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Line Chart
  lineChart: {
    height: 40,
    position: 'relative',
    justifyContent: 'center',
  },

  lineCurve: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    position: 'absolute',
    top: '50%',
    left: '10%',
    right: '10%',
    transform: [{ skewY: '-5deg' }],
  },

  linePoints: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: '10%',
  },

  point: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
  },

  // Bar Chart
  barChart: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: '10%',
  },

  bar: {
    width: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 2,
  },
});

// Alert Styles
const alertStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 6,
    height: 100,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  icon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  value: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  action: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
    textAlign: 'center',
  },
});

// Action Styles
const actionStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
});

// Client Styles
const clientStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },

  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3A8A',
  },

  info: {
    flex: 1,
  },

  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },

  step: {
    fontSize: 14,
    color: '#6B7280',
  },

  arrow: {
    padding: 8,
  },
});

// Status Card
const statusCard = StyleSheet.create({
  statusCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },

  progressContainer: {
    marginBottom: 12,
  },

  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginBottom: 8,
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#00FF9D',
    borderRadius: 4,
  },

  progressPercent: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'right',
  },

  statusSub: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

// Report Card
const reportCard = StyleSheet.create({
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

  reportIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },

  reportInfo: {
    flex: 1,
  },

  reportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },

  reportSub: {
    fontSize: 14,
    color: '#6B7280',
  },r
});
