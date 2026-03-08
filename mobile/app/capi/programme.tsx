import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { CapiAvatar } from '../../components/CapiAvatar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { UI } from '../../constants/UI';
import { useCapiSession } from '../../context/CapiContext';
import type { CapiMotif } from '../../lib/api';

type Programme = {
  id: string;
  titre: string;
  description: string;
  delai: string;
  complexite: 'faible' | 'moyenne' | 'elevee';
  conditions: string[];
};

const PROGRAMMES_BY_MOTIF: Record<CapiMotif, Programme[]> = {
  visiter: [
    { id: 'ave', titre: 'Autorisation de voyage électronique (AVE)', description: "Pour les ressortissants de pays exemptés de visa.", delai: '72h', complexite: 'faible', conditions: ['Passeport pays éligible', 'Pas de refus antérieur'] },
    { id: 'visa_visiteur', titre: 'Visa de visiteur', description: 'Pour séjourner au Canada jusqu\'à 6 mois.', delai: '2-8 semaines', complexite: 'faible', conditions: ['Liens avec pays d\'origine', 'Fonds suffisants'] },
    { id: 'super_visa', titre: 'Super Visa parents/grands-parents', description: 'Séjour de 5 ans renouvelable pour famille.', delai: '4-8 semaines', complexite: 'moyenne', conditions: ['Invitation enfant/petit-enfant canadien', 'Assurance santé privée'] },
  ],
  travailler: [
    { id: 'pvt', titre: 'Programme Vacances-Travail (PVT)', description: 'Pour les 18-35 ans de pays participants.', delai: '4-8 semaines', complexite: 'faible', conditions: ['Âge 18-35 ans', 'Pays participant', 'Fonds suffisants'] },
    { id: 'permis_ferme', titre: 'Permis de travail fermé (offre d\'emploi)', description: 'Lié à un employeur canadien spécifique.', delai: '4-6 semaines', complexite: 'moyenne', conditions: ['Offre d\'emploi valide', 'EIMT si requis'] },
    { id: 'lmia_exempt', titre: 'Permis EIMT exempté', description: 'Transfert intra-entreprise, accords internationaux.', delai: '2-4 semaines', complexite: 'faible', conditions: ['Accord ACEUMC / intra-entreprise'] },
  ],
  etudier: [
    { id: 'permis_etudiant', titre: 'Permis d\'étudiant', description: 'Pour études à temps plein dans un établissement désigné (EFD).', delai: '4-12 semaines', complexite: 'faible', conditions: ['Lettre d\'admission EFD', 'Preuve de fonds', 'Bonne santé'] },
    { id: 'etuvc', titre: 'Programme ÉTVC (extension campus)', description: 'Permet de travailler sur campus et hors campus.', delai: 'Avec permis d\'étudiant', complexite: 'faible', conditions: ['Permis d\'étudiant valide'] },
  ],
  residence_permanente: [
    { id: 'entree_express', titre: 'Entrée Express', description: 'Programme fédéral basé sur un système de points (CRS).', delai: '6 mois', complexite: 'moyenne', conditions: ['Score CRS suffisant', 'Expérience professionnelle', 'Compétences linguistiques'] },
    { id: 'pnp', titre: 'Programme des Nominees Provinciaux (PNP)', description: 'Nomination par une province selon ses besoins.', delai: '12-18 mois', complexite: 'moyenne', conditions: ['Lien avec une province', 'Compétences recherchées'] },
    { id: 'rnip', titre: 'Programme Rural et du Nord (RNIP)', description: 'Pour les communautés rurales désignées.', delai: '12-24 mois', complexite: 'moyenne', conditions: ['Offre d\'emploi admissible', 'Intention de s\'établir'] },
    { id: 'aip', titre: 'Programme des aides familiaux résidants (AIP)', description: 'Pour les soignants au domicile.', delai: '12-24 mois', complexite: 'moyenne', conditions: ['Expérience soins', 'Diplôme secondaire'] },
  ],
  famille: [
    { id: 'parrainage_conjoint', titre: 'Parrainage — Conjoint/Partenaire', description: 'Résidence permanente pour époux/épouse ou partenaire.', delai: '12 mois (au Canada)', complexite: 'moyenne', conditions: ['Répondant citoyen ou RP canadien', 'Relation authentique'] },
    { id: 'parrainage_enfant', titre: 'Parrainage — Enfant à charge', description: 'Pour enfants biologiques ou adoptés de moins de 22 ans.', delai: '12-18 mois', complexite: 'faible', conditions: ['Moins de 22 ans', 'Non marié / sans enfant'] },
    { id: 'parrainage_parents', titre: 'Parrainage — Parents et grands-parents', description: 'Via la loterie annuelle PGP.', delai: '24-48 mois', complexite: 'elevee', conditions: ['Invitation via loterie', 'Revenus répondant suffisants'] },
  ],
  entreprendre: [
    { id: 'startup_visa', titre: 'Visa Démarrage (Start-up Visa)', description: 'Pour entrepreneurs avec soutien d\'organisation désignée.', delai: '12-16 mois', complexite: 'elevee', conditions: ['Lettre de soutien organisation désignée', 'Niveau linguistique CLN 5'] },
    { id: 'pnp_entrepreneur', titre: 'PNP Voie Entrepreneuriale', description: 'Investissement dans une province (ex: MPNP Entrepreneurs).', delai: '18-36 mois', complexite: 'elevee', conditions: ['Capital d\'investissement', 'Expérience entrepreneuriale'] },
  ],
  regularisation: [
    { id: 'asile_en_ligne', titre: 'Demande d’asile au Canada — depuis le Canada', description: 'Démarche de protection internationale si vous êtes déjà au Canada (selon admissibilité).', delai: '18-36 mois', complexite: 'elevee', conditions: ['Présence au Canada', 'Conditions et délais variables (à vérifier)'] },
    { id: 'asile_frontiere', titre: 'Demande d’asile au Canada — à l’arrivée (point d’entrée)', description: 'Démarche à un point d’entrée (aéroport, port maritime ou frontière terrestre) lorsque vous arrivez au Canada (selon admissibilité).', delai: 'Variable', complexite: 'elevee', conditions: ['Demande à l’arrivée au Canada', 'Conditions et exceptions possibles (à vérifier)'] },
    { id: 'retablissement_statut', titre: 'Rétablissement de statut', description: 'Si votre statut a expiré récemment, certaines démarches peuvent exister pour le rétablir (selon délais et admissibilité).', delai: '4-12 semaines', complexite: 'moyenne', conditions: ['Statut expiré récemment', 'Délai et conditions variables (à vérifier)'] },
    { id: 'ch', titre: 'Motifs d\'ordre humanitaire (CH)', description: 'Demande basée sur l\'intérêt supérieur des enfants ou situation exceptionnelle.', delai: '24-48 mois', complexite: 'elevee', conditions: ['Établissement au Canada', 'Appel fondé en droit'] },
    { id: 'appel_spr', titre: 'Appel — Section d\'appel des réfugiés (SAR)', description: 'Appel d\'une décision de refus de statut de réfugié.', delai: '12-24 mois', complexite: 'elevee', conditions: ['Décision SPR défavorable', 'Délai 15 jours (intérieur)'] },
  ],
};

// Programmes spécifiques lorsque l'utilisateur est déjà au Canada (Inland)
const INLAND_PROGRAMMES_BY_MOTIF: Partial<Record<CapiMotif, Programme[]>> = {
  etudier: [
    {
      id: 'imm5709',
      titre: 'Prorogation du permis d’études (IMM 5709)',
      description: 'Prolonger/renouveler un permis d’études depuis le Canada (preuve de progression, fonds, etc.).',
      delai: '4–12 semaines',
      complexite: 'moyenne',
      conditions: ['Être au Canada', 'Déposer avant expiration (statut maintenu)'],
    },
  ],
  travailler: [
    {
      id: 'ptpd',
      titre: 'Permis de travail post‑diplôme (PTPD) — IMM 5710',
      description: 'Transition étudiant → travailleur après la fin des études (délai 180 jours).',
      delai: '2–5 mois',
      complexite: 'moyenne',
      conditions: ['Fin d’études', 'Déposer dans les 180 jours', 'Statut valide ou rétabli'],
    },
    {
      id: 'changement_employeur',
      titre: 'Changement d’employeur (permis fermé) — IMM 5710',
      description: 'Modifier les conditions du permis pour un nouvel employeur (souvent avec EIMT ou dispense).',
      delai: '1–4 mois',
      complexite: 'elevee',
      conditions: ['Nouveau contrat', 'EIMT/dispense au besoin', 'Ne pas commencer avant approbation (sauf exception)'],
    },
  ],
  visiter: [
    {
      id: 'imm5708',
      titre: 'Fiche visiteur (Visitor Record) — IMM 5708',
      description: 'Prolonger un séjour visiteur au‑delà de 6 mois depuis le Canada.',
      delai: '4–12 semaines',
      complexite: 'faible',
      conditions: ['Être au Canada', 'Fonds et justification', 'Déposer avant expiration'],
    },
  ],
};

const COMPLEXITE_CFG = {
  faible:  { label: 'Faible', color: Colors.success },
  moyenne: { label: 'Moyen', color: Colors.warning },
  elevee:  { label: 'Élevée', color: Colors.error },
};

export default function CapiProgrammeScreen() {
  const router = useRouter();
  const { session, updateSession } = useCapiSession();
  const [selected, setSelected] = useState<string | null>(session.programme ?? null);

  const motif = session.motif ?? 'visiter';
  const where = session.where ?? 'outside';
  const programmes = useMemo(() => {
    if (where === 'inside') {
      const inland = INLAND_PROGRAMMES_BY_MOTIF[motif];
      if (inland && inland.length) return inland;
    }
    return PROGRAMMES_BY_MOTIF[motif] ?? [];
  }, [motif, where]);

  const next = () => {
    if (!selected) return;
    updateSession({ programme: selected, step: 3 });
    router.push('/capi/profil');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.progressBarOuter}>
          <View style={[styles.progressBarInner, { width: '25%' }]} />
        </View>
        <Text style={styles.stepLabel}>2 / 8</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.capiHeader}>
          <CapiAvatar size={44} state="idle" />
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>Basé sur votre objectif, voici les programmes immigration qui correspondent. Lequel vous intéresse ?</Text>
          </View>
        </View>

        <Text style={styles.question}>Choisissez votre programme</Text>

        <View style={styles.list}>
          {programmes.map(p => {
            const isSelected = selected === p.id;
            const cfg = COMPLEXITE_CFG[p.complexite];
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => setSelected(p.id)}
                activeOpacity={0.85}
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardTitleRow}>
                    <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]} numberOfLines={2}>{p.titre}</Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color={Colors.orange} />}
                  </View>
                  <Text style={styles.cardDesc}>{p.description}</Text>
                </View>
                <View style={styles.cardMeta}>
                  <View style={styles.metaChip}>
                    <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{p.delai}</Text>
                  </View>
                  <View style={[styles.metaChip, { backgroundColor: cfg.color + '20' }]}>
                    <Text style={[styles.metaText, { color: cfg.color }]}>Complexité {cfg.label}</Text>
                  </View>
                </View>
                <View style={styles.conditions}>
                  {p.conditions.map((c, i) => (
                    <View key={i} style={styles.condRow}>
                      <Ionicons name="checkmark" size={12} color={Colors.textMuted} />
                      <Text style={styles.condText}>{c}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, !selected && styles.nextBtnDisabled]}
          onPress={next}
          disabled={!selected}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>Continuer</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgLight },
  scroll: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  progressBarOuter: { flex: 1, height: 4, backgroundColor: Colors.border, borderRadius: 2 },
  progressBarInner: { height: 4, backgroundColor: Colors.orange, borderRadius: 2 },
  stepLabel: { fontSize: 12, color: Colors.textMuted, minWidth: 32 },
  capiHeader: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20, gap: 12, alignItems: 'flex-start' },

  bubble: { flex: 1, backgroundColor: Colors.surface, borderRadius: 16, borderTopLeftRadius: 4, padding: 14 },
  bubbleText: { fontSize: 14, color: Colors.text, lineHeight: 21 },
  question: { fontSize: 20, fontWeight: '700', color: Colors.text, paddingHorizontal: 20, marginBottom: 16 },
  list: { paddingHorizontal: 20, gap: 12 },
  card: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: Colors.border, ...UI.cardShadow },
  cardSelected: { borderColor: Colors.orange, backgroundColor: Colors.orange + '08' },
  cardTop: { marginBottom: 10 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, flex: 1 },
  cardTitleSelected: { color: Colors.orange },
  cardDesc: { fontSize: 13, color: Colors.textMuted, lineHeight: 19 },
  cardMeta: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.border, borderRadius: 20, paddingVertical: 3, paddingHorizontal: 8 },
  metaText: { fontSize: 11, color: Colors.textMuted },
  conditions: { gap: 4 },
  condRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  condText: { fontSize: 12, color: Colors.textSecondary },
  footer: { padding: 20, paddingBottom: 28 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.orange, borderRadius: 14, paddingVertical: 16, gap: 8 },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
