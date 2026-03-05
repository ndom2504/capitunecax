import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  const listRef = useRef<FlatList<TeamMember>>(null);

  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const cardW = useMemo(() => Math.min(SCREEN_W - 32, 420), []);
  const sidePad = useMemo(() => Math.max(16, (SCREEN_W - cardW) / 2), [cardW]);

  const load = async () => {
    setLoading(true);
    try {
      if (!token) {
        setTeam([]);
        return;
      }
      const res = await teamApi.list(token);
      const list = res.data?.team ?? [];
      setTeam(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

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
          ref={listRef}
          data={team}
          keyExtractor={(m) => m.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: sidePad }}
          snapToAlignment="start"
          decelerationRate="fast"
          onMomentumScrollEnd={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            const idx = Math.round(x / cardW);
            setActiveIndex(Math.max(0, Math.min(team.length - 1, idx)));
          }}
          renderItem={({ item }) => {
            const src = getAvatarSource(item.avatar_key);
            return (
              <View style={[styles.card, { width: cardW }]}>
                <View style={styles.photoWrap}>
                  {src ? (
                    <Image source={src} style={styles.photo} resizeMode="cover" />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Text style={styles.photoInitial}>{(item.name?.[0] ?? 'C').toUpperCase()}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.name}>{item.name}</Text>
                  {!!item.location && (
                    <View style={styles.metaRow}>
                      <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                      <Text style={styles.metaText}>{item.location}</Text>
                    </View>
                  )}
                  {!!item.pro_experience_years && (
                    <View style={styles.metaRow}>
                      <Ionicons name="school-outline" size={14} color={Colors.textMuted} />
                      <Text style={styles.metaText}>{item.pro_experience_years} ans d'expérience</Text>
                    </View>
                  )}

                  {!!item.bio && <Text style={styles.bio}>{item.bio}</Text>}

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.contactBtn}
                      activeOpacity={0.85}
                      onPress={() => router.push({
                        pathname: '/(tabs)/messagerie',
                        params: {
                          advisorName: item.name,
                          advisorAvatarKey: item.avatar_key,
                          prefill: '1',
                        },
                      } as any)}
                    >
                      <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
                      <Text style={styles.contactText}>Contacter</Text>
                    </TouchableOpacity>
                  </View>
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

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginHorizontal: 0,
    ...UI.cardShadow,
  },
  photoWrap: { height: 250, backgroundColor: Colors.offWhite },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  photoInitial: { fontSize: 46, fontWeight: '900', color: Colors.white },
  cardBody: { padding: 16, gap: 8 },
  name: { fontSize: 18, fontWeight: '900', color: Colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  bio: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginTop: 4 },

  actionsRow: { flexDirection: 'row', marginTop: 10 },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.orange,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flex: 1,
  },
  contactText: { color: Colors.white, fontSize: 14, fontWeight: '900' },
});
