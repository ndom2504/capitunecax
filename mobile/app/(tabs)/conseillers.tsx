import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../constants/Colors';
import { UI } from '../../constants/UI';
import { useAuth } from '../../context/AuthContext';
import { getAvatarSource } from '../../lib/avatar';
import { teamApi, type TeamMember } from '../../lib/api';

const { width: SCREEN_W } = Dimensions.get('window');

export default function ConseillersScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const listRef = useRef<FlatList<TeamMember> | null>(null);

  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const load = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      if (!token) {
        setTeam([]);
        return;
      }
      const res = await teamApi.list(token);
      const list = res.data?.team ?? [];
      setTeam(list);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      // refresh silencieux au retour sur l'écran
      load(false);
    }, [load]),
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [team.length]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.85}
          onPress={() => {
            const canGoBack = (router as any)?.canGoBack?.();
            if (canGoBack) {
              router.back();
              return;
            }
            router.replace('/(tabs)/dashboard' as any);
          }}
          accessibilityLabel="Retour"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={18} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Trouvez votre conseiller</Text>
          <Text style={styles.subtitle}>Swipez pour voir les profils</Text>
        </View>
        <Text style={styles.counter}>{team.length ? `${activeIndex + 1}/${team.length}` : ''}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.orange} style={{ marginTop: 50 }} />
      ) : team.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="people-outline" size={38} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Aucun profil disponible</Text>
          <Text style={styles.emptySub}>Connectez-vous pour voir les conseillers.</Text>
        </View>
      ) : (
        <FlatList
          ref={(r) => {
            listRef.current = r;
          }}
          data={team}
          keyExtractor={(m) => m.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          decelerationRate="fast"
          snapToInterval={SCREEN_W}
          snapToAlignment="start"
          disableIntervalMomentum
          onMomentumScrollEnd={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            const idx = Math.round(x / SCREEN_W);
            setActiveIndex(Math.max(0, Math.min(team.length - 1, idx)));
          }}
          onScrollToIndexFailed={() => {}}
          extraData={activeIndex}
          renderItem={({ item }) => {
            const src = getAvatarSource(item.avatar_key);
            const services = Array.isArray(item.pro_services) ? item.pro_services.filter(Boolean) : [];
            const shown = services.slice(0, 3);
            const extra = Math.max(0, services.length - shown.length);
            const initials = String(item.name ?? 'C')
              .trim()
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0])
              .join('')
              .toUpperCase();

            const openMessages = () =>
              router.push({
                pathname: '/(tabs)/messagerie',
                params: {
                  advisorName: item.name,
                  advisorAvatarKey: item.avatar_key,
                  prefill: '1',
                },
              } as any);

            const handlePrev = () => {
              if (activeIndex <= 0) return;
              const nextIndex = activeIndex - 1;
              setActiveIndex(nextIndex);
              (listRef.current as any)?.scrollToIndex?.({ index: nextIndex, animated: true });
            };

            const handleNext = () => {
              if (activeIndex >= team.length - 1) return;
              const nextIndex = activeIndex + 1;
              setActiveIndex(nextIndex);
              (listRef.current as any)?.scrollToIndex?.({ index: nextIndex, animated: true });
            };

            return (
              <View style={[styles.story, { width: SCREEN_W }]}
              >
                {src ? (
                  <Image source={src} style={styles.storyBg} />
                ) : (
                  <View style={[styles.storyBgFallback]}>
                    <Text style={styles.storyBgInitial}>{initials}</Text>
                  </View>
                )}

                <View style={styles.storyShade} pointerEvents="none" />

                <View style={styles.storyTop}>
                  <View style={styles.storyProgress}>
                    {team.map((m, i) => (
                      <View
                        key={m.id}
                        style={[styles.storyBar, i === activeIndex && styles.storyBarActive]}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.storyContent}>
                  <View style={styles.storyHeaderRow}>
                    <View style={styles.storyAvatar}>
                      {src ? (
                        <Image source={src} style={styles.storyAvatarImg} />
                      ) : (
                        <View style={styles.storyAvatarFallback}>
                          <Text style={styles.storyAvatarInitial}>{initials}</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.storyName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.storyTitle} numberOfLines={1}>
                        {item.pro_diploma ? item.pro_diploma : 'Conseiller Pro CAPITUNE'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.storyContactIconBtn}
                      activeOpacity={0.85}
                      onPress={openMessages}
                      accessibilityLabel="Contacter"
                    >
                      <Ionicons name="chatbubble-ellipses" size={18} color={Colors.surface} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.storyMetaRow}>
                    {!!item.location && (
                      <View style={styles.storyMetaItem}>
                        <Ionicons name="location-outline" size={13} color={Colors.surface} />
                        <Text style={styles.storyMetaText} numberOfLines={1}>{item.location}</Text>
                      </View>
                    )}
                    {!!item.pro_experience_years && (
                      <View style={styles.storyMetaItem}>
                        <Ionicons name="time-outline" size={13} color={Colors.surface} />
                        <Text style={styles.storyMetaText}>{item.pro_experience_years} ans</Text>
                      </View>
                    )}
                  </View>

                  {!!item.bio && (
                    <Text style={styles.storyBio} numberOfLines={4}>{item.bio}</Text>
                  )}

                  {(shown.length > 0 || extra > 0) && (
                    <View style={styles.storyTags}>
                      {shown.map((s, i) => (
                        <View key={`${item.id}-tag-${i}`} style={styles.storyTag}>
                          <Text style={styles.storyTagText} numberOfLines={1}>{s}</Text>
                        </View>
                      ))}
                      {extra > 0 && (
                        <View style={styles.storyTag}>
                          <Text style={styles.storyTagText}>+{extra}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  <TouchableOpacity style={styles.storyContactBtn} activeOpacity={0.85} onPress={openMessages}>
                    <Ionicons name="chatbubble-ellipses" size={18} color={Colors.surface} />
                    <Text style={styles.storyContactText}>Contacter</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.storyNav} pointerEvents="box-none">
                  <TouchableOpacity
                    style={styles.storyNavLeft}
                    activeOpacity={1}
                    onPress={handlePrev}
                    accessibilityLabel="Profil précédent"
                  />
                  <TouchableOpacity
                    style={styles.storyNavRight}
                    activeOpacity={1}
                    onPress={handleNext}
                    accessibilityLabel="Profil suivant"
                  />
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgLight },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  title: { fontSize: 20, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  counter: { fontSize: 12, color: Colors.textMuted, marginTop: 10 },

  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingTop: 90, paddingHorizontal: 32, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  emptySub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },

  story: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
  },
  storyBg: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, resizeMode: 'cover' },
  storyBgFallback: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: Colors.primary },
  storyBgInitial: { color: Colors.surface, fontSize: 64, fontWeight: '900', alignSelf: 'center', marginTop: 120 },
  storyShade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: Colors.primaryDark + 'B3' },

  storyTop: { paddingTop: 8, paddingHorizontal: 10 },
  storyProgress: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  storyBar: { flex: 1, height: 3, borderRadius: 3, backgroundColor: Colors.surface + '33' },
  storyBarActive: { backgroundColor: Colors.orange },

  storyContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 18,
    paddingTop: 14,
    gap: 10,
  },
  storyHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  storyAvatar: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', backgroundColor: Colors.offWhite },
  storyAvatarImg: { width: '100%', height: '100%' },
  storyAvatarFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary },
  storyAvatarInitial: { fontSize: 15, fontWeight: '900', color: Colors.white },

  storyName: { fontSize: 16, fontWeight: '900', color: Colors.surface },
  storyTitle: { fontSize: 12, color: Colors.surface + 'CC', marginTop: 2, fontWeight: '700' },
  storyContactIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    ...UI.cardShadow,
  },

  storyMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  storyMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '75%' },
  storyMetaText: { fontSize: 12, color: Colors.surface + 'CC', fontWeight: '700' },
  storyBio: { fontSize: 13, color: Colors.surface, lineHeight: 19, fontWeight: '600' },

  storyTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  storyTag: { backgroundColor: Colors.surface + '22', borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12 },
  storyTagText: { fontSize: 11, color: Colors.surface, fontWeight: '700', maxWidth: 220 },

  storyContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.orange,
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginTop: 4,
    ...UI.cardShadow,
  },
  storyContactText: { color: Colors.surface, fontSize: 14, fontWeight: '900' },

  storyNav: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 140, flexDirection: 'row' },
  storyNavLeft: { flex: 1 },
  storyNavRight: { flex: 1 },
});
