import { Stack } from 'expo-router';
import { CapiProvider } from '../../context/CapiContext';

export default function CapiLayout() {
  return (
    <CapiProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </CapiProvider>
  );
}
