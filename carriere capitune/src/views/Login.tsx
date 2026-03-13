import React, { useState, useEffect } from "react";
import { ShieldCheck, Mail, Lock, ChevronRight, Github } from "lucide-react";
import { APP_NAME } from "../constants";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState("PARTICULIER");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login
    window.history.pushState({}, "", "/dashboard");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center font-bold text-black mx-auto mb-6 text-2xl">
            C
          </div>
          <h1 className="text-3xl font-black tracking-tighter mb-2 uppercase text-white">
            {isLogin ? "Bon retour" : "Rejoignez CAPITUNE"}
          </h1>
          <p className="text-gray-500 text-sm">
            {isLogin ? "Accédez à votre espace sécurisé." : "Commencez votre projet d'immigration aujourd'hui."}
          </p>
        </div>

        <div className="bg-[#111] border border-white/10 p-8 rounded-3xl primary-glow">
          {!isLogin && (
            <div className="mb-8">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 block">Je suis un...</label>
              <div className="grid grid-cols-2 gap-2">
                {["PARTICULIER", "PROFESSIONNEL"].map(r => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      role === r ? "bg-primary border-primary text-white" : "bg-white/5 border-white/5 text-gray-400 hover:border-white/20"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="email" 
                  required
                  placeholder="nom@exemple.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary transition-colors text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary transition-colors text-white"
                />
              </div>
            </div>

            {isLogin && (
              <div className="text-right">
                <button type="button" className="text-xs font-bold text-primary hover:text-primary/80">Mot de passe oublié ?</button>
              </div>
            )}

            <button className="w-full bg-primary hover:bg-primary/80 text-black py-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 mt-4">
              {isLogin ? "Se connecter" : "Créer mon compte"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest"><span className="bg-[#111] px-4 text-gray-600">Ou continuer avec</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 py-3 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors">
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4 grayscale" alt="Google" />
              Google
            </button>
            <button className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 py-3 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors">
              <Github className="w-4 h-4" />
              GitHub
            </button>
          </div>
        </div>

        <div className="text-center mt-8">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-bold text-gray-500 hover:text-white transition-colors"
          >
            {isLogin ? "Pas encore de compte ? Inscrivez-vous" : "Déjà un compte ? Connectez-vous"}
          </button>
        </div>
      </div>
    </div>
  );
}
