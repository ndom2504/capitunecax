// ─────────────────────────────────────────────────────────────────────────────
// CapiAvatar — Avatar animé de l'agent CAPI
// ─────────────────────────────────────────────────────────────────────────────
// États :
//   idle      → légère respiration (float)
//   thinking  → halo pulsant orange
//   speaking  → glow lumineux alternatif
//   completed → flash vert + scale up
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, View, StyleSheet } from 'react-native';

// Image locale (require statique)
const AGENT_IMAGE = require('../assets/agent-capi.png');

export type CapiAvatarState = 'idle' | 'thinking' | 'speaking' | 'completed';

interface Props {
  state?: CapiAvatarState;
  size?: number;
}

export function CapiAvatar({ state = 'idle', size = 44 }: Props) {
  // Animations
  const floatY   = useRef(new Animated.Value(0)).current;
  const scale    = useRef(new Animated.Value(1)).current;
  const haloScale = useRef(new Animated.Value(1)).current;
  const haloOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const completedScale = useRef(new Animated.Value(1)).current;

  // ── Arrêt propre de toutes les animations ──────────────────────────────────
  const stopAll = () => {
    floatY.stopAnimation();
    scale.stopAnimation();
    haloScale.stopAnimation();
    haloOpacity.stopAnimation();
    glowOpacity.stopAnimation();
    completedScale.stopAnimation();
    // Reset valeurs silencieuses
    haloOpacity.setValue(0);
    glowOpacity.setValue(0);
  };

  // ── IDLE : respiration douce ───────────────────────────────────────────────
  const startIdle = () => {
    stopAll();
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(floatY, { toValue: -5, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(scale,  { toValue: 1.04, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(floatY, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(scale,  { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ]),
    ).start();
  };

  // ── THINKING : halo pulsant ────────────────────────────────────────────────
  const startThinking = () => {
    stopAll();
    haloOpacity.setValue(0.7);
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(haloScale,   { toValue: 1.55, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(haloOpacity, { toValue: 0,    duration: 900, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(haloScale,   { toValue: 1,    duration: 0, useNativeDriver: true }),
          Animated.timing(haloOpacity, { toValue: 0.7,  duration: 0, useNativeDriver: true }),
        ]),
        Animated.delay(300),
      ]),
    ).start();
    // Légère respiration toujours active
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -3, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0,  duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
  };

  // ── SPEAKING : glow alternatif ─────────────────────────────────────────────
  const startSpeaking = () => {
    stopAll();
    haloOpacity.setValue(0.55);
    haloScale.setValue(1.2);
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      ]),
    ).start();
    // halo fixe visible
    Animated.loop(
      Animated.sequence([
        Animated.timing(haloScale, { toValue: 1.3, duration: 700, useNativeDriver: true }),
        Animated.timing(haloScale, { toValue: 1.15, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(haloOpacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(haloOpacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  };

  // ── COMPLETED : flash vert ─────────────────────────────────────────────────
  const startCompleted = () => {
    stopAll();
    Animated.sequence([
      Animated.timing(completedScale, { toValue: 1.18, duration: 200, useNativeDriver: true }),
      Animated.timing(completedScale, { toValue: 0.95, duration: 150, useNativeDriver: true }),
      Animated.timing(completedScale, { toValue: 1.08, duration: 150, useNativeDriver: true }),
      Animated.timing(completedScale, { toValue: 1,    duration: 200, useNativeDriver: true }),
    ]).start(() => {
      // Après le flash → idle tranquille
      startIdle();
    });
  };

  // ── Démarrage selon état ───────────────────────────────────────────────────
  useEffect(() => {
    switch (state) {
      case 'idle':      startIdle();      break;
      case 'thinking':  startThinking();  break;
      case 'speaking':  startSpeaking();  break;
      case 'completed': startCompleted(); break;
    }
    return () => stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // ── Couleurs halo selon état ───────────────────────────────────────────────
  const haloColor = state === 'completed' ? '#22c55e' : '#e87722';

  const imgSize   = size;
  const haloSize  = size * 1.6;
  const offset    = -(haloSize - imgSize) / 2;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { width: imgSize, height: imgSize },
        { transform: [{ translateY: floatY }, { scale: state === 'completed' ? completedScale : scale }] },
      ]}
    >
      {/* Halo pulsant / glow */}
      <Animated.View
        style={[
          styles.halo,
          {
            width: haloSize,
            height: haloSize,
            borderRadius: haloSize / 2,
            backgroundColor: haloColor + '40',
            top: offset,
            left: offset,
            transform: [{ scale: haloScale }],
            opacity: haloOpacity,
          },
        ]}
      />

      {/* Glow speaking (bordure lumineuse) */}
      {state === 'speaking' && (
        <Animated.View
          style={[
            styles.glowRing,
            {
              width: imgSize + 8,
              height: imgSize + 8,
              borderRadius: (imgSize + 8) / 2,
              top: -4,
              left: -4,
              opacity: glowOpacity,
              borderColor: '#e87722',
              borderWidth: 3,
            },
          ]}
        />
      )}

      {/* Badge état */}
      {state === 'completed' && (
        <View style={[styles.badge, { right: -2, bottom: -2 }]}>
          <Animated.Text style={styles.badgeText}>✓</Animated.Text>
        </View>
      )}
      {state === 'thinking' && (
        <View style={[styles.badge, styles.badgeThinking, { right: -2, bottom: -2 }]}>
          <Animated.Text style={styles.badgeText}>…</Animated.Text>
        </View>
      )}

      {/* Image agent */}
      <Image
        source={AGENT_IMAGE}
        style={[
          styles.img,
          {
            width: imgSize,
            height: imgSize,
            borderRadius: imgSize / 2,
          },
        ]}
        resizeMode="cover"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  halo: {
    position: 'absolute',
  },
  glowRing: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  img: {
    zIndex: 2,
  },
  badge: {
    position: 'absolute',
    zIndex: 3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeThinking: {
    backgroundColor: '#e87722',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 14,
  },
});

export default CapiAvatar;
