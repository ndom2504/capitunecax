import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types pour les projets
type ProjectMode = 'pro' | 'autonomous';
type ProjectStatus = 'created' | 'profile_filled' | 'advisor_selected' | 'subscribed' | 'documents_uploaded' | 'in_progress';

interface Project {
  id: string;
  title: string;
  mode: ProjectMode;
  status: ProjectStatus;
  budget: string;
  location: string;
  familySituation: string;
  goal: string;
  createdAt: string;
  advisor?: string;
}

// Mock data
const mockProjects: Project[] = [
  {
    id: '1',
    title: 'Projet Immigration Travail',
    mode: 'pro',
    status: 'profile_filled',
    budget: '$15,000',
    location: 'Hors Canada',
    familySituation: 'Seul',
    goal: 'Travail',
    createdAt: '2024-03-15',
  },
];

export default function ProjectsScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [token]);

  const loadProjects = async () => {
    try {
      // TODO: API call
      console.log('Loading projects...');
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'created': return Colors.warning;
      case 'profile_filled': return Colors.textSecondary;
      case 'advisor_selected': return Colors.primary;
      case 'subscribed': return Colors.success;
      case 'documents_uploaded': return Colors.success;
      case 'in_progress': return Colors.primary;
      default: return Colors.textMuted;
    }
  };

  const getStatusText = (status: ProjectStatus) => {
    switch (status) {
      case 'created': return 'Profil à compléter';
      case 'profile_filled': return 'Profil complété';
      case 'advisor_selected': return 'Conseiller choisi';
      case 'subscribed': return 'Abonnement actif';
      case 'documents_uploaded': return 'Documents envoyés';
      case 'in_progress': return 'Dossier en cours';
      default: return 'Statut inconnu';
    }
  };

  const getNextAction = (project: Project) => {
    switch (project.status) {
      case 'created':
        return { text: 'Compléter mon profil', icon: 'person', route: '/projects/create-profile' };
      case 'profile_filled':
        if (project.mode === 'pro') {
          return { text: 'Choisir un conseiller', icon: 'people', route: '/team' };
        } else {
          return { text: 'Voir les recommandations', icon: 'bulb', route: '/projects/recommendations' };
        }
      case 'advisor_selected':
        return { text: "S'abonner pour continuer", icon: 'card', route: '/subscription' };
      case 'subscribed':
        return { text: 'Envoyer mes documents', icon: 'document', route: '/documents' };
      case 'documents_uploaded':
        return { text: 'Suivre mon dossier', icon: 'chatbubble', route: '/messages' };
      default:
        return { text: 'Voir les détails', icon: 'eye', route: `/projects/${project.id}` };
    }
  };

  const renderProjectCard = (project: Project) => {
    const nextAction = getNextAction(project);
    const statusColor = getStatusColor(project.status);
    
    return (
      <View key={project.id} style={styles.projectCard}>
        <View style={styles.projectHeader}>
          <View style={styles.projectTitle}>
            <Text style={styles.projectName}>{project.title}</Text>
            <Text style={styles.projectDate}>Créé le {new Date(project.createdAt).toLocaleDateString('fr-FR')}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{getStatusText(project.status)}</Text>
          </View>
        </View>

        <View style={styles.projectDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="briefcase" size={16} color={Colors.textMuted} />
            <Text style={styles.detailText}>Mode: {project.mode === 'pro' ? '🏢 Professionnel' : '🚀 Autonomie guidée'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="cash" size={16} color={Colors.textMuted} />
            <Text style={styles.detailText}>Budget: {project.budget}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={16} color={Colors.textMuted} />
            <Text style={styles.detailText}>Lieu: {project.location}</Text>
          </View>
        </View>

        <View style={styles.projectActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryAction]}
            onPress={() => router.push(nextAction.route)}
          >
            <Ionicons name={nextAction.icon} size={20} color="white" />
            <Text style={styles.actionText}>{nextAction.text}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryAction]}
            onPress={() => router.push(`/projects/${project.id}`)}
          >
            <Ionicons name="settings" size={20} color={Colors.primary} />
            <Text style={[styles.actionText, { color: Colors.primary }]}>Modifier</Text>
          </TouchableOpacity>
        </View>

        {/* Upsell PRO button for autonomous users */}
        {project.mode === 'autonomous' && project.status !== 'subscribed' && (
          <TouchableOpacity style={styles.upsellButton}>
            <Ionicons name="rocket" size={16} color={Colors.primary} />
            <Text style={styles.upsellText}>Passer en mode PRO 🚀</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={[Colors.primary, Colors.dark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcomeText}>Mes Projets</Text>
            <Text style={styles.userName}>{user?.name || 'Utilisateur'}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Create new project button */}
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add-circle" size={24} color={Colors.primary} />
          <Text style={styles.createButtonText}>Créer un nouveau projet</Text>
        </TouchableOpacity>

        {/* Projects list */}
        {projects.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucun projet créé</Text>
            <Text style={styles.emptyDescription}>
              Commencez par créer votre premier projet d'immigration
            </Text>
          </View>
        ) : (
          <View style={styles.projectsContainer}>
            {projects.map(renderProjectCard)}
          </View>
        )}
      </ScrollView>

      {/* Create project modal */}
      {showCreateModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choisissez votre mode</Text>
            
            <TouchableOpacity 
              style={styles.modeButton}
              onPress={() => {
                setShowCreateModal(false);
                router.push('/projects/create-profile?mode=pro');
              }}
            >
              <View style={styles.modeIcon}>
                <Ionicons name="business" size={32} color={Colors.primary} />
              </View>
              <View style={styles.modeContent}>
                <Text style={styles.modeTitle}>🏢 Professionnel</Text>
                <Text style={styles.modeDescription}>Accompagnement personnalisé par un expert</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modeButton}
              onPress={() => {
                setShowCreateModal(false);
                router.push('/projects/create-profile?mode=autonomous');
              }}
            >
              <View style={styles.modeIcon}>
                <Ionicons name="rocket" size={32} color={Colors.success} />
              </View>
              <View style={styles.modeContent}>
                <Text style={styles.modeTitle}>🚀 Autonomie guidée</Text>
                <Text style={styles.modeDescription}>Self-service avec outils intégrés</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 10,
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 4,
  },
  notificationButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  scrollView: {
    flex: 1,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
  },
  emptyDescription: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  projectsContainer: {
    padding: 20,
  },
  projectCard: {
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
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  projectTitle: {
    flex: 1,
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  projectDate: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  projectDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  projectActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
  },
  primaryAction: {
    backgroundColor: Colors.primary,
  },
  secondaryAction: {
    backgroundColor: Colors.primary + '20',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  upsellButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary + '10',
  },
  upsellText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.bgLight,
    marginBottom: 12,
  },
  modeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modeContent: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  cancelButton: {
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: Colors.textMuted,
    fontWeight: '600',
  },
});
