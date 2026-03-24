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
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (content: string, tags?: string, media?: MediaFile[], location?: LocationData, link?: string) => Promise<void>;
  user?: {
    name?: string | null;
    avatar?: string | null;
  } | null;
}

interface MediaFile {
  uri: string;
  type: 'image' | 'video';
}

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export default function CreatePostModal({ visible, onClose, onSubmit, user }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [link, setLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const insets = useSafeAreaInsets();

  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0) {
      Alert.alert('Erreur', 'Veuillez écrire quelque chose ou ajouter un média avant de publier');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim(), tags.trim(), mediaFiles.length > 0 ? mediaFiles : undefined, location || undefined, link || undefined);
      resetForm();
      onClose();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de publier le post. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setContent('');
    setTags('');
    setLink('');
    setMediaFiles([]);
    setLocation(null);
    setShowLinkInput(false);
  };

  const handleClose = () => {
    if (content.trim() || tags.trim() || mediaFiles.length > 0 || link) {
      Alert.alert(
        'Abandonner ?',
        'Votre publication sera perdue.',
        [
          { text: 'Continuer', style: 'cancel' },
          { 
            text: 'Abandonner', 
            style: 'destructive',
            onPress: () => {
              resetForm();
              onClose();
            }
          },
        ]
      );
    } else {
      onClose();
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder aux photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 4,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newFiles: MediaFile[] = result.assets.map(asset => ({
        uri: asset.uri,
        type: 'image',
      }));
      setMediaFiles(prev => [...prev, ...newFiles].slice(0, 4));
    }
  };

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder aux vidéos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newFile: MediaFile = {
        uri: result.assets[0].uri,
        type: 'video',
      };
      setMediaFiles(prev => [...prev, newFile].slice(0, 4));
    }
  };

  const addLink = () => {
    if (link.trim()) {
      setShowLinkInput(false);
    }
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à votre localisation.');
      return;
    }

    try {
      const currentLocation = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      const locationData: LocationData = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        address: address[0] ? `${address[0].city}, ${address[0].country}` : undefined,
      };
      setLocation(locationData);
      Alert.alert('Localisation ajoutée', locationData.address || 'Position actuelle');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'obtenir votre localisation.');
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeLocation = () => {
    setLocation(null);
  };

  const removeLink = () => {
    setLink('');
    setShowLinkInput(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
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
            <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Nouvelle publication</Text>
            
            <TouchableOpacity 
              onPress={handleSubmit} 
              style={[styles.headerButton, styles.publishButton]}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.publishText}>Publier</Text>
              )}
            </TouchableOpacity>
          </LinearGradient>

          {/* CONTENT */}
          <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
            {/* USER INFO */}
            <View style={styles.userInfo}>
              <Image 
                source={user?.avatar ? { uri: user.avatar } : require('../assets/icons/inside.png')} 
                style={styles.avatar} 
              />
              <Text style={styles.userName}>{user?.name || 'Utilisateur'}</Text>
            </View>

            {/* TEXT INPUT */}
            <TextInput
              style={styles.textInput}
              placeholder="Quoi de neuf ?"
              placeholderTextColor="#999"
              multiline
              maxLength={500}
              value={content}
              onChangeText={setContent}
              autoFocus
            />

            {/* TAGS INPUT */}
            <TextInput
              style={styles.tagsInput}
              placeholder="#Tags (séparés par des espaces)"
              placeholderTextColor="#999"
              value={tags}
              onChangeText={setTags}
            />

            {/* LINK INPUT */}
            {showLinkInput && (
              <View style={styles.linkContainer}>
                <TextInput
                  style={styles.linkInput}
                  placeholder="https://..."
                  placeholderTextColor="#999"
                  value={link}
                  onChangeText={setLink}
                  autoCapitalize="none"
                  keyboardType="url"
                />
                <TouchableOpacity onPress={addLink} style={styles.linkAddBtn}>
                  <Ionicons name="checkmark" size={20} color="#1e3a8a" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowLinkInput(false)} style={styles.linkCancelBtn}>
                  <Ionicons name="close" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            )}

            {/* LINK PREVIEW */}
            {link && !showLinkInput && (
              <View style={styles.linkPreview}>
                <Ionicons name="link" size={16} color="#1e3a8a" />
                <Text style={styles.linkText} numberOfLines={1}>{link}</Text>
                <TouchableOpacity onPress={removeLink}>
                  <Ionicons name="close-circle" size={18} color="#666" />
                </TouchableOpacity>
              </View>
            )}

            {/* LOCATION PREVIEW */}
            {location && (
              <View style={styles.locationPreview}>
                <Ionicons name="location" size={16} color="#1e3a8a" />
                <Text style={styles.locationText} numberOfLines={1}>{location.address || 'Position actuelle'}</Text>
                <TouchableOpacity onPress={removeLocation}>
                  <Ionicons name="close-circle" size={18} color="#666" />
                </TouchableOpacity>
              </View>
            )}

            {/* MEDIA PREVIEW */}
            {mediaFiles.length > 0 && (
              <View style={styles.mediaContainer}>
                {mediaFiles.map((file, index) => (
                  <View key={index} style={styles.mediaItem}>
                    <Image source={{ uri: file.uri }} style={styles.mediaImage} />
                    <TouchableOpacity 
                      style={styles.removeMediaBtn} 
                      onPress={() => removeMedia(index)}
                    >
                      <Ionicons name="close-circle" size={22} color="#fff" />
                    </TouchableOpacity>
                    {file.type === 'video' && (
                      <View style={styles.videoIndicator}>
                        <Ionicons name="play" size={16} color="#fff" />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* CHARACTER COUNT */}
            <Text style={styles.charCount}>{content.length}/500</Text>

            {/* ACTION BUTTONS */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionBtn} onPress={pickImage}>
                <Ionicons name="image-outline" size={24} color="#1e3a8a" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={pickVideo}>
                <Ionicons name="videocam-outline" size={24} color="#1e3a8a" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setShowLinkInput(true)}>
                <Ionicons name="link-outline" size={24} color="#1e3a8a" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={getLocation}>
                <Ionicons name="location-outline" size={24} color="#1e3a8a" />
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    backgroundColor: '#fff',
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
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  publishButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  publishText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  textInput: {
    fontSize: 18,
    color: '#1f2937',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  tagsInput: {
    fontSize: 16,
    color: '#2563eb',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginBottom: 8,
  },
  charCount: {
    textAlign: 'right',
    color: '#999',
    fontSize: 12,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
    gap: 20,
  },
  actionBtn: {
    padding: 8,
  },

  // Link styles
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },

  linkInput: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    paddingVertical: 10,
  },

  linkAddBtn: {
    padding: 8,
    marginLeft: 8,
  },

  linkCancelBtn: {
    padding: 8,
  },

  linkPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },

  linkText: {
    flex: 1,
    fontSize: 14,
    color: '#1e3a8a',
  },

  // Location styles
  locationPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },

  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#166534',
  },

  // Media styles
  mediaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },

  mediaItem: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },

  mediaImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  removeMediaBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },

  videoIndicator: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    padding: 4,
  },
});
