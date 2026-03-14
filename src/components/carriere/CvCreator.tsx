import React, { useState, useRef } from "react";
import mammoth from "mammoth";
import html2pdf from "html2pdf.js";
import CVPreview from "./CVPreview";

// ── Constantes ────────────────────────────────────────────────────────────────

const TIPS = [
  { icon: "📷", title: "Pas de photo", desc: "Au Canada, ne mettez jamais de photo sur votre CV. Ce n'est pas la norme." },
  { icon: "📅", title: "Format chronologique", desc: "Listez vos expériences du plus récent au plus ancien." },
  { icon: "🗣️", title: "Langue de la région", desc: "En Ontario/BC, rédigez en anglais. Au Québec, en français." },
  { icon: "🏆", title: "Chiffrez vos réussites", desc: "Ex : « Augmenté les ventes de 30 % » plutôt que « Amélioré les ventes »." },
  { icon: "🔒", title: "Pas d'infos personnelles", desc: "Ne mentionnez pas votre âge, état civil ou numéro d'assurance sociale." },
  { icon: "⭐", title: "Résumé professionnel", desc: "Commencez par un résumé de 2-3 lignes adapté pour chaque poste." },
];

const CV_TEMPLATES = [
  { id: "modern",   name: "Moderne",      preview: "https://picsum.photos/seed/modern/200/260"   },
  { id: "classic",  name: "Classique",    preview: "https://picsum.photos/seed/classic/200/260"  },
  { id: "creative", name: "Créatif",      preview: "https://picsum.photos/seed/creative/200/260" },
  { id: "minimal",  name: "Minimaliste",  preview: "https://picsum.photos/seed/minimal/200/260"  },
];

const CV_SERVICES = [
  { id: "cv_canada",      icon: "🍁", label: "CV Canada",           desc: "CV standard canadien",            price: 10 },
  { id: "cv_quebec",      icon: "⚜️", label: "CV Québec",           desc: "Marché québécois, en français",    price: 10 },
  { id: "cv_etudiant",    icon: "🎓", label: "CV Étudiant",         desc: "Premier emploi / stage",          price: 8  },
  { id: "cv_immigration", icon: "✈️", label: "CV Immigration",      desc: "Entrée Express / PNP",            price: 12 },
  { id: "cover_letter",   icon: "✉️", label: "Lettre de motivation", desc: "Cover letter bilingue",           price: 10 },
  { id: "letter_ircc",    icon: "🏛️", label: "Lettre IRCC",         desc: "Lettre d'explication IRCC",       price: 15 },
];

// ── Composant ─────────────────────────────────────────────────────────────────

export default function CvCreator({ isMobileApp = false, defaultService = "cv_canada" }: { isMobileApp?: boolean; defaultService?: string }) {
  const [cvText, setCvText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [optimizedCv, setOptimizedCv] = useState<any>(null);
  const [loadingOptimize, setLoadingOptimize] = useState(false);
  const [targetJob, setTargetJob] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(CV_TEMPLATES[0]);
  const [showRawText, setShowRawText] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [service, setService] = useState(defaultService);
  const [showPaywall, setShowPaywall] = useState(false);
  const [coverLetter, setCoverLetter] = useState<any>(null);
  const [loadingCoverLetter, setLoadingCoverLetter] = useState(false);
  const [showCoverLetter, setShowCoverLetter] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cvMagicRef = useRef<HTMLDivElement>(null);

  // ── Lecture fichier ────────────────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setLoadingAnalysis(true);
    setError(null);
    setOptimizedCv(null);
    try {
      let text = "";
      if (file.type === "application/pdf") {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(",")[1];
          // Pour les PDF, on envoie le base64 → côté serveur extrait le texte
          await runAnalyze("(Fichier PDF — extraction automatique en cours)\n" + atob(base64).slice(0, 3000));
          setLoadingAnalysis(false);
        };
        reader.readAsDataURL(file);
        return;
      } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else if (file.type === "text/plain") {
        text = await file.text();
      } else {
        setError("Format non supporté. Utilisez PDF, DOCX ou TXT.");
        setLoadingAnalysis(false);
        return;
      }
      setCvText(text);
      await runAnalyze(text);
    } catch (err: any) {
      setError(err?.message ?? "Erreur lors de la lecture du fichier.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // ── Analyse IA ─────────────────────────────────────────────────────────────

  const runAnalyze = async (text: string) => {
    const res = await fetch("/api/cv-analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: "analyze", cvText: text, service }),
    });
    if (!res.ok) { setError("Erreur lors de l'analyse (" + res.status + ")"); return; }
    const data = await res.json();
    if (data.error) { setError(data.error); return; }
    setAnalysis(data);
  };

  const handleAnalyze = async () => {
    if (!cvText.trim()) return;
    setLoadingAnalysis(true);
    setError(null);
    setOptimizedCv(null);
    try {
      await runAnalyze(cvText);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // ── Optimisation CV Magic ─────────────────────────────────────────────────

  const handleOptimize = async () => {
    const text = cvText || (analysis ? "CV de " + analysis.name : "");
    if (!text) return;
    setLoadingOptimize(true);
    setError(null);
    try {
      const res = await fetch("/api/cv-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "optimize",
          cvText: text,
          targetJob,
          suggestions: analysis?.suggestions ?? "",
          service,
        }),
      });
      if (!res.ok) { setError("Erreur optimisation (" + res.status + ")"); return; }
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setOptimizedCv(data);
      setTimeout(() => cvMagicRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } finally {
      setLoadingOptimize(false);
    }
  };

  // ── Lettre de motivation ──────────────────────────────────────────────────

  const handleCoverLetter = async () => {
    const text = cvText;
    if (!text.trim()) return;
    setLoadingCoverLetter(true);
    setError(null);
    try {
      const res = await fetch("/api/cv-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: "cover_letter", cvText: text, targetJob, service }),
      });
      if (!res.ok) { setError("Erreur lettre (" + res.status + ")"); return; }
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setCoverLetter(data);
      setShowCoverLetter(true);
    } finally {
      setLoadingCoverLetter(false);
    }
  };

  // ── Réinitialiser ─────────────────────────────────────────────────────────

  const handleClear = () => {
    setCvText(""); setFileName(null); setAnalysis(null);
    setOptimizedCv(null); setError(null); setTargetJob("");
    setCoverLetter(null); setShowCoverLetter(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Copier / PDF ──────────────────────────────────────────────────────────

  const copyToClipboard = () => {
    if (!optimizedCv) return;
    navigator.clipboard.writeText(JSON.stringify(optimizedCv, null, 2));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    setShowPaywall(true);
  };

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div className="cv-wrap">

      {/* ── Paywall ── */}
      {showPaywall && (
        <div className="cv-paywall-overlay" onClick={() => setShowPaywall(false)}>
          <div className="cv-paywall-modal" onClick={e => e.stopPropagation()}>
            <button className="cv-paywall-close" onClick={() => setShowPaywall(false)}>✕</button>
            <div className="cv-paywall-icon">🔒</div>
            <h2 className="cv-paywall-title">Téléchargement réservé aux forfaits</h2>
            <p className="cv-paywall-sub">
              Pour télécharger votre CV en PDF et accéder à tous les services,
              activez votre forfait Capitune.
            </p>
            <div className="cv-paywall-prices">
              <div>À partir de <strong>2$/service</strong> avec forfait</div>
              <div className="cv-paywall-vs">vs {CV_SERVICES.find(s => s.id === service)?.price ?? 10}$ sans forfait</div>
            </div>
            <a href="/tarifs" className="cv-paywall-cta">🎯 Voir les forfaits Capitune</a>
            <p className="cv-paywall-note">Déjà abonné ? <a href="/connexion">Connectez-vous</a></p>
          </div>
        </div>
      )}

      {/* ── Sélecteur de service ── */}
      <section className="cv-services-section">
        <h2 className="cv-section-title">🔧 Choisir un service</h2>
        <p className="cv-section-sub">Sélectionnez le type de document à générer. Prix sans forfait → <strong>1/5 avec forfait Capitune</strong>.</p>
        <div className="cv-services-grid">
          {CV_SERVICES.map(s => (
            <button
              key={s.id}
              className={`cv-service-card${service === s.id ? " active" : ""}`}
              onClick={() => setService(s.id)}
            >
              <span className="cv-service-icon">{s.icon}</span>
              <div className="cv-service-info">
                <p className="cv-service-name">{s.label}</p>
                <p className="cv-service-desc">{s.desc}</p>
              </div>
              <div className="cv-service-pricing">
                <span className="cv-price-sub">{Math.round(s.price / 5)}$<small>/forfait</small></span>
                <span className="cv-price-full">{s.price}$</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Conseils ── */}
      <section className="cv-tips-section">
        <h2 className="cv-section-title">📋 Règles clés du CV canadien</h2>
        <div className="cv-tips-grid">
          {TIPS.map((tip, i) => (
            <div key={i} className="cv-tip-card">
              <span className="cv-tip-icon">{tip.icon}</span>
              <div>
                <p className="cv-tip-title">{tip.title}</p>
                <p className="cv-tip-desc">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Zone saisie ── */}
      <section className="cv-input-section">
        <div className="cv-input-grid">

          {/* Gauche : upload / texte */}
          <div className="cv-card">
            <div className="cv-card-header">
              <span className="cv-card-icon">📄</span>
              <h3>Votre CV</h3>
              {(cvText || fileName) && (
                <button className="cv-btn-clear" onClick={handleClear} title="Réinitialiser">✕</button>
              )}
            </div>

            <div className="cv-upload-bar">
              <span className="cv-upload-label">PDF, DOCX ou TXT</span>
              <button className="cv-btn-import" onClick={() => fileInputRef.current?.click()}>
                📎 Importer un fichier
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange}
                accept=".pdf,.docx,.txt" style={{ display: "none" }} />
            </div>

            {fileName ? (
              <div className="cv-file-preview">
                <span className="cv-file-icon">📎</span>
                <div>
                  <p className="cv-file-name">{fileName}</p>
                  <p className="cv-file-sub">Fichier importé avec succès</p>
                </div>
              </div>
            ) : (
              <textarea
                className="cv-textarea"
                value={cvText}
                onChange={e => setCvText(e.target.value)}
                placeholder="Ou collez le texte de votre CV ici (toutes expériences, formations, compétences)…"
              />
            )}

            {error && (
              <div className="cv-error-box">⚠️ {error}</div>
            )}

            <button
              className="cv-btn-primary"
              onClick={handleAnalyze}
              disabled={loadingAnalysis || (!cvText.trim() && !fileName)}
            >
              {loadingAnalysis
                ? <><span className="cv-spinner" /> Analyse en cours…</>
                : "✨ Analyser mon CV"}
            </button>
          </div>

          {/* Droite : résultat analyse */}
          <div className="cv-card">
            <div className="cv-card-header">
              <span className="cv-card-icon blue">🎯</span>
              <h3>Diagnostic IA</h3>
            </div>
            {!analysis ? (
              <div className="cv-empty-state">
                <span>📊</span>
                <p>Importez ou collez votre CV, puis cliquez sur <strong>Analyser</strong> pour obtenir un diagnostic personnalisé.</p>
              </div>
            ) : (
              <div className="cv-analysis-result">
                <div className="cv-analysis-header">
                  <div>
                    <p className="cv-analysis-label">Candidat</p>
                    <p className="cv-analysis-name">{analysis.name}</p>
                  </div>
                  <div className="cv-score-badge">
                    <p className="cv-analysis-label" style={{ color: "var(--cap-orange)" }}>Score</p>
                    <p className="cv-score-value">{analysis.compatibility_score}%</p>
                  </div>
                </div>
                <div className="cv-analysis-row">
                  <div className="cv-stat">
                    <p className="cv-analysis-label">Expérience</p>
                    <p className="cv-stat-val">{analysis.experience_years} ans</p>
                  </div>
                  <div className="cv-stat">
                    <p className="cv-analysis-label">Programmes recommandés</p>
                    <div className="cv-tags-wrap">
                      {(analysis.recommended_programs ?? []).slice(0, 3).map((p: string) => (
                        <span key={p} className="cv-tag orange">{p}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="cv-analysis-label">Compétences clés</p>
                  <div className="cv-tags-wrap" style={{ marginTop: "8px" }}>
                    {(analysis.top_skills ?? []).map((s: string) => (
                      <span key={s} className="cv-tag">{s}</span>
                    ))}
                  </div>
                </div>
                {analysis.ats_score !== undefined && (
                  <div className="cv-ats-row">
                    <div>
                      <p className="cv-analysis-label">Score ATS</p>
                      <p className="cv-score-value" style={{ color: analysis.ats_score >= 70 ? "#22c55e" : analysis.ats_score >= 50 ? "var(--cap-orange)" : "#ef4444" }}>
                        {analysis.ats_score}%
                      </p>
                    </div>
                    {(analysis.missing_keywords ?? []).length > 0 && (
                      <div style={{ flex: 1 }}>
                        <p className="cv-analysis-label">Mots-clés manquants</p>
                        <div className="cv-tags-wrap" style={{ marginTop: "6px" }}>
                          {(analysis.missing_keywords ?? []).map((k: string) => (
                            <span key={k} className="cv-tag red">{k}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="cv-suggestions-box">
                  <strong>💡 Suggestions IA</strong>
                  <p>{analysis.suggestions}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── CV Magic ── */}
      <section className="cv-magic-section" ref={cvMagicRef}>
        <div className="cv-section-header">
          <span className="cv-card-icon orange">✨</span>
          <div>
            <h2>CV Magic — Optimisation canadienne</h2>
            <p>Générez un CV reformaté et adapté au marché canadien avec les données analysées.</p>
          </div>
        </div>

        <div className="cv-magic-grid">

          {/* Gauche : templates + poste cible */}
          <div>
            <p className="cv-step-label">1. Poste cible (facultatif)</p>
            <input
              type="text"
              className="cv-input-field"
              placeholder="Ex : Développeur Full Stack, Infirmier, Comptable…"
              value={targetJob}
              onChange={e => setTargetJob(e.target.value)}
            />

            <p className="cv-step-label" style={{ marginTop: "20px" }}>2. Choisissez un template</p>
            <div className="cv-templates-grid">
              {CV_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  className={`cv-template-btn${selectedTemplate.id === t.id ? " active" : ""}`}
                  onClick={() => setSelectedTemplate(t)}
                >
                  <img src={t.preview} alt={t.name} />
                  <div className="cv-template-label">{t.name}</div>
                  {selectedTemplate.id === t.id && <div className="cv-template-check">✓</div>}
                </button>
              ))}
            </div>

            <button
              className="cv-btn-primary"
              style={{ marginTop: "20px" }}
              onClick={handleOptimize}
              disabled={loadingOptimize || (!cvText.trim() && !analysis)}
            >
              {loadingOptimize
                ? <><span className="cv-spinner" /> Optimisation…</>
                : "🪄 Générer mon CV canadien"}
            </button>
          </div>

          {/* Droite : prévisualisation */}
          <div className="cv-magic-panel">
            <div className="cv-magic-toolbar">
              <p className="cv-step-label" style={{ margin: 0 }}>3. Aperçu du CV généré</p>
              {optimizedCv && (
                <div className="cv-toolbar-actions">
                    <button className="cv-btn-sm" onClick={copyToClipboard}>{copied ? "✓ Copié" : "Copier"}</button>
                    <button className="cv-btn-sm" onClick={() => setShowRawText(!showRawText)} title="Vue brute">👁</button>
                    <button className="cv-btn-sm orange" onClick={handleDownloadPDF}>⬇ PDF</button>
                  </div>
              )}
            </div>

            <div className="cv-magic-preview">
              {loadingOptimize ? (
                <div className="cv-magic-loading">
                  <span className="cv-spinner large" />
                  <p>Optimisation en cours avec OpenAI…</p>
                </div>
              ) : optimizedCv ? (
                showRawText ? (
                  <pre className="cv-raw-pre">{JSON.stringify(optimizedCv, null, 2)}</pre>
                ) : (
                  <div className="cv-scaler">
                    <div className="cv-scaler-inner">
                      <div id="cv-preview-container" style={{ background: "#fff" }}>
                        <CVPreview
                          data={optimizedCv}
                          templateId={selectedTemplate.id}
                          onChange={d => setOptimizedCv(d)}
                        />
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="cv-empty-state">
                  <span>🪄</span>
                  <p>Cliquez sur <strong>Générer mon CV canadien</strong> pour créer une version optimisée.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Lettre de motivation ── */}
      <section className="cv-magic-section" style={{ marginTop: "32px" }}>
        <div className="cv-section-header">
          <span className="cv-card-icon">✉️</span>
          <div>
            <h2>Lettre de motivation</h2>
            <p>Génération automatique adaptée au poste et au marché canadien.</p>
          </div>
        </div>

        <div className="cv-cover-actions">
          <input
            type="text"
            className="cv-input-field"
            placeholder="Poste visé (facultatif)…"
            value={targetJob}
            onChange={e => setTargetJob(e.target.value)}
            style={{ maxWidth: "320px" }}
          />
          <button
            className="cv-btn-primary"
            style={{ maxWidth: "240px" }}
            onClick={handleCoverLetter}
            disabled={loadingCoverLetter || !cvText.trim()}
          >
            {loadingCoverLetter
              ? <><span className="cv-spinner" /> Génération…</>
              : "✉️ Générer la lettre"}
          </button>
        </div>

        {coverLetter && (
          <div className="cv-cover-letter-box">
            <div className="cv-cover-toolbar">
              <strong>{coverLetter.subject}</strong>
              <div className="cv-toolbar-actions">
                <button className="cv-btn-sm" onClick={() => {
                  const txt = [coverLetter.subject, coverLetter.greeting, coverLetter.intro, coverLetter.body, coverLetter.closing, coverLetter.signature].join('\n\n');
                  navigator.clipboard.writeText(txt);
                }}>Copier</button>
                <button className="cv-btn-sm" onClick={() => setShowCoverLetter(!showCoverLetter)}>{showCoverLetter ? 'Réduire' : 'Afficher'}</button>
              </div>
            </div>
            {showCoverLetter && (
              <div className="cv-cover-body">
                <p>{coverLetter.greeting}</p>
                <br />
                <p>{coverLetter.intro}</p>
                <br />
                <p style={{ whiteSpace: 'pre-line' }}>{coverLetter.body}</p>
                <br />
                <p>{coverLetter.closing}</p>
                <br />
                <p style={{ whiteSpace: 'pre-line' }}>{coverLetter.signature}</p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
