import React from "react";
import { APP_NAME } from "../constants";
import { Mail, Phone, MapPin, Send } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/5 pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-white">
                C
              </div>
              <span className="text-xl font-bold tracking-tighter uppercase text-white">{APP_NAME}</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              La plateforme de référence pour une immigration canadienne structurée, sécurisée et réussie.
            </p>
            <div className="flex gap-4">
              {/* Social icons placeholder */}
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10" />
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10" />
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10" />
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-primary">Navigation</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><a href="/" className="hover:text-white transition-colors">Accueil</a></li>
              <li><a href="/ecosystem" className="hover:text-white transition-colors">Écosystème</a></li>
              <li><a href="/services" className="hover:text-white transition-colors">Services</a></li>
              <li><a href="/investors" className="hover:text-white transition-colors">Investisseurs</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-primary">Légal</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">CGU</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Confidentialité</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Mentions légales</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-primary">Newsletter</h4>
            <p className="text-sm text-gray-500 mb-4">Recevez les dernières mises à jour sur l'immigration.</p>
            <div className="relative">
              <input 
                type="email" 
                placeholder="votre@email.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary transition-colors text-white"
              />
              <button className="absolute right-2 top-2 bg-primary text-black p-1.5 rounded-lg hover:bg-primary/80 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <MapPin className="w-4 h-4 text-primary" />
                Lévis, QC, Canada
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <Phone className="w-4 h-4 text-primary" />
                +1 (XXX) XXX-XXXX
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <Mail className="w-4 h-4 text-primary" />
                contact@capitune.ca
              </div>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-600">
          <span>© {new Date().getFullYear()} CAPITUNE ÉCOSYSTÈME INC. TOUS DROITS RÉSERVÉS.</span>
          <div className="flex gap-8">
            <span>Fait avec ❤️ au Québec</span>
            <span>Certifié RCIC</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
