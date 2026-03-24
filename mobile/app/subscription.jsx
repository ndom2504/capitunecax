import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

export default function SubscriptionScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);

  const plans = {
    monthly: {
      price: '$29.99',
      period: '/mois',
      yearly: '$359.88',
      description: 'Sans engagement',
      savings: '',
    },
    yearly: {
      price: '$24.99',
      period: '/mois',
      yearly: '$299.88',
      description: 'Facturé annuellement',
      savings: 'Économisez $60',
    },
  };

  const features = [
    { icon: 'person', title: 'Accès conseiller', description: 'Expert dédié à votre dossier' },
    { icon: 'chatbubble', title: 'Messagerie illimitée', description: 'Communication directe 24/7' },
    { icon: 'document-text', title: 'Validation documents', description: 'Review et corrections expertes' },
    { icon: 'analytics', title: 'Suivi personnalisé', description: 'Tableau de bord en temps réel' },
    { icon: 'shield-checkmark', title: 'Garantie de service', description: 'Support prioritaire garanti' },
    { icon: 'calendar', title: 'RDV prioritaires', description: 'Créneaux réservés' },
  ];

  const handleSubscribe = async () => {
    setLoading(true);
    
    try {
      // TODO: Implement payment processing
      console.log('Processing subscription:', selectedPlan);
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Abonnement activé !',
        'Bienvenue dans le mode Professionnel. Vous pouvez maintenant contacter votre conseiller.',
        [
          {
            text: 'Commencer',
            onPress: () => router.push('/team')
          }
        ]
      );
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert('Erreur', 'Impossible de traiter votre abonnement. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={[Colors.primary, Colors.dark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>🔒 Débloquez l\'Accompagnement</Text>
            <Text style={styles.headerSubtitle}>Mode Professionnel</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Value Proposition */}
        <View style={styles.valueSection}>
          <View style={styles.valueIcon}>
            <Ionicons name="rocket" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.valueTitle}>Passez au niveau supérieur</Text>
          <Text style={styles.valueDescription}>
            Accédez à un accompagnement personnalisé par un expert de l'immigration
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>✅ Ce que vous débloquez</Text>
          <View style={styles.featuresList}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon as any} size={20} color={Colors.primary} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.pricingSection}>
          <Text style={styles.pricingTitle}>💰 Choisissez votre formule</Text>
          
          <View style={styles.plansContainer}>
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'monthly' && styles.planCardSelected
              ]}
              onPress={() => setSelectedPlan('monthly')}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planName}>Mensuel</Text>
                {selectedPlan === 'monthly' && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedText}>Sélectionné</Text>
                  </View>
                )}
              </View>
              <View style={styles.planPricing}>
                <Text style={styles.planPrice}>{plans.monthly.price}</Text>
                <Text style={styles.planPeriod}>{plans.monthly.period}</Text>
              </View>
              <Text style={styles.planDescription}>{plans.monthly.description}</Text>
              <Text style={styles.planYearly}>Total: {plans.monthly.yearly}/an</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'yearly' && styles.planCardSelected
              ]}
              onPress={() => setSelectedPlan('yearly')}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planName}>Annuel</Text>
                {selectedPlan === 'yearly' && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedText}>Sélectionné</Text>
                  </View>
                )}
              </View>
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsText}>{plans.yearly.savings}</Text>
              </View>
              <View style={styles.planPricing}>
                <Text style={styles.planPrice}>{plans.yearly.price}</Text>
                <Text style={styles.planPeriod}>{plans.yearly.period}</Text>
              </View>
              <Text style={styles.planDescription}>{plans.yearly.description}</Text>
              <Text style={styles.planYearly}>Total: {plans.yearly.yearly}/an</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Trust Elements */}
        <View style={styles.trustSection}>
          <View style={styles.trustItem}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
            <Text style={styles.trustText}>Annulation à tout moment</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="lock-closed" size={20} color={Colors.success} />
            <Text style={styles.trustText}>Paiement sécurisé</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="headset" size={20} color={Colors.success} />
            <Text style={styles.trustText}>Support 24/7</Text>
          </View>
        </View>

        {/* CTA Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.subscribeButton}
            onPress={handleSubscribe}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.subscribeButtonText}>Traitement en cours...</Text>
            ) : (
              <>
                <Ionicons name="card" size={20} color="white" />
                <Text style={styles.subscribeButtonText}>
                  S'abonner et continuer ({plans[selectedPlan].price}{plans[selectedPlan].period})
                </Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Peut-être plus tard</Text>
          </TouchableOpacity>
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  valueSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  valueIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  valueTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  valueDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresSection: {
    padding: 20,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  pricingSection: {
    padding: 20,
  },
  pricingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  planCardSelected: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  selectedBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  savingsBadge: {
    position: 'absolute',
    top: -8,
    right: 20,
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  planPeriod: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  planDescription: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  planYearly: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trustText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginLeft: 8,
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  cancelButton: {
    alignItems: 'center',
    padding: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    color: Colors.textMuted,
    fontWeight: '600',
  },
});
