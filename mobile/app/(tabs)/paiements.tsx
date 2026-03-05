import { Redirect } from 'expo-router';

export default function PaiementsScreen() {
  // La page Paiements n'est plus utilisée : les paiements sont intégrés dans "Mon Projet".
  return <Redirect href="/(tabs)/projet" />;
}
