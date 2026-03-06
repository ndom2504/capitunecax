import { 
  LayoutDashboard, 
  GraduationCap, 
  Briefcase, 
  Home, 
  FileText, 
  Calculator, 
  MessageSquare,
  Menu,
  X,
  CheckCircle2,
  Circle,
  Map as MapIcon
} from 'lucide-react';
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const navItems = [
  { icon: LayoutDashboard, label: 'Tableau de bord', path: '/' },
  { icon: MapIcon, label: 'Carte Interactive', path: '/map' },
  { icon: GraduationCap, label: 'Formation', path: '/education' },
  { icon: Briefcase, label: 'Emploi', path: '/jobs' },
  { icon: Home, label: 'Logement', path: '/housing' },
  { icon: FileText, label: 'Lettre Explicative', path: '/letter' },
  { icon: Calculator, label: 'Budget', path: '/budget' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-bg-light flex">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-30 w-64 bg-surface border-r border-border shadow-sm flex flex-col transition-transform duration-300 ease-in-out",
          !isSidebarOpen && "-translate-x-full lg:translate-x-0 lg:w-20"
        )}
      >
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2 text-primary font-bold text-xl">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              C
            </div>
            <span className={cn("transition-opacity duration-300", !isSidebarOpen && "lg:hidden")}>
              Capitune
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative group",
                  isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-text-secondary hover:bg-bg-light hover:text-text"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary" : "text-text-muted group-hover:text-text-secondary")} />
                <span className={cn("whitespace-nowrap transition-opacity duration-300", !isSidebarOpen && "lg:hidden")}>
                  {item.label}
                </span>
                {!isSidebarOpen && (
                  <div className="hidden lg:block absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center p-2 text-text-muted hover:bg-bg-light rounded-lg lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-4 lg:px-8">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 -ml-2 text-text-muted hover:bg-bg-light rounded-lg lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange/10 text-orange rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-orange rounded-full animate-pulse" />
              Mode Autonomie Assistée
            </div>
            <div className="w-8 h-8 bg-bg-light rounded-full overflow-hidden border border-border">
               <img src="https://picsum.photos/seed/user/100/100" alt="User" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </div>
      </main>

      {/* Capi Chat Widget */}
      <CapiWidget />
    </div>
  );
}

function CapiWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: "Bonjour ! Je suis Capi, votre assistant pour votre projet Canada. Comment puis-je vous aider aujourd'hui ?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'model', text: data.reply || "Désolé, je n'ai pas pu répondre." }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "Erreur de connexion avec Capi." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-80 sm:w-96 bg-surface rounded-2xl shadow-xl border border-border overflow-hidden flex flex-col"
            style={{ maxHeight: '500px' }}
          >
            <div className="p-4 bg-primary text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  C
                </div>
                <span className="font-medium">Capi Assistant</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto bg-bg-light space-y-4 h-80">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[80%] p-3 rounded-2xl text-sm",
                    msg.role === 'user' 
                      ? "bg-primary text-white rounded-br-none" 
                      : "bg-surface border border-border text-text rounded-bl-none shadow-sm"
                  )}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-surface border border-border p-3 rounded-2xl rounded-bl-none shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce delay-75" />
                      <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce delay-150" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-surface border-t border-border flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Posez une question..."
                className="flex-1 px-3 py-2 bg-bg-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange/50"
              />
              <button 
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="p-2 bg-orange text-white rounded-xl hover:bg-orange-light disabled:opacity-50"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-orange text-white rounded-full shadow-lg flex items-center justify-center hover:bg-orange-light transition-colors"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}
