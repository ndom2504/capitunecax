import React, { useState, useEffect } from "react";
import { Search, MapPin, ExternalLink, GraduationCap, Filter, Loader2, UserCircle2 } from "lucide-react";
import { DLI } from "../types";
import { dataService } from "../services/dataService";
import { geminiService } from "../services/geminiService";

export default function EED() {
  const [institutions, setInstitutions] = useState<DLI[]>([]);
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("Toutes");
  const [loading, setLoading] = useState(false);
  const [allInstitutions, setAllInstitutions] = useState<DLI[]>([]);
  const [globalProfile, setGlobalProfile] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    dataService.getEED().then(data => {
      setAllInstitutions(data);
      setInstitutions(data);
      
      // Load global profile and auto-filter
      const profile = dataService.getGlobalProfile();
      if (profile && profile.analysis) {
        setGlobalProfile(profile);
        // Pre-fill search with a recommended program or top skill to auto-filter
        const recommended = profile.analysis.recommended_programs?.[0] || profile.analysis.top_skills?.[0];
        if (recommended) {
          setSearch(recommended);
        }
      }
      
      setLoading(false);
    });
  }, []);

  // Local filtering for speed
  useEffect(() => {
    const filtered = allInstitutions.filter(inst => 
      (inst.name.toLowerCase().includes(search.toLowerCase()) || inst.type.toLowerCase().includes(search.toLowerCase())) &&
      (province === "Toutes" || inst.province === province)
    );
    setInstitutions(filtered);
  }, [search, province, allInstitutions]);

  const handleRemoteSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;

    setLoading(true);
    try {
      const results = await geminiService.searchDLI(search, province === "Toutes" ? undefined : province);
      // Merge results avoiding duplicates
      setAllInstitutions(prev => {
        const existingIds = new Set(prev.map(i => i.id));
        const newOnes = results.filter(r => !existingIds.has(r.id));
        return [...prev, ...newOnes];
      });
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
      {globalProfile ? (
        <div className="bg-primary/10 border border-primary/20 p-6 rounded-3xl mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 text-primary rounded-full flex items-center justify-center">
              <UserCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary">Profil Actif : {globalProfile.analysis?.name || "Candidat"}</h3>
              <p className="text-sm text-gray-400">Les écoles sont filtrées selon vos objectifs d'études et compétences.</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2 text-white">Établissements DLI</h1>
          <p className="text-gray-500">Accédez à la liste officielle des établissements d'enseignement désignés.</p>
        </div>
        <form onSubmit={handleRemoteSearch} className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Filtrer ou rechercher (ex: McGill...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-primary outline-none text-white"
            />
          </div>
          <select 
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none text-white appearance-none cursor-pointer"
          >
            <option value="Toutes" className="bg-[#111] text-white">Toutes les provinces</option>
            <option value="Québec" className="bg-[#111] text-white">Québec</option>
            <option value="Ontario" className="bg-[#111] text-white">Ontario</option>
            <option value="Colombie-Britannique" className="bg-[#111] text-white">Colombie-Britannique</option>
            <option value="Alberta" className="bg-[#111] text-white">Alberta</option>
            <option value="Manitoba" className="bg-[#111] text-white">Manitoba</option>
            <option value="Saskatchewan" className="bg-[#111] text-white">Saskatchewan</option>
            <option value="Nouvelle-Écosse" className="bg-[#111] text-white">Nouvelle-Écosse</option>
            <option value="Nouveau-Brunswick" className="bg-[#111] text-white">Nouveau-Brunswick</option>
          </select>
          <button 
            type="submit"
            disabled={loading || !search.trim()}
            className="bg-primary text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
            title="Recherche approfondie via IA"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Rechercher"}
          </button>
        </form>
      </div>

      {loading && institutions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-500">
          <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" />
          <p className="font-bold uppercase tracking-widest text-xs text-gray-400">Recherche en cours...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {institutions.map(inst => {
            const domain = new URL(inst.url).hostname.replace('www.', '');
            const logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

            return (
              <div key={inst.id} className="bg-[#111] border border-white/5 p-6 rounded-3xl hover:border-primary/30 transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center overflow-hidden p-2 border border-white/10 group-hover:border-primary/50 transition-colors">
                    <img 
                      src={logoUrl} 
                      alt={inst.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png';
                      }}
                    />
                  </div>
                  <a 
                    href={inst.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 bg-white/5 rounded-lg hover:bg-primary hover:text-black transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <h3 className="text-xl font-bold mb-2 text-white group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">{inst.name}</h3>
                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {inst.province}
                  </span>
                  <span>•</span>
                  <span>{inst.type}</span>
                </div>
                <div className="mt-6 pt-6 border-t border-white/5">
                  <a 
                    href={inst.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-3 rounded-xl bg-white/5 border border-white/5 text-white text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-black text-center transition-all"
                  >
                    Voir les programmes
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {!loading && institutions.length === 0 && (
        <div className="text-center py-24 border-2 border-dashed border-white/5 rounded-3xl text-gray-600">
          Aucun établissement trouvé. Essayez une autre recherche.
        </div>
      )}
    </div>
  );
}
