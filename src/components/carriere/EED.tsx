import React, { useState, useEffect, useRef } from "react";
import { DLI } from "./types";
import { dataService } from "./services/dataService";
import { geminiService } from "./services/geminiService";

const EED_COLORS = [
  { bg: '#0f3460', accent: '#4ecdc4' },
  { bg: '#1a1a40', accent: '#a78bfa' },
  { bg: '#183028', accent: '#4ade80' },
  { bg: '#1a1a2e', accent: '#ff9408' },
  { bg: '#2d1540', accent: '#f472b6' },
  { bg: '#0a2744', accent: '#38bdf8' },
];

export default function EED({ isMobileApp = false }: { isMobileApp?: boolean }) {
  const [institutions, setInstitutions] = useState<DLI[]>([]);
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("Toutes");
  const [loading, setLoading] = useState(false);
  const [allInstitutions, setAllInstitutions] = useState<DLI[]>([]);
  const [globalProfile, setGlobalProfile] = useState<any>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const storyRef = useRef<HTMLDivElement>(null);
  const goTo = (idx: number) => {
    setCurrentIdx(idx);
    if (storyRef.current) storyRef.current.scrollTo({ left: idx * storyRef.current.offsetWidth, behavior: 'smooth' });
  };

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
    }).catch(err => {
      console.error("Erreur chargement EED", err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  // Filtrage local
  useEffect(() => {
    const q = search.toLowerCase();
    const filtered = allInstitutions.filter(inst =>
      (!q || inst.name.toLowerCase().includes(q) || inst.type.toLowerCase().includes(q)) &&
      (province === "Toutes" || inst.province === province || inst.province.toLowerCase() === province.toLowerCase())
    );
    setInstitutions(filtered);
    setCurrentIdx(0);
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
          <option value="QC">Québec</option>
          <option value="ON">Ontario</option>
          <option value="BC">Colombie-Britannique</option>
          <option value="AB">Alberta</option>
          <option value="MB">Manitoba</option>
          <option value="SK">Saskatchewan</option>
          <option value="NS">Nouvelle-Écosse</option>
          <option value="NB">Nouveau-Brunswick</option>
          <option value="NL">Terre-Neuve</option>
          <option value="PE">Île-du-Prince-Édouard</option>
          <option value="YT">Yukon</option>
          <option value="NT">Territoires du Nord-Ouest</option>
          <option value="NU">Nunavut</option>
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
        <div className="eed-story-outer">
          {/* Dots de progression */}
          <div className="eed-story-dots">
            {institutions.map(function(_, idx) {
              return (
                <button key={idx} className={"eed-story-dot" + (idx === currentIdx ? " active" : "")} onClick={() => goTo(idx)} title={String(idx + 1)} />
              );
            })}
          </div>

          {/* Track horizontal */}
          <div
            className="eed-story-track"
            ref={storyRef}
            onScroll={function(e) {
              const el = e.currentTarget;
              const idx = Math.round(el.scrollLeft / el.offsetWidth);
              setCurrentIdx(Math.max(0, Math.min(institutions.length - 1, idx)));
            }}
          >
            {institutions.map(function(inst, idx) {
              const col = EED_COLORS[idx % EED_COLORS.length];
              let domain = "";
              try { domain = new URL(inst.url).hostname.replace("www.", ""); } catch {}
              const logoUrl = domain
                ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
                : "https://cdn-icons-png.flaticon.com/512/2991/2991148.png";

              return (
                <div key={inst.id} className="eed-story-card" style={{ background: col.bg }}>
                  {/* Bulles deco */}
                  <div className="eed-story-bubble b1" style={{ background: col.accent + '1A' }} />
                  <div className="eed-story-bubble b2" style={{ background: col.accent + '10' }} />

                  {/* Header carte */}
                  <div className="eed-story-header">
                    <span className="eed-story-counter" style={{ color: col.accent }}>
                      &#127979; {idx + 1} / {institutions.length}
                    </span>
                    <a href={inst.url} target="_blank" rel="noopener noreferrer"
                      className="eed-story-ext" style={{ borderColor: col.accent + '55', color: col.accent }}>&#8599;</a>
                  </div>

                  {/* Logo */}
                  <div className="eed-story-logo" style={{ borderColor: col.accent + '44', background: col.accent + '15' }}>
                    <img src={logoUrl} alt={inst.name}
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://cdn-icons-png.flaticon.com/512/2991/2991148.png"; }} />
                  </div>

                  {/* Contenu */}
                  <div className="eed-story-content">
                    <div className="eed-story-tags">
                      {inst.type && (
                        <span className="eed-story-tag" style={{ color: col.accent, borderColor: col.accent + '55' }}>{inst.type}</span>
                      )}
                      {inst.province && (
                        <span className="eed-story-tag">&#128205; {inst.province}</span>
                      )}
                    </div>
                    <h3 className="eed-story-title">{inst.name}</h3>
                    <a href={inst.url} target="_blank" rel="noopener noreferrer"
                      className="eed-story-btn" style={{ background: col.accent }}>
                      Voir les programmes &#8594;
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Flèches navigation */}
          {currentIdx > 0 && (
            <button className="eed-story-nav eed-story-nav-prev" onClick={() => goTo(currentIdx - 1)}>&#8249;</button>
          )}
          {currentIdx < institutions.length - 1 && (
            <button className="eed-story-nav eed-story-nav-next" onClick={() => goTo(currentIdx + 1)}>&#8250;</button>
          )}
        </div>
      )}
    </div>
  );
}

