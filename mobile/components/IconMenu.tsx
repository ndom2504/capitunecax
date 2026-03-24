import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function IconMenu() {
  const router = useRouter();

  // Liste des icônes avec les nouveaux noms de fichiers découpés
  const menuItems = [
    { label: "DASHBOARD", icon: require('../assets/icons/dashboard.png'), route: "/(tabs)/dashboard" },
    { label: "PROJET", icon: require('../assets/icons/projet.png'), route: "/(tabs)/projet" },
    { label: "INSIDE", subLabel: "(Communauté Capitune)", icon: require('../assets/icons/inside.png'), route: "/(tabs)/inside" },
    { label: "DOCUMENTS", icon: require('../assets/icons/documents.png'), route: "/(tabs)/documents" },
    { label: "RENCONTRE", icon: require('../assets/icons/rencontre.png'), route: "/(tabs)/rencontre" },
    { label: "PROFIL", icon: require('../assets/icons/profil.png'), route: "/(tabs)/profil" },
  ];

  return (
    <View style={styles.grid}>
      {menuItems.map((item, index) => (
        <TouchableOpacity 
          key={index} 
          style={styles.card}
          onPress={() => router.push(item.route as any)}
          activeOpacity={0.7}
        >
          <Image source={item.icon} style={styles.icon} />
          <Text style={styles.label}>{item.label}</Text>
          {item.subLabel && <Text style={styles.subLabel}>{item.subLabel}</Text>}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  card: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 25,
    paddingHorizontal: 10,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 3, // Ombre Android
    shadowColor: '#000', // Ombre iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  icon: {
    width: 65,
    height: 65,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#003366', // Le bleu de vos icônes
    textAlign: 'center',
  },
  subLabel: {
    fontSize: 9,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
});
