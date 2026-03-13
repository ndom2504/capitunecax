import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { API_BASE_URL } from '../../lib/api';

const PAGE_URL = `${API_BASE_URL}/carriere/emplois-cv?source=app&_t=${Date.now()}`;

const INJECTED_JS = `
  (function() {
    var style = document.createElement('style');
    var meta = document.createElement('meta'); meta.name = 'viewport'; meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'; document.head.appendChild(meta);
    style.innerHTML = '.cap-page-hero { display: none !important; } .cap-page-body { padding-top: 8px !important; } body { background: #f5f7fa !important; }';
    document.head.appendChild(style);
  })();
  true;
`;

export default function EmploisCVScreen() {
  const router = useRouter();
  const webRef = useRef<any>(null);
  const [progress, setProgress] = useState(0);
  const [hasError, setHasError] = useState(false);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Marché de l'Emploi</Text>
        <TouchableOpacity
          style={styles.reloadBtn}
          onPress={() => { webRef.current?.reload(); setHasError(false); }}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh-outline" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Barre de progression */}
      {progress < 1 && (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as any }]} />
        </View>
      )}

      {/* Contenu */}
      {hasError ? (
        <View style={styles.errorBox}>
          <Ionicons name="cloud-offline-outline" size={44} color={Colors.textMuted} />
          <Text style={styles.errorTitle}>Connexion impossible</Text>
          <Text style={styles.errorSub}>Vérifiez votre connexion internet et réessayez.</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => { webRef.current?.reload(); setHasError(false); }}
            activeOpacity={0.8}
          >
            <Text style={styles.retryBtnText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webRef}
          source={{ uri: PAGE_URL }}
          style={styles.webview}
          injectedJavaScript={INJECTED_JS}
          onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
          onLoadEnd={() => setProgress(1)}
          onError={() => { setHasError(true); setProgress(1); }}
          onHttpError={() => { setHasError(true); setProgress(1); }}
          allowsBackForwardNavigationGestures
          renderLoading={() => (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={Colors.orange} />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },

  headerRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: '#fff',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center',
    justifyContent: 'center', backgroundColor: Colors.bgLight,
  },
  headerTitle: {
    flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: Colors.text,
  },
  reloadBtn: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center',
    justifyContent: 'center', backgroundColor: Colors.bgLight,
  },

  progressTrack: { height: 2, backgroundColor: Colors.border },
  progressFill:  { height: 2, backgroundColor: Colors.orange },

  webview: { flex: 1 },
  loader:  { flex: 1, alignItems: 'center', justifyContent: 'center' },

  errorBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, gap: 12,
  },
  errorTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  errorSub:   { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    marginTop: 8, paddingHorizontal: 28, paddingVertical: 12,
    backgroundColor: Colors.orange, borderRadius: 12,
  },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

