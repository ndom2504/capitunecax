import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi, type Message } from '../../lib/api';

const DEMO_MESSAGES: Message[] = [
  { id: '1', content: 'Bienvenue sur Capitune ! Je suis votre conseiller pour ce dossier.', sender: 'pro', senderName: 'Sarah Legrand', createdAt: '2026-02-10T09:00:00Z', read: true },
  { id: '2', content: 'Merci ! Par où commencer ?', sender: 'client', senderName: 'Vous', createdAt: '2026-02-10T09:05:00Z', read: true },
  { id: '3', content: 'Commencez par téléverser votre passeport et une photo d\'identité dans l\'onglet Documents.', sender: 'pro', senderName: 'Sarah Legrand', createdAt: '2026-02-10T09:07:00Z', read: true },
  { id: '4', content: 'Votre dossier est en révision. Les pièces jointes sont conformes ✅', sender: 'pro', senderName: 'Sarah Legrand', createdAt: '2026-03-01T10:32:00Z', read: true },
  { id: '5', content: 'Merci ! Quand aura lieu le dépôt officiel ?', sender: 'client', senderName: 'Vous', createdAt: '2026-03-01T10:35:00Z', read: true },
  { id: '6', content: 'Nous prévoyons le dépôt d\'ici 5 jours ouvrables 📅', sender: 'pro', senderName: 'Sarah Legrand', createdAt: '2026-03-01T10:37:00Z', read: false },
];

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function MessagerieScreen() {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const load = async () => {
    if (!token) { setMessages(DEMO_MESSAGES); setLoading(false); return; }
    const res = await dashboardApi.getMessages(token);
    const msgs = res.data?.messages;
    setMessages(msgs?.length ? msgs : DEMO_MESSAGES);
    setLoading(false);
  };

  useEffect(() => { load(); }, [token]);

  const send = async () => {
    const content = input.trim();
    if (!content || sending) return;

    const optimistic: Message = {
      id: String(Date.now()),
      content,
      sender: 'client',
      senderName: user?.name ?? 'Vous',
      createdAt: new Date().toISOString(),
      read: false,
    };
    setMessages(prev => [...prev, optimistic]);
    setInput('');
    setSending(true);

    if (token) await dashboardApi.sendMessage(token, content);
    setSending(false);

    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.proAvatar}>
          <Text style={styles.proInitial}>S</Text>
        </View>
        <View>
          <Text style={styles.proName}>Sarah Legrand</Text>
          <Text style={styles.proTitle}>Conseillère Capitune</Text>
        </View>
        <View style={styles.onlineIndicator} />
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.orange} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const isMe = item.sender === 'client' || item.sender === 'user';
            return (
              <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                  {item.content}
                </Text>
                <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
                  {formatTime(item.createdAt)}
                  {isMe && (
                    <Ionicons
                      name={item.read ? 'checkmark-done' : 'checkmark'}
                      size={12} color="rgba(255,255,255,0.6)"
                    />
                  )}
                </Text>
              </View>
            );
          }}
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Écrire un message..."
            placeholderTextColor="#94a3b8"
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
            onPress={send}
            disabled={!input.trim() || sending}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primaryDark },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  proAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  proInitial: { color: '#fff', fontSize: 18, fontWeight: '800' },
  proName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  proTitle: { fontSize: 12, color: Colors.textMuted },
  onlineIndicator: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.success, marginLeft: 'auto',
  },
  messagesList: { padding: 16, gap: 10, paddingBottom: 8 },
  bubble: {
    maxWidth: '80%', borderRadius: 16, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4,
  },
  bubbleMe: {
    alignSelf: 'flex-end', backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    alignSelf: 'flex-start', backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextMe: { color: '#fff' },
  bubbleTextThem: { color: Colors.text },
  bubbleTime: { fontSize: 10, color: 'rgba(0,0,0,0.35)', marginTop: 4, textAlign: 'right' },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.55)' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: 12, backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  input: {
    flex: 1, backgroundColor: Colors.bgLight,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: Colors.text, maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.orange, justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
