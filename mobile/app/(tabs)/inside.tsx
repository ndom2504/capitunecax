import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Linking,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../../constants/Colors';
import { UI } from '../../constants/UI';
import { useAuth } from '../../context/AuthContext';
import CreatePostModal from '../../components/CreatePostModal';
import CommentsModal from '../../components/CommentsModal';
import * as Sharing from 'expo-sharing';
import { insideApi } from '../../lib/api';

// Types
interface Post {
  id: string;
  avatar?: string;
  name: string;
  date: string;
  text: string;
  tags?: string;
  link?: {
    title: string;
    url: string;
  };
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
  likes: number;
  comments: number;
  shares: number;
  liked?: boolean;
}

// Icônes SVG
const LikeIcon = ({ filled = false, size = 20 }: { filled?: boolean; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      opacity="0.4"
      d="M18 18.86H17.24C16.44 18.86 15.68 19.17 15.12 19.73L13.41 21.42C12.63 22.19 11.36 22.19 10.58 21.42L8.87 19.73C8.31 19.17 7.54 18.86 6.75 18.86H6C4.34 18.86 3 17.53 3 15.89V4.98001C3 3.34001 4.34 2.01001 6 2.01001H18C19.66 2.01001 21 3.34001 21 4.98001V15.89C21 17.52 19.66 18.86 18 18.86Z"
      fill={filled ? '#1e3a8a' : '#666'}
    />
    <Path
      d="M12.28 14.96C12.13 15.01 11.88 15.01 11.72 14.96C10.42 14.51 7.5 12.66 7.5 9.51001C7.5 8.12001 8.62 7 10 7C10.82 7 11.54 7.39 12 8C12.46 7.39 13.18 7 14 7C15.38 7 16.5 8.12001 16.5 9.51001C16.49 12.66 13.58 14.51 12.28 14.96Z"
      fill={filled ? '#1e3a8a' : '#666'}
    />
  </Svg>
);

const TendanceIcon = ({ size = 16 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="#1e3a8a">
    <Path fill="#1e3a8a" d="M5.016 16c-1.066-2.219-0.498-3.49 0.321-4.688 0.897-1.312 1.129-2.61 1.129-2.61s0.706 0.917 0.423 2.352c1.246-1.387 1.482-3.598 1.293-4.445 2.817 1.969 4.021 6.232 2.399 9.392 8.631-4.883 2.147-12.19 1.018-13.013 0.376 0.823 0.448 2.216-0.313 2.893-1.287-4.879-4.468-5.879-4.468-5.879 0.376 2.516-1.364 5.268-3.042 7.324-0.059-1.003-0.122-1.696-0.649-2.656-0.118 1.823-1.511 3.309-1.889 5.135-0.511 2.473 0.383 4.284 3.777 6.197z"/>
  </Svg>
);

const ActualiteIcon = ({ size = 16 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="#1e3a8a">
    <Path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" fill="#1e3a8a"/>
    <Path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" fill="#1e3a8a"/>
  </Svg>
);

const RecommandeIcon = ({ size = 16 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 15L8 9L14 12L21 5" stroke="#1e3a8a" strokeWidth={2} fill="none"/>
    <Path d="M21 10V5H16" stroke="#1e3a8a" strokeWidth={2} fill="none"/>
    <Path d="M3 19H21" stroke="#1e3a8a" strokeWidth={2} fill="none"/>
  </Svg>
);

const MenuIcon = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 5H21" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M3 12H21" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M3 19H21" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CommentIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="#666">
    <Path d="M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22V22H9Z" fill="#666"/>
  </Svg>
);

const ShareIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="#666">
    <Path d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M14 16V13C10.39 13 7.81 14.43 6 17C6.72 13.33 8.94 9.73 14 9V6L19 11L14 16Z" fill="#666"/>
  </Svg>
);

const SendIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="#666">
    <Path d="M0 0l20 10L0 20V0zm0 8v4l10-2L0 8z" fill="#666"/>
  </Svg>
);

// Mock data
const mockPosts: Post[] = [
  {
    id: '1',
    name: 'Marie Consultant',
    date: '2 minutes ago',
    text: 'Nouvelles fonctionnalités disponibles dans Capitune! Découvrez notre nouvelle interface simplifiée pour les demandes d\'immigration.',
    tags: '#ProjetCapitune #Innovation #Immigration',
    link: {
      title: '🔗 Article intéressant',
      url: 'capitune.com/blog',
    },
    avatar: 'https://picsum.photos/200', // Test URL publique
    likes: 172,
    comments: 78,
    shares: 23,
    liked: true,
  },
  {
    id: '2',
    name: 'Pierre Advisor',
    date: '15 minutes ago',
    text: 'Webinaire gratuit ce jeudi : "Les nouvelles règles d\'immigration 2024". Réservez votre place maintenant! Places limitées.',
    tags: '#Webinaire #Formation #Canada',
    avatar: 'https://picsum.photos/200', // Test URL publique
    likes: 89,
    comments: 34,
    shares: 12,
    liked: false,
  },
  {
    id: '3',
    name: 'Sophie Client',
    date: '1 hour ago',
    text: 'Merci à toute l\'équipe Capitune! Mon dossier de résidence permanente a été approuvé en seulement 3 mois. Service exceptionnel et très professionnel! Je recommande vivement.',
    tags: '#Témoignage #Succès #Capitune',
    avatar: 'https://picsum.photos/200', // Test URL publique
    likes: 256,
    comments: 92,
    shares: 45,
    liked: true,
  },
  {
    id: '4',
    name: 'Thomas Expert',
    date: '3 hours ago',
    text: 'Mise à jour importante : Les délais de traitement pour les permis d\'études ont été réduits de 40%. Plus d\'informations dans notre guide complet.',
    link: {
      title: '📋 Guide complet',
      url: 'capitune.com/guide-permis',
    },
    avatar: 'https://picsum.photos/200', // Test URL publique
    likes: 145,
    comments: 67,
    shares: 34,
    liked: false,
  },
  {
    id: '5',
    name: 'Administrateur Capitune',
    date: '5 hours ago',
    text: '🚀 Nouveauté : Vous pouvez maintenant suivre en temps réel l\'avancement de votre dossier directement dans l\'application! Essayez-le maintenant.',
    tags: '#Nouveauté #Feature #MiseÀJour',
    avatar: 'https://picsum.photos/200', // Test URL publique
    likes: 423,
    comments: 156,
    shares: 89,
    liked: false,
  },
];

// Composant PostInput
const PostInput = ({ user, onPress }: { user: any; onPress: () => void }) => (
  <View style={styles.postBox}>
    
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Image 
        source={user?.avatar ? { uri: user.avatar } : require('../../assets/icons/inside.png')} 
        style={styles.avatar} 
      />
      <Text style={styles.placeholder}>Quoi de neuf ?</Text>
    </View>

    <View style={styles.postActions}>
      <TouchableOpacity style={styles.primaryBtn} onPress={onPress}>
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Partager un post</Text>
      </TouchableOpacity>
    </View>

  </View>
);

// Composant Avatar simple avec initiales
const SimpleAvatar = ({ name, style }: { name: string; style: any }) => {
  const getInitials = (fullName: string) => {
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[names.length - 1][0];
    }
    return names[0][0];
  };

  return (
    <View style={[style, styles.avatarContainer]}>
      <Text style={styles.avatarInitials}>
        {getInitials(name)}
      </Text>
    </View>
  );
};

// Composant PostCard
const PostCard = ({ post, onCommentPress }: { post: Post; onCommentPress: (post: Post) => void }) => {
  const [liked, setLiked] = useState(post.liked || false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [commentsCount, setCommentsCount] = useState(post.comments);
  const [sharesCount, setSharesCount] = useState(post.shares);
  const router = useRouter();

  const handleLike = () => {
    setLiked(!liked);
    setLikesCount(prev => liked ? prev - 1 : prev + 1);
  };

  const handleComment = () => {
    onCommentPress(post);
  };

  const handleShare = async () => {
    try {
      const message = `${post.text}\n\nPar ${post.name} sur Capitune`;
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(message, {
          dialogTitle: 'Partager sur',
          mimeType: 'text/plain',
        });
        setSharesCount(prev => prev + 1);
      } else {
        Alert.alert('Partage non disponible', 'Le partage n\'est pas supporté sur cet appareil.');
      }
    } catch (error) {
      console.log('Erreur de partage:', error);
    }
  };

  const handleSend = () => {
    router.push({
      pathname: '/(tabs)/messagerie',
      params: { 
        recipient: post.name,
        recipientId: post.id 
      }
    });
  };

  return (
    <View style={styles.card}>

      {/* HEADER */}
      <View style={styles.postHeader}>
        <View>
          <Text style={styles.debugLog}>URL: {post.avatar}</Text>
          <Image 
            source={post.avatar ? { uri: post.avatar } : require('../../assets/icons/inside.png')} 
            style={styles.avatar}
            onError={(e) => {
              console.log('IMAGE_ERROR:', e.nativeEvent.error);
              console.log('IMAGE_URL:', post.avatar);
            }}
            onLoad={() => console.log('IMAGE_LOADED:', post.avatar)}
          />
        </View>

        <View>
          <Text style={styles.name}>{post.name}</Text>
          <Text style={styles.date}>{post.date}</Text>
        </View>
      </View>

      {/* TEXTE */}
      <Text style={styles.postText}>{post.text}</Text>

      {/* MÉDIA (IMAGE/VIDÉO) */}
      {post.mediaUrl && post.mediaType && (
        <View style={styles.mediaContainer}>
          <Text style={styles.debugLog}>MEDIA: {post.mediaType} - {post.mediaUrl}</Text>
          {post.mediaType === 'image' ? (
            <Image 
              source={{ uri: post.mediaUrl }} 
              style={styles.mediaImage}
              resizeMode="cover"
              onError={(e) => {
                console.log('MEDIA_ERROR:', e.nativeEvent.error);
                console.log('MEDIA_URL:', post.mediaUrl);
              }}
              onLoad={() => console.log('MEDIA_LOADED:', post.mediaUrl)}
            />
          ) : (
            <Video
              source={{ uri: post.mediaUrl }}
              style={styles.mediaVideo}
              shouldPlay={false}
              useNativeControls
              resizeMode={ResizeMode.COVER}
              onError={(e: any) => {
                console.log('VIDEO_ERROR:', e.nativeEvent.error);
                console.log('VIDEO_URL:', post.mediaUrl);
              }}
              onLoad={() => console.log('VIDEO_LOADED:', post.mediaUrl)}
            />
          )}
        </View>
      )}

      {/* TAGS */}
      {post.tags && (
        <Text style={styles.tags}>
          {post.tags}
        </Text>
      )}

      {/* LIEN */}
      {post.link && (
        <View style={styles.linkBox}>
          <Text style={{ fontWeight: 'bold' }}>{post.link.title}</Text>
          <Text style={{ color: '#666' }}>{post.link.url}</Text>
        </View>
      )}

      {/* ACTIONS */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
          <LikeIcon filled={liked} size={20} />
          <Text style={styles.actionText}>{likesCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleComment} style={styles.actionButton}>
          <CommentIcon size={20} />
          <Text style={styles.actionText}>{commentsCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
          <ShareIcon size={20} />
          <Text style={styles.actionText}>{sharesCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSend} style={styles.actionButton}>
          <SendIcon size={20} />
          <Text style={styles.actionText}>Envoyer</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
};

// Composant FAB
const FAB = () => {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={() => router.push('/(tabs)/messagerie')}
    >
      <Ionicons name="mail" size={24} color="#fff" />
    </TouchableOpacity>
  );
};

export default function InsideScreen() {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
  const [comments, setComments] = useState<any[]>([]);

  // Charger les publications depuis l'API
  const loadPosts = async () => {
    try {
      if (!token) return;
      
      const response = await insideApi.list(token);
      if (response.data && response.data.posts) {
        console.log('Posts API:', response.data.posts); // Debug pour voir les données
        
        const formattedPosts = response.data.posts.map((post: any) => {
          console.log('Post authorAvatarKey:', post.authorAvatarKey); // Debug spécifique
          console.log('Post authorName:', post.authorName);
          
          // Forcer l'avatar de Morel Stevens Ndong pour toutes les publications (pro et admin)
          const avatarUrl = 'https://www.capitune.com/api/avatar/morel_stevens_ndong';
          
          return {
            id: post.id,
            name: post.authorName,
            date: new Date(post.createdAt).toLocaleDateString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit',
              day: 'numeric',
              month: 'short'
            }),
            text: post.content,
            tags: post.linkLabel ? `#${post.linkLabel}` : undefined,
            link: post.linkUrl ? {
              title: post.linkLabel || 'Lien',
              url: post.linkUrl
            } : undefined,
            mediaType: post.mediaType as 'image' | 'video' | undefined,
            mediaUrl: post.mediaUrl || undefined,
            // Forcer l'avatar de Morel Stevens Ndong pour toutes les publications
            avatar: avatarUrl,
            likes: 0,
            comments: 0,
            shares: 0,
            liked: false,
          };
        });
        setPosts(formattedPosts);
      }
    } catch (error) {
      console.error('Erreur chargement posts:', error);
      console.log('Utilisation des mock data en raison d\'une erreur API');
      // En cas d'erreur, utiliser les mock data
      setPosts(mockPosts);
    } finally {
      console.log('Chargement terminé, nombre de posts:', posts.length);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [token]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  }, [token]);

  const handleCommentPress = (post: Post) => {
    setSelectedPost(post);
    // TODO: Charger les vrais commentaires depuis l'API
    setComments([
      {
        id: '1',
        author: 'Jean Dupont',
        text: 'Super publication ! 👍',
        date: '2 min',
        likes: 3,
        liked: false,
      },
      {
        id: '2',
        author: 'Marie Martin',
        text: 'Merci pour cette information très utile.',
        date: '5 min',
        likes: 1,
        liked: true,
      },
    ]);
    setIsCommentsVisible(true);
  };

  const handleAddComment = async (text: string) => {
    const newComment = {
      id: Date.now().toString(),
      author: user?.name || 'Utilisateur',
      text,
      date: 'À l\'instant',
      likes: 0,
      liked: false,
    };
    setComments(prev => [...prev, newComment]);
    
    // Mettre à jour le compteur de commentaires du post
    if (selectedPost) {
      setPosts(prev => prev.map(p => 
        p.id === selectedPost.id 
          ? { ...p, comments: p.comments + 1 }
          : p
      ));
    }
  };

  const handleCreatePost = async (content: string, tags?: string) => {
    try {
      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté pour publier');
        return;
      }

      // Utiliser l'API admin pour créer le post
      const response = await insideApi.publish(token, {
        title: tags || 'Publication Inside',
        content: content,
      });

      if (response.error) {
        Alert.alert('Erreur', response.error);
        return;
      }

      if (response.data?.post) {
        // Ajouter le nouveau post au début de la liste
        const newPost: Post = {
          id: response.data.post.id,
          name: user?.name || 'Utilisateur',
          date: 'À l\'instant',
          text: content,
          tags: tags,
          likes: 0,
          comments: 0,
          shares: 0,
          liked: false,
        };
        
        setPosts([newPost, ...posts]);
        Alert.alert('Succès', 'Votre publication a été partagée');
      }
    } catch (error) {
      console.error('Erreur création post:', error);
      Alert.alert('Erreur', 'Impossible de publier votre message');
    }
  };

  return (
    <>
      <StatusBar style="light" backgroundColor={Colors.primary} />
      <SafeAreaView style={styles.root}>
        
        {/* HEADER */}
        <LinearGradient
          colors={['#1e3a8a', '#143FA8']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity style={styles.iconButton}>
                <MenuIcon size={24} />
              </TouchableOpacity>
            </View>
            <View style={styles.headerCenter}>
              <Text style={styles.title}>INSIDE</Text>
              <Text style={styles.subtitle}>Communauté Capitune</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="search" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="notifications-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* BARRES */}
        <View style={styles.barsContainer}>
          <TouchableOpacity style={styles.bar}>
            <View style={styles.barContent}>
              <TendanceIcon size={16} />
              <Text style={styles.barText}>Tendances</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bar}>
            <View style={styles.barContent}>
              <ActualiteIcon size={16} />
              <Text style={styles.barText}>Actualités</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bar}>
            <View style={styles.barContent}>
              <RecommandeIcon size={16} />
              <Text style={styles.barText}>Recommandé</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
          {/* INPUT POST */}
          <PostInput user={user} onPress={() => setIsModalVisible(true)} />

          {/* LISTE POSTS */}
          {loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#1e3a8a" />
              <Text style={{ marginTop: 10, color: '#666' }}>Chargement des publications...</Text>
            </View>
          ) : (
            <FlatList
              data={posts}
              renderItem={({ item }) => <PostCard post={item} onCommentPress={handleCommentPress} />}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#1e3a8a"
                  colors={["#1e3a8a"]}
                />
              }
            />
          )}
        </View>
      </SafeAreaView>

      {/* FAB - Positionné hors du SafeAreaView pour être absolument positionné */}
      <FAB />

      {/* CREATE POST MODAL */}
      <CreatePostModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleCreatePost}
        user={user}
      />

      {/* COMMENTS MODAL */}
      <CommentsModal
        visible={isCommentsVisible}
        onClose={() => {
          setIsCommentsVisible(false);
          setSelectedPost(null);
        }}
        postId={selectedPost?.id || ''}
        postAuthor={selectedPost?.name || ''}
        comments={comments}
        onAddComment={handleAddComment}
        currentUser={user}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Header styles (adaptés du dashboard)
  headerGradient: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerLeft: {
    width: 50,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },

  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },

  subtitle: {
    color: '#cbd5f5',
    fontSize: 14,
    marginTop: 2,
  },

  headerRight: {
    width: 80,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },

  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  barsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  bar: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    marginHorizontal: 5,
  },

  barContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  barText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e3a8a',
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Post Input full width
  postBox: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 0, // ❗ important
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e3a8a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  debugLog: {
    fontSize: 10,
    color: 'red',
    marginBottom: 5,
  },
  avatarTest: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarTestText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  avatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  placeholder: {
    marginLeft: 10,
    fontSize: 16,
    color: '#666',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  lightBtn: {
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 20,
    paddingHorizontal: 20,
  },
  primaryBtn: {
    backgroundColor: '#1e3a8a',
    padding: 10,
    borderRadius: 20,
    paddingHorizontal: 20,
  },

  // Post Card (full width feed)
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1e293b',
  },
  date: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  postText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#222',
    marginVertical: 10,
  },
  tags: {
    fontSize: 14,
    color: '#2563eb',
    marginBottom: 10,
  },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    padding: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 80, // Augmenté pour éviter la barre de navigation
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1e3a8a',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    zIndex: 1000, // Assurer qu'il est au-dessus des autres éléments
  },

  // Média styles
  mediaContainer: {
    marginVertical: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  mediaVideo: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
});
