import React, { useEffect, useState } from 'react';
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

  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const cardW = Math.min(SCREEN_W - 32, 440);
  const cardGap = 12;
  const sidePad = Math.max(16, (SCREEN_W - cardW) / 2);

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
          data={team}
          keyExtractor={(m) => m.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={cardW + cardGap}
          snapToAlignment="start"
          disableIntervalMomentum
          contentContainerStyle={{ paddingHorizontal: sidePad }}
          ItemSeparatorComponent={() => <View style={{ width: cardGap }} />}
          onMomentumScrollEnd={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            const idx = Math.round(x / (cardW + cardGap));
            setActiveIndex(Math.max(0, Math.min(team.length - 1, idx)));
          }}
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
            return (
              <View style={[styles.card, { width: cardW }]}>
                <View style={styles.cardTopRow}>
                  <View style={styles.avatarWrap}>
                    {src ? (
                      <Image source={src} style={styles.avatarImg} />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarInitial}>{initials}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardTopText}>
                    <Text style={styles.name}>{item.name}</Text>
                    {!!item.pro_diploma ? (
                      <Text style={styles.titleLine} numberOfLines={1}>{item.pro_diploma}</Text>
                    ) : (
                      <Text style={styles.titleLine} numberOfLines={1}>Conseiller Pro CAPITUNE</Text>
                    )}
                    <View style={styles.metaRow}>
                      {!!item.location && (
                        <View style={styles.metaItem}>
                          <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
                          <Text style={styles.metaText} numberOfLines={1}>{item.location}</Text>
                        </View>
                      )}
                      {!!item.pro_experience_years && (
                        <View style={styles.metaItem}>
                          <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
                          <Text style={styles.metaText}>{item.pro_experience_years} ans</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.contactIconBtn}
                    activeOpacity={0.85}
                    onPress={() => router.push({
                      pathname: '/(tabs)/messagerie',
                      params: {
                        advisorName: item.name,
                        advisorAvatarKey: item.avatar_key,
                        prefill: '1',
                      },
                    } as any)}
                    accessibilityLabel="Contacter"
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.orange} />
                  </TouchableOpacity>
                </View>

                {!!item.bio && (
                  <Text style={styles.bio} numberOfLines={3}>{item.bio}</Text>
                )}

                {(shown.length > 0 || extra > 0) && (
                  <View style={styles.tags}>
                    {shown.map((s, i) => (
                      <View key={`${item.id}-tag-${i}`} style={styles.tag}>
                        <Text style={styles.tagText} numberOfLines={1}>{s}</Text>
                      </View>
                    ))}
                    {extra > 0 && (
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>+{extra}</Text>
                      </View>
                    )}
                  </View>
                )}

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

  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 12 },

  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingTop: 90, paddingHorizontal: 32, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  emptySub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    ...UI.cardShadow,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', backgroundColor: Colors.offWhite },
  avatarImg: { width: '100%', height: '100%' },
  avatarFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary },
  avatarInitial: { fontSize: 15, fontWeight: '900', color: Colors.white },
  cardTopText: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: '900', color: Colors.text },
  titleLine: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '75%' },
  metaText: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  contactIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bio: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginTop: 12 },

  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: { backgroundColor: Colors.orange + '15', borderRadius: 20, paddingVertical: 3, paddingHorizontal: 10 },
  tagText: { fontSize: 11, color: Colors.orange, fontWeight: '600', maxWidth: 220 },

  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.orange,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 12,
  },
  contactText: { color: Colors.white, fontSize: 14, fontWeight: '900' },
});
