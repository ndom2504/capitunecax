import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/Colors';
import { UI } from '../../constants/UI';
import { agentApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

type ChatMsg = {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  createdAt: string;
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function CapiAgentScreen() {
  const { token, user } = useAuth();
  const router = useRouter();
  const { stepId, stepTitle, itemLabel } = useLocalSearchParams<{
    stepId?: string;
    stepTitle?: string;
    itemLabel?: string;
  }>();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatMsg>>(null);

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [, setLastSource] = useState<'openai' | 'kb' | 'local' | 'paywall' | 'error' | null>(null);

  const didHydrateRef = useRef(false);

  const storageKey = useMemo(() => `capi_agent_chat_autonomie:${String(user?.id ?? 'anon')}`, [user?.id]);

  const trimMessages = useCallback((arr: ChatMsg[]) => {
    // Évite d'accumuler une taille infinie dans le stockage local.
    const MAX = 60;
    return arr.length > MAX ? arr.slice(arr.length - MAX) : arr;
  }, []);

  const contextLine = (() => {
    const parts: string[] = [];
    if (stepTitle) parts.push(`Étape : ${stepTitle}`);
    if (itemLabel) parts.push(`Point : ${itemLabel}`);
    if (parts.length) return parts.join(' · ');
    if (stepId) return `Étape : ${stepId}`;
    return '';
  })();

  useEffect(() => {
    // Hydrate la conversation depuis le stockage local pour conserver la mémoire
    // quand l'utilisateur quitte/revient sur l'écran.
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw) as unknown;
          if (Array.isArray(parsed) && parsed.length) {
            const safe = parsed
              .filter((m: any) => m && typeof m.id === 'string' && (m.sender === 'user' || m.sender === 'bot'))
              .map((m: any) => ({
                id: String(m.id),
                sender: m.sender as 'user' | 'bot',
                createdAt: String(m.createdAt || new Date().toISOString()),
                content: String(m.content || ''),
              })) as ChatMsg[];
            if (safe.length) {
              setMessages(trimMessages(safe));
              didHydrateRef.current = true;
              return;
            }
          }
        }
      } catch {
        // ignore
      }

      const now = new Date().toISOString();
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          sender: 'bot',
          createdAt: now,
          content:
            `Bonjour, je suis CAPI. Posez-moi votre question (je réponds de façon générale, sans garantie ni avis juridique).${contextLine ? `\n\nContexte : ${contextLine}` : ''}`,
        },
      ]);
      didHydrateRef.current = true;
    })();
    // Re-hydrate si l'utilisateur change (logout/login)
  }, [contextLine, storageKey, trimMessages]);

  useEffect(() => {
    if (!didHydrateRef.current) return;
    (async () => {
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(trimMessages(messages)));
      } catch {
        // ignore
      }
    })();
  }, [messages, storageKey, trimMessages]);

  useEffect(() => {
    if (input.trim()) return;
    if (!contextLine) return;
    setInput(`Question sur ${itemLabel ? `“${itemLabel}”` : 'cette étape'} : `);
  }, [contextLine, itemLabel]);

  const send = async () => {
    const content = input.trim();
    if (!content || sending) return;

    const now = new Date().toISOString();
    const optimistic: ChatMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      createdAt: now,
      content,
    };

    setMessages(prev => [...prev, optimistic]);
    setInput('');
    setSending(true);

    try {
      const contentForApi = contextLine ? `Contexte: ${contextLine}\n\nQuestion: ${content}` : content;
      const history = messages
        .slice(-16)
        .map((m) => ({
          role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
          content: String(m.content || '').trim(),
        }))
        .filter((m) => m.content);

      const res = await agentApi.answer(contentForApi, null, token ?? undefined, 'autonomie', history);
      const reply = res.data?.replyText?.trim() || res.data?.replyHtml?.trim() || '';

      if (res.status >= 200 && res.status < 300) {
        setLastSource((res.data as any)?.meta?.source ?? 'openai');
      }

      if (res.status === 402) {
        setLastSource('paywall');
        setMessages(prev => [
          ...prev,
          {
            id: `pay-${Date.now()}`,
            sender: 'bot',
            createdAt: new Date().toISOString(),
            content: "Accès payant requis : l’agent intelligent (OpenAI) est disponible uniquement après déblocage de l’Autonomie guidée.",
          },
        ]);
        Alert.alert(
          'Autonomie guidée — accès payant',
          "Pour activer l’agent intelligent, débloquez l’Autonomie guidée.",
          [
            { text: 'Débloquer', onPress: () => router.replace('/capi/autonomie' as any) },
            { text: 'OK', style: 'cancel' },
          ]
        );
        return;
      }

      if (res.status === 404 || res.error || !reply) {
        const apiError = (res.error || (res.data as any)?.error || '').trim();
        const apiCode = String((res.data as any)?.code ?? '').trim();
        const msg = reply || (apiError ? (apiCode ? `${apiError} (${apiCode})` : apiError) : "Service temporairement indisponible. Réessayez dans quelques instants.");
        const errBot: ChatMsg = {
          id: `e-${Date.now()}`,
          sender: 'bot',
          createdAt: new Date().toISOString(),
          content: msg,
        };
        setMessages(prev => [...prev, errBot]);
        setLastSource('error');
        return;
      }

      const botMsg: ChatMsg = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        createdAt: new Date().toISOString(),
        content: reply,
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setSending(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  };

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

        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>C</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>CAPI</Text>
          <Text style={styles.subtitle}>Agent d’orientation virtuelle</Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => {
          const isMe = item.sender === 'user';
          return (
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
              <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                {item.content}
              </Text>
              <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>{formatTime(item.createdAt)}</Text>
            </View>
          );
        }}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Écrire à CAPI…"
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={1500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
            onPress={send}
            disabled={!input.trim() || sending}
            activeOpacity={0.85}
            accessibilityLabel="Envoyer"
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgLight },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
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
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    ...UI.cardShadow,
  },
  avatarTxt: { color: Colors.white, fontSize: 14, fontWeight: '900' },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  messagesList: { padding: 16, gap: 10, paddingBottom: 8 },
  bubble: { maxWidth: '84%', borderRadius: 16, padding: 12 },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleThem: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextMe: { color: Colors.white },
  bubbleTextThem: { color: Colors.text },
  bubbleTime: { fontSize: 10, color: Colors.textMuted, marginTop: 4, textAlign: 'right' },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.65)' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.offWhite,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    maxHeight: 110,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.orange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
