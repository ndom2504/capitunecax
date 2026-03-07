import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { UI } from '../constants/UI';

type Props = {
  onPress: () => void;
};

export function CapiHelpFab({ onPress }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View
        pointerEvents="box-none"
        style={[
          styles.wrap,
          {
            right: 16,
            bottom: 16 + Math.max(0, insets.bottom),
          },
        ]}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Poser une question à CAPI"
          onPress={onPress}
          activeOpacity={0.85}
          style={styles.fab}
        >
          <Ionicons name="chatbubble-ellipses" size={22} color={Colors.surface} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    ...UI.cardShadow,
  },
});
