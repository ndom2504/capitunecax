import React, { useState } from "react";
import { Search, Star, ShieldCheck, MapPin, MessageSquare, ChevronRight } from "lucide-react";

const EXPERTS = [
  { id: 1, name: "Amira B.", specialty: "Entrée Express", province: "Québec", rating: 4.9, reviews: 128, avatar: "https://picsum.photos/seed/exp1/200" },
  { id: 2, name: "Jean-Pierre L.", specialty: "Regroupement Familial", province: "Ontario", rating: 4.8, reviews: 95, avatar: "https://picsum.photos/seed/exp2/200" },
  { id: 3, name: "Sarah M.", specialty: "Visa Étudiant", province: "Colombie-Britannique", rating: 5.0, reviews: 210, avatar: "https://picsum.photos/seed/exp3/200" },
  { id: 4, name: "Carlos R.", specialty: "Investisseurs", province: "Alberta", rating: 4.7, reviews: 64, avatar: "https://picsum.photos/seed/exp4/200" },
];

export default function Marketplace() {
  return (
    <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2 text-white">Experts Certifiés RCIC</h1>
          <p className="text-gray-500">Connectez-vous avec des consultants réglementés pour sécuriser votre dossier.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Rechercher un expert..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-primary outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {EXPERTS.map(expert => (
          <div key={expert.id} className="bg-[#111] border border-white/5 p-6 rounded-3xl hover:border-primary/30 transition-all group">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto border-2 border-primary/20">
                <img src={expert.avatar} alt={expert.name} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-black px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                Vérifié
              </div>
            </div>
            
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold mb-1 text-white">{expert.name}</h3>
              <div className="text-xs font-bold text-primary uppercase tracking-widest mb-3">{expert.specialty}</div>
              <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
                <Star className="w-3 h-3 fill-current" />
                <span className="text-xs font-bold">{expert.rating}</span>
                <span className="text-gray-600 text-[10px]">({expert.reviews} avis)</span>
              </div>
              <div className="flex items-center justify-center gap-1 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                <MapPin className="w-3 h-3" />
                {expert.province}
              </div>
            </div>

            <div className="space-y-2">
              <button className="w-full py-3 rounded-xl bg-primary text-black text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center justify-center gap-2">
                <MessageSquare className="w-3 h-3" />
                Contacter
              </button>
              <button className="w-full py-3 rounded-xl bg-white/5 border border-white/5 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
                Voir Profil
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
