"""
Script 3: Replace renderItem section (intro/item/validate) with 'step' handler.
Uses marker-based replacement to avoid Unicode apostrophe matching issues.
"""

PATH = r'c:\capitunecax\mobile\app\capi\nouvel-arrivant.tsx'

with open(PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# Start marker: the line just after the 'finish' block ends and before the step rendering
START_MARKER = "          const s = steps.find((x) => x.id === item.stepId);\n          if (!s) return <View style={{ width }} />;"

start = content.find(START_MARKER)
if start == -1:
    print("ERROR: START_MARKER not found")
    import sys; sys.exit(1)

# The END_MARKER appears many times; we need the one after START_MARKER
# that is followed by newline + `        }}` (closing renderItem prop)
# Search for `        }}\n      />` after start
AFTER_RENDER_MARKER = "\n        }}\n      />"
end_after = content.find(AFTER_RENDER_MARKER, start)
if end_after == -1:
    print("ERROR: END_AFTER_RENDER_MARKER not found")
    import sys; sys.exit(1)

# The section to replace is from start to end_after (exclusive)
old_section = content[start:end_after]
print(f"Found section: chars {start} to {end_after} (length {end_after - start})")
print(f"Section starts: {repr(old_section[:80])}")
print(f"Section ends: {repr(old_section[-80:])}")

NEW_RENDER_SECTION = """          const s = steps.find((x) => x.id === item.stepId);
          if (!s) return <View style={{ width }} />;

          // \u2500\u2500 step: tout sur une seule page (badge, titre, docs, checklist, liens) \u2500\u2500
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
                {/* Header compteur */}
                <View style={styles.stepCounterRow}>
                  <Text style={styles.stepCounterText}>\u00c9tape {stepIndex + 1}\u00a0/\u00a0{steps.length}</Text>
                  <Text style={styles.stepCounterDone}>{st?.done ?? 0}\u00a0/\u00a0{st?.total ?? 0} faits</Text>
                </View>

                {/* Titre + description */}
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

                {/* Liens officiels */}
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

new_content = content[:start] + NEW_RENDER_SECTION + content[end_after:]
print(f"\nReplacement done. New length: {len(new_content)}")

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("File written successfully.")
