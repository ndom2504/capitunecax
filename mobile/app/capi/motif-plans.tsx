import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import type { CapiProfileData, MotifPlan, MotifPlanFee } from '../../lib/api';
import { getPaysParCode } from '../../lib/pays-data';

const IRCC_CRDV_URL = 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/demande/biometrie/ou.html';

// ─── helpers ────────────────────────────────────────────────────────────────

function getCrdv(profile: CapiProfileData): { crdvVille?: string; notesPays?: string; crdvIncertain?: boolean } {
  if (!profile.paysCode) return {};
  const p = getPaysParCode(profile.paysCode);
  if (!p) return {};
  return { crdvVille: p.crdv, notesPays: p.note, crdvIncertain: p.crdvIncertain };
}

// ─── computeMotifPlan ────────────────────────────────────────────────────────

export function computeMotifPlan(profile: CapiProfileData): MotifPlan {
  const { crdvVille, notesPays, crdvIncertain } = getCrdv(profile);
  const m = profile.motif;

  if (m === 'travailler') {
    const frais: MotifPlanFee[] = [
      { label: 'Permis de travail (IRCC)', montant: '155 $' },
      { label: "Biom\u00e9trie (par personne)", montant: '85 $' },
      { label: "EIMT \u2013 si requis (par employeur)", montant: '1\u202f000 $' },
    ];
    return {
      motif: 'travailler',
      fraisGouvernementaux: frais,
      totalGouvernement: 240,
      biometrieRequise: true,
      crdvVille,
      crdvIncertain,
      examenMedical: false,
      notesPays,
      documents: [
        "Passeport valide (min. 6 mois apr\u00e8s date de fin de permis)",
        "Offre d\u2019emploi sign\u00e9e par l\u2019employeur canadien",
        "EIMT / Annonce LMIA (si exig\u00e9)",
        "Dipl\u00f4mes et attestations professionnelles",
        "Lettre de motivation",
        "Relev\u00e9s bancaires (3 derniers mois)",
      ],
      documentsOptionnels: [
        "CV d\u00e9taill\u00e9",
        "Lettres de r\u00e9f\u00e9rence d\u2019employeurs pr\u00e9c\u00e9dents",
        "Certificats de formation compl\u00e9mentaires",
      ],
      conseils: [
        "V\u00e9rifiez si votre occupation figure sur la liste des professions exempt\u00e9es de l\u2019EIMT (Accord de libre-\u00e9change, etc.).",
        "Un permis de travail ouvert (PTF, PVT) est plus flexible qu\u2019un permis ferm\u00e9.",
        "L\u2019employeur doit conserver une copie de l\u2019offre d\u2019emploi conforme.",
        "Pr\u00e9parez vos biom\u00e9tries le plus t\u00f4t possible \u2014 la validit\u00e9 est de 10 ans.",
        "Consultez un conseiller CAPI avant de soumettre : une erreur de cat\u00e9gorie peut entra\u00eener un refus.",
      ],
    };
  }

  if (m === 'etudier') {
    const isQuebec =
      profile.paysResidence === 'Quebec' ||
      (profile.programme ?? '').toLowerCase().includes('qu\u00e9bec') ||
      (profile.programme ?? '').toLowerCase().includes('quebec');
    const frais: MotifPlanFee[] = [
      { label: "Permis d\u2019\u00e9tudes (IRCC)", montant: '150 $' },
      { label: "Biom\u00e9trie (par personne)", montant: '85 $' },
      { label: "Examen m\u00e9dical (si s\u00e9jour > 6 mois)", montant: '150\u2013300 $' },
    ];
    if (isQuebec) {
      frais.push({ label: "CAQ \u2013 Certificat d\u2019acceptation du Qu\u00e9bec", montant: '114 $' });
    }
    return {
      motif: 'etudier',
      fraisGouvernementaux: frais,
      totalGouvernement: isQuebec ? 574 : 460,
      biometrieRequise: true,
      crdvVille,
      crdvIncertain,
      examenMedical: true,
      notesPays,
      documents: [
        "Lettre d\u2019acceptation d\u2019un \u00e9tablissement canadien d\u00e9sign\u00e9 (DLI)",
        "Preuve de paiement des frais de scolarit\u00e9",
        "Passeport valide",
        "Relev\u00e9s de notes et dipl\u00f4mes",
        "Preuve de fonds suffisants (frais de scolarit\u00e9 + 10\u202f000\u00a0$/an de subsistance)",
        "R\u00e9sultats d\u2019examen m\u00e9dical (m\u00e9decin d\u00e9sign\u00e9 IRCC) \u2014 si permis > 6 mois",
        ...(isQuebec ? ["CAQ approuv\u00e9 (certificat d\u2019acceptation du Qu\u00e9bec)"] : []),
      ],
      documentsOptionnels: [
        "Lettre de motivation (objectifs d\u2019\u00e9tudes)",
        "Relev\u00e9s bancaires des parents si financement familial",
        "Assurance maladie souscrite",
      ],
      conseils: [
        "Demandez le permis via le Syst\u00e8me de demande en direct (SDE) \u2014 d\u00e9lais plus courts.",
        "Un permis d\u2019\u00e9tudes valide vous permet de travailler 20 h/sem hors campus pendant les sessions.",
        "Planifiez votre CAQ en premier si vous \u00e9tudiez au Qu\u00e9bec \u2014 jusqu\u2019\u00e0 5 semaines de traitement.",
        "V\u00e9rifiez le statut DLI de votre institution avant de vous inscrire.",
        "Conservez tous les re\u00e7us de paiement de frais de scolarit\u00e9.",
      ],
    };
  }

  if (m === 'residence_permanente') {
    const frais: MotifPlanFee[] = [
      { label: "R\u00e9sidence permanente \u2013 requ\u00e9rant principal", montant: '1\u202f365 $' },
      { label: "R\u00e9sidence permanente \u2013 conjoint(e)", montant: '1\u202f365 $' },
      { label: "R\u00e9sidence permanente \u2013 enfant \u00e0 charge", montant: '260 $ / enfant' },
      { label: "Biom\u00e9trie (par personne)", montant: '85 $' },
      { label: "Examen m\u00e9dical (par personne)", montant: '150\u2013300 $' },
      { label: "\u00c9valuation des dipl\u00f4mes (WES ou autre)", montant: '~320 $' },
      { label: "Test de langue officielle (IELTS/TEF)", montant: '290\u2013320 $' },
    ];
    return {
      motif: 'residence_permanente',
      fraisGouvernementaux: frais,
      totalGouvernement: 2275,
      biometrieRequise: true,
      crdvVille,
      crdvIncertain,
      examenMedical: true,
      notesPays,
      documents: [
        "Passeport valide",
        "R\u00e9sultats du test de langue (IELTS ou TEF)",
        "\u00c9valuation officielle des dipl\u00f4mes (WES ou \u00e9quivalent)",
        "Relev\u00e9s d\u2019emploi des 10 derni\u00e8res ann\u00e9es",
        "Preuve de fonds de r\u00e9serve (selon taille du m\u00e9nage)",
        "Casier judiciaire / certificat de bonne conduite",
        "R\u00e9sultats de l\u2019examen m\u00e9dical (m\u00e9decin d\u00e9sign\u00e9)",
        "Photos d\u2019identit\u00e9 conformes",
      ],
      documentsOptionnels: [
        "Offre d\u2019emploi r\u00e9serv\u00e9e (si applicable \u2014 +200 points CRS)",
        "Nomination provinciale (PNP)",
        "Preuves de liens au Canada (famille, \u00e9tudes ant\u00e9r.)",
      ],
      conseils: [
        "Maximisez votre score CRS avant de soumettre votre profil : langue, dipl\u00f4me, exp\u00e9rience.",
        "Une offre d\u2019emploi r\u00e9serv\u00e9e ajoute 50 ou 200 points CRS selon le NOC.",
        "La nomination PNP ajoute 600 points \u2014 explorez les volets provinciaux pour votre profil.",
        "Gardez votre profil Express Entry \u00e0 jour lors de chaque tirage.",
        "L\u2019examen m\u00e9dical doit \u00eatre r\u00e9alis\u00e9 chez un m\u00e9decin d\u00e9sign\u00e9 par IRCC.",
      ],
    };
  }

  if (m === 'famille') {
    const frais: MotifPlanFee[] = [
      { label: "Demande de parrainage \u2013 parrain", montant: '1\u202f085 $' },
      { label: "Traitement RP \u2013 adulte parrain\u00e9", montant: '1\u202f365 $' },
      { label: "Traitement RP \u2013 enfant parrain\u00e9 (<18 ans)", montant: '260 $ / enfant' },
      { label: "Biom\u00e9trie \u2013 personne parrain\u00e9e (par pers.)", montant: '85 $' },
      { label: "Examen m\u00e9dical \u2013 personne parrain\u00e9e (par pers.)", montant: '150\u2013300 $' },
    ];
    return {
      motif: 'famille',
      fraisGouvernementaux: frais,
      totalGouvernement: 2735,
      biometrieRequise: true,
      crdvVille,
      crdvIncertain,
      examenMedical: true,
      notesPays,
      documents: [
        "Preuves du statut de r\u00e9sident permanent ou citoyen du parrain",
        "Preuves de la relation (acte de mariage, photos, historique de communication)",
        "\u00c9tat financier du parrain (revenus, d\u00e9clarations de revenus)",
        "Passeport de la personne parrain\u00e9e",
        "Actes de naissance (parrain + parrain\u00e9)",
        "R\u00e9sultats de l\u2019examen m\u00e9dical du parrain\u00e9",
        "Casier judiciaire de la personne parrain\u00e9e",
      ],
      documentsOptionnels: [
        "Preuves de visites mutuelles (tampons de passeport)",
        "Historique de communication (chats, e-mails)",
        "D\u00e9clarations de t\u00e9moins / affidavits",
      ],
      conseils: [
        "Le parrain doit s\u2019engager \u00e0 subvenir aux besoins du parrain\u00e9 pendant 3 ans (conjoint) ou jusqu\u2019\u00e0 10 ans (enfant).",
        "Une relation jug\u00e9e non authentique par IRCC m\u00e8nera \u00e0 un refus \u2014 documentez tout.",
        "Le processus de parrainage des conjoints dure typiquement 10\u201318 mois.",
        "Un enfant de moins de 22 ans peut \u00eatre inclus comme membre de la famille accompagnant.",
        "V\u00e9rifiez que le parrain n\u2019a pas d\u2019ant\u00e9c\u00e9dent de violence familiale (crit\u00e8re d\u2019inadmissibilit\u00e9).",
      ],
    };
  }

  if (m === 'entreprendre') {
    const frais: MotifPlanFee[] = [
      { label: 'Programme SUV (Visa D\u00e9marrage)', montant: '1\u202f575 $' },
      { label: "Biom\u00e9trie (par personne)", montant: '85 $' },
      { label: "Examen m\u00e9dical (par personne)", montant: '150\u2013300 $' },
      { label: "Frais juridiques et d\u2019incorporation (estim\u00e9)", montant: '2\u202f000\u20135\u202f000 $' },
    ];
    return {
      motif: 'entreprendre',
      fraisGouvernementaux: frais,
      totalGouvernement: 1860,
      biometrieRequise: true,
      crdvVille,
      crdvIncertain,
      examenMedical: true,
      notesPays,
      documents: [
        "Plan d\u2019affaires d\u00e9taill\u00e9 (min. 5 ans de projections financi\u00e8res)",
        "Lettre d\u2019appui d\u2019un organisme d\u00e9sign\u00e9 (capital-risqueurs, anges financiers, incubateurs)",
        "Passeport valide",
        "Preuve de ma\u00eetrise du fran\u00e7ais ou de l\u2019anglais (CLB 5/NCLC 5 minimum)",
        "Preuve de fonds suffisants pour subvenir \u00e0 vos besoins",
        "Casier judiciaire",
        "R\u00e9sultats de l\u2019examen m\u00e9dical",
      ],
      documentsOptionnels: [
        "Pitch deck et prototype/MVP",
        "Lettres de recommandation de partenaires d\u2019affaires",
        "\u00c9tude de march\u00e9 canadien",
      ],
      conseils: [
        "Le Programme SUV exige l\u2019obtention d\u2019une lettre d\u2019un seul organisme d\u00e9sign\u00e9 \u2014 c\u2019est l\u2019\u00e9tape la plus s\u00e9lective.",
        "Pr\u00e9parez un pitch deck convaincant et une \u00e9tude de march\u00e9 solide avant de contacter les organismes.",
        "Le niveau de langue minimal est CLB 5 \u2014 visez CLB 7 pour maximiser vos chances.",
        "Les fonds requis d\u00e9pendent de la taille de votre m\u00e9nage (grille IRCC).",
        "CAPI peut vous mettre en relation avec des incubateurs reconnus par IRCC.",
      ],
    };
  }

  if (m === 'regularisation') {
    const frais: MotifPlanFee[] = [
      { label: "Motifs d\u2019ordre humanitaire (H&C)", montant: '550 $' },
      { label: "Titre de voyage pour r\u00e9fugi\u00e9 (PRTD)", montant: '50 $' },
      { label: "Examen m\u00e9dical (si requis, par personne)", montant: '150\u2013300 $' },
    ];
    return {
      motif: 'regularisation',
      fraisGouvernementaux: frais,
      totalGouvernement: 700,
      biometrieRequise: false,
      crdvVille,
      crdvIncertain,
      examenMedical: true,
      notesPays,
      documents: [
        "Passeport ou document de voyage (ou explication de l\u2019absence)",
        "Preuves d\u2019\u00e9tablissement au Canada (bail, emploi, scolarit\u00e9 des enfants)",
        "D\u00e9claration personnelle d\u00e9taillant les motifs H&C",
        "Preuves de difficult\u00e9s inhabituelles en cas de renvoi",
        "Casier judiciaire canadien et du pays d\u2019origine",
        "Preuves d\u2019int\u00e9gration communautaire (b\u00e9n\u00e9volat, associations, etc.)",
      ],
      documentsOptionnels: [
        "Lettres de soutien de la communaut\u00e9, employeurs ou associations",
        "Rapports psychologiques ou m\u00e9dicaux d\u00e9montrant une situation de vuln\u00e9rabilit\u00e9",
        "Preuves de liens familiaux au Canada (enfants, conjoints canadiens)",
      ],
      conseils: [
        "La demande H&C repose sur la d\u00e9monstration de difficult\u00e9s exceptionnelles \u2014 plus votre dossier est document\u00e9, mieux c\u2019est.",
        "L\u2019int\u00e9r\u00eat sup\u00e9rieur des enfants est un facteur d\u00e9terminant \u2014 incluez toutes preuves li\u00e9es \u00e0 vos enfants au Canada.",
        "La r\u00e9gularisation n\u2019est pas un statut permanent \u2014 elle peut mener \u00e0 la RP mais aussi \u00e0 un refus avec renvoi.",
        "Ne tardez pas : soumettez une demande de report de renvoi si une mesure de renvoi est active.",
        "Consultez urgemment un conseiller CAPI si vous \u00eates en situation de s\u00e9jour irr\u00e9gulier.",
      ],
    };
  }

  // Fallback
  return {
    motif: m ?? 'regularisation',
    fraisGouvernementaux: [],
    totalGouvernement: 0,
    biometrieRequise: false,
    crdvVille,
    crdvIncertain,
    examenMedical: false,
    notesPays,
    documents: [],
    documentsOptionnels: [],
    conseils: [],
  };
}

// ─── MotifPlanView ───────────────────────────────────────────────────────────

const MOTIF_LABELS: Record<string, string> = {
  travailler: 'Permis de travail',
  etudier: "Permis d’études",
  residence_permanente: "Résidence permanente",
  famille: 'Parrainage familial',
  entreprendre: 'Entrepreneur / SUV',
  regularisation: "Régularisation",
};

function MSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={ms.section}>
      <Text style={ms.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function MFeeRow({ label, montant }: { label: string; montant: string }) {
  return (
    <View style={ms.feeRow}>
      <Text style={ms.feeLabel}>{label}</Text>
      <Text style={ms.feeMontant}>{montant}</Text>
    </View>
  );
}

function MDoc({ text, optional }: { text: string; optional?: boolean }) {
  return (
    <View style={ms.docRow}>
      <Text style={[ms.docBullet, optional && ms.docBulletOpt]}>{optional ? '○' : '●'}</Text>
      <Text style={[ms.docText, optional && ms.docTextOpt]}>{text}</Text>
    </View>
  );
}

function MInfo({ label, value }: { label: string; value: string }) {
  return (
    <View style={ms.infoRow}>
      <Text style={ms.infoLabel}>{label}</Text>
      <Text style={ms.infoValue}>{value}</Text>
    </View>
  );
}

export function MotifPlanView({ plan }: { plan: MotifPlan }) {
  const motifLabel = MOTIF_LABELS[plan.motif] ?? plan.motif;
  return (
    <View style={ms.container}>
      {/* Header */}
      <View style={ms.header}>
        <Text style={ms.headerTitle}>Plan détaillé — {motifLabel}</Text>
        <Text style={ms.headerSub}>Frais, documents et étapes clés</Text>
      </View>

      {/* CRDV */}
      {plan.crdvVille && (
        <MSection title="📍 Centre de biométrie (CRDV)">
          <MInfo label="Ville recommandée" value={plan.crdvVille} />
          {plan.notesPays && <Text style={ms.noteText}>{plan.notesPays}</Text>}
          {plan.crdvIncertain && (
            <View style={ms.warningBox}>
              <Text style={ms.warningText}>
                ⚠️  Localisation à confirmer. Les centres VFS peuvent changer.
              </Text>
              <TouchableOpacity onPress={() => Linking.openURL(IRCC_CRDV_URL)}>
                <Text style={ms.warningLink}>🔗 Vérifier sur canada.ca (IRCC)</Text>
              </TouchableOpacity>
            </View>
          )}
        </MSection>
      )}

      {/* Frais gouvernementaux */}
      <MSection title="💰 Frais gouvernementaux">
        {plan.fraisGouvernementaux.map((f, i) => (
          <MFeeRow key={i} label={f.label} montant={f.montant} />
        ))}
        <View style={ms.totalRow}>
          <Text style={ms.totalLabel}>Total estimatif</Text>
          <Text style={ms.totalValue}>{plan.totalGouvernement.toLocaleString('fr-CA')} $</Text>
        </View>
      </MSection>

      {/* Biometrie */}
      <MSection title="🧑 Biométrie">
        <MInfo
          label="Biométrie requise"
          value={plan.biometrieRequise ? 'Oui — 85 $ / personne' : 'Non (vérifiez selon votre pays)'}
        />
        {plan.biometrieRequise && plan.crdvVille && (
          <MInfo label="Centre recommandé" value={plan.crdvVille} />
        )}
        {plan.biometrieRequise && (
          <Text style={ms.noteText}>
            Valide 10 ans. Réservez tôt pour éviter les délais.
          </Text>
        )}
      </MSection>

      {/* Examen medical */}
      <MSection title="🏥 Examen médical">
        <MInfo
          label="Examen requis"
          value={plan.examenMedical
            ? (plan.motif === 'etudier'
                ? 'Requis si durée du permis > 6 mois (quasi systématique)'
                : 'Oui — 150–300 $ / personne')
            : 'Non (vérifiez selon durée et pays)'}
        />
        {plan.examenMedical && (
          <Text style={ms.noteText}>
            {plan.motif === 'etudier'
              ? "La quasi-totalité des permis d’études dépassent 6 mois. L’examen doit être réalisé chez un médecin désigné par IRCC — résultats valides ~12 mois."
              : 'Doit être réalisé chez un médecin désigné par IRCC. Résultats valides 12 mois environ.'}
          </Text>
        )}
      </MSection>

      {/* Documents obligatoires */}
      <MSection title="📄 Documents obligatoires">
        {plan.documents.map((d, i) => (
          <MDoc key={i} text={d} />
        ))}
      </MSection>

      {/* Documents optionnels */}
      {plan.documentsOptionnels.length > 0 && (
        <MSection title="📎 Documents complémentaires (recommandés)">
          {plan.documentsOptionnels.map((d, i) => (
            <MDoc key={i} text={d} optional />
          ))}
        </MSection>
      )}

      {/* Conseils */}
      <MSection title="💡 Conseils CAPI">
        {plan.conseils.map((c, i) => (
          <View key={i} style={ms.conseilRow}>
            <Text style={ms.conseilBullet}>›</Text>
            <Text style={ms.conseilText}>{c}</Text>
          </View>
        ))}
      </MSection>
    </View>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const ms = StyleSheet.create({
  container: { marginTop: 24, gap: 0 },
  header: {
    backgroundColor: '#1a3a5c',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
  },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  headerSub: { color: '#a0c4e8', fontSize: 12, marginTop: 4 },

  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1a3a5c', marginBottom: 10 },

  feeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  feeLabel: { flex: 1, fontSize: 13, color: '#374151', paddingRight: 8 },
  feeMontant: { fontSize: 13, fontWeight: '600', color: '#1a3a5c' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 8,
    paddingTop: 8,
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: '#374151' },
  totalValue: { fontSize: 14, fontWeight: '700', color: '#d97706' },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  infoLabel: { fontSize: 13, color: '#6b7280' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#1a3a5c', flex: 1, textAlign: 'right' },

  noteText: { fontSize: 12, color: '#6b7280', marginTop: 6, fontStyle: 'italic' },
  warningBox: { marginTop: 8, padding: 10, backgroundColor: '#fff7ed', borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#f97316' },
  warningText: { fontSize: 12, color: '#9a3412', fontWeight: '600', marginBottom: 4 },
  warningLink: { fontSize: 12, color: '#1d4ed8', textDecorationLine: 'underline' },

  docRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  docBullet: { color: '#2563eb', marginRight: 6, marginTop: 2, fontSize: 10 },
  docBulletOpt: { color: '#9ca3af' },
  docText: { flex: 1, fontSize: 13, color: '#374151' },
  docTextOpt: { color: '#9ca3af' },

  conseilRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  conseilBullet: { color: '#f59e0b', marginRight: 8, fontSize: 18, lineHeight: 20 },
  conseilText: { flex: 1, fontSize: 13, color: '#374151' },
});
