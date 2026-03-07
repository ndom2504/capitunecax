import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { UI } from '../../../constants/UI';
import { useCapiSession } from '../../../context/CapiContext';
import { CapiHelpFab } from '../../../components/CapiHelpFab';
import { getBiometrieUrl, getMedecinDesigneUrl } from '../../../lib/dli-data';
import type { AutonomieCheckItem, AutonomieProject, AutonomieStep } from '../../../lib/api';

type Page =
  | { key: string; stepId: string; stepIndex: number; kind: 'intro' }
  | { key: string; stepId: string; stepIndex: number; kind: 'item'; itemId: string }
  | { key: string; stepId: string; stepIndex: number; kind: 'validate' };

function resolveRessourceUrl(stepId: string, baseUrl: string, paysCode?: string): string {
  if (stepId.includes('biometrie') && baseUrl.includes('biometrie')) return getBiometrieUrl(paysCode);
  if ((stepId.includes('exam-medical') || stepId.includes('examens-medicaux')) && baseUrl.includes('dmp')) return getMedecinDesigneUrl(paysCode);
  return baseUrl;
}

function getDefaultOfficialResourcesForItem(
  stepId: string,
  step: AutonomieStep,
  paysCode?: string,
): Array<{ label: string; url: string; kind?: 'link' | 'button' }> {
  if (step.ressources && step.ressources.length > 0) {
    const r = step.ressources[0];
    return [
      {
        label: r.titre,
        url: resolveRessourceUrl(stepId, r.url, paysCode),
        kind: 'link',
      },
    ];
  }

  if (step.actionUrl) {
    return [
      {
        label: step.actionLabel ?? 'Ouvrir la ressource officielle',
        url: resolveRessourceUrl(stepId, step.actionUrl, paysCode),
        kind: 'link',
      },
    ];
  }

  return [
    {
      label: 'Immigration et citoyenneté (Canada.ca)',
      url: 'https://www.canada.ca/fr/services/immigration-citoyennete.html',
      kind: 'link',
    },
  ];
}

export default function AutonomieFlowScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { start } = useLocalSearchParams<{ start?: string }>();
  const { session, updateSession } = useCapiSession();

  const project = session.autonomie;
  const paysCode = session.profile?.paysCode;

  const pages: Page[] = useMemo(() => {
    if (!project) return [];
    const out: Page[] = [];
    project.steps.forEach((s, idx) => {
      out.push({ key: `${s.id}:intro`, stepId: s.id, stepIndex: idx, kind: 'intro' });
      (s.checkItems ?? []).forEach((ci) => {
        out.push({ key: `${s.id}:item:${ci.id}`, stepId: s.id, stepIndex: idx, kind: 'item', itemId: ci.id });
      });
      out.push({ key: `${s.id}:validate`, stepId: s.id, stepIndex: idx, kind: 'validate' });
    });
    return out;
  }, [project]);

  const initialIndex = useMemo(() => {
    if (!project || !pages.length) return 0;
    if (!start) return 0;
    const i = pages.findIndex((p) => p.kind === 'intro' && p.stepId === start);
    return i >= 0 ? i : 0;
  }, [project, pages, start]);

  const listRef = useRef<FlatList<Page>>(null);
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    setIndex(initialIndex);
    setTimeout(() => listRef.current?.scrollToIndex({ index: initialIndex, animated: false }), 50);
  }, [initialIndex]);

  const currentPage = pages[index];
  const currentStep = useMemo(() => {
    if (!project || !currentPage) return null;
    return project.steps.find((s) => s.id === currentPage.stepId) ?? null;
  }, [project, currentPage]);

  const currentItem = useMemo(() => {
    if (!currentStep || !currentPage || currentPage.kind !== 'item') return null;
    return currentStep.checkItems.find((ci) => ci.id === currentPage.itemId) ?? null;
  }, [currentStep, currentPage]);

  const lockedAfterIndex = useMemo(() => {
    if (!project || !pages.length) return pages.length - 1;
    const firstNotDone = project.steps.findIndex((s) => s.status !== 'done');
    if (firstNotDone === -1) return pages.length - 1;
    const lockStepId = project.steps[firstNotDone].id;
    const validateIndex = pages.findIndex((p) => p.stepId === lockStepId && p.kind === 'validate');
    return validateIndex >= 0 ? validateIndex : pages.length - 1;
  }, [project, pages]);

  const goToIndex = (nextIndex: number) => {
    const clamped = Math.max(0, Math.min(pages.length - 1, nextIndex));
    const allowed = Math.min(clamped, lockedAfterIndex);
    listRef.current?.scrollToIndex({ index: allowed, animated: true });
    setIndex(allowed);
  };

  const openUrl = async (url: string) => {
    if (url.startsWith('/')) {
      router.push(url as any);
      return;
    }
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) await Linking.openURL(url);
      else Alert.alert('Lien indisponible', url);
    } catch {
      Alert.alert('Erreur', "Impossible d'ouvrir ce lien.");
    }
  };

  const toggleCheckItem = (stepId: string, itemId: string) => {
    if (!project) return;

    const nextSteps: AutonomieStep[] = project.steps.map((s) => {
      if (s.id !== stepId) return s;
      const nextItems: AutonomieCheckItem[] = s.checkItems.map((ci) =>
        ci.id === itemId ? { ...ci, done: !ci.done } : ci
      );
      const anyDone = nextItems.some((i) => i.done);
      const allDone = nextItems.length > 0 && nextItems.every((i) => i.done);
      const nextStatus: AutonomieStep['status'] = allDone ? 'done' : anyDone ? 'in_progress' : 'pending';
      return { ...s, checkItems: nextItems, status: nextStatus };
    });

    const nextProject: AutonomieProject = { ...project, steps: nextSteps };
    updateSession({ autonomie: nextProject });
  };

  const validateAndNext = () => {
    if (!project || !currentStep) return;
    const allDone = currentStep.checkItems.length === 0 || currentStep.checkItems.every((i) => i.done);
    if (!allDone) {
      Alert.alert('Validation requise', "Terminez tous les points avant de valider l'étape.");
      return;
    }

    if (currentStep.status !== 'done') {
      const nextSteps: AutonomieStep[] = project.steps.map((s) =>
        s.id === currentStep.id ? { ...s, status: 'done' as AutonomieStep['status'] } : s
      );
      updateSession({ autonomie: { ...project, steps: nextSteps } });
    }

    const currentIdx = project.steps.findIndex((s) => s.id === currentStep.id);
    const nextStep = currentIdx >= 0 ? project.steps[currentIdx + 1] : undefined;
    if (!nextStep) return;
    const nextIntroIndex = pages.findIndex((p) => p.kind === 'intro' && p.stepId === nextStep.id);
    if (nextIntroIndex >= 0) goToIndex(nextIntroIndex);
  };

  if (!project || pages.length === 0) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Plan d’action indisponible.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.emptyBtn}>
            <Text style={styles.emptyBtnText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentStepIndex = currentStep ? project.steps.findIndex((s) => s.id === currentStep.id) : 0;
  const totalSteps = project.steps.length;
  const completedCount = currentStep?.checkItems?.filter((i) => i.done).length ?? 0;
  const totalItems = currentStep?.checkItems?.length ?? 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}> 
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.85}
          onPress={() => {
            const canGoBack = (router as any)?.canGoBack?.();
            if (canGoBack) router.back();
            else router.replace('/capi/autonomie' as any);
          }}
          accessibilityLabel="Retour"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={18} color={Colors.text} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Plan d’action</Text>
          <Text style={styles.headerSub}>
            Étape {Math.max(1, currentStepIndex + 1)}/{totalSteps}
            {totalItems > 0 ? ` · ${completedCount}/${totalItems} points` : ''}
          </Text>
        </View>

        <View style={styles.headerNavRow}>
          <TouchableOpacity
            style={[styles.navBtn, index <= 0 && styles.navBtnDisabled]}
            onPress={() => goToIndex(index - 1)}
            disabled={index <= 0}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={18} color={index <= 0 ? Colors.border : Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navBtn, (index >= lockedAfterIndex) && styles.navBtnDisabled]}
            onPress={() => goToIndex(index + 1)}
            disabled={index >= lockedAfterIndex}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="chevron-forward"
              size={18}
              color={(index >= lockedAfterIndex) ? Colors.border : Colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={pages}
        keyExtractor={(p) => p.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onMomentumScrollEnd={(e) => {
          const nextIndex = Math.round(e.nativeEvent.contentOffset.x / width);
          const allowed = Math.min(nextIndex, lockedAfterIndex);
          if (allowed !== nextIndex) {
            listRef.current?.scrollToIndex({ index: allowed, animated: true });
            setIndex(allowed);
            return;
          }
          setIndex(allowed);
        }}
        renderItem={({ item }) => {
          const step = project.steps.find((s) => s.id === item.stepId);
          if (!step) return <View style={{ width }} />;

          if (item.kind === 'intro') {
            return (
              <View style={[styles.page, { width }]}> 
                <View style={styles.card}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.stepIcon}>{step.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                      <Text style={styles.stepDesc}>{step.description}</Text>
                    </View>
                  </View>

                  {(step.ressources?.length ?? 0) > 0 && (
                    <View style={{ marginTop: 12 }}>
                      <Text style={styles.sectionTitle}>Liens utiles</Text>
                      {step.ressources.slice(0, 3).map((r, i) => (
                        <TouchableOpacity
                          key={`${step.id}:intro:r:${i}`}
                          style={styles.linkBtn}
                          onPress={() => openUrl(resolveRessourceUrl(step.id, r.url, paysCode))}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="link-outline" size={14} color={Colors.primary} />
                          <Text style={styles.linkText}>{r.titre}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <View style={styles.hintRow}>
                    <Ionicons name="swap-horizontal" size={14} color={Colors.textMuted} />
                    <Text style={styles.hintText}>Swipez pour avancer point par point.</Text>
                  </View>
                </View>
              </View>
            );
          }

          if (item.kind === 'item') {
            const ci = step.checkItems.find((x) => x.id === item.itemId);
            if (!ci) return <View style={{ width }} />;
            const resources = (ci.officialResources && ci.officialResources.length > 0)
              ? ci.officialResources
              : getDefaultOfficialResourcesForItem(step.id, step, paysCode);

            return (
              <View style={[styles.page, { width }]}> 
                <View style={styles.card}>
                  <Text style={styles.kicker}>Ce que vous devez faire</Text>
                  <Text style={styles.itemTitle}>{ci.label}</Text>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.doneBtn, ci.done && styles.doneBtnOn]}
                      activeOpacity={0.85}
                      onPress={() => toggleCheckItem(step.id, ci.id)}
                    >
                      <Ionicons
                        name={ci.done ? 'checkmark-circle' : 'ellipse-outline'}
                        size={18}
                        color={ci.done ? Colors.white : Colors.text}
                      />
                      <Text style={[styles.doneBtnText, ci.done && { color: Colors.white }]}> 
                        {ci.done ? 'Fait' : 'Marquer comme fait'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.sectionTitle}>Lien(s) correspondant(s)</Text>
                    {resources.map((r) => (
                      <TouchableOpacity
                        key={`${step.id}:${ci.id}:${r.url}:${r.label}`}
                        style={styles.linkBtn}
                        onPress={() => openUrl(resolveRessourceUrl(step.id, r.url, paysCode))}
                        activeOpacity={0.85}
                      >
                        <Ionicons
                          name={r.kind === 'button' ? 'navigate-outline' : 'link-outline'}
                          size={14}
                          color={Colors.primary}
                        />
                        <Text style={styles.linkText}>{r.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.hintRow}>
                    <Ionicons name="chatbubble-ellipses-outline" size={14} color={Colors.textMuted} />
                    <Text style={styles.hintText}>Besoin d’aide ? Ouvrez le chat CAPI.</Text>
                  </View>
                </View>
              </View>
            );
          }

          // validate
          const allDone = step.checkItems.length === 0 || step.checkItems.every((x) => x.done);
          return (
            <View style={[styles.page, { width }]}> 
              <View style={styles.card}>
                <Text style={styles.kicker}>Validation</Text>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>
                  {step.checkItems.length
                    ? `Complété : ${step.checkItems.filter((x) => x.done).length}/${step.checkItems.length} points.`
                    : 'Aucun point à cocher sur cette étape.'}
                </Text>

                <TouchableOpacity
                  style={[styles.primaryBtn, !allDone && styles.primaryBtnDisabled]}
                  activeOpacity={0.85}
                  disabled={!allDone}
                  onPress={validateAndNext}
                >
                  <Text style={styles.primaryBtnText}>
                    {currentStepIndex >= totalSteps - 1 ? 'Terminer' : 'Valider et passer à la suivante'}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>

                {!allDone && (
                  <View style={styles.noteCard}>
                    <Ionicons name="lock-closed-outline" size={16} color={Colors.warning} />
                    <Text style={styles.noteText}>Terminez tous les points avant de passer à l’étape suivante.</Text>
                  </View>
                )}
              </View>
            </View>
          );
        }}
      />

      <CapiHelpFab
        onPress={() => {
          const ctx = {
            stepId: currentStep?.id ?? '',
            stepTitle: currentStep?.title ?? '',
            itemLabel: currentItem?.label ?? '',
          };
          router.push({ pathname: '/capi/agent', params: ctx } as any);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgLight },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  headerNavRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: { opacity: 0.5 },
  page: { padding: 16, paddingBottom: 28 },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 16,
    ...UI.cardShadow,
  },
  cardTitleRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepIcon: { fontSize: 22, marginTop: 2 },
  stepTitle: { fontSize: 18, fontWeight: '900', color: Colors.text },
  stepDesc: { fontSize: 13, color: Colors.textMuted, marginTop: 6, lineHeight: 18 },
  kicker: { fontSize: 12, fontWeight: '800', color: Colors.primary },
  itemTitle: { fontSize: 18, fontWeight: '900', color: Colors.text, marginTop: 6, lineHeight: 22 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: Colors.text, marginTop: 10, marginBottom: 6 },
  actionsRow: { marginTop: 14 },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: Colors.offWhite,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  doneBtnOn: { backgroundColor: Colors.success, borderColor: Colors.success },
  doneBtnText: { fontSize: 14, fontWeight: '800', color: Colors.text },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: Colors.offWhite,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  linkText: { flex: 1, fontSize: 13, color: Colors.text, fontWeight: '700' },
  hintRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 14 },
  hintText: { fontSize: 12, color: Colors.textMuted, flex: 1 },
  primaryBtn: {
    marginTop: 14,
    backgroundColor: Colors.orange,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...UI.cardShadow,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  noteCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: Colors.offWhite,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  noteText: { flex: 1, color: Colors.textMuted, fontSize: 12, lineHeight: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { color: Colors.textMuted, fontSize: 14, marginBottom: 12 },
  emptyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyBtnText: { color: Colors.text, fontWeight: '800' },
});
