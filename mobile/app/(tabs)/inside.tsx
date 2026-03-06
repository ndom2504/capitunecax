import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Alert,
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

type ReactionKey = 'like' | 'fire' | 'clap';

type InsidePost = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  authorName: string;
  authorAvatarKey?: string;
  media?: { type: 'video'; source: AVPlaybackSource };
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
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === 'admin';

  const [posts, setPosts] = useState<InsidePost[]>(DEMO_POSTS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(DEMO_POSTS[0]?.id ?? null);
  const [unmuted, setUnmuted] = useState<Record<string, boolean>>({});

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

  const load = async () => {
    setLoading(true);
    try {
      // MVP: feed local (sera branché à une API ensuite)
      setPosts(DEMO_POSTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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

    setPublishing(true);
    try {
      const newPost: InsidePost = {
        id: String(Date.now()),
        title: title.trim(),
        content: content.trim(),
        createdAt: new Date().toISOString(),
        authorName: user?.name ?? 'Admin',
        reactions: { like: 0, fire: 0, clap: 0 },
      };
      setPosts(prev => [newPost, ...prev]);
      setTitle('');
      setContent('');
      Alert.alert('Publié', 'Votre publication est visible dans Inside.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Inside</Text>
          <Text style={styles.subtitle}>Communauté & mises à jour</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.contactBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/messagerie' as any)}
            accessibilityLabel="Ouvrir la messagerie conseiller"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.text} />
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
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
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

                <View style={{ flex: 1 }} />

                <View style={styles.noChatHint}>
                  <Ionicons name="lock-closed-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.noChatText}>Réactions seulement</Text>
                </View>
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

  contactBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
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

  list: { padding: 16, paddingBottom: 24 },
  postCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...UI.cardShadow,
  },
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
  author: { fontSize: 13, fontWeight: '800', color: Colors.text },
  date: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  postTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  videoWrap: {
    backgroundColor: Colors.offWhite,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
  },
  video: { width: '100%', height: 220 },
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

  noChatHint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  noChatText: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },

  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  emptySub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
});
