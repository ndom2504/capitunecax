import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { CapiAvatar } from '../../components/CapiAvatar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { UI } from '../../constants/UI';
import { useCapiSession } from '../../context/CapiContext';
import type { CapiEvaluation, CapiProfileData, VisiteurPlan } from '../../lib/api';
import { computeMotifPlan, MotifPlanView } from './motif-plans';
import { getPaysParCode } from '../../lib/pays-data';

// ── Calcul plan détaillé VISA VISITEUR ──────────────────────────────────────

const REGION_BILLETS: Record<string, string> = {
  afrique:      '900 – 1 500 $',
  europe:       '500 – 900 $',
  moyen_orient: '650 – 1 100 $',
  asie:         '700 – 1 200 $',
  ameriques:    '300 – 700 $',
  autre:        '600 – 1 200 $',
};

const REGION_LABEL: Record<string, string> = {
  afrique:      'Afrique',
  europe:       'Europe',
  moyen_orient: 'Moyen-Orient',
  asie:         'Asie',
  ameriques:    'Amériques',
  autre:        'Autre région',
};

const BILLET_MID: Record<string, number> = {
  afrique: 1200, europe: 700, moyen_orient: 875, asie: 950,
  ameriques: 500, autre: 900,
};

function computeVisiteurPlan(profile: CapiProfileData): VisiteurPlan {
  const n      = Math.max(1, profile.nombrePersonnes ?? 1);
  const jours  = Math.max(1, profile.dureeSejour ?? 14);
  const region = profile.paysResidence ?? 'autre';

  // Données spécifiques au pays sélectionné
  const paysInfo = profile.paysCode ? getPaysParCode(profile.paysCode) : null;
  const fraisVisaPays   = paysInfo?.fraisVisa    ?? 100;
  const fraisBiomPays   = paysInfo?.fraisBiometrie ?? 85;
  const crdvVille       = paysInfo?.crdv ?? profile.crdvVille ?? 'Centre VFS Global le plus proche';
  const notesPays       = paysInfo?.note;
  // Examen médical : si pays marqué à risque OU séjour > 180 jours
  const examenMedical   = (paysInfo?.examMedicalRisque ?? false) || jours > 180;
  const coutExamen      = examenMedical ? '150 – 300 $ par personne' : 'Non requis';

  const fraisVisa       = fraisVisaPays;
  const fraisBiom       = fraisBiomPays;
  const fraisBiomTotal  = fraisBiom * n;

  const budgetJour      = 120;
  const totalSejour     = budgetJour * jours * n;

  const billetMid       = BILLET_MID[region] ?? 900;
  const totalBillets    = billetMid * n;
  const fourchetteBill  = REGION_BILLETS[region] ?? '600 – 1 200 $';
  const envoiPasseport  = '20 – 50 $ (CRDV)';

  let fondMin = 5000;
  if (n === 2) fondMin = 8000;
  else if (n >= 3 && n <= 4) fondMin = 12000;
  else if (n >= 5) fondMin = 15000;

  const totalEstimatif = (fraisVisa * n) + fraisBiomTotal + totalSejour + totalBillets;

  const documents = [
    'Passeport valide (+ 6 mois après la date de retour)',
    'Photos format immigration (35 × 45 mm)',
    'Formulaire IMM5257 — Demande de visa visiteur',
    'Lettre d\'explication du voyage',
    'Preuve d\'emploi ou d\'activité professionnelle',
    'Relevés bancaires (6 derniers mois)',
    'Preuve de logement prévu au Canada',
    'Billet d\'avion ou réservation (aller-retour)',
  ];

  const documentsOptionnels = [
    'Lettre d\'invitation (si hébergé chez famille/amis)',
    'Preuve de propriété / attaches dans le pays d\'origine',
    'Assurance voyage internationale',
    ...(examenMedical ? ['Résultats examen médical (médecin agréé IRCC)'] : []),
  ];

  const conseils = [
    'Démontrez clairement votre intention de revenir dans votre pays d\'origine.',
    'Des relevés bancaires solides augmentent considérablement les chances d\'approbation.',
    'Rédigez une lettre d\'explication précise et structurée avec l\'itinéraire du voyage.',
    'Évitez les formulaires IMM5257 mal remplis — c\'est la première cause de refus.',
    profile.refusAnterieur
      ? '⚠️ Refus antérieur détecté : une lettre d\'explication détaillant les circonstances est indispensable.'
      : 'Aucun refus antérieur : votre profil part avec un avantage non négligeable.',
  ];

  return {
    nombrePersonnes: n,
    dureeSejour: jours,
    region,
    crdvVille,
    notesPays,
    fraisVisa,
    fraisBiometrie: fraisBiom,
    fraisBiometrieTotal: fraisBiomTotal,
    examenMedical,
    coutExamenMedical: coutExamen,
    budgetParJourParPersonne: budgetJour,
    totalBudgetSejour: totalSejour,
    fourchetteBillets: fourchetteBill,
    coutEnvoiPasseport: envoiPasseport,
    preuveFondsMin: fondMin,
    documents,
    documentsOptionnels,
    conseils,
    totalEstimatif,
  };
}

// ── Évaluation générique (tous motifs hors visiteur) ─────────────────────────
function computeEvaluation(profile: CapiProfileData): CapiEvaluation {
  if (profile.motif === 'visiter') {
    const visiteurPlan = computeVisiteurPlan(profile);
    const risques: string[] = [];
    const points: string[] = [];
    if (profile.refusAnterieur) risques.push('Refus antérieur — lettre d\'explication obligatoire');
    else points.push('Pas de refus antérieur — atout majeur');
    if ((visiteurPlan.dureeSejour ?? 0) > 90)
      risques.push('Séjour > 90 jours — justifications financières renforcées requises');
    else
      points.push('Durée de séjour raisonnable — facilite l\'approbation');
    points.push('Dossier complet préparé par Capitune');
    return {
      faisabilite: profile.refusAnterieur ? 62 : 78,
      complexite: profile.refusAnterieur ? 'moyenne' : 'faible',
      delaiEstime: '2 – 8 semaines',
      risques,
      points_forts: points,
      disclaimer: 'Les frais et délais sont indicatifs selon les barèmes IRCC 2024-2025. Un conseiller Capitune validera votre dossier avant toute soumission.',
      visiteurPlan,
    };
  }

  let score = 50;
  const risques: string[] = [];
  const points: string[] = [];

  const diplomes = ['Baccalauréat', 'Maîtrise', 'Doctorat'];
  if (diplomes.includes(profile.diplome ?? '')) { score += 10; points.push('Niveau d\'études élevé'); }
  else if (profile.diplome === 'Technique / DEP') { score += 5; }
  else { risques.push('Niveau de diplôme peu compétitif pour certains programmes'); }

  if ((profile.experience ?? 0) >= 3) { score += 10; points.push('Expérience professionnelle solide'); }
  else if ((profile.experience ?? 0) === 0) { risques.push('Aucune expérience professionnelle déclarée'); }

  const hasEn = (profile.langues ?? []).includes('Anglais');
  const hasFr = (profile.langues ?? []).includes('Français');
  if (hasEn && hasFr) { score += 15; points.push('Bilinguisme français-anglais — atout majeur'); }
  else if (hasEn || hasFr) { score += 8; points.push('Compétences linguistiques acceptables'); }
  else { score -= 5; risques.push('Absence de français ou anglais — obstacle critique'); }

  if (profile.refusAnterieur) { score -= 10; risques.push('Refus antérieur — justification requise'); }
  else { points.push('Pas de refus antérieur'); }

  if (profile.delai === 'urgent') { risques.push('Délai urgent — certains programmes nécessitent 6-24 mois'); score -= 5; }

  const clampedScore = Math.min(95, Math.max(20, score));
  let complexite: CapiEvaluation['complexite'] = 'moyenne';
  if (clampedScore >= 75) complexite = 'faible';
  else if (clampedScore < 50) complexite = 'elevee';

  const DELAI_LABELS: Record<string, string> = {
    travailler: '4-12 semaines',
    etudier: '4-12 semaines',
    residence_permanente: '6-24 mois',
    famille: '12-24 mois',
    entreprendre: '12-36 mois',
    regularisation: '12-48 mois',
  };

  const motifPlan = computeMotifPlan(profile);

  return {
    faisabilite: clampedScore,
    complexite,
    delaiEstime: DELAI_LABELS[profile.motif] ?? '6-12 mois',
    risques,
    points_forts: points,
    disclaimer: 'Cette analyse est indicative. Un conseiller Capitune validera votre profil avant toute soumission officielle.',
    motifPlan,
  };
}

// ── Composant Plan Visiteur ──────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={pStyles.card}>
      <Text style={pStyles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function FeeRow({ label, amount, highlight }: { label: string; amount: string; highlight?: boolean }) {
  return (
    <View style={pStyles.feeRow}>
      <Text style={pStyles.feeLabel}>{label}</Text>
      <Text style={[pStyles.feeAmount, highlight && pStyles.feeAmountHighlight]}>{amount}</Text>
    </View>
  );
}

function DocItem({ text, optional }: { text: string; optional?: boolean }) {
  return (
    <View style={pStyles.docItem}>
      <Ionicons
        name={optional ? 'add-circle-outline' : 'document-text-outline'}
        size={14}
        color={optional ? Colors.textMuted : Colors.primary}
      />
      <Text style={[pStyles.docText, optional && pStyles.docTextOptional]}>{text}</Text>
    </View>
  );
}

function VisiteurPlanView({ plan }: { plan: VisiteurPlan }) {
  const totalGouv = plan.fraisVisa * plan.nombrePersonnes + plan.fraisBiometrieTotal;
  const sejourLabel = plan.dureeSejour === 1 ? '1 jour' : `${plan.dureeSejour} jours`;

  return (
    <>
      {/* Résumé global */}
      <SectionCard title="📋 Résumé de votre dossier">
        <View style={pStyles.summaryGrid}>
          <View style={pStyles.summaryItem}>
            <Text style={pStyles.summaryValue}>
              {plan.nombrePersonnes} {plan.nombrePersonnes > 1 ? 'personnes' : 'personne'}
            </Text>
            <Text style={pStyles.summaryKey}>Voyageurs</Text>
          </View>
          <View style={pStyles.summaryItem}>
            <Text style={pStyles.summaryValue}>{sejourLabel}</Text>
            <Text style={pStyles.summaryKey}>Durée</Text>
          </View>
          <View style={pStyles.summaryItem}>
            <Text style={pStyles.summaryValue}>2–8 sem.</Text>
            <Text style={pStyles.summaryKey}>Délai traitement</Text>
          </View>
          <View style={pStyles.summaryItem}>
            <Text style={[pStyles.summaryValue, { color: Colors.orange }]}>
              {plan.totalEstimatif.toLocaleString()} $
            </Text>
            <Text style={pStyles.summaryKey}>Total estimé</Text>
          </View>
        </View>
      </SectionCard>

      {/* Frais gouvernementaux */}
      <SectionCard title="💰 Frais gouvernementaux">
        <FeeRow label={`Visa visiteur × ${plan.nombrePersonnes}`} amount={`${plan.fraisVisa * plan.nombrePersonnes} $ CAD`} />
        <View style={pStyles.feeDivider} />
        <FeeRow label={`Biométrie × ${plan.nombrePersonnes}`} amount={`${plan.fraisBiometrieTotal} $ CAD`} />
        {plan.examenMedical && (
          <>
            <View style={pStyles.feeDivider} />
            <FeeRow label="Examen médical" amount={plan.coutExamenMedical} />
          </>
        )}
        <View style={pStyles.feeDivider} />
        <FeeRow label="Envoi passeport (CRDV)" amount={plan.coutEnvoiPasseport} />
        <View style={pStyles.feeTotal}>
          <FeeRow label="Total frais obligatoires" amount={`${totalGouv} $ CAD`} highlight />
        </View>
      </SectionCard>

      {/* Biométrie */}
      <SectionCard title="🫆 Biométrie">
        <View style={pStyles.infoRow}>
          <Ionicons name="location-outline" size={15} color={Colors.textMuted} />
          <Text style={pStyles.infoText}>
            Centre : <Text style={pStyles.infoValue}>{plan.crdvVille ?? 'Centre VFS Global le plus proche'}</Text>
          </Text>
        </View>
        <View style={pStyles.infoRow}>
          <Ionicons name="time-outline" size={15} color={Colors.textMuted} />
          <Text style={pStyles.infoText}>Durée : <Text style={pStyles.infoValue}>10 à 15 minutes</Text></Text>
        </View>
        <View style={pStyles.infoRow}>
          <Ionicons name="shield-checkmark-outline" size={15} color={Colors.textMuted} />
          <Text style={pStyles.infoText}>Validité : <Text style={pStyles.infoValue}>10 ans</Text></Text>
        </View>
        <View style={pStyles.infoBanner}>
          <Text style={pStyles.infoBannerText}>
            Empreintes digitales + photo biométrique obligatoires pour toute première demande.
          </Text>
        </View>
        {plan.notesPays && (
          <View style={[pStyles.infoBanner, { backgroundColor: Colors.orange + '15', marginTop: 6 }]}>
            <Text style={[pStyles.infoBannerText, { color: Colors.orange }]}>
              {plan.notesPays}
            </Text>
          </View>
        )}
      </SectionCard>

      {/* Examen médical */}
      <SectionCard title={`🩺 Examen médical — ${plan.examenMedical ? 'Requis' : 'Non requis pour votre séjour'}`}>
        {plan.examenMedical ? (
          <>
            <Text style={pStyles.noteText}>
              {plan.dureeSejour > 180
                ? 'Séjour supérieur à 6 mois : examen médical obligatoire.'
                : 'Requis selon votre pays de résidence (liste IRCC des pays désignés).'}
            </Text>
            <View style={pStyles.infoRow}>
              <Ionicons name="cash-outline" size={15} color={Colors.textMuted} />
              <Text style={pStyles.infoText}>Coût moyen : <Text style={pStyles.infoValue}>{plan.coutExamenMedical}</Text></Text>
            </View>
            <View style={pStyles.infoRow}>
              <Ionicons name="medkit-outline" size={15} color={Colors.textMuted} />
              <Text style={pStyles.infoText}>Médecin agréé par l'IRCC requis.</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={pStyles.noteText}>Non obligatoire pour un séjour de {sejourLabel}.</Text>
            <Text style={pStyles.noteSubText}>Requis si : séjour {'>'} 6 mois, travail dans la santé, ou pays à risque sanitaire.</Text>
          </>
        )}
      </SectionCard>

      {/* Budget séjour */}
      <SectionCard title="🏨 Budget séjour estimé">
        <View style={pStyles.infoRow}>
          <Ionicons name="person-outline" size={15} color={Colors.textMuted} />
          <Text style={pStyles.infoText}>
            Référence : <Text style={pStyles.infoValue}>{plan.budgetParJourParPersonne} $ CAD / jour / personne</Text>
          </Text>
        </View>
        <View style={pStyles.feeDivider} />
        <FeeRow label={`${sejourLabel} × ${plan.nombrePersonnes} pers.`} amount={`${plan.totalBudgetSejour.toLocaleString()} $ CAD`} highlight />
      </SectionCard>

      {/* Billets d'avion */}
      <SectionCard title="✈️ Billet d'avion">
        <View style={pStyles.infoRow}>
          <Ionicons name="navigate-outline" size={15} color={Colors.textMuted} />
          <Text style={pStyles.infoText}>{REGION_LABEL[plan.region] ?? plan.region} → Canada</Text>
        </View>
        <View style={pStyles.feeTotal}>
          <FeeRow label="Fourchette par personne" amount={plan.fourchetteBillets} highlight />
        </View>
        <Text style={pStyles.noteSubText}>
          Réservation aller-retour confirmée exigée (ou réservation provisoire acceptable).
        </Text>
      </SectionCard>

      {/* Preuve de fonds */}
      <SectionCard title="🏦 Preuve de fonds recommandée">
        <Text style={pStyles.noteText}>Pour renforcer votre dossier :</Text>
        <View style={pStyles.feeTotal}>
          <FeeRow
            label={`${plan.nombrePersonnes} ${plan.nombrePersonnes > 1 ? 'personnes' : 'personne'} (minimum)`}
            amount={`${plan.preuveFondsMin.toLocaleString()} $ CAD`}
            highlight
          />
        </View>
        <View style={pStyles.infoRow}>
          <Ionicons name="time-outline" size={15} color={Colors.textMuted} />
          <Text style={pStyles.infoText}>Relevés bancaires : <Text style={pStyles.infoValue}>6 derniers mois</Text></Text>
        </View>
        <Text style={pStyles.noteSubText}>Plus vos fonds sont stables et élevés, plus le dossier est solide.</Text>
      </SectionCard>

      {/* Documents requis */}
      <SectionCard title="📁 Documents requis">
        {plan.documents.map((d, i) => <DocItem key={i} text={d} />)}
      </SectionCard>

      {/* Documents recommandés */}
      <SectionCard title="➕ Documents recommandés">
        {plan.documentsOptionnels.map((d, i) => <DocItem key={i} text={d} optional />)}
      </SectionCard>

      {/* Conseils Capitune */}
      <SectionCard title="💡 Conseils Capitune">
        {plan.conseils.map((c, i) => (
          <View key={i} style={pStyles.conseilRow}>
            <Ionicons name="bulb-outline" size={15} color={Colors.orange} style={{ marginTop: 2 }} />
            <Text style={pStyles.conseilText}>{c}</Text>
          </View>
        ))}
      </SectionCard>
    </>
  );
}

const pStyles = StyleSheet.create({
  card: {
    marginHorizontal: 20, backgroundColor: Colors.surface, borderRadius: 14,
    padding: 16, marginBottom: 12, ...UI.cardBorder, ...UI.cardShadow,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryItem: {
    flex: 1, minWidth: '44%', backgroundColor: Colors.bgLight, borderRadius: 10,
    padding: 12, alignItems: 'center',
  },
  summaryValue: { fontSize: 16, fontWeight: '800', color: Colors.text },
  summaryKey: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  feeLabel: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  feeAmount: { fontSize: 13, fontWeight: '600', color: Colors.text },
  feeAmountHighlight: { color: Colors.orange, fontSize: 15, fontWeight: '800' },
  feeDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 6 },
  feeTotal: { marginTop: 10, backgroundColor: Colors.orange + '10', borderRadius: 10, padding: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  infoText: { fontSize: 13, color: Colors.textMuted, flex: 1, lineHeight: 18 },
  infoValue: { color: Colors.text, fontWeight: '600' },
  infoBanner: { backgroundColor: Colors.primary + '15', borderRadius: 8, padding: 10, marginTop: 8 },
  infoBannerText: { fontSize: 12, color: Colors.primary, lineHeight: 17 },
  noteText: { fontSize: 13, color: Colors.textSecondary, marginBottom: 8, lineHeight: 18 },
  noteSubText: { fontSize: 12, color: Colors.textMuted, marginTop: 6, lineHeight: 17, fontStyle: 'italic' },
  docItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 7 },
  docText: { fontSize: 13, color: Colors.textSecondary, flex: 1, lineHeight: 18 },
  docTextOptional: { color: Colors.textMuted },
  conseilRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  conseilText: { fontSize: 13, color: Colors.textSecondary, flex: 1, lineHeight: 18 },
});

const COMPLEXITE_CFG = {
  faible:  { label: 'Faible', color: Colors.success, bg: '#dcfce7' },
  moyenne: { label: 'Moyen', color: Colors.warning, bg: '#fef3c7' },
  elevee:  { label: 'Élevée', color: Colors.error, bg: '#fee2e2' },
};

function ScoreCircle({ value }: { value: number }) {
  const color = value >= 70 ? Colors.success : value >= 50 ? Colors.warning : Colors.error;
  return (
    <View style={[scoreStyles.circle, { borderColor: color }]}>
      <Text style={[scoreStyles.value, { color }]}>{value}%</Text>
      <Text style={scoreStyles.label}>Faisabilité</Text>
    </View>
  );
}
const scoreStyles = StyleSheet.create({
  circle: { width: 110, height: 110, borderRadius: 55, borderWidth: 6, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface },
  value: { fontSize: 28, fontWeight: '800' },
  label: { fontSize: 11, color: Colors.textMuted },
});

export default function CapiEvaluationScreen() {
  const router = useRouter();
  const { session, updateSession } = useCapiSession();
  const [evaluation, setEvaluation] = useState<CapiEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const isVisiteur = session.motif === 'visiter';

  useEffect(() => {
    const timer = setTimeout(() => {
      if (session.profile) {
        const result = computeEvaluation(session.profile);
        setEvaluation(result);
        updateSession({ evaluation: result });
      } else {
        // Session perdue (reload) → retour au début CAPI
        router.replace('/capi');
      }
      setLoading(false);
    }, 900);
    return () => clearTimeout(timer);
  }, []);

  const next = () => { router.push('/capi/services'); };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.progressBarOuter}>
          <View style={[styles.progressBarInner, { width: '50%' }]} />
        </View>
        <Text style={styles.stepLabel}>4 / 8</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.orange} />
          <Text style={styles.loadingText}>
            {isVisiteur ? 'CAPI prépare votre plan visiteur…' : 'CAPI analyse votre profil…'}
          </Text>
          <Text style={styles.loadingSubtext}>
            {isVisiteur ? 'Calcul des frais, documents et budget' : 'Calcul de votre score de faisabilité'}
          </Text>
        </View>
      ) : evaluation ? (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Message CAPI */}
          <View style={styles.capiHeader}>
            <CapiAvatar size={44} state="idle" />
            <View style={styles.bubble}>
              <Text style={styles.bubbleText}>
                {isVisiteur
                  ? `Voici votre plan complet pour le visa visiteur — frais, documents, budget et conseils, calculés pour ${evaluation.visiteurPlan?.nombrePersonnes ?? 1} personne(s) et ${evaluation.visiteurPlan?.dureeSejour ?? 14} jours.`
                  : 'J\'ai analysé votre profil ! Voici le résultat de mon évaluation :'}
              </Text>
            </View>
          </View>

          {/* Score + complexité */}
          <View style={styles.scoreRow}>
            <ScoreCircle value={evaluation.faisabilite} />
            <View style={styles.scoreRight}>
              <View style={[styles.complexiteBadge, { backgroundColor: COMPLEXITE_CFG[evaluation.complexite].bg }]}>
                <Text style={[styles.complexiteText, { color: COMPLEXITE_CFG[evaluation.complexite].color }]}>
                  Complexité {COMPLEXITE_CFG[evaluation.complexite].label}
                </Text>
              </View>
              <View style={styles.delaiRow}>
                <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
                <Text style={styles.delaiText}>Délai : <Text style={{ color: Colors.text, fontWeight: '600' }}>{evaluation.delaiEstime}</Text></Text>
              </View>
            </View>
          </View>

          {/* Points forts */}
          {evaluation.points_forts.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>✅ Points forts</Text>
              {evaluation.points_forts.map((p, i) => (
                <View key={i} style={styles.listRow}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.listText}>{p}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Risques */}
          {evaluation.risques.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>⚠️ Points d'attention</Text>
              {evaluation.risques.map((r, i) => (
                <View key={i} style={styles.listRow}>
                  <Ionicons name="alert-circle" size={16} color={Colors.warning} />
                  <Text style={styles.listText}>{r}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Plan détaillé VISITEUR */}
          {isVisiteur && evaluation.visiteurPlan && (
            <VisiteurPlanView plan={evaluation.visiteurPlan} />
          )}

          {/* Plan détaillé tous autres motifs */}
          {!isVisiteur && session.profile && (
            <MotifPlanView plan={computeMotifPlan(session.profile)} />
          )}

          {/* Disclaimer */}
          <View style={styles.disclaimer}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.disclaimerText}>{evaluation.disclaimer}</Text>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      ) : null}

      {!loading && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.nextBtn} onPress={next} activeOpacity={0.85}>
            <Text style={styles.nextBtnText}>Voir les services recommandés</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  loadingText: { fontSize: 16, fontWeight: '600', color: Colors.text },
  loadingSubtext: { fontSize: 13, color: Colors.textMuted },
  capiHeader: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20, gap: 12, alignItems: 'flex-start' },

  bubble: { flex: 1, backgroundColor: Colors.surface, borderRadius: 16, borderTopLeftRadius: 4, padding: 14 },
  bubbleText: { fontSize: 14, color: Colors.text, lineHeight: 21 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 20, marginBottom: 20 },
  scoreRight: { flex: 1, gap: 12 },
  complexiteBadge: { borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14, alignSelf: 'flex-start' },
  complexiteText: { fontSize: 13, fontWeight: '600' },
  delaiRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  delaiText: { fontSize: 13, color: Colors.textMuted },
  card: { marginHorizontal: 20, backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 12, ...UI.cardBorder, ...UI.cardShadow },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  listText: { fontSize: 13, color: Colors.textSecondary, flex: 1, lineHeight: 19 },
  disclaimer: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginTop: 4 },
  disclaimerText: { fontSize: 12, color: Colors.textMuted, flex: 1, lineHeight: 18, fontStyle: 'italic' },
  footer: { padding: 20, paddingBottom: 28 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.orange, borderRadius: 14, paddingVertical: 16, gap: 8 },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
