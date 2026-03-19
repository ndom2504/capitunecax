import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "../constants/Colors";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get("window");
const cardWidth = (width - 60) / 2; // 2 colonnes avec marges

interface MenuItem {
  label: string;
  iconSource: any;
  route: string;
  userType?: 'client' | 'pro' | 'both';
}

export default function IconMenu() {
  const router = useRouter();
  const { user } = useAuth();
  const isPro = user?.account_type === 'pro';

  // Menu items avec vos icônes personnalisées
  const menuItems: MenuItem[] = [
    {
      label: "Dashboard",
      iconSource: require("../assets/icons/icons.png"),
      route: "/(tabs)/dashboard",
      userType: 'both'
    },
    {
      label: "Projet",
      iconSource: require("../assets/icons/icons.png"),
      route: "/(tabs)/projet",
      userType: 'both'
    },
    {
      label: "Inside",
      iconSource: require("../assets/icons/icons.png"),
      route: "/(tabs)/inside",
      userType: 'both'
    },
    {
      label: "Documents",
      iconSource: require("../assets/icons/icons.png"),
      route: "/(tabs)/documents",
      userType: 'both'
    },
    {
      label: "Messagerie",
      iconSource: require("../assets/icons/icons.png"),
      route: "/(tabs)/messagerie",
      userType: 'both'
    },
    {
      label: "Conseillers",
      iconSource: require("../assets/icons/icons.png"),
      route: "/(tabs)/conseillers",
      userType: 'client'
    },
    {
      label: "Paiements",
      iconSource: require("../assets/icons/icons.png"),
      route: "/(tabs)/paiements",
      userType: 'client'
    },
    {
      label: "Carrière",
      iconSource: require("../assets/icons/icons.png"),
      route: "/(tabs)/carriere",
      userType: 'pro'
    },
    {
      label: "Profil",
      iconSource: require("../assets/icons/icons.png"),
      route: "/(tabs)/profil",
      userType: 'both'
    }
  ];

  // Filtrer les items selon le type d'utilisateur
  const filteredItems = menuItems.filter(item => 
    item.userType === 'both' || 
    (isPro && item.userType === 'pro') || 
    (!isPro && item.userType === 'client')
  );

  const handlePress = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenue sur CAPITUNE</Text>
      <Text style={styles.subtitle}>
        {isPro ? "Espace Professionnel" : "Espace Client"}
      </Text>

      <View style={styles.grid}>
        {filteredItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => handlePress(item.route)}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <Image
                source={item.iconSource}
                style={styles.icon}
              />
            </View>
            <Text style={styles.label}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgLight,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
    color: Colors.text,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 30,
    textAlign: "center",
    color: Colors.textSecondary,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: cardWidth,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    alignItems: "center",
    elevation: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: Colors.bgLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  icon: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
  },
});
