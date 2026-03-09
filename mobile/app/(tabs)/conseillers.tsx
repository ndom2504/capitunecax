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

  const cardGap = 12;
  const columns = 2;
  const cardW = Math.floor((SCREEN_W - 16 * 2 - cardGap * (columns - 1)) / columns);
  const cardH = 180;

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
    // no-op (grille)
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
        <Text style={styles.counter}>{team.length ? `${team.length} profils` : ''}</Text>
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
          numColumns={columns}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24 }}
          columnWrapperStyle={{ gap: cardGap, marginBottom: cardGap }}
          renderItem={({ item }) => {
            const src = getAvatarSource(item.avatar_key);
            const initials = String(item.name ?? 'C')
              .trim()
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0])
              .join('')
              .toUpperCase();
            return (
              <TouchableOpacity
                style={[styles.storyCard, { width: cardW, height: cardH }]}
                activeOpacity={0.88}
                onPress={() => router.push({
                  pathname: '/(tabs)/messagerie',
                  params: {
                    advisorName: item.name,
                    advisorAvatarKey: item.avatar_key,
                    prefill: '1',
                  },
                } as any)}
              >
                <View style={styles.storyTop}>
                  <View style={styles.storyAvatarWrap}>
                    {src ? (
                      <Image source={src} style={styles.storyAvatarImg} />
                    ) : (
                      <View style={styles.storyAvatarFallback}>
                        <Text style={styles.storyAvatarInitial}>{initials}</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.storyChatBtn}
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
                    <Ionicons name="chatbubble-ellipses" size={16} color={Colors.orange} />
                  </TouchableOpacity>
                </View>

                <View style={styles.storyText}>
                  <Text style={styles.storyName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.storySubtitle} numberOfLines={1}>
                    {String(item.location ?? '').trim() || 'Canada'}
                  </Text>
                </View>
              </TouchableOpacity>
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

  // Cartes "statut" (type stories)
  storyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    justifyContent: 'space-between',
    ...UI.cardShadow,
  },
  storyTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  storyAvatarWrap: { width: 52, height: 52, borderRadius: 26, overflow: 'hidden', backgroundColor: Colors.offWhite },
  storyAvatarImg: { width: '100%', height: '100%' },
  storyAvatarFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary },
  storyAvatarInitial: { fontSize: 16, fontWeight: '900', color: Colors.white },
  storyChatBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyText: { gap: 2 },
  storyName: { fontSize: 14, fontWeight: '900', color: Colors.text },
  storySubtitle: { fontSize: 12, color: Colors.textMuted, fontWeight: '700' },
});
