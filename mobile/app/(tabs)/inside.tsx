import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Modal,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  type ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ResizeMode, Video } from 'expo-av';
import type { AVPlaybackSource } from 'expo-av';
import { Colors } from '../../constants/Colors';
import { UI } from '../../constants/UI';
import { useAuth } from '../../context/AuthContext';
import { getAvatarSource } from '../../lib/avatar';
import {
  insideApi,
  officialApi,
  presenceApi,
  userApi,
  type InsidePost as ApiInsidePost,
  type OfficialNewsItem,
} from '../../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ReactionKey = 'like' | 'fire' | 'clap';

type InsidePost = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  authorName: string;
  authorAvatarKey?: string;
  media?:
    | { type: 'video'; source: AVPlaybackSource }
    | { type: 'image'; uri: string };
  reactions: Record<ReactionKey, number>;
};

const INSIDE_LAST_SEEN_KEY = 'inside_last_seen_at';

const DEMO_POSTS: InsidePost[] = [
  {
    id: 'p1',
    title: 'Vidéo — Préparation du dossier (à venir)',
    content:
      "Cette publication annonce notre vidéo de préparation. Dans Inside, vous retrouverez des posts officiels avec des images, des vidéos, des sondages et des articles pédagogiques (contenus officiels, simples et actionnables).",
    createdAt: '2026-03-03T10:00:00Z',
    authorName: 'Admin CAPI',
    media: { type: 'video', source: require('../../assets/videos/preparation-depart.mp4') },
    reactions: { like: 12, fire: 4, clap: 7 },
  },
  {
    id: 'p2',
    title: 'Vidéo — Intégration au Canada (à venir)',
    content:
      "Cette publication annonce notre vidéo d'intégration (logement, démarches, premiers jours). Les contenus Inside seront des posts officiels : images, vidéos, sondages, et articles pédagogiques validés.",
    createdAt: '2026-03-01T14:30:00Z',
    authorName: 'Admin CAPI',
    media: { type: 'video', source: require('../../assets/videos/integration-canada.mp4') },
    reactions: { like: 9, fire: 2, clap: 5 },
  },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function InsideScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === 'admin';

  const [posts, setPosts] = useState<InsidePost[]>(DEMO_POSTS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(DEMO_POSTS[0]?.id ?? null);
  const [unmuted, setUnmuted] = useState<Record<string, boolean>>({});
  const [unreadCount, setUnreadCount] = useState(0);
  const lastSeenRef = useRef<string | null>(null);

  // Officiel (cloche)
  const [officialOpen, setOfficialOpen] = useState(false);
  const [officialItems, setOfficialItems] = useState<OfficialNewsItem[]>([]);
  const [officialIndex, setOfficialIndex] = useState(0);
  const [officialLoading, setOfficialLoading] = useState(false);
  const [officialError, setOfficialError] = useState<string | null>(null);

  // Présence
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [onlineEnabled, setOnlineEnabled] = useState<boolean>(true);

  const loadOfficial = async () => {
    setOfficialLoading(true);
    setOfficialError(null);
    try {
      const res = await officialApi.getNews('fr', 10);
      if (res.status === 200 && res.data?.items) {
        setOfficialItems(res.data.items);
        setOfficialIndex(0);
        return;
      }
      setOfficialItems([]);
      setOfficialError(res.error ?? (res.data as any)?.error ?? 'Impossible de charger les actus officielles.');
    } finally {
      setOfficialLoading(false);
    }
  };

  const openOfficial = async () => {
    setOfficialOpen(true);
    // conserve le comportement existant: effacer l'indicateur de nouveautés Inside
    await markInsideAsSeen();
    if (officialItems.length === 0 && !officialLoading) {
      await loadOfficial();
    }
  };

  const openOfficialLink = async (url: string) => {
    const u = String(url ?? '').trim();
    if (!u) return;
    try {
      await Linking.openURL(u);
    } catch {
      Alert.alert('Erreur', "Impossible d'ouvrir le lien.");
    }
  };

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 70 });
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
    const first = viewableItems.find(v => v.isViewable);
    const item = first?.item as InsidePost | undefined;
    if (item?.media?.type === 'video') {
      setActivePostId(item.id);
    } else {
      setActivePostId(null);
    }
  });

  // Composer (admin)
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [publishing, setPublishing] = useState(false);

  const canPublish = useMemo(() => title.trim().length >= 3 && content.trim().length >= 10, [title, content]);

  const computeUnread = (apiPosts: ApiInsidePost[]) => {
    const lastSeenIso = lastSeenRef.current;
    if (!lastSeenIso) {
      setUnreadCount(apiPosts?.length ?? 0);
      return;
    }
    const lastSeen = new Date(lastSeenIso).getTime();
    if (!Number.isFinite(lastSeen)) {
      setUnreadCount(apiPosts?.length ?? 0);
      return;
    }
    const count = (apiPosts ?? []).filter(p => new Date(p.createdAt).getTime() > lastSeen).length;
    setUnreadCount(Math.max(0, count));
  };

  const mapApiToUi = (p: ApiInsidePost): InsidePost => {
    const mediaType = String((p as any).mediaType ?? (p as any).media_type ?? '').toLowerCase();
    const mediaUrl = String((p as any).mediaUrl ?? (p as any).media_url ?? '').trim();

    let media: InsidePost['media'] = undefined;
    if (mediaType === 'video' && mediaUrl) {
      media = { type: 'video', source: { uri: mediaUrl } };
    } else if (mediaType === 'image' && mediaUrl) {
      media = { type: 'image', uri: mediaUrl };
    }

    return {
      id: p.id,
      title: p.title,
      content: p.content,
      createdAt: p.createdAt,
      authorName: p.authorName,
      authorAvatarKey: p.authorAvatarKey || undefined,
      media,
      reactions: { like: 0, fire: 0, clap: 0 },
    };
  };

  const load = async () => {
    setLoading(true);
    try {
      if (!token) {
        setPosts(DEMO_POSTS);
        return;
      }

      const res = await insideApi.getPosts(token);
      const apiPosts = res.data?.posts ?? [];

      if (res.status === 200 && apiPosts.length > 0) {
        setPosts(apiPosts.map(mapApiToUi));
        computeUnread(apiPosts);
      } else {
        // fallback UX: conserver le feed démo si aucune publication n'existe encore
        setUnreadCount(0);
        setPosts(DEMO_POSTS);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    AsyncStorage.getItem(INSIDE_LAST_SEEN_KEY)
      .then((v) => {
        lastSeenRef.current = v;
      })
      .catch(() => {
        lastSeenRef.current = null;
      })
      .finally(() => {
        load();
      });
  }, []);

  // Charger la préférence "statut en ligne" (Profil)
  useEffect(() => {
    if (!token) {
      setOnlineEnabled(true);
      return;
    }
    userApi.getProfile(token)
      .then((res) => {
        if (res.status === 200 && res.data) {
          setOnlineEnabled(!!res.data.online_status_enabled);
        }
      })
      .catch(() => {
        // si l'API échoue, on laisse le défaut = true
        setOnlineEnabled(true);
      });
  }, [token]);

  // Heartbeat présence
  useEffect(() => {
    if (!token || !onlineEnabled) return;

    let stopped = false;
    const send = async () => {
      if (stopped) return;
      await presenceApi.heartbeat(token);
    };

    send();
    const id = setInterval(send, 25000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [token, onlineEnabled]);

  // Poll compteur "en ligne"
  useEffect(() => {
    if (!token) {
      setOnlineCount(null);
      return;
    }

    let stopped = false;
    const refresh = async () => {
      if (stopped) return;
      const res = await presenceApi.count(token, 60);
      if (res.status === 200 && res.data && typeof res.data.count === 'number') {
        setOnlineCount(res.data.count);
      }
    };

    refresh();
    const id = setInterval(refresh, 15000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [token]);

  // Rotation automatique des actus officielles
  useEffect(() => {
    if (!officialOpen) return;
    if (officialItems.length <= 1) return;
    const id = setInterval(() => {
      setOfficialIndex((i) => (i + 1) % officialItems.length);
    }, 7000);
    return () => clearInterval(id);
  }, [officialOpen, officialItems.length]);

  const markInsideAsSeen = async () => {
    // Marque "vu" jusqu'au plus récent post.
    const latest = posts?.[0]?.createdAt;
    if (!latest) {
      setUnreadCount(0);
      return;
    }
    lastSeenRef.current = latest;
    setUnreadCount(0);
    try {
      await AsyncStorage.setItem(INSIDE_LAST_SEEN_KEY, latest);
    } catch {
      // no-op
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const reactToPost = (postId: string, key: ReactionKey) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, reactions: { ...p.reactions, [key]: (p.reactions[key] ?? 0) + 1 } }
          : p,
      ),
    );
  };

  const publish = async () => {
    if (!isAdmin) return;
    if (!canPublish || publishing) return;
    if (!token) {
      Alert.alert('Connexion requise', 'Veuillez vous reconnecter puis réessayer.');
      return;
    }

    setPublishing(true);
    try {
      const payload = { title: title.trim(), content: content.trim() };
      const res = await insideApi.publish(token, payload);
      if (res.status !== 200 || !res.data?.ok || !res.data?.post) {
        Alert.alert('Erreur', res.error ?? res.data?.error ?? 'Publication impossible.');
        return;
      }

      const newPost = mapApiToUi(res.data.post);
      setPosts(prev => [newPost, ...prev]);
      setTitle('');
      setContent('');
      Alert.alert('Publié', 'Votre publication est visible dans Inside.');
    } finally {
      setPublishing(false);
    }
  };

  const currentOfficial = officialItems[officialIndex] ?? null;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Inside</Text>
          <Text style={styles.subtitle}>Communauté Capitune</Text>
          {typeof onlineCount === 'number' && (
            <Text style={styles.onlineCount}>En ligne : {onlineCount}</Text>
          )}
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.bellBtn}
            activeOpacity={0.85}
            onPress={openOfficial}
            accessibilityLabel="Notifications Inside"
          >
            <Ionicons name="notifications-outline" size={18} color={Colors.text} />
            {unreadCount > 0 && <View style={styles.bellDot} />}
          </TouchableOpacity>

          <View style={styles.meAvatar}>
            {getAvatarSource(user?.avatar) ? (
              <Image source={getAvatarSource(user?.avatar) as any} style={styles.meAvatarImg} />
            ) : (
              <Text style={styles.meAvatarInitial}>{(user?.name ?? 'U')[0].toUpperCase()}</Text>
            )}
          </View>
        </View>

        <View style={styles.badge}>
          <Ionicons name="newspaper-outline" size={14} color={Colors.orange} />
          <Text style={styles.badgeText}>Officiel</Text>
        </View>
      </View>

      <Modal
        visible={officialOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setOfficialOpen(false)}
      >
        <View style={styles.officialOverlay}>
          <View style={styles.officialCard}>
            <View style={styles.officialTop}>
              <Text style={styles.officialTitle}>Infos officielles</Text>
              <TouchableOpacity
                style={styles.officialClose}
                onPress={() => setOfficialOpen(false)}
                accessibilityLabel="Fermer"
              >
                <Ionicons name="close" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {officialLoading ? (
              <View style={styles.officialLoadingRow}>
                <ActivityIndicator size="small" color={Colors.orange} />
                <Text style={styles.officialLoadingText}>Chargement…</Text>
              </View>
            ) : officialError ? (
              <Text style={styles.officialError}>{officialError}</Text>
            ) : !currentOfficial ? (
              <Text style={styles.officialEmpty}>Aucune actu pour le moment.</Text>
            ) : (
              <>
                <Text style={styles.officialItemTitle}>{currentOfficial.title}</Text>
                {!!currentOfficial.summary && (
                  <Text style={styles.officialItemSummary} numberOfLines={5}>
                    {currentOfficial.summary}
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.officialOpenBtn}
                  activeOpacity={0.85}
                  onPress={() => openOfficialLink(currentOfficial.url)}
                >
                  <Ionicons name="open-outline" size={16} color="#fff" />
                  <Text style={styles.officialOpenBtnText}>Ouvrir</Text>
                </TouchableOpacity>

                {officialItems.length > 1 && (
                  <View style={styles.officialPager}>
                    <TouchableOpacity
                      style={styles.officialNavBtn}
                      onPress={() => setOfficialIndex((i) => (i - 1 + officialItems.length) % officialItems.length)}
                      accessibilityLabel="Précédent"
                    >
                      <Ionicons name="chevron-back" size={18} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.officialPagerText}>
                      {officialIndex + 1} / {officialItems.length}
                    </Text>
                    <TouchableOpacity
                      style={styles.officialNavBtn}
                      onPress={() => setOfficialIndex((i) => (i + 1) % officialItems.length)}
                      accessibilityLabel="Suivant"
                    >
                      <Ionicons name="chevron-forward" size={18} color={Colors.text} />
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {isAdmin && (
        <View style={styles.composerCard}>
          <Text style={styles.composerTitle}>Publier une mise à jour</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Titre (ex: Mise à jour programmes…)"
            placeholderTextColor={Colors.textMuted}
            maxLength={120}
          />
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={content}
            onChangeText={setContent}
            placeholder="Texte…"
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.publishBtn, (!canPublish || publishing) && styles.publishBtnDisabled]}
            onPress={publish}
            disabled={!canPublish || publishing}
            activeOpacity={0.85}
          >
            {publishing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={16} color="#fff" />
                <Text style={styles.publishBtnText}>Publier</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={Colors.orange} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />}
          viewabilityConfig={viewabilityConfig.current}
          onViewableItemsChanged={onViewableItemsChanged.current}
          renderItem={({ item }) => (
            <View style={styles.postCard}>
              <View style={styles.postTop}>
                <View style={styles.avatar}>
                  {getAvatarSource(item.authorAvatarKey) ? (
                    <Image source={getAvatarSource(item.authorAvatarKey) as any} style={styles.avatarImg} />
                  ) : (
                    <Text style={styles.avatarInitial}>{(item.authorName?.[0] ?? 'A').toUpperCase()}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.author}>{item.authorName}</Text>
                  <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                </View>
              </View>

              <Text style={styles.postTitle}>{item.title}</Text>

              {item.media?.type === 'image' && (
                <Image
                  source={{ uri: item.media.uri }}
                  style={styles.image}
                  resizeMode="cover"
                />
              )}

              {item.media?.type === 'video' && (
                <View style={styles.videoWrap}>
                  <Video
                    source={item.media.source}
                    style={styles.video}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={activePostId === item.id}
                    isLooping
                    isMuted={!unmuted[item.id]}
                  />

                  <TouchableOpacity
                    style={styles.videoMuteBtn}
                    activeOpacity={0.85}
                    onPress={() => setUnmuted(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                    accessibilityLabel={unmuted[item.id] ? 'Couper le son' : 'Activer le son'}
                  >
                    <Ionicons
                      name={unmuted[item.id] ? 'volume-high' : 'volume-mute'}
                      size={16}
                      color={Colors.text}
                    />
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.postContent}>{item.content}</Text>

              <View style={styles.reactionsRow}>
                <TouchableOpacity style={styles.reactBtn} activeOpacity={0.85} onPress={() => reactToPost(item.id, 'like')}>
                  <Text style={styles.reactEmoji}>👍</Text>
                  <Text style={styles.reactCount}>{item.reactions.like ?? 0}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.reactBtn} activeOpacity={0.85} onPress={() => reactToPost(item.id, 'fire')}>
                  <Text style={styles.reactEmoji}>🔥</Text>
                  <Text style={styles.reactCount}>{item.reactions.fire ?? 0}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.reactBtn} activeOpacity={0.85} onPress={() => reactToPost(item.id, 'clap')}>
                  <Text style={styles.reactEmoji}>👏</Text>
                  <Text style={styles.reactCount}>{item.reactions.clap ?? 0}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="sparkles-outline" size={36} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Aucune publication</Text>
              <Text style={styles.emptySub}>Les mises à jour apparaîtront ici.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.chatFab}
        activeOpacity={0.9}
        onPress={() => router.push('/(tabs)/messagerie' as any)}
        accessibilityLabel="Ouvrir la messagerie conseiller"
      >
        <Ionicons name="chatbubble-ellipses" size={20} color={Colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgLight },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 12,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  onlineCount: { fontSize: 12, color: Colors.textMuted, marginTop: 2, fontWeight: '700' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.orange + '18',
    borderWidth: 1,
    borderColor: Colors.orange + '35',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 4,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: Colors.orange },

  meAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  meAvatarImg: { width: 36, height: 36, borderRadius: 18 },
  meAvatarInitial: { fontSize: 14, fontWeight: '900', color: Colors.text },

  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bellDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.orange,
  },

  officialOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  officialCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...UI.cardShadow,
  },
  officialTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  officialTitle: { fontSize: 14, fontWeight: '900', color: Colors.text },
  officialClose: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: Colors.offWhite,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  officialLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  officialLoadingText: { fontSize: 13, color: Colors.textMuted, fontWeight: '700' },
  officialError: { fontSize: 13, color: Colors.error, lineHeight: 18 },
  officialEmpty: { fontSize: 13, color: Colors.textMuted },
  officialItemTitle: { fontSize: 14, fontWeight: '900', color: Colors.text, marginBottom: 6 },
  officialItemSummary: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginBottom: 12 },
  officialOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.orange,
    borderRadius: 12,
    paddingVertical: 12,
  },
  officialOpenBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  officialPager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12 },
  officialNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.offWhite,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  officialPagerText: { fontSize: 12, fontWeight: '800', color: Colors.textMuted },

  image: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    marginTop: 10,
    backgroundColor: Colors.surface,
  },

  chatFab: {
    position: 'absolute',
    right: 18,
    bottom: 22,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  composerCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...UI.cardShadow,
    marginBottom: 10,
    gap: 10,
  },
  composerTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },
  input: {
    backgroundColor: Colors.offWhite,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.orange,
    borderRadius: 12,
    paddingVertical: 12,
  },
  publishBtnDisabled: { opacity: 0.45 },
  publishBtnText: { color: Colors.white, fontSize: 14, fontWeight: '800' },

  // Feed compact, sans espace entre publications
  list: { padding: 0, paddingBottom: 24 },
  postCard: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  postTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: { width: 36, height: 36, borderRadius: 18 },
  avatarInitial: { color: '#fff', fontSize: 16, fontWeight: '800' },
  author: { fontSize: 13, fontWeight: '800', color: Colors.text },
  date: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  postTitle: { fontSize: 14, fontWeight: '900', color: Colors.text, marginBottom: 6 },
  videoWrap: {
    backgroundColor: Colors.offWhite,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  video: { width: '100%', height: 190 },
  videoMuteBtn: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postContent: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },

  reactionsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  reactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.offWhite,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  reactEmoji: { fontSize: 14 },
  reactCount: { fontSize: 12, fontWeight: '800', color: Colors.text },

  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  emptySub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
});
