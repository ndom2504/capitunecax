import { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Colors } from '../constants/Colors';
import { useAuth } from '../context/AuthContext';
import { saveSession } from '../lib/auth';
import type { UserInfo } from '../lib/api';

/**
 * Page de callback OAuth.
 * Expo Router navigue ici quand le deep link exp://.../ --/oauth?token=...
 * est intercepté (cas Android / Expo Go où WebBrowser ne retient pas l'URL).
 */
export default function OAuthCallback() {
  const params = useLocalSearchParams<{
    token?: string;
    email?: string;
    name?: string;
    role?: string;
    account_type?: string;
  }>();
  const router = useRouter();
  const { setUser } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        // Récupérer depuis les query params directs OU depuis l'URL complète
        let token       = params.token;
        let emailParam  = params.email;
        let nameParam   = params.name;
        let roleParam   = params.role ?? 'client';
        let atParam     = params.account_type ?? 'client';

        // Fallback : relire l'URL initiale via Linking si les params sont vides
        if (!token) {
          const url = await Linking.getInitialURL();
          if (url) {
            const parsed = Linking.parse(url);
            token      = parsed.queryParams?.token as string | undefined;
            emailParam = parsed.queryParams?.email as string | undefined;
            nameParam  = parsed.queryParams?.name  as string | undefined;
            roleParam  = (parsed.queryParams?.role as string | undefined) ?? 'client';
            atParam    = (parsed.queryParams?.account_type as string | undefined) ?? 'client';
          }
        }

        if (!token || !emailParam) {
          router.replace('/(auth)/connexion');
          return;
        }

        const user: UserInfo = {
          id: '',
          email: decodeURIComponent(emailParam),
          name:  decodeURIComponent(nameParam ?? emailParam),
          role:  roleParam as UserInfo['role'],
          account_type: atParam as UserInfo['account_type'],
        };

        await saveSession(decodeURIComponent(token), user);
        setUser(user);
        router.replace('/(tabs)/dashboard');
      } catch {
        router.replace('/(auth)/connexion');
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.primaryDark, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <ActivityIndicator color={Colors.orange} size="large" />
      <Text style={{ color: Colors.textMuted, fontSize: 14 }}>Connexion en cours…</Text>
    </View>
  );
}
