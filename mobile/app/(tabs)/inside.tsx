import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Alert,
  type ViewToken,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Audio, ResizeMode, Video } from 'expo-av';
import type { AVPlaybackSource } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/Colors';
import { UI } from '../../constants/UI';
import { useAuth } from '../../context/AuthContext';
import { getAvatarSource } from '../../lib/avatar';
import { API_BASE_URL, dashboardApi, insideApi, presenceApi, type InsidePostDto } from '../../lib/api';

type ReactionKey = 'like' | 'fire' | 'clap';

type InsideMedia =
  | { kind: 'video'; source: AVPlaybackSource }
  | { kind: 'image'; source: ImageSourcePropType };

type InsidePost = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  authorName: string;
  authorAvatarKey?: string;
  authorId?: string;
  authorAccountType?: string;
  linkUrl?: string;
  linkLabel?: string;
  media?: InsideMedia;
  reactions: Record<ReactionKey, number>;
};

const DEMO_POSTS: InsidePost[] = [
  {
    id: 'p1',
    title: 'Vidéo — Préparation du dossier (à venir)',
    content:
      "Cette publication annonce notre vidéo de préparation. Dans Inside, vous retrouverez des posts officiels avec des images, des vidéos, des sondages et des articles pédagogiques (contenus officiels, simples et actionnables).",
    createdAt: '2026-03-03T10:00:00Z',
    authorName: 'Admin CAPI',
    media: { kind: 'video', source: require('../../assets/videos/preparation-depart.mp4') },
    reactions: { like: 12, fire: 4, clap: 7 },
  },
  {
    id: 'p2',
    title: 'Vidéo — Intégration au Canada (à venir)',
    content:
      "Cette publication annonce notre vidéo d'intégration (logement, démarches, premiers jours). Les contenus Inside seront des posts officiels : images, vidéos, sondages, et articles pédagogiques validés.",
    createdAt: '2026-03-01T14:30:00Z',
    authorName: 'Admin CAPI',
    media: { kind: 'video', source: require('../../assets/videos/integration-canada.mp4') },
    reactions: { like: 9, fire: 2, clap: 5 },
  },
];

const OFFICIAL_LINKS: Array<{ label: string; url: string }> = [
  { label: 'Entrée Express (IRCC)', url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/entree-express.html' },
  { label: 'Permis de travail (IRCC)', url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/travailler-canada.html' },
  { label: 'Étudier au Canada (IRCC)', url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/etudier-canada.html' },
  { label: 'Immigration Canada (IRCC)', url: 'https://www.canada.ca/fr/services/immigration-citoyennete.html' },
];

const MESSAGES_LAST_SEEN_KEY = 'messages:lastSeenAt';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function InsideScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const isPro = user?.account_type === 'pro';
  const isAdmin = user?.role === 'admin';
  const userCanPublish = isPro || isAdmin;
  const insets = useSafeAreaInsets();

  const [posts, setPosts] = useState<InsidePost[]>(DEMO_POSTS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(DEMO_POSTS[0]?.id ?? null);
  const [unmuted, setUnmuted] = useState<Record<string, boolean>>({});
  const [officialOpen, setOfficialOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectedCount, setConnectedCount] = useState<number | null>(null);
  const [meOnline, setMeOnline] = useState<boolean | null>(null);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 70 });
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
    const first = viewableItems.find(v => v.isViewable);
    const item = first?.item as InsidePost | undefined;
    if (item?.media?.kind === 'video') {
      setActivePostId(item.id);
    } else {
      setActivePostId(null);
    }
  });

  // Composer (admin & pro)
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [publishing, setPublishing] = useState(false);

  const contentValid = useMemo(() => title.trim().length >= 3 && content.trim().length >= 10, [title, content]);

  const normalizeMediaUrl = (raw?: string | null): string | null => {
    const url = String(raw ?? '').trim();
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
    return `${API_BASE_URL}/${url}`;
  };

  const toMedia = (p: InsidePostDto): InsideMedia | undefined => {
    const mediaUrl = normalizeMediaUrl(p.mediaUrl);
    if (!mediaUrl) return undefined;
    const t = String(p.mediaType ?? '').toLowerCase().trim();
    if (t.startsWith('video') || t.includes('mp4') || mediaUrl.endsWith('.mp4')) {
      return { kind: 'video', source: { uri: mediaUrl } };
    }
    if (t.startsWith('image') || t.includes('png') || t.includes('jpg') || t.includes('jpeg')) {
      return { kind: 'image', source: { uri: mediaUrl } };
    }
    return { kind: 'image', source: { uri: mediaUrl } };
  };

  const mapApiPost = (p: InsidePostDto): InsidePost => ({
    id: String(p.id),
    title: String(p.title ?? ''),
    content: String(p.content ?? ''),
    createdAt: String(p.createdAt ?? new Date().toISOString()),
    authorName: String(p.authorName ?? 'Admin'),
    authorAvatarKey: p.authorAvatarKey ? String(p.authorAvatarKey) : undefined,
    authorId: p.authorId ? String(p.authorId) : undefined,
    authorAccountType: p.authorAccountType ? String(p.authorAccountType) : undefined,
    linkUrl: String((p as any)?.linkUrl ?? ''),
    linkLabel: String((p as any)?.linkLabel ?? 'Ouvrir le lien'),
    media: toMedia(p),
    reactions: { like: 0, fire: 0, clap: 0 },
  });

  const normalizeLink = (raw?: string | null): string | null => {
    const v = String(raw ?? '').trim();
    if (!v) return null;
    if (v.startsWith('http://') || v.startsWith('https://')) return v;
    if (v.startsWith('www.')) return `https://${v}`;
    // Si l'utilisateur colle un domaine nu, on tente https
    if (v.includes('.') && !v.includes(' ')) return `https://${v}`;
    return null;
  };

  const refreshUnread = async () => {
    if (!token) {
      setUnreadCount(0);
      return;
    }
    const [messagesRes, lastSeenRaw] = await Promise.all([
      dashboardApi.getMessages(token),
      AsyncStorage.getItem(MESSAGES_LAST_SEEN_KEY),
    ]);

    const lastSeenAt = lastSeenRaw ? new Date(lastSeenRaw).getTime() : 0;
    const messages = messagesRes.data?.messages ?? [];
    const unread = Array.isArray(messages)
      ? messages.filter((m: any) => {
          const created = new Date(m?.created_at ?? m?.createdAt ?? 0).getTime();
          return Number.isFinite(created) && created > lastSeenAt;
        }).length
      : 0;
    setUnreadCount(unread);
  };

  const load = async () => {
    setLoading(true);
    try {
      if (!token) {
        setPosts(DEMO_POSTS);
        setActivePostId(DEMO_POSTS[0]?.id ?? null);
        setUnreadCount(0);
        setConnectedCount(null);
        setMeOnline(null);
        return;
      }

      if (Platform.OS === 'ios') {
        Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});
      }

      const res = await insideApi.list(token, { includeHidden: isAdmin });
      const apiPosts = res.data?.posts ?? [];
      const mapped = Array.isArray(apiPosts) ? apiPosts.map(mapApiPost) : [];

      setPosts(mapped.length ? mapped : DEMO_POSTS);
      const firstVideo = mapped.find(p => p.media?.kind === 'video')?.id ?? DEMO_POSTS[0]?.id ?? null;
      setActivePostId(firstVideo);
      await refreshUnread();

      // Presence (best-effort)
      await presenceApi.ping(token);
      const pres = await presenceApi.status(token);
      if (!pres.error && pres.data) {
        setConnectedCount(Number.isFinite(pres.data.connected) ? pres.data.connected : 0);
        setMeOnline(!!pres.data.meOnline);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const tick = async () => {
      try {
        await presenceApi.ping(token);
        const res = await presenceApi.status(token);
        if (cancelled) return;
        if (!res.error && res.data) {
          setConnectedCount(Number.isFinite(res.data.connected) ? res.data.connected : 0);
          setMeOnline(!!res.data.meOnline);
        }
      } catch {
        // best-effort
      }
    };

    // ping immédiat + polling léger
    tick();
    const id = setInterval(tick, 25_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [token]);

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

  const handleContactPro = (post: InsidePost) => {
    if (!user?.id || !post.authorId) {
      Alert.alert('Erreur', 'Impossible de contacter ce professionnel.');
      return;
    }
    // Navigate to messages or create a conversation with the PRO
    // For now, open the messages screen
    router.push({
      pathname: '/dashboard',
      params: { tab: 'messages' },
    });
  };

  const publish = async () => {
    if (!isPro && !isAdmin) return;
    const canPublishContent = title.trim().length >= 3 && content.trim().length >= 10;
    if (!canPublishContent || publishing) return;

    setPublishing(true);
    try {
      if (!token) {
        Alert.alert('Non connecté', 'Connectez-vous pour publier.');
        return;
      }

      const payload = {
        title: title.trim(),
        content: content.trim(),
        linkUrl: normalizeLink(linkUrl) ?? '',
        linkLabel: linkLabel.trim() || 'Ouvrir le lien',
      };
      const res = await insideApi.publish(token, payload);
      if (res.error) {
        Alert.alert('Erreur', res.error);
        return;
      }

      if (res.data?.post) {
        const mapped = mapApiPost(res.data.post);
        setPosts(prev => [mapped, ...prev]);
      } else {
        const newPost: InsidePost = {
          id: String(Date.now()),
          title: payload.title,
          content: payload.content,
          linkUrl: payload.linkUrl || undefined,
          linkLabel: payload.linkLabel,
          createdAt: new Date().toISOString(),
          authorName: user?.name ?? 'Admin',
          reactions: { like: 0, fire: 0, clap: 0 },
        };
        setPosts(prev => [newPost, ...prev]);
      }

      setTitle('');
      setContent('');
      setLinkUrl('');
      setLinkLabel('');
      Alert.alert('Publié', 'Votre publication est visible dans Inside.');
    } finally {
      setPublishing(false);
    }
  };

  const openMessages = async () => {
    const now = new Date().toISOString();
    AsyncStorage.setItem(MESSAGES_LAST_SEEN_KEY, now).catch(() => {});
    setUnreadCount(0);
    if (isPro) {
      router.push('/(tabs)/dashboard' as any);
      return;
    }
    router.push({ pathname: '/(tabs)/messagerie', params: { prefill: '1' } } as any);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Inside</Text>
          <Text style={styles.subtitle}>Communauté Capitune</Text>
          <View style={styles.presenceRow}>
            <View style={[styles.presenceDot, { backgroundColor: (meOnline ?? !!token) ? Colors.success : Colors.textMuted }]} />
            <Text style={styles.presenceText}>
              {(meOnline ?? !!token) ? 'En ligne' : 'Hors ligne'}
              {typeof connectedCount === 'number' ? ` • ${connectedCount} connectés` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.badge}
            activeOpacity={0.85}
            onPress={() => setOfficialOpen(true)}
            accessibilityLabel="Ouvrir les liens officiels"
          >
            <Ionicons name="newspaper-outline" size={14} color={Colors.orange} />
            <Text style={styles.badgeText}>Officiel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.notificationBtn}
            activeOpacity={0.85}
            onPress={openMessages}
            accessibilityLabel="Ouvrir la messagerie"
          >
            <Ionicons name="notifications-outline" size={18} color={Colors.text} />
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount > 9 ? '9+' : String(unreadCount)}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.meAvatar}
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/profil' as any)}
            accessibilityLabel="Ouvrir mon profil"
          >
            {getAvatarSource(user?.avatar) ? (
              <Image source={getAvatarSource(user?.avatar) as any} style={styles.meAvatarImg} />
            ) : (
              <Text style={styles.meAvatarInitial}>{(user?.name ?? 'U')[0].toUpperCase()}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={officialOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setOfficialOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Officiel — IRCC</Text>
              <TouchableOpacity
                style={styles.modalClose}
                activeOpacity={0.85}
                onPress={() => setOfficialOpen(false)}
                accessibilityLabel="Fermer"
              >
                <Ionicons name="close" size={18} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {OFFICIAL_LINKS.map((l) => (
              <TouchableOpacity
                key={l.url}
                style={styles.linkRow}
                activeOpacity={0.85}
                onPress={() => Linking.openURL(l.url)}
              >
                <Ionicons name="link-outline" size={16} color={Colors.orange} />
                <Text style={styles.linkText}>{l.label}</Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.modalHint}>Toujours vérifier sur le site officiel.</Text>
          </View>
        </View>
      </Modal>

      {userCanPublish && (
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
          <TextInput
            style={styles.input}
            value={linkUrl}
            onChangeText={setLinkUrl}
            placeholder="Lien (optionnel) — ex: https://..."
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.publishBtn, (!contentValid || publishing) && styles.publishBtnDisabled]}
            onPress={publish}
            disabled={!contentValid || publishing}
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
              <View style={styles.postInner}>
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
              </View>

              <View style={styles.postInnerContent}>
                <Text style={styles.postContent}>{item.content}</Text>
              </View>

              {item.media?.kind === 'video' && (
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

              {item.media?.kind === 'image' && (
                <Image source={item.media.source} style={styles.image} resizeMode="cover" />
              )}

              <View style={styles.postInnerActions}>
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

                  <View style={{ flex: 1 }} />
                </View>

                {normalizeLink(item.linkUrl) && (
                  <TouchableOpacity
                    style={styles.linkBtn}
                    activeOpacity={0.85}
                    onPress={() => Linking.openURL(normalizeLink(item.linkUrl) as string)}
                    accessibilityLabel={`${item.linkLabel || 'Ouvrir le lien'}`}
                  >
                    <Ionicons name="link" size={18} color="#fff" />
                    <Text style={styles.linkBtnText}>{item.linkLabel || 'Ouvrir le lien'}</Text>
                  </TouchableOpacity>
                )}

                {item.authorAccountType === 'pro' && user?.account_type === 'client' && (
                  <TouchableOpacity
                    style={styles.contactBtn}
                    activeOpacity={0.85}
                    onPress={() => handleContactPro(item)}
                    accessibilityLabel={`Contacter ${item.authorName}`}
                  >
                    <Ionicons name="call" size={18} color="#fff" />
                    <Text style={styles.contactBtnText}>Contacter {item.authorName}</Text>
                  </TouchableOpacity>
                )}
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

      {/* Bulle messagerie (conversation Pro) */}
      <TouchableOpacity
        style={[styles.msgFab, { bottom: Math.max(6, insets.bottom + 36) }]}
        activeOpacity={0.9}
        onPress={openMessages}
        accessibilityLabel="Ouvrir la messagerie avec mon conseiller"
      >
        <Ionicons name="chatbubble-ellipses" size={22} color={Colors.surface} />
        {unreadCount > 0 && (
          <View style={styles.msgFabBadge}>
            <Text style={styles.msgFabBadgeText}>{unreadCount > 9 ? '9+' : String(unreadCount)}</Text>
          </View>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgLight },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 12,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  presenceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  presenceDot: { width: 8, height: 8, borderRadius: 4 },
  presenceText: { fontSize: 12, color: Colors.textMuted, fontWeight: '700' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 4,
  },
  badgeText: { fontSize: 12, fontWeight: '800', color: Colors.text },

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

  notificationBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.bgLight,
  },
  unreadBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },

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

  list: { paddingTop: 0, paddingBottom: 30 },
  postCard: {
    backgroundColor: Colors.surface,
    paddingVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  postInner: { paddingHorizontal: 16, paddingTop: 14 },
  postInnerContent: { paddingHorizontal: 16, paddingBottom: 12 },
  postInnerActions: { paddingHorizontal: 16, paddingBottom: 14 },
  postTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: { width: 40, height: 40, borderRadius: 20 },
  avatarInitial: { color: '#fff', fontSize: 16, fontWeight: '800' },
  author: { fontSize: 14, fontWeight: '800', color: Colors.text },
  date: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  postTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  videoWrap: {
    backgroundColor: '#000',
    borderWidth: 0,
    borderColor: 'transparent',
    borderRadius: 0,
    overflow: 'hidden',
    marginBottom: 10,
  },
  video: { width: '100%', height: 240 },
  image: { width: '100%', height: 240, marginBottom: 10, backgroundColor: '#000' },
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
  postContent: { fontSize: 16, color: Colors.textSecondary, lineHeight: 23 },

  linkBtn: {
    marginTop: 12,
    marginHorizontal: -16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.orange,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  linkBtnText: { fontSize: 14, fontWeight: '700', color: '#fff', textAlign: 'center' },

  contactBtn: {
    marginTop: 12,
    marginHorizontal: -16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.accent,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  contactBtnText: { fontSize: 14, fontWeight: '700', color: '#fff', textAlign: 'center' },

  reactionsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
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

  msgFab: {
    position: 'absolute',
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...UI.cardShadow,
  },
  msgFabBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: Colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.orange,
  },
  msgFabBadgeText: { color: Colors.surface, fontSize: 10, fontWeight: '900' },

  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  emptySub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  modalTitle: { fontSize: 16, fontWeight: '900', color: Colors.text },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: Colors.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  linkText: { flex: 1, fontSize: 13, color: Colors.text, fontWeight: '700' },
  modalHint: { marginTop: 10, fontSize: 11, color: Colors.textMuted },
});
