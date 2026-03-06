import { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { useAuth } from '../../../context/AuthContext';
import { useCapiSession } from '../../../context/CapiContext';
import { autonomiePaymentApi } from '../../../lib/api';

export default function AutonomiePaymentReturn() {
  const router = useRouter();
  const params = useLocalSearchParams<{ session_id?: string }>();
  const { token } = useAuth();
  const { session, updateSession } = useCapiSession();

  // En dev (React 18 StrictMode), useEffect peut s'exécuter 2 fois.
  // On garde un guard pour éviter une boucle de confirmation/navigation.
  const didRunRef = useRef(false);

  const sessionId = String(params.session_id ?? '').trim();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (didRunRef.current) return;
    didRunRef.current = true;

    (async () => {
      try {
        if (!token) {
          setError('Vous devez être connecté pour confirmer le paiement.');
          setLoading(false);
          return;
        }
        if (!sessionId) {
          setError('Session de paiement manquante.');
          setLoading(false);
          return;
        }

        const res = await autonomiePaymentApi.stripeConfirm(token, sessionId);
        if (res.status !== 200 || !res.data?.ok) {
          setError(res.data?.error ?? 'Confirmation de paiement impossible.');
          setLoading(false);
          return;
        }

        const nextProject = session.autonomie
          ? { ...session.autonomie, hasPaidAutonomie: true }
          : undefined;

        updateSession({ autonomie: nextProject });
        setLoading(false);
        router.replace('/capi/autonomie' as never);
      } catch (e) {
        setError(String(e));
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgLight }} edges={['top']}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 14 }}>
        {loading ? (
          <>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={{ color: Colors.textMuted, fontSize: 14, textAlign: 'center' }}>
              Confirmation du paiement…
            </Text>
          </>
        ) : error ? (
          <>
            <Ionicons name="alert-circle-outline" size={34} color={Colors.warning} />
            <Text style={{ color: Colors.text, fontSize: 16, fontWeight: '800', textAlign: 'center' }}>
              Paiement non confirmé
            </Text>
            <Text style={{ color: Colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 18 }}>
              {error}
            </Text>
            <TouchableOpacity
              onPress={() => router.replace('/capi/autonomie' as never)}
              style={{
                marginTop: 10,
                paddingVertical: 12,
                paddingHorizontal: 18,
                borderRadius: 14,
                backgroundColor: Colors.primary,
              }}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#fff', fontWeight: '800' }}>Retour à l’autonomie</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Ionicons name="checkmark-circle-outline" size={34} color={Colors.success} />
            <Text style={{ color: Colors.text, fontSize: 16, fontWeight: '800', textAlign: 'center' }}>
              Paiement confirmé ✓
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
