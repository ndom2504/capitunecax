import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';
import { Colors } from '../constants/Colors';
import { CapiAvatar, type CapiAvatarState } from './CapiAvatar';

type Props = {
  text: string;
  onPress?: (() => void) | undefined;
  avatarState?: CapiAvatarState;
  avatarSize?: number;
  style?: ViewStyle | ViewStyle[];
};

export function CapiOrientationBubble({
  text,
  onPress,
  avatarState = 'idle',
  avatarSize = 38,
  style,
}: Props) {
  return (
    <View style={[styles.row, style]}>
      <CapiAvatar size={avatarSize} state={avatarState} />
      {onPress ? (
        <TouchableOpacity style={styles.bubble} onPress={onPress} activeOpacity={0.85}>
          <Text style={styles.text}>{text}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.bubble}>
          <Text style={styles.text}>{text}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
  },
  bubble: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  text: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
});
