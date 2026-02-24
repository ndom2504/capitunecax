import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: number;
  sender: 'client' | 'consultant';
  text: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  attachments?: Array<{ name: string; url: string; type: string }>;
}

export function ChatInterne() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'consultant',
      text: 'Bonjour ! Je suis Marie, votre conseillère en immigration. Comment puis-je vous aider aujourd\'hui ?',
      timestamp: new Date(Date.now() - 3600000),
      status: 'read'
    },
    {
      id: 2,
      sender: 'client',
      text: 'Bonjour Marie, j\'aimerais savoir où en est mon dossier de permis d\'études.',
      timestamp: new Date(Date.now() - 3000000),
      status: 'read'
    },
    {
      id: 3,
      sender: 'consultant',
      text: 'Votre dossier a été soumis il y a 2 semaines et est actuellement en cours de traitement par les autorités canadiennes. Tout est en ordre !',
      timestamp: new Date(Date.now() - 2400000),
      status: 'read'
    }
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (newMessage.trim() === '' && attachments.length === 0) return;

    const message: Message = {
      id: messages.length + 1,
      sender: 'client',
      text: newMessage,
      timestamp: new Date(),
      status: 'sent',
      attachments: attachments.map(file => ({
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type
      }))
    };

    setMessages([...messages, message]);
    setNewMessage('');
    setAttachments([]);

    // Simulate consultant typing after 2 seconds
    setTimeout(() => {
      setIsTyping(true);
    }, 2000);

    // Simulate consultant response after 4 seconds
    setTimeout(() => {
      setIsTyping(false);
      const response: Message = {
        id: messages.length + 2,
        sender: 'consultant',
        text: 'Merci pour votre message. Je vais vérifier cela et revenir vers vous dans les plus brefs délais.',
        timestamp: new Date(),
        status: 'sent'
      };
      setMessages(prev => [...prev, response]);
    }, 4000);

    // Update message status after delivery
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, status: 'delivered' } : msg
      ));
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...filesArray]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return '🖼️';
    } else if (type === 'application/pdf') {
      return '📄';
    } else if (type.includes('word')) {
      return '📝';
    } else {
      return '📎';
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden flex flex-col" style={{ height: '75vh' }}>
        
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold">M</span>
              </div>
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-primary"></div>
            </div>
            <div>
              <div className="font-bold text-lg">Marie Dubois</div>
              <div className="text-xs text-primary-foreground/80 flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                En ligne
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-primary-foreground/10 rounded-lg transition" title="Rechercher">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button className="p-2 hover:bg-primary-foreground/10 rounded-lg transition" title="Plus d'options">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/20">
          {messages.map((message, index) => {
            const showDate = index === 0 || 
              formatDate(messages[index - 1].timestamp) !== formatDate(message.timestamp);

            return (
              <React.Fragment key={message.id}>
                {showDate && (
                  <div className="flex justify-center my-4">
                    <span className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground font-medium">
                      {formatDate(message.timestamp)}
                    </span>
                  </div>
                )}
                
                <div className={`flex ${message.sender === 'client' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${message.sender === 'client' ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.sender === 'client'
                          ? 'bg-primary text-primary-foreground rounded-tr-sm'
                          : 'bg-card border border-border rounded-tl-sm'
                      }`}
                    >
                      {message.text && (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                      )}
                      
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {message.attachments.map((file, idx) => (
                            <a
                              key={idx}
                              href={file.url}
                              download={file.name}
                              className={`flex items-center gap-2 p-2 rounded-lg ${
                                message.sender === 'client' 
                                  ? 'bg-primary-foreground/10 hover:bg-primary-foreground/20' 
                                  : 'bg-muted hover:bg-muted/80'
                              } transition`}
                            >
                              <span className="text-xl">{getFileIcon(file.type)}</span>
                              <span className="text-xs font-medium truncate flex-1">{file.name}</span>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className={`flex items-center gap-1 mt-1 ${message.sender === 'client' ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
                      {message.sender === 'client' && (
                        <span className="text-xs">
                          {message.status === 'sent' && '✓'}
                          {message.status === 'delivered' && '✓✓'}
                          {message.status === 'read' && <span className="text-blue-500">✓✓</span>}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="px-6 py-2 bg-muted/30 border-t border-border">
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 text-sm">
                  <span>{getFileIcon(file.type)}</span>
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="bg-card border-t border-border px-6 py-4">
          <div className="flex items-end gap-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 hover:bg-muted rounded-lg transition text-muted-foreground hover:text-foreground"
              title="Joindre un fichier"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            
            <div className="flex-1 bg-muted/50 rounded-xl border border-border focus-within:border-primary transition">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tapez votre message..."
                rows={1}
                className="w-full px-4 py-3 bg-transparent resize-none outline-none text-foreground placeholder:text-muted-foreground"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>

            <button
              onClick={handleSendMessage}
              disabled={newMessage.trim() === '' && attachments.length === 0}
              className="p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              title="Envoyer"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          
          <div className="mt-2 text-xs text-muted-foreground">
            Appuyez sur Entrée pour envoyer • Maj + Entrée pour une nouvelle ligne
          </div>
        </div>
      </div>
    </div>
  );
}

