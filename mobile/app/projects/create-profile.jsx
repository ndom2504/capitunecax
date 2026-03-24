import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ProjectMode = 'pro' | 'autonomous';

interface ProfileData {
  location: 'inside' | 'outside';
  goal: 'work' | 'study' | 'family' | 'business' | 'residence';
  budget: string;
  familySituation: 'single' | 'couple' | 'family';
  timeline: '3months' | '6months' | '1year' | 'flexible';
}

export default function CreateProfileScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const mode = (params.mode as ProjectMode) || 'autonomous';
  
  const [profileData, setProfileData] = useState<ProfileData>({
    location: 'outside',
    goal: 'work',
    budget: '$10,000-$20,000',
    familySituation: 'single',
    timeline: '6months',
  });

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    
    try {
      // TODO: API call to save profile and create project
      console.log('Saving profile:', { mode, ...profileData });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Projet créé !',
        'Votre projet d\'immigration a été créé avec succès.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/projects')
          }
        ]
      );
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Erreur', 'Impossible de créer votre projet. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const renderOption = (key: keyof ProfileData, value: string, label: string, icon: string) => {
    const isSelected = profileData[key] === value;
    
    return (
      <TouchableOpacity
        key={value}
        style={[
          styles.optionCard,
          isSelected && styles.optionCardSelected
        ]}
        onPress={() => setProfileData({ ...profileData, [key]: value })}
      >
        <View style={styles.optionContent}>
          <View style={[styles.optionIcon, isSelected && styles.optionIconSelected]}>
            <Ionicons 
              name={icon as any} 
              size={20} 
              color={isSelected ? 'white' : Colors.primary} 
            />
          </View>
          <Text style={[
            styles.optionText,
            isSelected && styles.optionTextSelected
          ]}>
            {label}
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
        )}
      </TouchableOpacity>
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
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Créer mon profil</Text>
            <Text style={styles.headerSubtitle}>
              Mode {mode === 'pro' ? '🏢 Professionnel' : '🚀 Autonomie guidée'}
            </Text>
          </View>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Où êtes-vous actuellement ?</Text>
          <View style={styles.optionsContainer}>
            {renderOption('location', 'outside', 'Je suis HORS Canada', 'globe')}
            {renderOption('location', 'inside', 'Je suis DÉJÀ au Canada', 'flag')}
          </View>
        </View>

        {/* Goal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Quel est votre objectif ?</Text>
          <View style={styles.optionsContainer}>
            {renderOption('goal', 'work', 'Travail', 'briefcase')}
            {renderOption('goal', 'study', 'Études', 'school')}
            {renderOption('goal', 'family', 'Famille', 'people')}
            {renderOption('goal', 'business', 'Affaires', 'business')}
            {renderOption('goal', 'residence', 'Résidence permanente', 'home')}
          </View>
        </View>

        {/* Budget */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Budget estimé</Text>
          <View style={styles.optionsContainer}>
            {renderOption('budget', '$5,000-$10,000', '$5,000 - $10,000', 'cash')}
            {renderOption('budget', '$10,000-$20,000', '$10,000 - $20,000', 'wallet')}
            {renderOption('budget', '$20,000+', '$20,000+', 'card')}
          </View>
        </View>

        {/* Family Situation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Situation familiale</Text>
          <View style={styles.optionsContainer}>
            {renderOption('familySituation', 'single', 'Seul(e)', 'person')}
            {renderOption('familySituation', 'couple', 'En couple', 'heart')}
            {renderOption('familySituation', 'family', 'Avec enfants', 'happy')}
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Quand souhaitez-vous partir ?</Text>
          <View style={styles.optionsContainer}>
            {renderOption('timeline', '3months', 'Dans 3 mois', 'calendar')}
            {renderOption('timeline', '6months', 'Dans 6 mois', 'calendar-number')}
            {renderOption('timeline', '1year', 'Dans 1 an', 'calendar-outline')}
            {renderOption('timeline', 'flexible', 'Flexible', 'repeat')}
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>📋 Résumé de votre projet</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Mode:</Text>
              <Text style={styles.summaryValue}>
                {mode === 'pro' ? '🏢 Professionnel' : '🚀 Autonomie guidée'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Lieu:</Text>
              <Text style={styles.summaryValue}>
                {profileData.location === 'inside' ? 'Déjà au Canada' : 'Hors Canada'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Objectif:</Text>
              <Text style={styles.summaryValue}>
                {profileData.goal === 'work' ? 'Travail' :
                 profileData.goal === 'study' ? 'Études' :
                 profileData.goal === 'family' ? 'Famille' :
                 profileData.goal === 'business' ? 'Affaires' : 'Résidence'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Budget:</Text>
              <Text style={styles.summaryValue}>{profileData.budget}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Situation:</Text>
              <Text style={styles.summaryValue}>
                {profileData.familySituation === 'single' ? 'Seul(e)' :
                 profileData.familySituation === 'couple' ? 'En couple' : 'Avec enfants'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Délai:</Text>
              <Text style={styles.summaryValue}>
                {profileData.timeline === '3months' ? 'Dans 3 mois' :
                 profileData.timeline === '6months' ? 'Dans 6 mois' :
                 profileData.timeline === '1year' ? 'Dans 1 an' : 'Flexible'}
              </Text>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.saveButtonText}>Création en cours...</Text>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.saveButtonText}>Enregistrer et créer mon projet</Text>
              </>
            )}
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
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionCardSelected: {
    backgroundColor: Colors.primary + '15',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionIconSelected: {
    backgroundColor: Colors.primary,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  summarySection: {
    padding: 20,
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: Colors.bgLight,
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: 18,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
});
