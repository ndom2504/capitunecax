"""
Script 2: Rewrites the pages useMemo, goToIndex, onMomentumScrollEnd,
removes dead code (lockedAfterIndex, currentItem, validateAndNext),
and rewrites renderItem for 'step' pages.
"""
import sys

PATH = r'c:\capitunecax\mobile\app\capi\nouvel-arrivant.tsx'

with open(PATH, 'r', encoding='utf-8') as f:
    content = f.read()

def replace_once(src, old, new, label):
    idx = src.find(old)
    if idx == -1:
        print(f'  ERROR: [{label}] not found!')
        return src
    print(f'  OK: [{label}] found at {idx}')
    return src[:idx] + new + src[idx + len(old):]

# ─────────────────────────────────────────────────────────────────────────────
# 1. pages useMemo – generate 'step' pages instead of intro/item/validate
# ─────────────────────────────────────────────────────────────────────────────
OLD_PAGES = """  const pages: Page[] = useMemo(() => {
    const out: Page[] = [{ key: 'pick', kind: 'pick' }];
    if (!stage) return out;
    for (const s of steps) {
      out.push({ key: `intro:${s.id}`, kind: 'intro', stepId: s.id });
      for (const ci of s.checkItems) {
        out.push({ key: `item:${s.id}:${ci.id}`, kind: 'item', stepId: s.id, itemId: ci.id });
      }
      out.push({ key: `validate:${s.id}`, kind: 'validate', stepId: s.id });
    }
    out.push({ key: 'finish', kind: 'finish' });
    return out;
  }, [stage, steps]);"""

NEW_PAGES = """  const pages: Page[] = useMemo(() => {
    const out: Page[] = [{ key: 'pick', kind: 'pick' }];
    if (!stage) return out;
    for (const s of steps) {
      out.push({ key: `step:${s.id}`, kind: 'step', stepId: s.id });
    }
    out.push({ key: 'finish', kind: 'finish' });
    return out;
  }, [stage, steps]);"""

content = replace_once(content, OLD_PAGES, NEW_PAGES, 'pages useMemo')

# ─────────────────────────────────────────────────────────────────────────────
# 2. Remove lockedAfterIndex useMemo
# ─────────────────────────────────────────────────────────────────────────────
OLD_LOCKED = """
  const lockedAfterIndex = useMemo(() => {
    if (!stage || pages.length === 0) return pages.length - 1;
    const firstIncomplete = steps.find((s) => {
      const st = stepStats[s.id];
      return st ? !st.allDone : true;
    });
    if (!firstIncomplete) return pages.length - 1;
    const validateIndex = pages.findIndex((p) => p.kind === 'validate' && p.stepId === firstIncomplete.id);
    return validateIndex >= 0 ? validateIndex : pages.length - 1;
  }, [stage, pages, steps, stepStats]);
"""

content = replace_once(content, OLD_LOCKED, '\n', 'lockedAfterIndex useMemo')

# ─────────────────────────────────────────────────────────────────────────────
# 3. Update goToIndex – remove lockedAfterIndex
# ─────────────────────────────────────────────────────────────────────────────
OLD_GO = """  const goToIndex = (nextIndex: number) => {
    const clamped = Math.max(0, Math.min(pages.length - 1, nextIndex));
    const allowed = Math.min(clamped, lockedAfterIndex);
    listRef.current?.scrollToIndex({ index: allowed, animated: true });
    setIndex(allowed);
  };"""

NEW_GO = """  const goToIndex = (nextIndex: number) => {
    const clamped = Math.max(0, Math.min(pages.length - 1, nextIndex));
    listRef.current?.scrollToIndex({ index: clamped, animated: true });
    setIndex(clamped);
  };"""

content = replace_once(content, OLD_GO, NEW_GO, 'goToIndex')

# ─────────────────────────────────────────────────────────────────────────────
# 4. Remove currentPage, currentStep, currentItem, validateAndNext
# ─────────────────────────────────────────────────────────────────────────────
OLD_CURRENT = """  const currentPage = pages[index];
  const currentStep = useMemo(() => {
    if (!currentPage || currentPage.kind === 'pick' || currentPage.kind === 'finish') return null;
    return steps.find((s) => s.id === currentPage.stepId) ?? null;
  }, [currentPage, steps]);

  const currentItem = useMemo(() => {
    if (!currentPage || currentPage.kind !== 'item' || !currentStep) return null;
    return currentStep.checkItems.find((ci) => ci.id === currentPage.itemId) ?? null;
  }, [currentPage, currentStep]);

  const validateAndNext = () => {
    if (!currentPage || currentPage.kind !== 'validate' || !currentStep) return;
    const st = stepStats[currentStep.id];
    const allDone = st ? st.allDone : false;
    if (!allDone) {
      Alert.alert('Validation requise', "Terminez tous les points avant de valider l'\u00e9tape.");
      return;
    }

    const currentIdx = steps.findIndex((s) => s.id === currentStep.id);
    const nextStep = currentIdx >= 0 ? steps[currentIdx + 1] : undefined;
    if (!nextStep) {
      const finishIndex = pages.findIndex((p) => p.kind === 'finish');
      if (finishIndex >= 0) goToIndex(finishIndex);
      return;
    }
    const nextIntroIndex = pages.findIndex((p) => p.kind === 'intro' && p.stepId === nextStep.id);
    if (nextIntroIndex >= 0) goToIndex(nextIntroIndex);
  };"""

content = replace_once(content, OLD_CURRENT, '', 'currentPage/currentStep/currentItem/validateAndNext')

# ─────────────────────────────────────────────────────────────────────────────
# 5. Update onMomentumScrollEnd – remove lockedAfterIndex
# ─────────────────────────────────────────────────────────────────────────────
OLD_SCROLL = """        onMomentumScrollEnd={(e) => {
          const nextIndex = Math.round(e.nativeEvent.contentOffset.x / width);
          const clamped = Math.max(0, Math.min(pages.length - 1, nextIndex));
          const allowed = Math.min(clamped, lockedAfterIndex);
          if (allowed !== clamped) {
            listRef.current?.scrollToIndex({ index: allowed, animated: true });
            setIndex(allowed);
            return;
          }
          setIndex(allowed);
        }}"""

NEW_SCROLL = """        onMomentumScrollEnd={(e) => {
          const nextIndex = Math.round(e.nativeEvent.contentOffset.x / width);
          const clamped = Math.max(0, Math.min(pages.length - 1, nextIndex));
          setIndex(clamped);
        }}"""

content = replace_once(content, OLD_SCROLL, NEW_SCROLL, 'onMomentumScrollEnd')

# ─────────────────────────────────────────────────────────────────────────────
# 6. Replace renderItem: remove intro/item/validate handlers, add step handler
#    The section to replace starts at:
#      const s = steps.find((x) => x.id === item.stepId);
#      if (!s) return <View style={{ width }} />;
#    And ends before the closing `}}` of renderItem.
# ─────────────────────────────────────────────────────────────────────────────
OLD_RENDER = """          const s = steps.find((x) => x.id === item.stepId);
          if (!s) return <View style={{ width }} />;

          if (item.kind === 'intro') {
            const st = stepStats[s.id];
            return (
              <View style={[styles.page, { width }]}> 
                <ScrollView
                  style={styles.pageScroll}
                  contentContainerStyle={styles.pageScrollContent}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  <View style={styles.capiHeader}>
                    <CapiAvatar size={44} state="idle" />
                    <View style={styles.bubble}>
                      <Text style={styles.bubbleText}>{"Voici l'\u00e9tape. Cochez les actions, puis validez."}</Text>
                    </View>
                  </View>

                  <View style={styles.card}>
                    {s.when && <Text style={styles.kicker}>{s.when}</Text>}
                    <Text style={styles.stepTitle}>{s.title}</Text>
                    <Text style={styles.stepDesc}>{s.description}</Text>

                    <View style={styles.inlineMeta}>
                      <Ionicons name="checkmark-done" size={14} color={Colors.textMuted} />
                      <Text style={styles.inlineMetaText}>{(st?.done ?? 0)}/{(st?.total ?? 0)} actions compl\u00e9t\u00e9es</Text>
                    </View>

                    {(s.documents?.length ?? 0) > 0 && (
                      <View style={{ marginTop: 12 }}>
                        <Text style={styles.sectionTitle}>Documents \u00e0 avoir</Text>
                        <View style={{ gap: 8, marginTop: 10 }}>
                          {s.documents!.map((d) => (
                            <View key={`${s.id}:doc:${d}`} style={styles.bulletRow}>
                              <Ionicons name="document-text-outline" size={14} color={Colors.textMuted} />
                              <Text style={styles.bulletText}>{d}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    <View style={{ marginTop: 12 }}>
                      <Text style={styles.sectionTitle}>Liens utiles</Text>
                      <View style={{ gap: 10, marginTop: 10 }}>
                        {s.links.map((l) => (
                          <TouchableOpacity
                            key={`${s.id}__${l.url}__${l.label}`}
                            style={styles.linkBtn}
                            activeOpacity={0.85}
                            onPress={() => openOfficial(l.url)}
                          >
                            <Ionicons name="link-outline" size={14} color={Colors.primary} />
                            <Text style={styles.linkText} numberOfLines={3}>{l.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View style={styles.hintRow}>
                    <Ionicons name="swap-horizontal" size={14} color={Colors.textMuted} />
                    <Text style={styles.hintText}>Swipez pour passer aux actions \u00e0 cocher.</Text>
                  </View>
                </ScrollView>
              </View>
            );
          }

          if (item.kind === 'item') {
            const ci = s.checkItems.find((x) => x.id === item.itemId);
            if (!ci) return <View style={{ width }} />;
            const done = isDone(s.id, ci.id);
            const resources = (ci.links && ci.links.length > 0) ? ci.links : s.links;

            return (
              <View style={[styles.page, { width }]}> 
                <ScrollView
                  style={styles.pageScroll}
                  contentContainerStyle={styles.pageScrollContent}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  <View style={styles.capiHeader}>
                    <CapiAvatar size={44} state="idle" />
                    <View style={styles.bubble}>
                      <Text style={styles.bubbleText}>{"Cochez cette action quand c'est fait."}</Text>
                    </View>
                  </View>

                  <View style={styles.card}>
                    {s.when && <Text style={styles.kicker}>{s.when}</Text>}
                    <Text style={styles.kicker}>Ce que vous devez faire</Text>
                    <Text style={styles.itemTitle}>{ci.label}</Text>

                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={[styles.doneBtn, done && styles.doneBtnOn]}
                        activeOpacity={0.85}
                        onPress={() => toggleCheckItem(s.id, ci.id)}
                      >
                        <Ionicons
                          name={done ? 'checkmark-circle' : 'ellipse-outline'}
                          size={18}
                          color={done ? Colors.white : Colors.text}
                        />
                        <Text style={[styles.doneBtnText, done && { color: Colors.white }]}>
                          {done ? 'Fait' : 'Marquer comme fait'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={{ marginTop: 12 }}>
                      <Text style={styles.sectionTitle}>Lien(s) correspondant(s)</Text>
                      <View style={{ gap: 10, marginTop: 10 }}>
                        {resources.map((r) => (
                          <TouchableOpacity
                            key={`${s.id}:${ci.id}:${r.url}:${r.label}`}
                            style={styles.linkBtn}
                            onPress={() => openOfficial(r.url)}
                            activeOpacity={0.85}
                          >
                            <Ionicons name="link-outline" size={14} color={Colors.primary} />
                            <Text style={styles.linkText}>{r.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View style={styles.hintRow}>
                    <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
                    <Text style={styles.hintText}>Priorisez les liens officiels (Canada.ca / ASFC / CISR).</Text>
                  </View>
                </ScrollView>
              </View>
            );
          }

          // validate
          const st = stepStats[s.id];
          const allDone = st ? st.allDone : false;
          return (
            <View style={[styles.page, { width }]}> 
              <ScrollView
                style={styles.pageScroll}
                contentContainerStyle={styles.pageScrollContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                <View style={styles.capiHeader}>
                  <CapiAvatar size={44} state="idle" />
                  <View style={styles.bubble}>
                    <Text style={styles.bubbleText}>{"Validez l'\u00e9tape pour continuer."}</Text>
                  </View>
                </View>

                <View style={styles.card}>
                  <Text style={styles.kicker}>Validation</Text>
                  <Text style={styles.stepTitle}>{s.title}</Text>
                  <Text style={styles.stepDesc}>{`Compl\u00e9t\u00e9 : ${(st?.done ?? 0)}/${(st?.total ?? 0)} actions.`}</Text>

                  <TouchableOpacity
                    style={[styles.primaryBtn, !allDone && styles.primaryBtnDisabled]}
                    activeOpacity={0.85}
                    disabled={!allDone}
                    onPress={validateAndNext}
                  >
                    <Text style={styles.primaryBtnText}>
                      {s.id === steps[steps.length - 1]?.id ? 'Terminer' : 'Valider et passer \u00e0 la suivante'}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                  </TouchableOpacity>

                  {!allDone && (
                    <View style={styles.hintRow}>
                      <Ionicons name="alert-circle-outline" size={14} color={Colors.textMuted} />
                      <Text style={styles.hintText}>Terminez tous les points avant de valider.</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>
          );"""

NEW_RENDER = """          const s = steps.find((x) => x.id === item.stepId);
          if (!s) return <View style={{ width }} />;

          // ── step: tout sur une seule page (badge, titre, docs, checklist, liens) ──
          const st = stepStats[s.id];
          const stepIndex = steps.findIndex((x) => x.id === s.id);
          return (
            <View style={[styles.page, { width }]}>
              <ScrollView
                style={styles.pageScroll}
                contentContainerStyle={styles.pageScrollContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                {/* Header step counter */}
                <View style={styles.stepCounterRow}>
                  <Text style={styles.stepCounterText}>\u00c9tape {stepIndex + 1} / {steps.length}</Text>
                  <Text style={styles.stepCounterDone}>{st?.done ?? 0}/{st?.total ?? 0} faits</Text>
                </View>

                <View style={styles.card}>
                  {s.when && <Text style={styles.kicker}>{s.when}</Text>}
                  <Text style={styles.stepTitle}>{s.title}</Text>
                  <Text style={styles.stepDesc}>{s.description}</Text>
                </View>

                {/* Documents */}
                {(s.documents?.length ?? 0) > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Documents \u00e0 avoir</Text>
                    <View style={styles.sectionBody}>
                      {s.documents!.map((d) => (
                        <View key={`${s.id}:doc:${d}`} style={styles.bulletRow}>
                          <Ionicons name="document-text-outline" size={14} color={Colors.textMuted} />
                          <Text style={styles.bulletText}>{d}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Checklist */}
                {s.checkItems.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Actions \u00e0 compl\u00e9ter</Text>
                    <View style={styles.sectionBody}>
                      {s.checkItems.map((ci) => {
                        const done = isDone(s.id, ci.id);
                        return (
                          <TouchableOpacity
                            key={`${s.id}:check:${ci.id}`}
                            style={[styles.checkRow, done && styles.checkRowDone]}
                            activeOpacity={0.75}
                            onPress={() => toggleCheckItem(s.id, ci.id)}
                          >
                            <Ionicons
                              name={done ? 'checkmark-circle' : 'ellipse-outline'}
                              size={20}
                              color={done ? Colors.success : Colors.textMuted}
                            />
                            <Text style={[styles.checkLabel, done && styles.checkLabelDone]}>{ci.label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Liens */}
                {s.links.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ressources officielles</Text>
                    <View style={styles.sectionBody}>
                      {s.links.map((l) => (
                        <TouchableOpacity
                          key={`${s.id}:link:${l.url}`}
                          style={styles.linkBtn}
                          activeOpacity={0.85}
                          onPress={() => openOfficial(l.url)}
                        >
                          <Ionicons name="link-outline" size={14} color={Colors.primary} />
                          <Text style={styles.linkText} numberOfLines={3}>{l.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Navigation Pr\u00e9c / Suivant */}
                <View style={styles.navRow}>
                  <TouchableOpacity
                    style={styles.navBtn}
                    activeOpacity={0.85}
                    onPress={() => goToIndex(index - 1)}
                  >
                    <Ionicons name="arrow-back" size={18} color={Colors.text} />
                    <Text style={styles.navBtnText}>Pr\u00e9c.</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.navBtn, styles.navBtnPrimary]}
                    activeOpacity={0.85}
                    onPress={() => goToIndex(index + 1)}
                  >
                    <Text style={[styles.navBtnText, { color: Colors.white }]}>
                      {stepIndex === steps.length - 1 ? 'Terminer' : 'Suivant'}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                  </TouchableOpacity>
                </View>

                <View style={{ height: 24 }} />
              </ScrollView>
            </View>
          );"""

content = replace_once(content, OLD_RENDER, NEW_RENDER, 'renderItem step handler')

# ─────────────────────────────────────────────────────────────────────────────
# 7. Add new styles for step pages (section, checkRow, navRow, stepCounterRow)
# ─────────────────────────────────────────────────────────────────────────────
OLD_STYLES_END = """  secondaryBtnText: { color: Colors.text, fontSize: 14, fontWeight: '800' },
});"""

NEW_STYLES_END = """  secondaryBtnText: { color: Colors.text, fontSize: 14, fontWeight: '800' },

  // Step page
  stepCounterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4 },
  stepCounterText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  stepCounterDone: { fontSize: 12, fontWeight: '900', color: Colors.orange },

  section: { paddingHorizontal: 20, marginTop: 14 },
  sectionBody: { marginTop: 10, gap: 10 },

  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: Colors.offWhite, borderWidth: 1, borderColor: Colors.border },
  checkRowDone: { borderColor: Colors.success, backgroundColor: Colors.surface },
  checkLabel: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 19, fontWeight: '600' },
  checkLabelDone: { color: Colors.success },

  navRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 20 },
  navBtn: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  navBtnPrimary: { backgroundColor: Colors.orange, borderColor: Colors.orange },
  navBtnText: { fontSize: 14, fontWeight: '800', color: Colors.text },
});"""

content = replace_once(content, OLD_STYLES_END, NEW_STYLES_END, 'new styles')

# ─────────────────────────────────────────────────────────────────────────────
# Write
# ─────────────────────────────────────────────────────────────────────────────
with open(PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print('\nAll done! File written.')
print(f'Final length: {len(content)} chars')
