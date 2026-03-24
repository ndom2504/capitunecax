import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface Comment {
  id: string;
  author: string;
  avatar?: string;
  text: string;
  date: string;
  likes: number;
  liked?: boolean;
}

interface CommentsModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  postAuthor: string;
  comments: Comment[];
  onAddComment: (text: string) => Promise<void>;
  onLikeComment?: (commentId: string) => void;
  currentUser?: {
    name?: string | null;
    avatar?: string | null;
  } | null;
}

export default function CommentsModal({
  visible,
  onClose,
  postId,
  postAuthor,
  comments,
  onAddComment,
  onLikeComment,
  currentUser,
}: CommentsModalProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment('');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter le commentaire.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <Image
        source={item.avatar ? { uri: item.avatar } : require('../assets/icons/inside.png')}
        style={styles.commentAvatar}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>{item.author}</Text>
          <Text style={styles.commentDate}>{item.date}</Text>
        </View>
        <Text style={styles.commentText}>{item.text}</Text>
        <View style={styles.commentActions}>
          <TouchableOpacity
            style={styles.commentAction}
            onPress={() => onLikeComment?.(item.id)}
          >
            <Ionicons
              name={item.liked ? 'heart' : 'heart-outline'}
              size={14}
              color={item.liked ? '#ef4444' : '#666'}
            />
            <Text style={[styles.commentActionText, item.liked && styles.likedText]}>
              {item.likes}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.commentAction}>
            <Text style={styles.commentActionText}>Répondre</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={[styles.overlay, { paddingTop: insets.top }]}>
          {/* HEADER */}
          <LinearGradient
            colors={['#1e3a8a', '#143FA8']}
            style={styles.header}
          >
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Commentaires</Text>
            <View style={styles.headerButton} />
          </LinearGradient>

          {/* COMMENTS LIST */}
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.commentsList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Aucun commentaire</Text>
                <Text style={styles.emptySubtext}>
                  Soyez le premier à commenter cette publication
                </Text>
              </View>
            }
          />

          {/* INPUT */}
          <View style={[styles.inputContainer, { paddingBottom: Math.max(16, insets.bottom) }]}>
            <Image
              source={currentUser?.avatar ? { uri: currentUser.avatar } : require('../assets/icons/inside.png')}
              style={styles.inputAvatar}
            />
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Ajouter un commentaire..."
                placeholderTextColor="#999"
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
                onPress={handleSubmit}
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  commentsList: {
    padding: 16,
    flexGrow: 1,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  commentDate: {
    fontSize: 12,
    color: '#999',
  },
  commentText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentActionText: {
    fontSize: 12,
    color: '#666',
  },
  likedText: {
    color: '#ef4444',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    maxHeight: 80,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e3a8a',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});
