import React, { useState, useEffect } from "react";
import { DLI } from "./types";
import { dataService } from "./services/dataService";
import { geminiService } from "./services/geminiService";

export default function EED({ isMobileApp = false }: { isMobileApp?: boolean }) {
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

      const profile = dataService.getGlobalProfile();
      if (profile?.analysis) {
        setGlobalProfile(profile);
        const recommended = profile.analysis.recommended_programs?.[0] || profile.analysis.top_skills?.[0];
        if (recommended) setSearch(recommended);
      }

      setLoading(false);
    });
  }, []);

  // Filtrage local
  useEffect(() => {
    const q = search.toLowerCase();
    const filtered = allInstitutions.filter(inst =>
      (inst.name.toLowerCase().includes(q) || inst.type.toLowerCase().includes(q)) &&
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
      setAllInstitutions(prev => {
        const ids = new Set(prev.map(i => i.id));
        return [...prev, ...results.filter(r => !ids.has(r.id))];
      });
    } catch (err) {
      console.error("Recherche DLI échouée", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="eed-wrap">

      {/* Bannière profil actif */}
      {globalProfile && (
        <div className="eed-profile-banner">
          <div className="eed-profile-icon">👤</div>
          <div>
            <p className="eed-profile-name">
              Profil actif : {globalProfile.analysis?.name || "Candidat"}
            </p>
            <p className="eed-profile-sub">
              Les établissements sont filtrés selon vos objectifs d'études.
            </p>
          </div>
        </div>
      )}

      {/* Barre de recherche */}
      <form className="eed-search-bar" onSubmit={handleRemoteSearch}>
        <div className="eed-input-wrap">
          <span className="eed-input-icon">🔍</span>
          <input
            type="text"
            className="eed-input"
            placeholder="Filtrer ou rechercher (ex: McGill, infirmerie...)"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="eed-select"
          value={province}
          onChange={e => setProvince(e.target.value)}
        >
          <option value="Toutes">Toutes les provinces</option>
          <option value="Québec">Québec</option>
          <option value="Ontario">Ontario</option>
          <option value="Colombie-Britannique">Colombie-Britannique</option>
          <option value="Alberta">Alberta</option>
          <option value="Manitoba">Manitoba</option>
          <option value="Saskatchewan">Saskatchewan</option>
          <option value="Nouvelle-Écosse">Nouvelle-Écosse</option>
          <option value="Nouveau-Brunswick">Nouveau-Brunswick</option>
        </select>
        <button
          type="submit"
          className="eed-btn-search"
          disabled={loading || !search.trim()}
        >
          {loading ? "Chargement…" : "Rechercher via IA"}
        </button>
      </form>

      {/* Résultats */}
      {loading && institutions.length === 0 ? (
        <div className="eed-loading">
          <p>⏳ Chargement des établissements…</p>
        </div>
      ) : institutions.length === 0 ? (
        <div className="eed-empty">
          Aucun établissement trouvé. Essayez une autre recherche.
        </div>
      ) : (
        <div className="eed-grid">
          {institutions.map(inst => {
            let domain = "";
            try { domain = new URL(inst.url).hostname.replace("www.", ""); } catch {}
            const logoUrl = domain
              ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
              : "https://cdn-icons-png.flaticon.com/512/2991/2991148.png";

            return (
              <div key={inst.id} className="eed-card">
                <div className="eed-card-head">
                  <div className="eed-card-logo">
                    <img
                      src={logoUrl}
                      alt={inst.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://cdn-icons-png.flaticon.com/512/2991/2991148.png";
                      }}
                    />
                  </div>
                  <a
                    href={inst.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="eed-card-ext"
                    title="Ouvrir le site"
                  >
                    ↗
                  </a>
                </div>

                <p className="eed-card-name">{inst.name}</p>

                <div className="eed-card-meta">
                  <span>📍 {inst.province}</span>
                  <span>•</span>
                  <span>{inst.type}</span>
                </div>

                <div className="eed-card-footer">
                  <a
                    href={inst.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="eed-card-btn"
                  >
                    Voir les programmes
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

