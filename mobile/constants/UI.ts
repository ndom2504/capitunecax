import { Platform, type ViewStyle } from 'react-native';
import { Colors } from './Colors';

const cardShadowIOS: ViewStyle = {
  shadowColor: Colors.shadow,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
};

const cardShadowAndroid: ViewStyle = {
  elevation: 2,
};

export const UI = {
  cardBorder: {
    borderWidth: 1,
    borderColor: Colors.border,
  } satisfies ViewStyle,

  cardShadow: (Platform.OS === 'ios'
    ? cardShadowIOS
    : Platform.OS === 'android'
      ? cardShadowAndroid
      : {}) satisfies ViewStyle,

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...(Platform.OS === 'ios'
      ? cardShadowIOS
      : Platform.OS === 'android'
        ? cardShadowAndroid
        : {}),
  } satisfies ViewStyle,

  cardLg: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    ...(Platform.OS === 'ios'
      ? cardShadowIOS
      : Platform.OS === 'android'
        ? cardShadowAndroid
        : {}),
  } satisfies ViewStyle,
} as const;
