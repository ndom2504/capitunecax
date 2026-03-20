import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function DashboardScreen() {
  const navigation = useNavigation();

  const menuItems = [
    { label: "DASHBOARD", icon: require('../assets/icons/dashboard.png'), screen: "Dashboard" },
    { label: "PROJET", icon: require('../assets/icons/projet.png'), screen: "Projet" },
    { label: "INSIDE", subLabel: "(Communauté Capitune)", icon: require('../assets/icons/inside.png'), screen: "Inside" },
    { label: "DOCUMENTS", icon: require('../assets/icons/documents.png'), screen: "Documents" },
    { label: "RENCONTRE", icon: require('../assets/icons/rencontre.png'), screen: "Rencontre" },
    { label: "PROFIL", icon: require('../assets/icons/profil.png'), screen: "Profil" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Tableau de Bord</Text>
        
        <View style={styles.grid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.card}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              <Image source={item.icon} style={styles.icon} />
              <Text style={styles.label}>{item.label}</Text>
              {item.subLabel && <Text style={styles.subLabel}>{item.subLabel}</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#003366', // Le bleu de vos icônes
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingVertical: 25,
    paddingHorizontal: 10,
    marginBottom: 20,
    alignItems: 'center',
    // Ombre pour iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Ombre pour Android
    elevation: 3,
  },
  icon: {
    width: 65,
    height: 65,
    resizeMode: 'contain',
    marginBottom: 15,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#003366',
    textAlign: 'center',
  },
  subLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  }
});
