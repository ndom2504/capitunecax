import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
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
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { getAvatarSource } from '../../lib/avatar';
import { agentApi, dashboardApi, proApi, type Message } from '../../lib/api';

const DEMO_MESSAGES: Message[] = [
  {
    id: '1',
    content: 'Bonjour 👋 Je suis votre conseiller. Dites-moi où vous en êtes, je vous guide.',
    sender: 'pro',
    senderName: 'Conseiller CAPI',
    createdAt: '2026-03-02T09:00:00Z',
    read: true,
  },
  {
    id: '2',
    content: 'Merci ! Je commence par quels documents ? ',
    sender: 'client',
    senderName: 'Vous',
    createdAt: '2026-03-02T09:03:00Z',
    read: true,
  },
  {
    id: '3',
    content: "On commence par passeport + photo d'identité. Ensuite, on valide l'étape 1 dans Mon Projet.",
    sender: 'pro',
    senderName: 'Conseiller CAPI',
    createdAt: '2026-03-02T09:05:00Z',
    read: true,
  },
];

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function MessagerieScreen() {
  const { token, user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const isPro = user?.account_type === 'pro';
  const isProMode = isPro && String(params.mode ?? '') === 'pro';
  const clientId = typeof params.clientId === 'string' ? params.clientId : '';

  const clientNameFromParams = typeof params.clientName === 'string' ? params.clientName : '';
  const clientEmailFromParams = typeof params.clientEmail === 'string' ? params.clientEmail : '';

  const isCapiAgent = String(params.agent ?? '') === 'capi';

  const advisorName = isProMode
    ? (clientNameFromParams || clientEmailFromParams || 'Client')
    : isCapiAgent
    ? 'CAPI'
    : (typeof params.advisorName === 'string' ? params.advisorName : 'Conseiller CAPI');
  const advisorAvatarKey = (isProMode || isCapiAgent)
    ? ''
    : (typeof params.advisorAvatarKey === 'string' ? params.advisorAvatarKey : '');
  const shouldPrefill = String(params.prefill ?? '') === '1';
  const advisorAvatarSource = getAvatarSource(advisorAvatarKey);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [proClient, setProClient] = useState<any>(null);
  const [proProjects, setProProjects] = useState<any[]>([]);
  const didPrefillRef = useRef(false);
  const listRef = useRef<FlatList<Message>>(null);

  const load = async () => {
    setLoading(true);
    try {
      if (isProMode) {
        if (!token || !clientId) {
          setMessages([]);
          setProClient(null);
          setProProjects([]);
          return;
        }
        const res = await proApi.getClient(token, clientId);
        if (res.error) {
          setMessages([]);
          setProClient({ name: clientNameFromParams || 'Client', email: clientEmailFromParams || '' });
          setProProjects([]);
          return;
        }
        const u = (res.data as any)?.user ?? null;
        const msgs = ((res.data as any)?.messages ?? []) as any[];
        const projs = ((res.data as any)?.projects ?? []) as any[];
        setProClient(u);
        setProProjects(projs);
        setMessages(
          msgs.map((m) => ({
            id: String(m.id ?? Math.random()),
            content: String(m.content ?? ''),
            sender: String(m.sender ?? 'bot') as any,
            senderName: String(m.sender === 'admin' ? (user?.name ?? 'Vous') : (u?.name ?? 'Client')),
            createdAt: String(m.created_at ?? new Date().toISOString()),
            read: true,
          }))
        );
        return;
      }

      if (isCapiAgent) {
        setMessages([]);
        return;
      }
      if (!token) {
        setMessages(DEMO_MESSAGES);
        return;
      }
      const res = await dashboardApi.getMessages(token);
      const msgs = res.data?.messages;
      setMessages(msgs?.length ? msgs : DEMO_MESSAGES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token, isCapiAgent, isProMode, clientId]);

  useEffect(() => {
    if (isProMode) return;
    if (isCapiAgent) return;
    if (!shouldPrefill) return;
    if (didPrefillRef.current) return;
    if (input.trim()) {
      didPrefillRef.current = true;
      return;
    }
    const firstName = advisorName.split(' ')[0] || advisorName;
    setInput(`Bonjour ${firstName}, j’aimerais discuter de mon dossier.`);
    didPrefillRef.current = true;
  }, [shouldPrefill, advisorName, input]);

  const send = async () => {
    const content = input.trim();
    if (!content || sending) return;

    const optimistic: Message = {
      id: String(Date.now()),
      content,
      sender: isProMode ? 'admin' : 'client',
      senderName: user?.name ?? 'Vous',
      createdAt: new Date().toISOString(),
      read: false,
    };

    setMessages(prev => [...prev, optimistic]);
    setInput('');
    setSending(true);

    try {
      if (isProMode) {
        if (token && clientId) {
          await proApi.reply(token, { user_id: clientId, content });
        }
        return;
      }

      if (isCapiAgent) {
        const res = await agentApi.answer(content, null, token ?? undefined, 'general');
        const reply = res.data?.replyText?.trim() || res.data?.replyHtml?.trim() || '';

        if (res.error || !reply) {
          const errMsg = res.error || 'Je n’ai pas réussi à répondre. Réessayez.';
          const errBot: Message = {
            id: `${Date.now()}-err`,
            content: errMsg,
            sender: 'bot',
            senderName: 'CAPI',
            createdAt: new Date().toISOString(),
            read: true,
          };
          setMessages(prev => [...prev, errBot]);
          return;
        }

        const botMsg: Message = {
          id: `${Date.now()}-bot`,
          content: reply,
          sender: 'bot',
          senderName: 'CAPI',
          createdAt: new Date().toISOString(),
          read: true,
        };
        setMessages(prev => [...prev, botMsg]);
        return;
      }

      if (token) await dashboardApi.sendMessage(token, content);
    } finally {
      setSending(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.advisorAvatar}>
          {advisorAvatarSource ? (
            <Image source={advisorAvatarSource} style={styles.advisorAvatarImg} />
          ) : (
            <Text style={styles.advisorAvatarInitial}>{(advisorName?.[0] ?? 'C').toUpperCase()}</Text>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{advisorName}</Text>
          <Text style={styles.headerSub}>
            {isProMode ? (clientEmailFromParams || proClient?.email || '') : (isCapiAgent ? 'Agent d’orientation' : 'Point de contact')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerAction}
            onPress={() => {
              if (isProMode) {
                router.push('/(tabs)/projet' as any);
                return;
              }
              router.push('/(tabs)/documents' as any);
            }}
          activeOpacity={0.85}
            accessibilityLabel={isProMode ? 'Aller au dossier' : 'Aller aux documents'}
        >
          <Ionicons name="folder-open-outline" size={18} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.orange} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const isMe = isProMode
              ? (item.sender === 'admin')
              : (item.sender === 'client' || item.sender === 'user');
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
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={isProMode ? 'Répondre au client…' : (isCapiAgent ? 'Écrire à CAPI…' : 'Écrire au conseiller…')}
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
            onPress={send}
            disabled={!input.trim() || sending}
            activeOpacity={0.85}
            accessibilityLabel="Envoyer"
          >
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
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
  advisorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    overflow: 'hidden',
  },
  advisorAvatarImg: { width: 36, height: 36, borderRadius: 18 },
  advisorAvatarInitial: { color: Colors.white, fontSize: 14, fontWeight: '900' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  headerAction: {
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
  messagesList: { padding: 16, gap: 10, paddingBottom: 8 },
  bubble: { maxWidth: '84%', borderRadius: 16, padding: 12 },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleThem: { alignSelf: 'flex-start', backgroundColor: Colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
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
