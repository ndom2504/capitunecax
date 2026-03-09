import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { UI } from '../../../constants/UI';
import { useCapiSession } from '../../../context/CapiContext';
import { buildMotifBudget } from '../../../lib/autonomie-steps';
import { autonomiePaymentApi, capiApi, userApi } from '../../../lib/api';
import type { AutonomieStep, CapiMotif } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { CapiOrientationBubble } from '../../../components/CapiOrientationBubble';
import { CapiHelpFab } from '../../../components/CapiHelpFab';

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

const MOTIF_LABELS: Record<string, string> = {
  etudier: "Permis d'etudes",
  travailler: 'Permis de travail',
  residence_permanente: 'Residence permanente',
  famille: 'Regroupement familial',
  entreprendre: 'Visa entrepreneur',
  regularisation: 'Regularisation',
  visiter: 'Visa visiteur',
};

const MOTIF_ICONS: Record<string, string> = {
  etudier: 'grad-cap',
  travailler: 'briefcase',
  residence_permanente: 'flag',
  famille: 'people',
  entreprendre: 'rocket',
  regularisation: 'scale',
  visiter: 'airplane',
};

const MOTIF_EMOJI: Record<string, string> = {
  etudier: 'grad',
  travailler: 'brief',
  residence_permanente: 'ca',
  famille: 'fam',
  entreprendre: 'rkt',
  regularisation: 'law',
  visiter: 'fly',
};

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function AutonomieIndexScreen() {
  const router = useRouter();
  const { session, updateSession } = useCapiSession();
  const { token, user, setUser } = useAuth();
  const [paying, setPaying] = useState(false);
  const [priceCents, setPriceCents] = useState<number | null>(null);
  const [priceCurrency, setPriceCurrency] = useState<string>('CAD');
  const activatingRef = useRef(false);
  const activationAttemptedRef = useRef(false);
  const project = session.autonomie;
  const motif: CapiMotif = (project?.motif ?? 'visiter') as CapiMotif;
  const motifLabel = MOTIF_LABELS[motif] ?? 'Projet';

  const hasPaidAutonomie =
    Boolean(project?.hasPaidAutonomie) ||
    user?.role === 'admin' ||
    Boolean(user?.autonomie_unlocked) ||
    Boolean(user?.premium_active);

  const budget = useMemo(() => buildMotifBudget(motif), [motif]);

  const selectedServiceIds = useMemo(
    () => (session.services ?? []).filter((s) => s.selected).map((s) => s.id),
    [session.services],
  );

  // Enregistre le projet côté serveur aussi en mode autonomie (après déblocage/paiement).
  useEffect(() => {
    if (!token) return;
    if (!hasPaidAutonomie) return;
    if (session.projectId) return;
    if (activatingRef.current) return;
    if (activationAttemptedRef.current) return;

    activationAttemptedRef.current = true;
    activatingRef.current = true;
    (async () => {
      const res = await capiApi.activateProject(token, {
        session,
        selectedServiceIds,
      });
      if (res.status >= 200 && res.status < 300 && res.data?.projectId) {
        updateSession({ projectId: res.data.projectId });
      }
    })()
      .catch(() => {
        // On ne bloque pas l'UI en autonomie: l'utilisateur peut continuer.
        // L'activation pourra se refaire plus tard (ex: retour au dashboard).
      })
      .finally(() => {
        activatingRef.current = false;
      });
  }, [token, hasPaidAutonomie, session.projectId, selectedServiceIds]);

  // Rafraîchir silencieusement le profil : utile si l'admin a débloqué Autonomie.
  useEffect(() => {
    let alive = true;
    if (!token || !user) return;
    userApi.getProfile(token).then((res) => {
      if (!alive) return;
      if (res.status !== 200 || !res.data) return;
      const next = {
        ...user,
        premium_active: Boolean((res.data as any).premium_active),
        autonomie_unlocked: Boolean((res.data as any).autonomie_unlocked),
      };
      setUser(next);
    }).catch(() => {});
    return () => { alive = false; };
  }, [token]);

  const payAmountLabel = useMemo(() => {
    if (!priceCents || priceCents <= 0) return null;
    const amount = priceCents / 100;
    const currency = String(priceCurrency || 'CAD').toUpperCase();

    try {
      return amount.toLocaleString('fr-CA', { style: 'currency', currency });
    } catch {
      // Fallback si Intl n'est pas dispo.
      return `${amount.toFixed(2)} ${currency}`;
    }
  }, [priceCents, priceCurrency]);

  useEffect(() => {
    let alive = true;
    autonomiePaymentApi
      .getPrice(motif)
      .then((res) => {
        if (!alive) return;
        const unit = res.data?.unit_amount;
        const cur = res.data?.currency;

        if (res.status >= 200 && res.status < 300 && typeof unit === 'number' && unit > 0) {
          setPriceCents(Math.round(unit));
          if (cur) setPriceCurrency(String(cur));
          return;
        }

        // Ne bloque pas l'UI: on laisse le bouton sans montant.
        setPriceCents(null);
      })
      .catch(() => {
        if (!alive) return;
        setPriceCents(null);
      });
    return () => {
      alive = false;
    };
  }, [motif]);

  if (!project) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Aucun projet trouve.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.emptyBtn}>
            <Text style={styles.emptyBtnText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const startCheckout = async () => {
    setPaying(true);
    try {
      const sessionToken = String(token ?? '').trim();
      if (!sessionToken) {
        Alert.alert('Connexion requise', 'Connectez-vous pour procéder au paiement.');
        return;
      }

      const res = await autonomiePaymentApi.stripeCheckout(sessionToken, motif);

      // Session expirée → invite à se reconnecter
      if (res.status === 401) {
        Alert.alert(
          'Session expirée',
          'Votre session a expiré. Veuillez vous reconnecter pour continuer.',
          [
            { text: 'Se connecter', onPress: () => router.replace('/(auth)/connexion' as any) },
            { text: 'Annuler', style: 'cancel' },
          ]
        );
        return;
      }

      const url = res.data?.url;
      if (res.status < 200 || res.status >= 300 || !url) {
        throw new Error((res.data as any)?.error ?? res.error ?? 'Paiement indisponible');
      }

      await Linking.openURL(url);
    } catch (err: any) {
      Alert.alert('Paiement', err?.message ?? 'Impossible de démarrer le paiement.');
    } finally {
      setPaying(false);
    }
  };

  const onLockedStepPress = () => {
    if (paying) return;
    Alert.alert(
      'Service requis',
      'Activer le service pour debloquer les étapes',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: payAmountLabel ? `Activer le service (${payAmountLabel})` : 'Activer le service',
          onPress: startCheckout,
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Votre copilote de projet</Text>
          <Text style={styles.headerSub}>{motifLabel}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <CapiOrientationBubble
          text={`Je suis CAPI. Ouvrez une étape pour voir les actions à faire et les liens officiels. Je reste avec vous tout au long du parcours.`}
        />

        {/* Hero banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroLeft}>
            <View style={styles.heroIconWrap}>
              <Text style={styles.heroIconText}>
                {motif === 'etudier' ? '\u{1F393}' : motif === 'travailler' ? '\u{1F4BC}' : motif === 'residence_permanente' ? '\u{1F1E8}\u{1F1E6}' : motif === 'famille' ? '\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}' : motif === 'entreprendre' ? '\u{1F680}' : motif === 'regularisation' ? '\u{2696}\u{FE0F}' : '\u{2708}\u{FE0F}'}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.heroLabel}>Projet Canada</Text>
              <Text style={styles.heroMotif} numberOfLines={1}>{motifLabel}</Text>
            </View>
          </View>
          <View style={styles.heroRight}>
            <Text style={styles.heroBudgetLabel}>Budget estime</Text>
            <Text style={styles.heroBudgetNum}>{budget.totalFourchette}</Text>
            <Text style={styles.heroBudgetDevise}>{budget.devise}</Text>
          </View>
        </View>

        {/* Note budget */}
        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
          <Text style={styles.noteText}>{budget.notesBudget}</Text>
        </View>

        {/* Detail budget */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detail des couts estimes</Text>
          <View style={styles.budgetCard}>
            {budget.categories.map((cat, i) => (
              <View key={i} style={[styles.budgetRow, i < budget.categories.length - 1 && styles.budgetRowBorder]}>
                <Text style={styles.budgetIcon}>{cat.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.budgetLabel}>{cat.label}</Text>
                  {cat.fourchette
                    ? <Text style={styles.budgetFourchette}>{cat.fourchette} {budget.devise}</Text>
                    : <Text style={styles.budgetDesc}>{cat.description}</Text>
                  }
                </View>
                <Text style={[styles.budgetMontant, cat.montant === 0 && { color: Colors.textMuted }]}>
                  {cat.montant === 0 ? 'Variable' : `${cat.montant.toLocaleString('fr-CA')} $`}
                </Text>
              </View>
            ))}
            <View style={styles.budgetTotal}>
              <Text style={styles.budgetTotalLabel}>Total estime</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.budgetTotalNum}>{budget.totalFourchette}</Text>
                <Text style={styles.budgetTotalDevise}>{budget.devise}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Plan d'action */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plan d'action — {project.steps.length} etapes</Text>

          {!hasPaidAutonomie && (
            <View style={styles.paywallCard}>
              <View style={styles.paywallRow}>
                <View style={styles.paywallIcon}>
                  <Ionicons name="lock-closed" size={16} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paywallTitle}>Paiement requis</Text>
                  <Text style={styles.paywallText}>
                    Débloquez l'accès aux 5 étapes guidées pour votre projet.
                    {payAmountLabel ? `\nPaiement unique : ${payAmountLabel}` : ''}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.paywallBtn, paying && styles.paywallBtnDisabled]}
                onPress={startCheckout}
                disabled={paying}
                activeOpacity={0.85}
              >
                {paying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.paywallBtnText}>
                    {payAmountLabel ? `Payer ${payAmountLabel} avec Stripe` : 'Payer avec Stripe'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {project.steps.map((step, index) => (
            <StepCard
              key={step.id}
              step={step}
              index={index}
              total={project.steps.length}
              locked={!hasPaidAutonomie}
              onPress={() => {
                if (!hasPaidAutonomie) {
                  onLockedStepPress();
                  return;
                }
                router.push({ pathname: '/capi/autonomie/flow', params: { start: step.id } } as any);
              }}
            />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <CapiHelpFab
        onPress={() =>
          router.push('/capi/agent' as any)
        }
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Composant carte etape
// ---------------------------------------------------------------------------

function StepCard({ step, index, total, locked, onPress }: {
  step: AutonomieStep;
  index: number;
  total: number;
  locked: boolean;
  onPress: () => void;
}) {
  const isLast = index === total - 1;
  return (
    <View style={cardStyles.wrap}>
      {!isLast && <View style={cardStyles.connector} />}
      <View style={cardStyles.numWrap}>
        <Text style={cardStyles.numText}>{step.ordre}</Text>
      </View>
      <TouchableOpacity style={[cardStyles.card, locked && cardStyles.cardLocked]} onPress={onPress} activeOpacity={locked ? 1 : 0.85}>
        <View style={cardStyles.top}>
          <Text style={cardStyles.stepIcon}>{step.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={cardStyles.title}>{step.title}</Text>
            <Text style={cardStyles.desc} numberOfLines={2}>{step.description}</Text>
          </View>
          <View style={cardStyles.arrowWrap}>
            <Ionicons name={locked ? 'lock-closed' : 'chevron-forward'} size={14} color={locked ? Colors.textMuted : Colors.primary} />
          </View>
        </View>
        {step.checkItems.length > 0 && (
          <Text style={cardStyles.meta}>
            {step.checkItems.length} action{step.checkItems.length > 1 ? 's' : ''}{step.ressources.length > 0 ? ` · ${step.ressources.length} ressource${step.ressources.length > 1 ? 's' : ''}` : ''}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10, position: 'relative' },
  connector: { position: 'absolute', left: 15, top: 36, width: 2, bottom: -10, backgroundColor: Colors.border, zIndex: 0 },
  numWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primary + '15', borderWidth: 2, borderColor: Colors.primary + '40',
    justifyContent: 'center', alignItems: 'center', marginTop: 8, zIndex: 1, flexShrink: 0,
  },
  numText: { fontSize: 13, fontWeight: '800', color: Colors.primary },
  card: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, ...UI.cardShadow,
  },
  cardLocked: { opacity: 0.6 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepIcon: { fontSize: 22, width: 28, textAlign: 'center' },
  title: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  desc: { fontSize: 12, color: Colors.textMuted, lineHeight: 17 },
  arrowWrap: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.primary + '12', justifyContent: 'center', alignItems: 'center',
  },
  meta: { fontSize: 11, color: Colors.textMuted, marginTop: 8, paddingLeft: 38 },
});

// ---------------------------------------------------------------------------
// Styles principaux
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgLight },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingVertical: 14, gap: 12, backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  heroBanner: {
    margin: 20, marginBottom: 12, backgroundColor: Colors.primary, borderRadius: 20, padding: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 },
  heroIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  heroIconText: { fontSize: 28 },
  heroLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  heroMotif: { fontSize: 15, color: '#fff', fontWeight: '800', marginTop: 2 },
  heroRight: { alignItems: 'flex-end', flexShrink: 0, marginLeft: 8 },
  heroBudgetLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: '600', textTransform: 'uppercase' },
  heroBudgetNum: { fontSize: 17, color: '#fbbf24', fontWeight: '800', marginVertical: 2 },
  heroBudgetDevise: { fontSize: 10, color: 'rgba(255,255,255,0.55)' },
  noteCard: {
    marginHorizontal: 20, marginBottom: 4, flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: Colors.primary + '10', borderRadius: 12, padding: 12,
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
  },
  noteText: { flex: 1, fontSize: 12, color: Colors.text, lineHeight: 18 },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1,
    textTransform: 'uppercase', marginBottom: 12,
  },
  paywallCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
    ...UI.cardShadow,
  },
  paywallRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  paywallIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paywallTitle: { fontSize: 13, fontWeight: '800', color: Colors.text },
  paywallText: { fontSize: 12, color: Colors.textMuted, marginTop: 2, lineHeight: 18 },
  paywallBtn: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  paywallBtnDisabled: { opacity: 0.7 },
  paywallBtnText: { color: '#fff', fontWeight: '800' },
  budgetCard: {
    backgroundColor: Colors.surface, borderRadius: 18, borderWidth: 1,
    borderColor: Colors.border, overflow: 'hidden', ...UI.cardShadow,
  },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  budgetRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  budgetIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  budgetLabel: { fontSize: 13, fontWeight: '600', color: Colors.text },
  budgetDesc: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  budgetFourchette: { fontSize: 11, color: '#e87722', marginTop: 1, fontWeight: '600' },
  budgetMontant: { fontSize: 14, fontWeight: '700', color: Colors.text, minWidth: 70, textAlign: 'right' },
  budgetTotal: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Colors.primary,
  },
  budgetTotalLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  budgetTotalNum: { fontSize: 17, fontWeight: '800', color: '#fbbf24' },
  budgetTotalDevise: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 },
  emptyText: { fontSize: 15, color: Colors.textMuted, textAlign: 'center' },
  emptyBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
});
