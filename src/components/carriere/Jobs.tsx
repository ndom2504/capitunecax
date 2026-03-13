import React, { useState, useEffect, useRef } from "react";
import { geminiService } from "./services/geminiService";
import { dataService } from "./services/dataService";
import mammoth from "mammoth";
import html2pdf from "html2pdf.js";
import CVPreview from "./CVPreview";

const CV_TEMPLATES = [
  { id: "modern",   name: "Moderne",     preview: "https://picsum.photos/seed/modern/400/500"   },
  { id: "classic",  name: "Classique",   preview: "https://picsum.photos/seed/classic/400/500"  },
  { id: "creative", name: "Creatif",     preview: "https://picsum.photos/seed/creative/400/500" },
  { id: "minimal",  name: "Minimaliste", preview: "https://picsum.photos/seed/minimal/400/500"  },
];

export default function Jobs({ isMobileApp = false, mode = "full" }) {
  // mode: "full" | "jobs" | "cv"
  const [cvText, setCvText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [fileName, setFileName] = useState(null);
  const fileInputRef = useRef(null);
  const [jobQuery, setJobQuery] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [optimizedCv, setOptimizedCv] = useState(null);
  const [loadingMagic, setLoadingMagic] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(CV_TEMPLATES[0]);
  const [selectedModel, setSelectedModel] = useState("gemini-3-flash-preview");
  const [copied, setCopied] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const [globalProfile, setGlobalProfile] = useState(null);
  const cvMagicRef = useRef(null);

  useEffect(() => {
    const profile = dataService.getGlobalProfile();
    if (profile) {
      setGlobalProfile(profile);
      setAnalysis(profile.analysis);
      setCvText(profile.cvText || "");
      if (mode !== "cv") {
        const skill = profile.analysis && profile.analysis.top_skills && profile.analysis.top_skills[0];
        handleJobSearch(skill || "*");
      }
    } else if (mode !== "cv") {
      handleJobSearch("*");
    }
    // Pré-remplir depuis ?job= (redirection depuis la page emplois)
    if (typeof window !== "undefined") {
      const jobParam = new URLSearchParams(window.location.search).get("job");
      if (jobParam) setJobQuery(jobParam);
    }
  }, []);

  const handleOptimizeForJob = (jobTitle) => {
    if (mode === "jobs") {
      window.location.href = "/carriere/cv?job=" + encodeURIComponent(jobTitle);
      return;
    }
    setJobQuery(jobTitle);
    if (cvMagicRef.current) cvMagicRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setLoadingAnalysis(true);
    setOptimizedCv(null);
    try {
      const reader = new FileReader();
      if (file.type === "application/pdf") {
        reader.onload = async () => {
          const base64 = reader.result.split(",")[1];
          const res = await geminiService.analyzeCVFromFile(base64, "application/pdf");
          setAnalysis(res); dataService.saveGlobalProfile({ analysis: res, cvText: "" });
          setGlobalProfile({ analysis: res, cvText: "" });
          if (res && res.top_skills && res.top_skills[0]) handleJobSearch(res.top_skills[0]);
          setLoadingAnalysis(false);
        };
        reader.readAsDataURL(file);
      } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setCvText(result.value);
        const res = await geminiService.analyzeCV(result.value);
        setAnalysis(res); dataService.saveGlobalProfile({ analysis: res, cvText: result.value });
        setGlobalProfile({ analysis: res, cvText: result.value });
        if (res && res.top_skills && res.top_skills[0]) handleJobSearch(res.top_skills[0]);
        setLoadingAnalysis(false);
      } else if (file.type === "text/plain") {
        reader.onload = async () => {
          const text = reader.result;
          setCvText(text);
          const res = await geminiService.analyzeCV(text);
          setAnalysis(res); dataService.saveGlobalProfile({ analysis: res, cvText: text });
          setGlobalProfile({ analysis: res, cvText: text });
          if (res && res.top_skills && res.top_skills[0]) handleJobSearch(res.top_skills[0]);
          setLoadingAnalysis(false);
        };
        reader.readAsText(file);
      } else {
        alert("Format non supporte. Veuillez utiliser PDF, DOCX ou TXT.");
        setLoadingAnalysis(false);
      }
    } catch (error) {
      console.error("Erreur lecture fichier", error);
      setLoadingAnalysis(false);
    }
  };

  const clearFile = () => {
    setFileName(null); setCvText(""); setOptimizedCv(null);
    setAnalysis(null); setGlobalProfile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!cvText.trim()) return;
    setLoadingAnalysis(true); setOptimizedCv(null);
    try {
      const res = await geminiService.analyzeCV(cvText);
      setAnalysis(res); dataService.saveGlobalProfile({ analysis: res, cvText });
      setGlobalProfile({ analysis: res, cvText });
      if (res && res.top_skills && res.top_skills[0]) handleJobSearch(res.top_skills[0]);
    } catch (e) { console.error(e); } finally { setLoadingAnalysis(false); }
  };

  const handleMagicOptimize = async () => {
    const textToOptimize = cvText || (analysis ? ("CV de " + analysis.name) : "");
    if (!textToOptimize) return;
    setLoadingMagic(true);
    try {
      const res = await geminiService.optimizeCV(textToOptimize, analysis && analysis.suggestions, jobQuery, selectedModel);
      setOptimizedCv(res);
    } catch (e) { console.error(e); } finally { setLoadingMagic(false); }
  };

  const copyToClipboard = () => {
    if (!optimizedCv) return;
    navigator.clipboard.writeText(JSON.stringify(optimizedCv, null, 2));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById("cv-preview-container");
    if (!element) return;
    const name = analysis && analysis.name ? analysis.name.replace(/s+/g, "_") : "Optimise";
    html2pdf().set({
      margin: 0, filename: "CV_" + name + ".pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    }).from(element).save();
  };

  const handleJobSearch = async (query) => {
    const q = query || jobQuery;
    if (!q || !q.trim()) return;
    setLoadingJobs(true);
    try { const results = await geminiService.searchJobs(q, jobLocation); setJobs(results); }
    catch (e) { console.error(e); } finally { setLoadingJobs(false); }
  };

  return (
    <div className="jobs-wrap">

      {globalProfile && (
        <div className="jobs-profile-banner">
          <div className="jobs-profile-left">
            <div className="jobs-profile-icon">&#128100;</div>
            <div>
              <p className="jobs-profile-name">Profil actif : {(globalProfile.analysis && globalProfile.analysis.name) || "Candidat"}</p>
              <p className="jobs-profile-sub">Vos offres sont filtrées selon vos compétences.</p>
            </div>
          </div>
          <button className="jobs-btn-clear" onClick={clearFile}>Mettre à jour le profil</button>
        </div>
      )}

      {!globalProfile && mode !== "jobs" && (
        <div className="jobs-cv-grid">
          <div className="jobs-card">
            <div className="jobs-card-title">
              <div className="jobs-card-icon">&#128196;</div>
              <h2>Analyse CV par IA</h2>
            </div>
            <div className="jobs-file-header">
              <span style={{ fontSize: "12px", color: "#aaa" }}>PDF, DOCX ou TXT</span>
              <button className="jobs-btn-import" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
                Importer PDF/Word
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.docx,.txt" style={{ display: "none" }} />
            </div>
            {fileName ? (
              <div className="jobs-file-preview">
                <button className="jobs-file-remove" onClick={clearFile} title="Supprimer">x</button>
                <div className="jobs-file-preview-icon">&#128206;</div>
                <p className="jobs-file-preview-name">{fileName}</p>
                <p className="jobs-file-preview-sub">Fichier prêt pour l'analyse</p>
              </div>
            ) : (
              <textarea className="jobs-textarea" value={cvText} onChange={e => setCvText(e.target.value)}
                placeholder="Collez le texte de votre CV ici ou importez un fichier..." />
            )}
            <button className="jobs-btn-primary" onClick={handleAnalyze}
              disabled={loadingAnalysis || (!cvText.trim() && !fileName)}>
              {loadingAnalysis ? "Analyse en cours..." : "Analyser mon profil"}
            </button>
          </div>

          <div className="jobs-card">
            <div className="jobs-card-title">
              <div className="jobs-card-icon blue">&#10022;</div>
              <h2>Diagnostic Carrière</h2>
            </div>
            {!analysis ? (
              <div className="jobs-analysis-empty">
                <span style={{ fontSize:"40px", opacity:0.18 }}>&#128203;</span>
                <p>Analysez votre CV pour voir les recommandations personnalisées.</p>
              </div>
            ) : (
              <div className="jobs-analysis-result">
                <div className="jobs-analysis-header">
                  <div>
                    <p className="jobs-analysis-label">Candidat</p>
                    <p className="jobs-analysis-name">{analysis.name}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p className="jobs-analysis-label" style={{ color: "var(--cap-orange)" }}>Compatibilité</p>
                    <p className="jobs-analysis-score">{analysis.compatibility_score}%</p>
                  </div>
                </div>
                <div className="jobs-analysis-row">
                  <div className="jobs-analysis-stat">
                    <p className="jobs-analysis-label">Expérience</p>
                    <p className="jobs-analysis-stat-val">{analysis.experience_years} ans</p>
                  </div>
                  <div className="jobs-analysis-stat">
                    <p className="jobs-analysis-label">Programmes</p>
                    <div className="jobs-skills-wrap" style={{ marginTop:"6px" }}>
                      {analysis.recommended_programs && analysis.recommended_programs.slice(0,3).map(function(p) {
                        return <span key={p} className="jobs-skill-tag" style={{ fontSize:"11px", background:"rgba(255,148,8,0.1)", color:"var(--cap-orange)", border:"1px solid rgba(255,148,8,0.2)" }}>{p}</span>;
                      })}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="jobs-analysis-label" style={{ marginBottom: "8px" }}>Compétences clés</p>
                  <div className="jobs-skills-wrap">
                    {analysis.top_skills && analysis.top_skills.map(function(s) {
                      return <span key={s} className="jobs-skill-tag">{s}</span>;
                    })}
                  </div>
                </div>
                <div className="jobs-suggestions-box">
                  <strong>Suggestions IA</strong>
                  {analysis.suggestions}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {mode !== "jobs" && (
      <div style={{ marginBottom: "40px" }} ref={cvMagicRef}>
        <div className="jobs-section-title">
          <div className="jobs-section-icon">&#128161;</div>
          <div>
            <h2>CV Magic</h2>
            <p>Optimisez votre CV pour le marché canadien et choisissez un template professionnel.</p>
          </div>
        </div>
        <div className="jobs-magic-grid">
          <div>
            <p className="jobs-step-label">1. Choisissez un template</p>
            <div className="jobs-templates-grid">
              {CV_TEMPLATES.map(function(t) {
                return (
                  <button key={t.id} className={"jobs-template-btn" + (selectedTemplate.id === t.id ? " active" : "")} onClick={() => setSelectedTemplate(t)}>
                    <img src={t.preview} alt={t.name} />
                    <div className="jobs-template-label">{t.name}</div>
                    {selectedTemplate.id === t.id && <div className="jobs-template-check">&#10003;</div>}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="jobs-magic-panel">
            <div className="jobs-magic-toolbar">
              <p className="jobs-step-label" style={{ margin: 0 }}>2. Optimisation IA</p>
              <div className="jobs-magic-actions">
                <select className="jobs-model-select" value={selectedModel} onChange={e => setSelectedModel(e.target.value)}>
                  <option value="gemini-3-flash-preview">Gemini Flash</option>
                  <option value="gemini-3.1-pro-preview">Gemini Pro</option>
                </select>
                {optimizedCv && (
                  <>
                    <button className="jobs-btn-copy" onClick={copyToClipboard}>{copied ? "Copie !" : "Copier"}</button>
                    <button className="jobs-btn-eye" onClick={() => setShowRawText(!showRawText)} title="Vue texte brut">&#128065;</button>
                    <button className="jobs-btn-dl" onClick={handleDownloadPDF} title="Telecharger PDF">&#8595;</button>
                  </>
                )}
              </div>
            </div>
            <div className="jobs-magic-preview">
              {loadingMagic ? (
                <div className="jobs-magic-loading">
                  <span className="jobs-magic-loading-spin">&#9881;</span>
                  <p>Optimisation en cours...</p>
                </div>
              ) : optimizedCv ? (
                showRawText ? (
                  <pre className="jobs-raw-pre">{JSON.stringify(optimizedCv, null, 2)}</pre>
                ) : (
                  <div className="jobs-cv-scaler">
                    <div className="jobs-cv-scaler-inner">
                      <div id="cv-preview-container" style={{ background: "#fff" }}>
                        <CVPreview data={optimizedCv} templateId={selectedTemplate.id} onChange={function(d) { setOptimizedCv(d); }} />
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="jobs-magic-preview-empty">
                  <span style={{ fontSize:"40px", opacity:0.18 }}>&#128161;</span>
                  <p>Cliquez sur le bouton ci-dessous pour generer votre CV optimise pour le Canada.</p>
                </div>
              )}
            </div>
            <button className="jobs-btn-primary" onClick={handleMagicOptimize}
              disabled={loadingMagic || (!cvText.trim() && !analysis)}>
              {loadingMagic ? "Optimisation..." : "Generer mon CV Magic"}
            </button>
          </div>
        </div>
      </div>
      )}

      {mode !== "cv" && (
      <div>
        <div className="jobs-section-title">
          <div className="jobs-section-icon">&#128269;</div>
          <div>
            <h2>{jobQuery ? "Résultats pour \'" + jobQuery + "\'" : "Dernières offres"}</h2>
            <p>Offres réelles scrappées depuis le <a href="https://www.jobbank.gc.ca" target="_blank" rel="noopener noreferrer" style={{ color: "var(--cap-orange)" }}>Guichet Emplois Canada</a>.</p>
          </div>
        </div>
        <div className="jobs-search-bar">
          <div className="jobs-input-wrap">
            <span className="jobs-input-icon">&#128188;</span>
            <input type="text" className="jobs-input" placeholder="Poste (ex: Developpeur...)" value={jobQuery} onChange={e => setJobQuery(e.target.value)} />
          </div>
          <div className="jobs-input-wrap">
            <span className="jobs-input-icon">&#128205;</span>
            <input type="text" className="jobs-input" placeholder="Lieu (ex: Montreal...)" value={jobLocation} onChange={e => setJobLocation(e.target.value)} />
          </div>
          <button className="jobs-btn-search" onClick={() => handleJobSearch()} disabled={loadingJobs || !jobQuery.trim()}>
            {loadingJobs ? "Recherche..." : "Chercher"}
          </button>
        </div>
        {loadingJobs && jobs.length === 0 ? (
          <div className="jobs-loading">
            <span style={{ fontSize: "28px", animation: "spin 1s linear infinite", display: "inline-block" }}>&#9881;</span>
            <p>Recherche sur le Guichet Emplois Canada...</p>
          </div>
        ) : (
          <div className="jobs-grid">
            {jobs.map(function(job) {
              return (
                <div key={job.id} className="jobs-job-card">
                  <div className="jobs-job-top">
                    <div style={{ flex: 1 }}>
                      <h3 className="jobs-job-title">{job.title}</h3>
                      <p className="jobs-job-company">&#127970; {job.company}</p>
                    </div>
                    <a href={job.url_officielle} target="_blank" rel="noopener noreferrer" className="jobs-job-ext" title="Voir l'offre">&#8599;</a>
                  </div>
                  <p className="jobs-job-desc">{job.description_short}</p>
                  <div className="jobs-job-footer">
                    <span className="jobs-job-meta">&#128205; {job.location}</span>
                    {job.salary && <span className="jobs-job-meta jobs-job-salary">&#128176; {job.salary}</span>}
                    <div className="jobs-job-actions">
                      <button className="jobs-btn-optimize" onClick={() => handleOptimizeForJob(job.title)}>Optimiser mon CV</button>
                      <a href={job.url_officielle} target="_blank" rel="noopener noreferrer" className="jobs-btn-postuler">Postuler</a>
                    </div>
                  </div>
                </div>
              );
            })}
            {!loadingJobs && jobs.length === 0 && (
              <div className="jobs-empty">
                <p>Aucune offre trouvée. Essayez un autre mot-clé ou lieu.</p>
                <a href="https://www.jobbank.gc.ca/jobsearch/jobsearch" target="_blank" rel="noopener noreferrer" style={{ color: "var(--cap-orange)", fontWeight: "700", fontSize: "13px" }}>&#8599; Parcourir le Guichet Emplois</a>
              </div>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
