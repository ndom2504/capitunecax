import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useCapiSession } from '../../context/CapiContext';
import type { CapiMotif, CapiService } from '../../lib/api';

// Catalogue de services par motif
function buildServices(motif: CapiMotif, complexite?: string): CapiService[] {
  const isComplex = complexite === 'elevee';
  const immigration: CapiService[] = [
    { id: 'analyse', nom: 'Analyse stratégique du profil', description: 'Étude complète de votre dossier, recommandations personnalisées et plan d\'action.', categorie: 'immigration', priorite: 'obligatoire', prixEstime: 299, devise: 'CAD', selected: true },
    { id: 'preparation', nom: 'Montage et préparation du dossier', description: 'Collecte, vérification et organisation complète de tous vos documents.', categorie: 'immigration', priorite: 'obligatoire', prixEstime: 699, devise: 'CAD', selected: true },
    { id: 'soumission', nom: 'Soumission de la demande', description: 'Dépôt officiel de la demande auprès de l\'IRCC ou Québec.', categorie: 'immigration', priorite: 'obligatoire', prixEstime: 499, devise: 'CAD', selected: true },
    { id: 'traduction', nom: 'Traduction certifiée', description: 'Traduction officielle de vos documents par un traducteur agréé.', categorie: 'immigration', priorite: 'recommande', prixEstime: 150, devise: 'CAD', selected: false },
    { id: 'coaching_langue', nom: 'Coaching IELTS / TEF', description: 'Préparation aux tests de langue pour maximiser votre score.', categorie: 'immigration', priorite: motif === 'residence_permanente' ? 'recommande' : 'optionnel', prixEstime: 350, devise: 'CAD', selected: false },
    { id: 'suivi', nom: 'Suivi administratif mensuel', description: 'Réponses aux demandes d\'information et suivi de l\'avancement.', categorie: 'immigration', priorite: 'recommande', prixEstime: 149, devise: 'CAD', selected: false },
    ...(isComplex ? [{ id: 'recours', nom: 'Gestion d\'un recours / appel', description: 'Représentation et préparation en cas de refus ou d\'appel.', categorie: 'immigration' as const, priorite: 'optionnel' as const, prixEstime: 1200, devise: 'CAD', selected: false }] : []),
  ];
  const installation: CapiService[] = [
    { id: 'logement', nom: 'Recherche de logement', description: 'Aide à la recherche d\'un appartement et mise en relation avec des propriétaires.', categorie: 'installation', priorite: 'recommande', prixEstime: 199, devise: 'CAD', selected: false },
    { id: 'accueil', nom: 'Accueil à l\'aéroport', description: 'Prise en charge à l\'arrivée et accompagnement vers votre logement temporaire.', categorie: 'installation', priorite: 'optionnel', prixEstime: 99, devise: 'CAD', selected: false },
    { id: 'banque', nom: 'Ouverture compte bancaire', description: 'Accompagnement pour ouvrir votre premier compte canadien.', categorie: 'installation', priorite: 'recommande', prixEstime: 0, devise: 'CAD', selected: false },
    { id: 'assurance', nom: 'Assurance santé privée', description: 'Souscription à une assurance santé en attendant la couverture provinciale.', categorie: 'installation', priorite: 'recommande', prixEstime: 89, devise: 'CAD', selected: false },
    { id: 'nas', nom: 'Inscription NAS & impôts', description: 'Aide à l\'obtention du Numéro d\'Assurance Sociale et première déclaration.', categorie: 'installation', priorite: 'recommande', prixEstime: 79, devise: 'CAD', selected: false },
    { id: 'emploi', nom: 'Coaching emploi', description: 'CV canadien, préparation entretiens, réseau professionnel local.', categorie: 'installation', priorite: 'optionnel', prixEstime: 249, devise: 'CAD', selected: false },
  ];
  return [...immigration, ...installation];
}

const PRIORITE_CFG = {
  obligatoire: { label: 'Obligatoire', color: Colors.error, bg: '#fee2e2' },
  recommande:  { label: 'Recommandé', color: Colors.warning, bg: '#fef3c7' },
  optionnel:   { label: 'Optionnel', color: Colors.textMuted, bg: Colors.border },
};

export default function CapiServicesScreen() {
  const router = useRouter();
  const { session, updateSession } = useCapiSession();
  const motif = session.motif ?? 'visiter';

  const [services, setServices] = useState<CapiService[]>(() =>
    buildServices(motif, session.evaluation?.complexite),
  );

  const toggle = (id: string) => {
    setServices(prev => prev.map(s =>
      s.id === id && s.priorite !== 'obligatoire' ? { ...s, selected: !s.selected } : s,
    ));
  };

  const selected = services.filter(s => s.selected);
  const total = selected.reduce((sum, s) => sum + (s.prixEstime ?? 0), 0);

  const immigrationServices = services.filter(s => s.categorie === 'immigration');
  const installationServices = services.filter(s => s.categorie === 'installation');

  const next = () => {
    updateSession({ services, step: 6 });
    router.push('/capi/timeline');
  };

  const renderService = (service: CapiService) => {
    const cfg = PRIORITE_CFG[service.priorite];
    const isObl = service.priorite === 'obligatoire';
    return (
      <TouchableOpacity
        key={service.id}
        style={[styles.serviceCard, service.selected && styles.serviceCardSelected]}
        onPress={() => toggle(service.id)}
        activeOpacity={isObl ? 1 : 0.85}
      >
        <View style={styles.serviceTop}>
          <View style={styles.serviceTitleRow}>
            <Text style={styles.serviceName} numberOfLines={2}>{service.nom}</Text>
            <View style={[styles.checkbox, service.selected && styles.checkboxSelected]}>
              {service.selected && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
          </View>
          <Text style={styles.serviceDesc}>{service.description}</Text>
        </View>
        <View style={styles.serviceMeta}>
          <View style={[styles.prioriteBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.prioriteText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          <Text style={styles.servicePrice}>
            {(service.prixEstime ?? 0) === 0 ? 'Gratuit' : `${service.prixEstime} ${service.devise}`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.progressBarOuter}>
          <View style={[styles.progressBarInner, { width: '62.5%' }]} />
        </View>
        <Text style={styles.stepLabel}>5 / 8</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.capiHeader}>
          <View style={styles.capiAvatar}><Text style={styles.capiEmoji}>🤖</Text></View>
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>Voici les services adaptés à votre projet. Les services <Text style={{ color: Colors.error, fontWeight: '600' }}>obligatoires</Text> sont présélectionnés. Ajoutez ce dont vous avez besoin.</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>🧾 Services Immigration</Text>
        <View style={styles.list}>{immigrationServices.map(renderService)}</View>

        <Text style={styles.sectionTitle}>🏠 Services d'Installation</Text>
        <View style={styles.list}>{installationServices.map(renderService)}</View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer avec total */}
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Estimation totale</Text>
          <Text style={styles.totalAmount}>{total.toLocaleString()} $ CAD</Text>
        </View>
        <TouchableOpacity style={styles.nextBtn} onPress={next} activeOpacity={0.85}>
          <Text style={styles.nextBtnText}>Voir ma timeline</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.dark },
  scroll: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  progressBarOuter: { flex: 1, height: 4, backgroundColor: Colors.border, borderRadius: 2 },
  progressBarInner: { height: 4, backgroundColor: Colors.orange, borderRadius: 2 },
  stepLabel: { fontSize: 12, color: Colors.textMuted, minWidth: 32 },
  capiHeader: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 12, alignItems: 'flex-start' },
  capiAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.orange + '25', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  capiEmoji: { fontSize: 22 },
  bubble: { flex: 1, backgroundColor: Colors.surface, borderRadius: 16, borderTopLeftRadius: 4, padding: 14 },
  bubbleText: { fontSize: 14, color: Colors.text, lineHeight: 21 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, paddingHorizontal: 20, marginBottom: 10, marginTop: 4 },
  list: { paddingHorizontal: 20, gap: 10, marginBottom: 8 },
  serviceCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: Colors.border },
  serviceCardSelected: { borderColor: Colors.orange, backgroundColor: Colors.orange + '06' },
  serviceTop: { marginBottom: 10 },
  serviceTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  serviceName: { fontSize: 14, fontWeight: '600', color: Colors.text, flex: 1 },
  serviceDesc: { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  serviceMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prioriteBadge: { borderRadius: 20, paddingVertical: 3, paddingHorizontal: 10 },
  prioriteText: { fontSize: 11, fontWeight: '600' },
  servicePrice: { fontSize: 13, fontWeight: '700', color: Colors.text },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  checkboxSelected: { backgroundColor: Colors.orange, borderColor: Colors.orange },
  footer: { padding: 20, paddingBottom: 28, gap: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 13, color: Colors.textMuted },
  totalAmount: { fontSize: 18, fontWeight: '800', color: Colors.orange },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.orange, borderRadius: 14, paddingVertical: 16, gap: 8 },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
