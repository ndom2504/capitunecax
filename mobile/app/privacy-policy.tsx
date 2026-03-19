import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { UI } from '../constants/UI';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Politique de Confidentialité</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>1. Collecte des informations</Text>
          <Text style={styles.sectionText}>
            CAPITUNE collecte les informations nécessaires pour fournir nos services de consultation en immigration canadienne. Ces informations incluent :
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Nom, adresse email et coordonnées</Text>
            <Text style={styles.listItem}>• Informations sur votre projet d'immigration</Text>
            <Text style={styles.listItem}>• Données de connexion et d'utilisation</Text>
            <Text style={styles.listItem}>• Documents partagés pour votre dossier</Text>
          </View>

          <Text style={styles.sectionTitle}>2. Utilisation des données</Text>
          <Text style={styles.sectionText}>
            Vos informations sont utilisées exclusivement pour :
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Fournir des services de consultation personnalisés</Text>
            <Text style={styles.listItem}>• Gérer votre dossier d'immigration</Text>
            <Text style={styles.listItem}>• Communiquer avec vous concernant votre projet</Text>
            <Text style={styles.listItem}>• Améliorer nos services</Text>
          </View>

          <Text style={styles.sectionTitle}>3. Protection des données</Text>
          <Text style={styles.sectionText}>
            CAPITUNE s'engage à protéger vos informations personnelles :
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Chiffrement des données sensibles</Text>
            <Text style={styles.listItem}>• Accès sécurisé via authentification</Text>
            <Text style={styles.listItem}>• Sauvegarde régulière des informations</Text>
            <Text style={styles.listItem}>• Respect des normes de sécurité canadiennes</Text>
          </View>

          <Text style={styles.sectionTitle}>4. Partage des informations</Text>
          <Text style={styles.sectionText}>
            CAPITUNE ne partage vos informations personnelles qu'avec :
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Les autorités canadiennes (avec votre consentement)</Text>
            <Text style={styles.listItem}>• Nos partenaires de service (strictement nécessaire)</Text>
            <Text style={styles.listItem}>• En cas d'obligation légale</Text>
          </View>

          <Text style={styles.sectionTitle}>5. Vos droits</Text>
          <Text style={styles.sectionText}>
            Vous avez le droit de :
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Accéder à vos informations personnelles</Text>
            <Text style={styles.listItem}>• Modifier vos données</Text>
            <Text style={styles.listItem}>• Supprimer votre compte</Text>
            <Text style={styles.listItem}>• Limiter l'utilisation de vos données</Text>
          </View>

          <Text style={styles.sectionTitle}>6. Conservation des données</Text>
          <Text style={styles.sectionText}>
            Vos informations sont conservées selon les exigences légales canadiennes et les besoins de votre dossier. Les données non nécessaires sont supprimées régulièrement.
          </Text>

          <Text style={styles.sectionTitle}>7. Cookies et technologies</Text>
          <Text style={styles.sectionText}>
            CAPITUNE utilise des cookies et technologies similaires pour améliorer votre expérience utilisateur. Vous pouvez gérer ces préférences dans les paramètres de votre appareil.
          </Text>

          <Text style={styles.sectionTitle}>8. Modifications de la politique</Text>
          <Text style={styles.sectionText}>
            CAPITUNE peut modifier cette politique de confidentialité. Les changements seront communiqués via l'application ou par email.
          </Text>

          <Text style={styles.sectionTitle}>9. Contact</Text>
          <Text style={styles.sectionText}>
            Pour toute question concernant cette politique de confidentialité :
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Email : equipe@capitune.com</Text>
            <Text style={styles.listItem}>• Site web : www.capitune.com</Text>
            <Text style={styles.listItem}>• Téléphone : (disponible dans l'application)</Text>
          </View>

          <Text style={styles.sectionTitle}>10. Loi applicable</Text>
          <Text style={styles.sectionText}>
            Cette politique est régie par la législation canadienne, notamment la Loi sur la protection des renseignements personnels et les documents électroniques (LPRPDE).
          </Text>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Dernière mise à jour : 18 mars 2026
            </Text>
            <Text style={styles.footerText}>
              © 2026 CAPITUNE - Tous droits réservés
            </Text>
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
  scroll: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.text,
    marginBottom: 12,
  },
  list: {
    marginLeft: 16,
    marginBottom: 12,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    marginBottom: 4,
  },
  footer: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
});
