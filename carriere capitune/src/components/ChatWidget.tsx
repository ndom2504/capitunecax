import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Bot, User } from "lucide-react";
import { geminiService } from "../services/geminiService";
import { motion, AnimatePresence } from "motion/react";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "bot" | "user"; text: string }[]>([
    { role: "bot", text: "Bonjour ! Je suis l'assistant IA de CAPITUNE. Comment puis-je vous aider dans votre projet d'immigration aujourd'hui ?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await geminiService.generateResponse(userMsg);
      setMessages(prev => [...prev, { role: "bot", text: response || "Désolé, je n'ai pas pu générer de réponse." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "bot", text: "Une erreur est survenue. Veuillez réessayer." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-[350px] h-[500px] bg-[#111] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden primary-glow"
          >
            {/* Header */}
            <div className="p-4 bg-primary text-black flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                <span className="font-bold text-sm">Assistant CAPITUNE</span>
              </div>
              <button onClick={() => setIsOpen(false)}><X className="w-5 h-5" /></button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === "user" 
                      ? "bg-primary text-black rounded-tr-none" 
                      : "bg-white/5 border border-white/10 text-gray-200 rounded-tl-none"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 p-3 rounded-2xl rounded-tl-none animate-pulse">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-gray-500 rounded-full" />
                      <div className="w-1 h-1 bg-gray-500 rounded-full" />
                      <div className="w-1 h-1 bg-gray-500 rounded-full" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/5 bg-black/50">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Posez votre question..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-primary text-white"
                />
                <button 
                  onClick={handleSend}
                  className="absolute right-2 top-2 p-1.5 bg-primary text-black rounded-lg hover:bg-primary/80 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-black shadow-xl hover:scale-110 transition-transform primary-glow"
      >
        {isOpen ? <X /> : <MessageSquare />}
      </button>
    </div>
  );
}
