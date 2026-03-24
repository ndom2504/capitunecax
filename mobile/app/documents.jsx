import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

// Types pour les documents
const DocumentStatus = {
  PENDING: 'pending',
  UPLOADED: 'uploaded', 
  VALIDATED: 'validated',
  REJECTED: 'rejected'
};

const DocumentCategory = {
  PASSPORT: 'passport',
  DIPLOMA: 'diploma',
  FINANCIAL: 'financial',
  OTHER: 'other'
};

const mockDocuments = [
  {
    id: '1',
    category: 'passport',
    name: 'Passeport',
    status: 'uploaded',
    fileName: 'passport.pdf',
    uploadedAt: '2024-03-15',
    required: true,
  },
  {
    id: '2',
    category: 'diploma',
    name: 'Diplômes',
    status: 'validated',
    fileName: 'diplome_bac.pdf',
    uploadedAt: '2024-03-14',
    required: true,
  },
  {
    id: '3',
    category: 'financial',
    name: 'Preuves financières',
    status: 'rejected',
    fileName: 'bank_statement.pdf',
    uploadedAt: '2024-03-13',
    comment: 'Solde insuffisant, merci de fournir un relevé plus récent',
    required: true,
  },
  {
    id: '4',
    category: 'other',
    name: 'Lettre de motivation',
    status: 'pending',
    required: false,
  },
];

export default function DocumentsScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState(mockDocuments);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadDocuments();
  }, [token]);

  const loadDocuments = async () => {
    try {
      // TODO: API call
      console.log('Loading documents...');
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDocuments();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'validated': return Colors.success;
      case 'uploaded': return Colors.textSecondary;
      case 'rejected': return Colors.error;
      case 'pending': return Colors.warning;
      default: return Colors.textMuted;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'validated': return '✅ Validé';
      case 'uploaded': return '⏳ En attente de validation';
      case 'rejected': return '❌ À corriger';
      case 'pending': return '📄 À téléverser';
      default: return 'Inconnu';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'passport': return 'card';
      case 'diploma': return 'school';
      case 'financial': return 'cash';
      case 'other': return 'document';
      default: return 'document';
    }
  };

  const getCategoryName = (category) => {
    switch (category) {
      case 'passport': return 'Passeport';
      case 'diploma': return 'Diplômes';
      case 'financial': return 'Preuves financières';
      case 'other': return 'Autres';
      default: return 'Autres';
    }
  };

  const getProgressPercentage = () => {
    const requiredDocs = documents.filter(doc => doc.required);
    const validatedDocs = requiredDocs.filter(doc => doc.status === 'validated');
    return requiredDocs.length > 0 ? Math.round((validatedDocs.length / requiredDocs.length) * 100) : 0;
  };

  const getFilteredDocuments = () => {
    if (selectedCategory === 'all') return documents;
    return documents.filter(doc => doc.category === selectedCategory);
  };

  const handleUpload = (documentId: string) => {
    Alert.alert(
      'Téléverser un document',
      'Choisissez le fichier à téléverser',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Choisir un fichier', 
          onPress: () => {
            // TODO: Implement file picker
            console.log('Upload document:', documentId);
          }
        }
      ]
    );
  };

  const renderDocumentCard = (document) => {
    const statusColor = getStatusColor(document.status);
    const categoryIcon = getCategoryIcon(document.category);

    return (
      <View key={document.id} style={styles.documentCard}>
        <View style={styles.documentHeader}>
          <View style={styles.documentInfo}>
            <View style={[styles.documentIcon, { backgroundColor: Colors.primary + '20' }]}>
              <Ionicons name={categoryIcon} size={20} color={Colors.primary} />
            </View>
            <View style={styles.documentTitle}>
              <Text style={styles.documentName}>{document.name}</Text>
              {document.required && (
                <Text style={styles.requiredText}>Obligatoire</Text>
              )}
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{getStatusText(document.status)}</Text>
          </View>
        </View>

        {document.fileName && (
          <View style={styles.documentDetails}>
            <Text style={styles.fileName}>{document.fileName}</Text>
            {document.uploadedAt && (
              <Text style={styles.uploadDate}>
                Téléversé le {new Date(document.uploadedAt).toLocaleDateString('fr-FR')}
              </Text>
            )}
          </View>
        )}

        {document.comment && (
          <View style={styles.commentBox}>
            <Ionicons name="information-circle" size={16} color={Colors.warning} />
            <Text style={styles.commentText}>{document.comment}</Text>
          </View>
        )}

        <View style={styles.documentActions}>
          {document.status === 'pending' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.uploadButton]}
              onPress={() => handleUpload(document.id)}
            >
              <Ionicons name="cloud-upload" size={16} color="white" />
              <Text style={styles.actionButtonText}>Téléverser</Text>
            </TouchableOpacity>
          )}
          
          {document.status === 'rejected' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.reuploadButton]}
              onPress={() => handleUpload(document.id)}
            >
              <Ionicons name="refresh" size={16} color="white" />
              <Text style={styles.actionButtonText}>Téléverser à nouveau</Text>
            </TouchableOpacity>
          )}
          
          {document.fileName && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.viewButton]}
              onPress={() => {
                // TODO: Implement document viewer
                console.log('View document:', document.fileName);
              }}
            >
              <Ionicons name="eye" size={16} color={Colors.primary} />
              <Text style={[styles.actionButtonText, { color: Colors.primary }]}>Voir</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderCategoryFilter = () => {
    const categories = ['all', 'passport', 'diploma', 'financial', 'other'];
    
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipSelected
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            {category === 'all' ? (
              <Ionicons name="apps" size={16} color={selectedCategory === category ? 'white' : Colors.primary} />
            ) : (
              <Ionicons name={categoryIcon} size={16} color={selectedCategory === category ? 'white' : Colors.primary} />
            )}
            <Text style={[
              styles.categoryText,
              selectedCategory === category && styles.categoryTextSelected
            ]}>
              {category === 'all' ? 'Tous' : getCategoryName(category)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const progress = getProgressPercentage();
  const filteredDocuments = getFilteredDocuments();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={[Colors.primary, Colors.dark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>📁 Mes Documents</Text>
            <Text style={styles.headerSubtitle}>Progression: {progress}%</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="help-circle" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {documents.filter(doc => doc.required && doc.status === 'validated').length} / {documents.filter(doc => doc.required).length} documents requis validés
          </Text>
        </View>
      </LinearGradient>

      {/* Category Filter */}
      {renderCategoryFilter()}

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Missing Documents Alert */}
        {documents.filter(doc => doc.required && doc.status !== 'validated').length > 0 && (
          <View style={styles.alertBox}>
            <Ionicons name="warning" size={20} color={Colors.warning} />
            <Text style={styles.alertText}>
              {documents.filter(doc => doc.required && doc.status !== 'validated').length} document(s) requis manquant(s)
            </Text>
          </View>
        )}

        {/* Documents List */}
        <View style={styles.documentsContainer}>
          {filteredDocuments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open" size={64} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Aucun document</Text>
              <Text style={styles.emptyDescription}>
                {selectedCategory === 'all' 
                  ? 'Aucun document requis pour le moment'
                  : `Aucun document dans la catégorie ${getCategoryName(selectedCategory)}`}
              </Text>
            </View>
          ) : (
            filteredDocuments.map(renderDocumentCard)
          )}
        </View>

        {/* Upload Button */}
        <View style={styles.uploadSection}>
          <TouchableOpacity style={styles.uploadAllButton}>
            <Ionicons name="add-circle" size={24} color="white" />
            <Text style={styles.uploadAllText}>Ajouter un document</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgLight,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  notificationButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00FF9D',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  categoriesContainer: {
    backgroundColor: 'white',
    paddingVertical: 16,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  categoryChipSelected: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  categoryTextSelected: {
    color: 'white',
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '20',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  alertText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warning,
    marginLeft: 12,
  },
  documentsContainer: {
    padding: 20,
  },
  documentCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentTitle: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  requiredText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  documentDetails: {
    marginBottom: 12,
  },
  fileName: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  uploadDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  commentBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.warning + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  commentText: {
    fontSize: 14,
    color: Colors.warning,
    marginLeft: 8,
    flex: 1,
  },
  documentActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  uploadButton: {
    backgroundColor: Colors.primary,
  },
  reuploadButton: {
    backgroundColor: Colors.warning,
  },
  viewButton: {
    backgroundColor: Colors.primary + '20',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  uploadSection: {
    padding: 20,
    paddingBottom: 40,
  },
  uploadAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
  },
  uploadAllText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
});
