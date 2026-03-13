import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Pressable,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { UI } from '../../constants/UI';
import { API_BASE_URL } from '../../lib/api';

// ── Onglets ────────────────────────────────────────────────────────────────────

const TABS = [
  {
    id: 'emplois',
    label: 'Marche Emploi',
    icon: 'briefcase-outline' as const,
    iconActive: 'briefcase' as const,
    url: `${API_BASE_URL}/carriere/emplois-cv?source=app&tab=emplois`,
    color: Colors.orange,
  },
  {
    id: 'cv',
    label: 'CV Magic',
    icon: 'document-text-outline' as const,
    iconActive: 'document-text' as const,
    url: `${API_BASE_URL}/carriere/emplois-cv?source=app&tab=cv`,
    color: '#3b82f6',
  },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ── Barre de progression de chargement WebView ────────────────────────────────

function ProgressBar({ progress }: { progress: number }) {
  if (progress >= 1) return null;
  return (
    <View style={progressStyles.track}>
      <View style={[progressStyles.fill, { width: `${Math.round(progress * 100)}%` as any }]} />
    </View>
  );
}

const progressStyles = StyleSheet.create({
  track: {
    height: 2,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: 2,
    backgroundColor: Colors.orange,
  },
});

// ── Ecran principal ────────────────────────────────────────────────────────────

export default function EmploisCVScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('emplois');
  const [loadProgress, setLoadProgress] = useState<Record<TabId, number>>({ emplois: 0, cv: 0 });
  const [hasError, setHasError] = useState<Record<TabId, boolean>>({ emplois: false, cv: false });
  const [initialLoaded, setInitialLoaded] = useState<Record<TabId, boolean>>({ emplois: false, cv: false });
  const webviewRefs = useRef<Record<TabId, any>>({ emplois: null, cv: null });

  const currentTab = TABS.find(t => t.id === activeTab)!;

  const handleTabPress = (id: TabId) => {
    setActiveTab(id);
  };

  const handleReload = () => {
    webviewRefs.current[activeTab]?.reload();
    setHasError(prev => ({ ...prev, [activeTab]: false }));
  };

  const handleLoadProgress = (tabId: TabId, progress: number) => {
    setLoadProgress(prev => ({ ...prev, [tabId]: progress }));
  };

  const handleLoadEnd = (tabId: TabId) => {
    setLoadProgress(prev => ({ ...prev, [tabId]: 1 }));
    setInitialLoaded(prev => ({ ...prev, [tabId]: true }));
  };

  const handleError = (tabId: TabId) => {
    setHasError(prev => ({ ...prev, [tabId]: true }));
    setLoadProgress(prev => ({ ...prev, [tabId]: 1 }));
  };

  // Script injecte pour cacher le hero de la page web et adapter au mobile
  const INJECTED_JS = `
    (function() {
      var style = document.createElement('style');
      style.innerHTML = '.cap-page-hero { display: none !important; } .cap-page-body { padding-top: 8px !important; } body { background: #f5f7fa !important; }';
      document.head.appendChild(style);
    })();
    true;
  `;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emplois & CV</Text>
        <TouchableOpacity style={styles.reloadBtn} onPress={handleReload} activeOpacity={0.8}>
          <Ionicons name="refresh-outline" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Onglets */}
      <View style={styles.tabBar}>
        {TABS.map(tab => {
          const isActive = tab.id === activeTab;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabItem, isActive && { borderBottomColor: tab.color }]}
              onPress={() => handleTabPress(tab.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isActive ? tab.iconActive : tab.icon}
                size={18}
                color={isActive ? tab.color : Colors.textMuted}
              />
              <Text style={[styles.tabLabel, isActive && { color: tab.color }]}>
                {tab.label}
              </Text>
              {!initialLoaded[tab.id] && (
                <View style={[styles.tabDot, { backgroundColor: tab.color }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Barre de progression */}
      <ProgressBar progress={loadProgress[activeTab]} />

      {/* WebViews (preloaded, hidden si inactif) */}
      <View style={styles.webviewContainer}>
        {TABS.map(tab => (
          <View
            key={tab.id}
            style={[styles.webviewLayer, tab.id !== activeTab && styles.webviewHidden]}
          >
            {hasError[tab.id] ? (
              <View style={styles.errorWrap}>
                <Ionicons name="wifi-outline" size={52} color={Colors.border} />
                <Text style={styles.errorTitle}>Connexion indisponible</Text>
                <Text style={styles.errorSub}>Verifiez votre connexion Internet</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={handleReload} activeOpacity={0.8}>
                  <Ionicons name="refresh" size={16} color={Colors.surface} />
                  <Text style={styles.retryBtnText}>Reessayer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <WebView
                ref={ref => { webviewRefs.current[tab.id] = ref; }}
                source={{ uri: tab.url }}
                style={styles.webview}
                startInLoadingState={false}
                showsVerticalScrollIndicator={false}
                allowFileAccess
                allowsInlineMediaPlayback
                injectedJavaScript={INJECTED_JS}
                onLoadProgress={({ nativeEvent }) => handleLoadProgress(tab.id, nativeEvent.progress)}
                onLoadEnd={() => handleLoadEnd(tab.id)}
                onError={() => handleError(tab.id)}
                onHttpError={({ nativeEvent }) => {
                  if (nativeEvent.statusCode >= 500) handleError(tab.id);
                }}
                renderLoading={() => (
                  <View style={styles.spinnerOverlay}>
                    <ActivityIndicator size="large" color={tab.color} />
                    <Text style={styles.spinnerText}>Chargement...</Text>
                  </View>
                )}
              />
            )}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.bgLight,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  reloadBtn: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  tabDot: {
    width: 6, height: 6, borderRadius: 3,
    marginLeft: 2,
  },

  webviewContainer: { flex: 1 },
  webviewLayer: { ...StyleSheet.absoluteFillObject },
  webviewHidden: { opacity: 0, pointerEvents: 'none' as any, zIndex: -1 },

  webview: { flex: 1, backgroundColor: Colors.bgLight },

  spinnerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center', gap: 14,
    backgroundColor: Colors.bgLight,
  },
  spinnerText: { fontSize: 14, color: Colors.textMuted },

  errorWrap: {
    flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12,
    padding: 32, backgroundColor: Colors.bgLight,
  },
  errorTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  errorSub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 24,
    marginTop: 8,
  },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: Colors.surface },
});
