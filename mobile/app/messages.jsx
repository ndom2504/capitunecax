import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

type MessageStatus = 'sent' | 'delivered' | 'read';
type MessageType = 'text' | 'file' | 'system';

interface Message {
  id: string;
  type: MessageType;
  content: string;
  sender: 'client' | 'advisor';
  timestamp: string;
  status?: MessageStatus;
  fileName?: string;
}

interface Conversation {
  id: string;
  advisorName: string;
  advisorAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: 'active' | 'archived';
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    advisorName: 'Marie Dubois',
    lastMessage: 'Vos documents ont été validés, nous pouvons...',
    lastMessageTime: '14:30',
    unreadCount: 2,
    status: 'active',
  },
  {
    id: '2', 
    advisorName: 'Pierre Martin',
    lastMessage: 'Merci pour les informations complémentaires',
    lastMessageTime: 'Hier',
    unreadCount: 0,
    status: 'active',
  },
];

const mockMessages: Message[] = [
  {
    id: '1',
    type: 'text',
    content: 'Bonjour ! Je suis votre conseiller pour votre projet d\'immigration. Je vois que vous souhaitez venir travailler au Canada.',
    sender: 'advisor',
    timestamp: '09:00',
    status: 'read',
  },
  {
    id: '2',
    type: 'text',
    content: 'Bonjour Marie ! Oui, c\'est exact. Je suis ingénieur et je cherche une entreprise au Québec.',
    sender: 'client',
    timestamp: '09:15',
    status: 'read',
  },
  {
    id: '3',
    type: 'file',
    content: 'CV_Ingénieur.pdf',
    sender: 'client',
    timestamp: '09:16',
    status: 'delivered',
    fileName: 'CV_Ingénieur.pdf',
  },
  {
    id: '4',
    type: 'text',
    content: 'Parfait ! J\'ai reçu votre CV. Votre profil est excellent. Pour le programme d\'immigration québécois, nous allons d\'abord préparer votre dossier CSQ. Pouvez-vous me fournir vos relevés académiques ?',
    sender: 'advisor',
    timestamp: '09:30',
    status: 'read',
  },
];

export default function MessagesScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConversations();
  }, [token]);

  const loadConversations = async () => {
    try {
      // TODO: API call
      console.log('Loading conversations...');
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      // TODO: API call
      console.log('Loading messages for conversation:', conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: Date.now().toString(),
      type: 'text',
      content: newMessage.trim(),
      sender: 'client',
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };

    setMessages([...messages, message]);
    setNewMessage('');
    setLoading(true);

    try {
      // TODO: API call to send message
      console.log('Sending message:', message);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update message status
      setMessages(prev => prev.map(m => 
        m.id === message.id ? { ...m, status: 'delivered' as MessageStatus } : m
      ));
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = () => {
    Alert.alert(
      'Envoyer un fichier',
      'Choisissez le type de fichier à envoyer',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Document', onPress: () => console.log('Upload document') },
        { text: 'Photo', onPress: () => console.log('Upload photo') },
      ]
    );
  };

  const renderConversationList = () => {
    return (
      <View style={styles.conversationsList}>
        {conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucune conversation</Text>
            <Text style={styles.emptyDescription}>
              Votre messagerie est vide pour le moment
            </Text>
          </View>
        ) : (
          conversations.map(conversation => (
            <TouchableOpacity
              key={conversation.id}
              style={styles.conversationItem}
              onPress={() => {
                setSelectedConversation(conversation);
                loadMessages(conversation.id);
              }}
            >
              <View style={styles.advisorAvatar}>
                <Text style={styles.avatarText}>
                  {conversation.advisorName.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
              
              <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                  <Text style={styles.advisorName}>{conversation.advisorName}</Text>
                  <Text style={styles.messageTime}>{conversation.lastMessageTime}</Text>
                </View>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {conversation.lastMessage}
                </Text>
              </View>
              
              {conversation.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>{conversation.unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    );
  };

  const renderMessage = (message: Message) => {
    const isClient = message.sender === 'client';
    
    return (
      <View key={message.id} style={[
        styles.messageContainer,
        isClient ? styles.clientMessage : styles.advisorMessage
      ]}>
        {!isClient && (
          <View style={styles.advisorMessageHeader}>
            <Text style={styles.advisorMessageName}>
              {selectedConversation?.advisorName}
            </Text>
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isClient ? styles.clientBubble : styles.advisorBubble
        ]}>
          {message.type === 'file' ? (
            <View style={styles.fileMessage}>
              <Ionicons name="document" size={20} color={isClient ? 'white' : Colors.primary} />
              <Text style={[
                styles.fileName,
                { color: isClient ? 'white' : Colors.text }
              ]}>
                {message.fileName}
              </Text>
            </View>
          ) : (
            <Text style={[
              styles.messageText,
              { color: isClient ? 'white' : Colors.text }
            ]}>
              {message.content}
            </Text>
          )}
          
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              { color: isClient ? 'rgba(255,255,255,0.7)' : Colors.textMuted }
            ]}>
              {message.timestamp}
            </Text>
            
            {isClient && message.status && (
              <Ionicons 
                name={
                  message.status === 'read' ? 'checkmark-done' :
                  message.status === 'delivered' ? 'checkmark' : 'time'
                } 
                size={14} 
                color="rgba(255,255,255,0.7)" 
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderChatInterface = () => {
    if (!selectedConversation) return null;

    return (
      <View style={styles.chatContainer}>
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setSelectedConversation(null)}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatAdvisorName}>{selectedConversation.advisorName}</Text>
            <Text style={styles.chatStatus}>En ligne</Text>
          </View>
          
          <TouchableOpacity style={styles.chatOptions}>
            <Ionicons name="ellipsis-vertical" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView 
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity 
            style={styles.attachButton}
            onPress={handleFileUpload}
          >
            <Ionicons name="attach" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
          
          <TextInput
            style={styles.messageInput}
            placeholder="Tapez votre message..."
            placeholderTextColor={Colors.textMuted}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />
          
          <TouchableOpacity 
            style={[
              styles.sendButton,
              (!newMessage.trim() || loading) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || loading}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={!newMessage.trim() || loading ? Colors.textMuted : 'white'} 
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={[Colors.primary, Colors.dark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          {!selectedConversation ? (
            <>
              <View style={{ width: 24 }} />
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>💬 Messages</Text>
                <Text style={styles.headerSubtitle}>
                  {conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)} non lu(s)
                </Text>
              </View>
              <TouchableOpacity style={styles.notificationButton}>
                <Ionicons name="search" size={24} color="white" />
              </TouchableOpacity>
            </>
          ) : (
            renderChatInterface()
          )}
        </View>
      </LinearGradient>

      {!selectedConversation && renderConversationList()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgLight,
  },
  header: {
    paddingTop: 20,
    paddingBottom: selectedConversation ? 10 : 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  notificationButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  conversationsList: {
    flex: 1,
    padding: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  advisorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  advisorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  messageTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
  },
  chatHeaderInfo: {
    flex: 1,
    alignItems: 'center',
  },
  chatAdvisorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  chatStatus: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  chatOptions: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  messagesContainer: {
    flex: 1,
    padding: 20,
  },
  messageContainer: {
    marginBottom: 16,
  },
  clientMessage: {
    alignItems: 'flex-end',
  },
  advisorMessage: {
    alignItems: 'flex-start',
  },
  advisorMessageHeader: {
    marginBottom: 4,
  },
  advisorMessageName: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
  },
  clientBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  advisorBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  fileMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  messageTime: {
    fontSize: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  attachButton: {
    padding: 12,
    marginRight: 12,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    maxHeight: 100,
  },
  sendButton: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.bgLight,
  },
});
