import { Stack, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { UI } from '../../../constants/UI';
import { CapiOrientationBubble } from '../../../components/CapiOrientationBubble';
import { CapiHelpFab } from '../../../components/CapiHelpFab';

type ResourceLink = {
  label: string;
  url: string;
};

function isHttpUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

async function openUrl(url: string, router: ReturnType<typeof useRouter>) {
  if (url.startsWith('/')) {
    router.push(url as never);
    return;
  }

  if (!isHttpUrl(url)) {
    return;
  }

  await Linking.openURL(url);
}

export default function CentresLangueScreen() {
  const router = useRouter();

  const links = useMemo<ResourceLink[]>(
    () => [
      {
        label: 'IELTS — centres de test',
        url: 'https://ielts.org/test-centres',
      },
      {
        label: 'CELPIP — trouver une date / un centre',
        url: 'https://www.celpip.ca/take-celpip/find-a-test-date/',
      },
      {
        label: 'IRCC — infos officielles sur les tests de langue (incl. TEF/TCF)',
        url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/education-language-proficiency/language-testing.html',
      },
    ],
    [],
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Centres de test',
          headerBackTitle: 'Retour',
        }}
      />
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <CapiOrientationBubble
            text={`Je suis CAPI. Choisissez votre test, puis utilisez l’outil officiel pour trouver un centre près de vous.`}
            style={{ paddingHorizontal: 0, paddingTop: 0, paddingBottom: 10 }}
          />
          <Text style={styles.title}>Trouver un centre proche</Text>
          <Text style={styles.subtitle}>
            Choisissez votre test, puis utilisez l’outil officiel.
          </Text>

          <View style={styles.list}>
            {links.map((l) => (
              <TouchableOpacity
                key={l.url}
                style={styles.linkBtn}
                onPress={() => openUrl(l.url, router)}
              >
                <Text style={styles.linkText}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <CapiHelpFab
          onPress={() =>
            router.push('/capi/agent' as any)
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 28,
    backgroundColor: Colors.bgLight,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  list: {
    gap: 10,
  },
  linkBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.surface,
    ...UI.cardShadow,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
});
