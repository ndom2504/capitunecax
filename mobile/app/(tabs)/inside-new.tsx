import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  Alert,
  Dimensions,
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

// Types pour les publications
type Post = {
  id: string;
  author: {
    name: string;
    avatar?: string;
    role: 'client' | 'pro' | 'admin';
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  attachments?: Array<{
    type: 'image' | 'video' | 'document';
    url: string;
    name: string;
  }>;
  tags?: string[];
};

// Types pour les stories
type Story = {
  id: string;
  author: {
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  viewed: boolean;
};

// Header de la page
function Header() {
  const router = useRouter();
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <View style={headerStyles.container}>
      <View style={headerStyles.left}>
        <Text style={headerStyles.title}>INSIDE</Text>
        <Text style={headerStyles.subtitle}>Communauté Capitune</Text>
      </View>
      
      <View style={headerStyles.right}>
        <TouchableOpacity 
          style={headerStyles.menuButton}
          onPress={() => setShowMenu(!showMenu)}
        >
          <Ionicons name="people" size={20} color="#fff" />
        </TouchableOpacity>
        
        {showMenu && (
          <View style={headerStyles.menu}>
            <TouchableOpacity 
              style={headerStyles.menuItem}
              onPress={() => {
                setShowMenu(false);
                router.push('/(tabs)/messagerie');
              }}
            >
              <Ionicons name="mail" size={16} color="#333" />
              <Text style={headerStyles.menuText}>Messagerie</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={headerStyles.menuItem}
              onPress={() => {
                setShowMenu(false);
                router.push('/(tabs)/documents');
              }}
            >
              <Ionicons name="folder" size={16} color="#333" />
              <Text style={headerStyles.menuText}>Documents</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={headerStyles.menuItem}
              onPress={() => {
                setShowMenu(false);
                router.push('/(tabs)/profil');
              }}
            >
              <Ionicons name="person" size={16} color="#333" />
              <Text style={headerStyles.menuText}>Profil</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// Stories horizontaux
function Stories() {
  const stories: Story[] = [
    {
      id: '1',
      author: { name: 'Marie Laurent', avatar: undefined },
      content: 'Nouvelle procédure de visa express disponible !',
      timestamp: 'Il y a 2h',
      viewed: false,
    },
    {
      id: '2',
      author: { name: 'Jean Dupont', avatar: undefined },
      content: 'Conseils pour la préparation du dossier CSQ',
      timestamp: 'Il y a 4h',
      viewed: true,
    },
    {
      id: '3',
      author: { name: 'Ahmed Touré', avatar: undefined },
      content: 'Mon expérience d\'immigration réussie 🇨🇦🇸',
      timestamp: 'Il y a 6h',
      viewed: false,
    },
  ];

  return (
    <View style={storiesStyles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={storiesStyles.scrollView}
      >
        {stories.map((story) => (
          <View key={story.id} style={storiesStyles.story}>
            <View style={storiesStyles.avatar}>
              {story.author.avatar ? (
                <Image source={{ uri: story.author.avatar }} style={storiesStyles.avatarImage} />
              ) : (
                <View style={[storiesStyles.avatarPlaceholder, { backgroundColor: Colors.primary }]}>
                  <Text style={storiesStyles.avatarText}>
                    {story.author.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <Text style={storiesStyles.storyText}>{story.content}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// Composant Post
function PostComponent({ post }: { post: Post }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    // TODO: Appeler l'API pour liker
  };

  const handleComment = () => {
    setShowComments(!showComments);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: post.content,
        title: 'Publication Capitune',
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de partager cette publication');
    }
  };

  return (
    <View style={postStyles.container}>
      {/* Header du post */}
      <View style={postStyles.header}>
        <View style={postStyles.authorInfo}>
          <View style={postStyles.avatar}>
            {post.author.avatar ? (
              <Image source={{ uri: post.author.avatar }} style={postStyles.avatarImage} />
            ) : (
              <View style={[postStyles.avatarPlaceholder, { backgroundColor: Colors.primary }]}>
                <Text style={postStyles.avatarText}>
                  {post.author.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={postStyles.authorDetails}>
            <Text style={postStyles.authorName}>{post.author.name}</Text>
            <Text style={postStyles.timestamp}>{post.timestamp}</Text>
            <View style={postStyles.roleBadge}>
              <Text style={postStyles.roleText}>
                {post.author.role === 'pro' ? 'PRO' : 
                 post.author.role === 'admin' ? 'ADMIN' : 'CLIENT'}
              </Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity style={postStyles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={16} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Contenu du post */}
      <Text style={postStyles.content}>{post.content}</Text>

      {/* Attachements */}
      {post.attachments && post.attachments.length > 0 && (
        <View style={postStyles.attachments}>
          {post.attachments.map((attachment, index) => (
            <View key={index} style={postStyles.attachment}>
              {attachment.type === 'image' && (
                <Image source={{ uri: attachment.url }} style={postStyles.attachmentImage} />
              )}
              {attachment.type === 'video' && (
                <View style={postStyles.videoPlaceholder}>
                  <Ionicons name="play" size={24} color="#fff" />
                  <Text style={postStyles.videoText}>VIDEO</Text>
                </View>
              )}
              {attachment.type === 'document' && (
                <TouchableOpacity style={postStyles.document}>
                  <Ionicons name="document" size={20} color="#143FA8" />
                  <Text style={postStyles.documentText}>{attachment.name}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <View style={postStyles.tags}>
          {post.tags.map((tag, index) => (
            <View key={index} style={postStyles.tag}>
              <Text style={postStyles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={postStyles.actions}>
        <TouchableOpacity 
          style={[postStyles.actionButton, liked && postStyles.actionButtonLiked]} 
          onPress={handleLike}
        >
          <Ionicons name={liked ? "heart" : "heart-outline"} size={16} color={liked ? "#e74c3c" : "#666"} />
          <Text style={postStyles.actionText}>{post.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={postStyles.actionButton} 
          onPress={handleComment}
        >
          <Ionicons name="chatbubble" size={16} color="#666" />
          <Text style={postStyles.actionText}>{post.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={postStyles.actionButton} 
          onPress={handleShare}
        >
          <Ionicons name="share" size={16} color="#666" />
          <Text style={postStyles.actionText}>{post.shares}</Text>
        </TouchableOpacity>
      </View>

      {/* Section commentaires */}
      {showComments && (
        <View style={postStyles.commentsSection}>
          <Text style={postStyles.commentsTitle}>Commentaires</Text>
          {/* TODO: Implémenter les commentaires */}
          <View style={postStyles.noComments}>
            <Text style={postStyles.noCommentsText}>Les commentaires arrivent bientôt...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// Bouton flottant pour créer
function FloatingActionButton() {
  const router = useRouter();
  const { user } = useAuth();

  const handlePress = () => {
    if (user?.account_type === 'client') {
      // Client : poser des questions
      router.push('/(tabs)/messagerie');
    } else if (user?.account_type === 'pro') {
      // Pro : publier conseils
      router.push('/(tabs)/inside?action=publish');
    } else if (user?.account_type === 'admin') {
      // Admin : publier annonce
      router.push('/(tabs)/inside?action=admin');
    }
  };

  return (
    <TouchableOpacity 
      style={fabStyles.container}
      onPress={handlePress}
    >
      <Text style={fabStyles.text}>+</Text>
    </TouchableOpacity>
  );
}

export default function InsidePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Simuler des données de démonstration
  useEffect(() => {
    const demoPosts: Post[] = [
      {
        id: '1',
        author: {
          name: 'Jean Dupont',
          role: 'pro',
          avatar: undefined,
        },
        content: 'Conseils importants pour la préparation de votre dossier CSQ. N\'hésitez pas à demander de l\'aide si besoin. Je suis disponible pour vous accompagner dans vos démarches. #immigration #CSQ #conseils',
        timestamp: 'Il y a 30 minutes',
        likes: 24,
        comments: 8,
        shares: 12,
        attachments: [
          { type: 'document', url: 'https://example.com/doc.pdf', name: 'Guide_CSQ.pdf' }
        ],
        tags: ['conseils', 'CSQ', 'immigration'],
      },
      {
        id: '2',
        author: {
          name: 'Marie Laurent',
          role: 'admin',
          avatar: undefined,
        },
        content: '📢 ANNONCE IMPORTANTE : Nouvelle procédure de visa express disponible dès demain ! Prenez rendez-vous sur notre plateforme pour les dépôts. Contactez notre support pour plus d\'informations. #visa #express #annonce',
        timestamp: 'Il y a 1 heure',
        likes: 45,
        comments: 15,
        shares: 28,
        tags: ['annonce', 'visa', 'express'],
      },
      {
        id: '3',
        author: {
          name: 'Ahmed Touré',
          role: 'client',
          avatar: undefined,
        },
        content: 'Bonjour à tous, je cherche des conseils pour ma demande d\'immigration au Québec. Quelqu\'un a-t-il déjà passé par cette procédure ? Merci d\'avance pour votre aide ! #aide #québec #immigration',
        timestamp: 'Il y a 2 heures',
        likes: 8,
        comments: 3,
        shares: 2,
        tags: ['aide', 'québec', 'immigration'],
      },
    ];

    setTimeout(() => {
      setPosts(demoPosts);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={Colors.primary} />
      
      {/* Header */}
      <Header />

      {/* Stories */}
      <Stories />

      {/* Feed principal */}
      <ScrollView style={styles.feed}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <PostComponent post={item} />}
            contentContainerStyle={styles.feedContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </ScrollView>

      {/* Bouton flottant */}
      <FloatingActionButton />
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});

// Styles du header
const headerStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
  },
  left: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
    marginTop: 4,
  },
  right: {
    position: 'relative',
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  menu: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    minWidth: 150,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  menuText: {
    color: '#333',
    fontSize: 14,
    marginLeft: 8,
  },
});

// Styles des stories
const storiesStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  scrollView: {
    paddingHorizontal: 15,
  },
  story: {
    alignItems: 'center',
    marginRight: 15,
    minWidth: 120,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    borderWidth: 3,
    borderColor: Colors.primary,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  storyText: {
    fontSize: 12,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
});

// Styles des posts
const postStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: Colors.primary,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  roleText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  moreButton: {
    padding: 4,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 15,
  },
  attachments: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  attachment: {
    width: (screenWidth - 60) / 2,
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  videoPlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  document: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
  },
  documentText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    minWidth: 80,
  },
  actionButtonLiked: {
    backgroundColor: '#fee2e2',
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  commentsSection: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  noComments: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noCommentsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});

// Styles du bouton flottant
const fabStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
    zIndex: 1000,
  },
  text: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
});
