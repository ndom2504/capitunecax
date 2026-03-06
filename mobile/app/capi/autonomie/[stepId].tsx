import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode, type AVPlaybackStatus } from 'expo-av';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../../constants/Colors';
import { UI } from '../../../constants/UI';
import { useCapiSession } from '../../../context/CapiContext';
import {
  getBiometrieUrl, getMedecinDesigneUrl, getPaysLabel,
} from '../../../lib/dli-data';
import type { AutonomieProject, AutonomieStep, AutonomieCheckItem } from '../../../lib/api';

// ---------------------------------------------------------------------------
// Utilitaire : URL intelligente selon l'étape et le pays
// ---------------------------------------------------------------------------

function resolveActionUrl(stepId: string, baseUrl: string | undefined, paysCode?: string): string | undefined {
  if (!baseUrl) return undefined;
  // Étapes biométrie → VFS Global selon pays
  if (stepId.includes('biometrie')) return getBiometrieUrl(paysCode);
  // Étapes examens médicaux → DMP IRCC avec filtre pays
  if (stepId.includes('exam-medical') || stepId.includes('examens-medicaux')) return getMedecinDesigneUrl(paysCode);
  return baseUrl;
}

function resolveRessourceUrl(stepId: string, baseUrl: string, paysCode?: string): string {
  if (stepId.includes('biometrie') && baseUrl.includes('biometrie')) return getBiometrieUrl(paysCode);
  if ((stepId.includes('exam-medical') || stepId.includes('examens-medicaux')) && baseUrl.includes('dmp')) return getMedecinDesigneUrl(paysCode);
  return baseUrl;
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function AutonomieStepScreen() {
  const router = useRouter();
  const { stepId } = useLocalSearchParams<{ stepId: string }>();
  const { session, updateSession } = useCapiSession();

  const [selectedDli, setSelectedDli] = useState<Array<{ id: string; nom: string; ville?: string; province?: string; type?: string; admissionsUrl?: string }> | null>(null);
  const videoRef = useRef<Video>(null);
  const [videoFinished, setVideoFinished] = useState(false);

  const project = session.autonomie;
  // Récupère le code pays depuis le profil CAPI (ex: "MA", "DZ", "FR")
  const paysCode = session.profile?.paysCode;

  const step = useMemo(
    () => project?.steps.find(s => s.id === stepId),
    [project, stepId],
  );

  const stepIndex = useMemo(
    () => project?.steps.findIndex(s => s.id === stepId) ?? -1,
    [project, stepId],
  );

  // Drapeaux pour les étapes spéciales
  const isEtablissement = stepId === 'choisir-etablissement';
  const isAdmission = stepId === 'demande-admission';
  const isCAQ = stepId === 'caq-mifi';
  const isBiometrie = typeof stepId === 'string' && stepId.includes('biometrie');
  const isMedical = typeof stepId === 'string' &&
    (stepId.includes('exam-medical') || stepId.includes('examens-medicaux'));

  const admissionStep = useMemo(
    () => project?.steps.find(s => s.id === 'demande-admission'),
    [project],
  );

  const isAdmissionComplete = useMemo(() => {
    if (!admissionStep) return false;
    return admissionStep.checkItems.length > 0 && admissionStep.checkItems.every(i => i.done);
  }, [admissionStep]);

  // Bloque l'accès à l'étape CAQ tant que la demande d'admission n'est pas validée.
  useEffect(() => {
    if (!project) return;
    if (!isCAQ) return;
    if (isAdmissionComplete) return;

    Alert.alert(
      'Étape 2 requise',
      'Validez toutes les actions de la demande d\'admission avant de passer au CAQ.',
      [{ text: 'OK', onPress: () => router.replace('/capi/autonomie/demande-admission' as never) }],
    );
  }, [project, isCAQ, isAdmissionComplete, router]);

  // Charge les 3 choix validés (étape 1) pour l'étape 2.
  useEffect(() => {
    if (!isAdmission) return;
    let alive = true;
    AsyncStorage.getItem('capi_selected_dli')
      .then(raw => {
        if (!alive) return;
        if (!raw) { setSelectedDli([]); return; }
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setSelectedDli(parsed);
          else setSelectedDli([]);
        } catch {
          setSelectedDli([]);
        }
      })
      .catch(() => { if (alive) setSelectedDli([]); });
    return () => { alive = false; };
  }, [isAdmission]);

  const openUrl = useCallback(async (url: string) => {
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Lien indisponible', url);
      }
    } catch {
      Alert.alert('Erreur', "Impossible d'ouvrir ce lien.");
    }
  }, []);

  const goToStep = useCallback((offset: number) => {
    if (!project || !step) return;

    // Gating global : on ne passe pas à l'étape suivante tant que tout n'est pas validé.
    if (offset > 0) {
      const allDone = step.checkItems.length === 0 || step.checkItems.every(i => i.done);
      if (!allDone) {
        Alert.alert(
          'Validation requise',
          "Chaque point doit être marqué comme fait avant de passer à l'étape suivante."
        );
        return;
      }
    }

    const target = project.steps[stepIndex + offset];
    if (target) router.replace(`/capi/autonomie/${target.id}` as never);
  }, [project, stepIndex, router, step]);

  const toggleCheckItem = useCallback((itemId: string) => {
    if (!project || !step || typeof stepId !== 'string') return;

    const nextSteps: AutonomieStep[] = project.steps.map((s) => {
      if (s.id !== stepId) return s;
      const nextItems: AutonomieCheckItem[] = s.checkItems.map((ci) =>
        (ci.id === itemId ? { ...ci, done: !ci.done } : ci)
      );
      const anyDone = nextItems.some(i => i.done);
      const allDone = nextItems.length > 0 && nextItems.every(i => i.done);
      const nextStatus: AutonomieStep['status'] = allDone ? 'done' : anyDone ? 'in_progress' : 'pending';
      return { ...s, checkItems: nextItems, status: nextStatus };
    });

    const nextProject: AutonomieProject = { ...project, steps: nextSteps };
    updateSession({ autonomie: nextProject });
  }, [project, step, stepId, updateSession]);

  if (!project || !step) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Étape introuvable.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.emptyBtn}>
            <Text style={styles.emptyBtnText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const hasPrev = stepIndex > 0;
  const hasNext = stepIndex < project.steps.length - 1;

  // URLs résolues intelligemment
  const smartActionUrl = resolveActionUrl(stepId as string, step.actionUrl, paysCode);
  const paysLabel = getPaysLabel(paysCode);

  const isLastStep = stepIndex === project.steps.length - 1;
  const allCurrentDone = step.checkItems.length === 0 || step.checkItems.every(i => i.done);
  const showBonVoyage = isLastStep && allCurrentDone;
  const showPreparationVideoInline = isLastStep && project.motif === 'visiter' && !allCurrentDone;

  const onBonVoyagePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    if (status.didJustFinish && !videoFinished) {
      setVideoFinished(true);
      void (async () => {
        try {
          await videoRef.current?.setIsLoopingAsync(true);
          await videoRef.current?.replayAsync();
        } catch {
          // ignore
        }
      })();
    }
  }, [videoFinished]);

  if (showBonVoyage) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Félicitations ! 🎉</Text>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.bonVoyageContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.heroIconWrap}>
            <Text style={styles.heroIconEmoji}>✈️</Text>
          </View>
          <Text style={styles.heroTitle}>Bon voyage !</Text>
          <Text style={styles.heroDesc}>Un dernier conseil avant votre départ vers le Canada</Text>

          <View style={styles.videoWrapper}>
            <Video
              ref={videoRef}
              source={require('../../../assets/videos/preparation-depart.mp4')}
              style={styles.video}
              useNativeControls={true}
              resizeMode={ResizeMode.COVER}
              isLooping={false}
              shouldPlay
              onPlaybackStatusUpdate={onBonVoyagePlaybackStatusUpdate}
              onError={() => {
                Alert.alert('Vidéo indisponible', 'Impossible de lire la vidéo de préparation.');
                setVideoFinished(true);
              }}
            />
          </View>

          {videoFinished && (
            <View style={styles.actionSection}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.replace('/capi/integration' as never)}
                activeOpacity={0.85}
              >
                <Text style={styles.actionBtnText}>Lancer la Phase Intégration</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header avec navigation */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Étape {step.ordre} / {project.steps.length}
        </Text>
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={() => goToStep(-1)}
            disabled={!hasPrev}
            style={[styles.navBtn, !hasPrev && styles.navBtnDisabled]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={20} color={hasPrev ? Colors.text : Colors.border} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => goToStep(1)}
            disabled={!hasNext}
            style={[styles.navBtn, !hasNext && styles.navBtnDisabled]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-forward" size={20} color={hasNext ? Colors.text : Colors.border} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIconWrap}>
            <Text style={styles.heroIconEmoji}>{step.icon}</Text>
          </View>
          {step.delaiEstime && (
            <View style={styles.delaiBadge}>
              <Ionicons name="time-outline" size={13} color={Colors.primary} />
              <Text style={styles.delaiText}>{step.delaiEstime}</Text>
            </View>
          )}
          <Text style={styles.heroTitle}>{step.title}</Text>
          <Text style={styles.heroDesc}>{step.description}</Text>
        </View>

        {/* Vidéo de préparation (Visa visiteur) — visible dès l'étape 5 */}
        {showPreparationVideoInline && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="videocam-outline" size={16} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Vidéo de préparation</Text>
            </View>
            <View style={styles.videoWrapper}>
              <Video
                ref={videoRef}
                source={require('../../../assets/videos/preparation-depart.mp4')}
                style={styles.video}
                useNativeControls={true}
                resizeMode={ResizeMode.COVER}
                isLooping={false}
                shouldPlay={false}
                onPlaybackStatusUpdate={onBonVoyagePlaybackStatusUpdate}
                onError={() => {
                  Alert.alert('Vidéo indisponible', 'Impossible de lire la vidéo de préparation.');
                }}
              />
            </View>
          </View>
        )}

        {/* ── ÉTAPE SPÉCIALE : Choisir un établissement DLI ─────────────── */}
        {isEtablissement && (
          <View style={styles.specialSection}>
            <View style={styles.specialHeader}>
              <Text style={styles.specialEmoji}>🎓</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.specialTitle}>Recherche d'établissement</Text>
                <Text style={styles.specialSub}>Base de données DLI interactive — 60+ institutions</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.dliBtn}
              onPress={() => router.push('/capi/autonomie/dli-search' as never)}
              activeOpacity={0.85}
            >
              <Ionicons name="search-outline" size={18} color="#fff" />
              <Text style={styles.dliBtnText}>Rechercher un établissement désigné</Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
            <View style={styles.dliInfo}>
              <Ionicons name="checkmark-circle-outline" size={14} color={Colors.success} />
              <Text style={styles.dliInfoText}>Filtre par province, type, domaine — bouton "Demande d'admission" directement vers le site officiel</Text>
            </View>
          </View>
        )}

        {/* ── ÉTAPE SPÉCIALE : Demande d'admission — afficher les choix validés ── */}
        {isAdmission && (
          <View style={styles.specialSection}>
            <View style={styles.specialHeader}>
              <Text style={styles.specialEmoji}>✅</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.specialTitle}>Vos 3 choix validés</Text>
                <Text style={styles.specialSub}>Ces établissements doivent apparaître ici avant de continuer.</Text>
              </View>
            </View>

            <View style={styles.actionsCard}>
              {selectedDli === null ? (
                <View style={styles.actionRow}>
                  <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
                  <Text style={[styles.actionLabel, { marginLeft: 10 }]}>Chargement…</Text>
                </View>
              ) : selectedDli.length === 0 ? (
                <View style={styles.actionRow}>
                  <Ionicons name="alert-circle-outline" size={16} color={Colors.warning} />
                  <Text style={[styles.actionLabel, { marginLeft: 10 }]}>Aucun choix enregistré. Retournez à l'étape 1 pour valider vos 3 établissements.</Text>
                </View>
              ) : (
                selectedDli.slice(0, 3).map((inst, idx) => (
                  <View
                    key={inst.id ?? String(idx)}
                    style={[styles.actionRow, idx < Math.min(3, selectedDli.length) - 1 && styles.actionRowBorder]}
                  >
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.actionLabel, { fontWeight: '800' }]}>{inst.nom}</Text>
                      <Text style={styles.ressourceDesc} numberOfLines={2}>
                        {(inst.ville ? inst.ville : '—')}{inst.province ? ` · ${inst.province}` : ''}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={async () => {
                        const name = inst.nom ?? 'Établissement';
                        const google = `https://www.google.com/search?q=${encodeURIComponent(`${name} admissions Canada`)}`;
                        const normalizeUrl = (u: string): string => {
                          const trimmed = u.trim();
                          if (!trimmed) return '';
                          if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
                          if (trimmed.startsWith('www.')) return `https://${trimmed}`;
                          if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(trimmed)) return `https://${trimmed}`;
                          return trimmed;
                        };

                        const buildAdmissionUrls = (official: string): string[] => {
                          try {
                            const url = new URL(official);
                            const origin = url.origin;
                            const path = (url.pathname || '/').toLowerCase();
                            const looksLikeAdmission = /admission|admissions|apply|future-students|prospective|international/.test(path);
                            const suffixes = [
                              '/admissions',
                              '/admission',
                              '/apply',
                              '/apply-now',
                              '/future-students',
                              '/prospective-students',
                              '/international',
                              '/international-students',
                              '/international/admissions',
                              '/en/admissions',
                              '/fr/admission',
                            ];
                            const derived = suffixes.map(s => `${origin}${s}`);
                            return Array.from(new Set([
                              ...(looksLikeAdmission ? [official] : []),
                              ...derived,
                              official,
                              origin,
                            ].filter(Boolean)));
                          } catch {
                            return official ? [official] : [];
                          }
                        };

                        const raw = normalizeUrl(inst.admissionsUrl?.trim() ?? '');
                        if (!raw) {
                          Alert.alert('Lien officiel indisponible', 'Ouverture d\'une recherche web.', [
                            { text: 'OK', onPress: () => { Linking.openURL(google).catch(() => {}); } },
                          ]);
                          return;
                        }

                        const tries: string[] = [];
                        if (raw.toLowerCase().includes('usherb.ca')) {
                          tries.push('https://www.usherbrooke.ca/');
                        }

                        // D'abord essayer les pages d'admission dérivées
                        tries.push(...buildAdmissionUrls(raw));

                        if (raw.startsWith('http://')) {
                          tries.push(raw.replace(/^http:\/\//, 'https://'));
                          tries.push(raw);
                        } else if (raw.startsWith('https://')) {
                          tries.push(raw);
                          tries.push(raw.replace(/^https:\/\//, 'http://'));
                        } else {
                          tries.push(raw);
                        }

                        let opened = false;
                        for (const u of Array.from(new Set(tries.filter(Boolean)))) {
                          try {
                            await Linking.openURL(u);
                            opened = true;
                            break;
                          } catch {
                            // next
                          }
                        }

                        if (!opened) {
                          Alert.alert('Lien non ouvrable', 'Ouvrir une recherche web ?', [
                            { text: 'Annuler', style: 'cancel' },
                            { text: 'Rechercher', onPress: () => { Linking.openURL(google).catch(() => {}); } },
                          ]);
                        }
                      }}
                      style={styles.smallActionBtn}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.smallActionBtnText}>Admission</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            <TouchableOpacity
              style={[styles.dliBtn, { marginTop: 12 }]}
              onPress={() => router.push('/capi/autonomie/dli-search' as never)}
              activeOpacity={0.85}
            >
              <Ionicons name="create-outline" size={18} color="#fff" />
              <Text style={styles.dliBtnText}>Modifier mes choix (étape 1)</Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>

            <View style={{ height: 12 }} />

            <View style={styles.actionsCard}>
              <View style={[styles.actionRow, styles.actionRowBorder]}>
                <Ionicons name="sparkles-outline" size={16} color={Colors.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.actionLabel, { fontWeight: '800' }]}>Agent CAPI — Lettre & relevés</Text>
                  <Text style={styles.ressourceDesc}>
                    {typeof session.evaluation?.faisabilite === 'number'
                      ? `Score de chance (indicatif) : ${session.evaluation.faisabilite}%`
                      : "Ouvrez la messagerie pour faire réviser votre lettre et vos documents."}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/messagerie' as never)}
                  style={styles.smallActionBtn}
                  activeOpacity={0.85}
                >
                  <Text style={styles.smallActionBtnText}>Ouvrir</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.actionRow}>
                <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
                <Text style={[styles.actionLabel, { marginLeft: 10 }]}>Cochez l'action quand vous avez reçu votre score et vos corrections.</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── ÉTAPE SPÉCIALE : Biométrie — lien VFS selon pays ─────────── */}
        {isBiometrie && (
          <View style={styles.paysBanner}>
            <Text style={styles.paysEmoji}>🖐️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.paysTitle}>Centre VFS Global — {paysLabel}</Text>
              <Text style={styles.paysSub}>
                {paysCode
                  ? `Lien généré spécifiquement pour les résidents de ${paysLabel}`
                  : 'Définissez votre pays dans votre profil pour un lien personnalisé'}
              </Text>
            </View>
          </View>
        )}

        {/* ── ÉTAPE SPÉCIALE : Examen médical — DMP selon pays ─────────── */}
        {isMedical && (
          <View style={styles.paysBanner}>
            <Text style={styles.paysEmoji}>🏥</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.paysTitle}>Médecins désignés — {paysLabel}</Text>
              <Text style={styles.paysSub}>
                {paysCode
                  ? `Recherche filtrée pour ${paysLabel} sur le portail DMP d'IRCC`
                  : 'Définissez votre pays dans votre profil pour filtrer par pays'}
              </Text>
            </View>
          </View>
        )}

        {/* Actions à réaliser (bullet points non-cliquables) */}
        {step.checkItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list-outline" size={16} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Ce que vous devez faire</Text>
            </View>
            <View style={styles.actionsCard}>
              {step.checkItems.map((item, i) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.actionRow, i < step.checkItems.length - 1 && styles.actionRowBorder]}
                  onPress={() => toggleCheckItem(item.id)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
                    size={18}
                    color={item.done ? Colors.success : Colors.textMuted}
                  />
                  <Text style={[styles.actionLabel, { marginLeft: 10 }, item.done && { color: Colors.text }]}> {item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Indication blocante pour l'étape 2 */}
            {isAdmission && !isAdmissionComplete && (
              <View style={styles.noteCardInline}>
                <Ionicons name="lock-closed-outline" size={15} color={Colors.warning} />
                <Text style={styles.noteInlineText}>
                  Validez tout avant de passer à l'étape 3 (CAQ).
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Documents requis */}
        {step.documents && step.documents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={16} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Documents requis</Text>
            </View>
            <View style={styles.docsCard}>
              {step.documents.map((doc, i) => (
                <View
                  key={i}
                  style={[styles.docRow, i < step.documents!.length - 1 && styles.docRowBorder]}
                >
                  <Ionicons name="document-outline" size={16} color="#e87722" />
                  <Text style={styles.docLabel}>{doc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Ressources officielles */}
        {step.ressources.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="link-outline" size={16} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Ressources officielles</Text>
            </View>
            <View style={styles.ressourcesList}>
              {step.ressources.map((r, i) => {
                const resolvedUrl = resolveRessourceUrl(stepId as string, r.url, paysCode);
                return (
                  <View key={i} style={styles.ressourceCard}>
                    <View style={styles.ressourceIconWrap}>
                      <Ionicons name="globe-outline" size={18} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ressourceTitre}>{r.titre}</Text>
                      <Text style={styles.ressourceDesc}>{r.description}</Text>
                      {/* Badge "personnalisé" si URL modifiée */}
                      {resolvedUrl !== r.url && (
                        <View style={styles.smartBadge}>
                          <Ionicons name="locate-outline" size={11} color={Colors.primary} />
                          <Text style={styles.smartBadgeText}>Lien adapté — {paysLabel}</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.ressourceOpenBtn}
                      onPress={() => openUrl(resolvedUrl)}
                      activeOpacity={0.75}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.ressourceOpenText}>Ouvrir</Text>
                      <Ionicons name="open-outline" size={14} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Bouton action principal */}
        {step.actionLabel && smartActionUrl && (
          <View style={styles.actionSection}>
            {/* Badge "intelligent" si l'URL a été adaptée */}
            {smartActionUrl !== step.actionUrl && (
              <View style={styles.smartActionBadge}>
                <Ionicons name="locate-outline" size={13} color={Colors.primary} />
                <Text style={styles.smartActionText}>
                  Lien personnalisé pour {paysLabel}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => openUrl(smartActionUrl)}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnText}>{step.actionLabel}</Text>
              <Ionicons name="open-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Navigation bas de page */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={[styles.bottomNavBtn, !hasPrev && styles.bottomNavBtnDisabled]}
            onPress={() => goToStep(-1)}
            disabled={!hasPrev}
            activeOpacity={0.75}
          >
            <Ionicons name="arrow-back" size={15} color={hasPrev ? Colors.primary : Colors.border} />
            <Text style={[styles.bottomNavText, !hasPrev && styles.bottomNavTextDisabled]}>
              Précédente
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bottomNavBtn, styles.bottomNavBtnRight, !hasNext && styles.bottomNavBtnDisabled]}
            onPress={() => goToStep(1)}
            disabled={!hasNext}
            activeOpacity={0.75}
          >
            <Text style={[styles.bottomNavText, !hasNext && styles.bottomNavTextDisabled]}>
              Suivante
            </Text>
            <Ionicons name="arrow-forward" size={15} color={hasNext ? Colors.primary : Colors.border} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgLight },
  scroll: { flex: 1 },

  // Bon voyage
  bonVoyageContainer: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40, alignItems: 'center' },
  videoWrapper: {
    alignSelf: 'stretch',
    marginTop: 18,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...UI.cardShadow,
  },
  video: { width: '100%', aspectRatio: 16 / 9, backgroundColor: Colors.bgLight },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingVertical: 14, gap: 12, backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  smallActionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.primary + '15',
    borderWidth: 1,
    borderColor: Colors.primary + '35',
  },
  smallActionBtnText: { fontSize: 12, fontWeight: '800', color: Colors.primary },

  noteCardInline: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noteInlineText: { flex: 1, fontSize: 12, color: Colors.textMuted, lineHeight: 16, fontWeight: '600' },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.text },
  navRow: { flexDirection: 'row', gap: 4 },
  navBtn: { padding: 6, borderRadius: 8, backgroundColor: Colors.bgLight },
  navBtnDisabled: { opacity: 0.3 },

  // Hero
  hero: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 28, paddingBottom: 16 },
  heroIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary + '15', borderWidth: 2, borderColor: Colors.primary + '30',
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  heroIconEmoji: { fontSize: 38 },
  delaiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primary + '12', borderRadius: 20,
    paddingVertical: 5, paddingHorizontal: 12, marginBottom: 14,
  },
  delaiText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  heroTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 10 },
  heroDesc: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, maxWidth: 320 },

  // ── Sections spéciales ──
  specialSection: {
    marginHorizontal: 20, marginBottom: 8,
    backgroundColor: Colors.primary + '08', borderRadius: 18, padding: 16,
    borderWidth: 1.5, borderColor: Colors.primary + '30',
  },
  specialHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  specialEmoji: { fontSize: 28 },
  specialTitle: { fontSize: 15, fontWeight: '800', color: Colors.text },
  specialSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  dliBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 18,
    marginBottom: 12,
  },
  dliBtnText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#fff' },
  dliInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  dliInfoText: { flex: 1, fontSize: 12, color: Colors.textMuted, lineHeight: 18 },

  // Bannière pays (biométrie / médical)
  paysBanner: {
    marginHorizontal: 20, marginBottom: 8, flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#e87722' + '12', borderRadius: 14, padding: 14,
    borderLeftWidth: 3, borderLeftColor: '#e87722',
  },
  paysEmoji: { fontSize: 24 },
  paysTitle: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  paysSub: { fontSize: 12, color: Colors.textMuted, lineHeight: 17 },

  // Section
  section: { paddingHorizontal: 20, marginTop: 22 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.text },

  // Actions
  actionsCard: {
    backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1,
    borderColor: Colors.border, overflow: 'hidden', ...UI.cardShadow,
  },
  actionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingHorizontal: 18, paddingVertical: 14 },
  actionRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  bullet: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 7, flexShrink: 0 },
  actionLabel: { flex: 1, fontSize: 14, color: Colors.text, lineHeight: 21 },

  // Documents
  docsCard: {
    backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1,
    borderColor: Colors.border, overflow: 'hidden', ...UI.cardShadow,
  },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 13 },
  docRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  docLabel: { flex: 1, fontSize: 14, color: Colors.text, lineHeight: 20 },

  // Ressources
  ressourcesList: { gap: 10 },
  ressourceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface,
    borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, ...UI.cardShadow,
  },
  ressourceIconWrap: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  ressourceTitre: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  ressourceDesc: { fontSize: 12, color: Colors.textMuted, lineHeight: 17 },
  smartBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5,
    backgroundColor: Colors.primary + '12', borderRadius: 8, paddingVertical: 3, paddingHorizontal: 7,
    alignSelf: 'flex-start',
  },
  smartBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.primary },
  ressourceOpenBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 7, paddingHorizontal: 10, borderRadius: 10, backgroundColor: Colors.primary + '12',
  },
  ressourceOpenText: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  // Bouton action principal
  actionSection: { paddingHorizontal: 20, marginTop: 26 },
  smartActionBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    justifyContent: 'center', marginBottom: 10,
  },
  smartActionText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 17,
  },
  actionBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  // Navigation bas
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 20, marginTop: 30, gap: 12,
  },
  bottomNavBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 14, paddingHorizontal: 16,
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.primary + '40',
  },
  bottomNavBtnRight: { justifyContent: 'flex-end' },
  bottomNavBtnDisabled: { borderColor: Colors.border, opacity: 0.4 },
  bottomNavText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  bottomNavTextDisabled: { color: Colors.textMuted },

  // Empty
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 },
  emptyText: { fontSize: 15, color: Colors.textMuted, textAlign: 'center' },
  emptyBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
});
