import React, { useState, useEffect, useRef } from "react";
import { Briefcase, Search, Upload, FileText, Sparkles, CheckCircle2, MapPin, Building2, ExternalLink, Loader2, DollarSign, FileUp, X, Wand2, Layout, Copy, Check, Eye, Download, UserCircle2 } from "lucide-react";
import { geminiService } from "./services/geminiService";
import { dataService } from "./services/dataService";
import mammoth from "mammoth";
import html2pdf from "html2pdf.js";
import CVPreview from "./CVPreview";

const CV_TEMPLATES = [
  { id: "modern", name: "Moderne", color: "emerald", preview: "https://picsum.photos/seed/modern/400/500" },
  { id: "classic", name: "Classique", color: "blue", preview: "https://picsum.photos/seed/classic/400/500" },
  { id: "creative", name: "CrÃ©atif", color: "purple", preview: "https://picsum.photos/seed/creative/400/500" },
  { id: "minimal", name: "Minimaliste", color: "zinc", preview: "https://picsum.photos/seed/minimal/400/500" },
];

export default function Jobs() {
  const [cvText, setCvText] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [jobQuery, setJobQuery] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  const [optimizedCv, setOptimizedCv] = useState<any | null>(null);
  const [loadingMagic, setLoadingMagic] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(CV_TEMPLATES[0]);
  const [selectedModel, setSelectedModel] = useState("gemini-3-flash-preview");
  const [copied, setCopied] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const [globalProfile, setGlobalProfile] = useState<any>(null);

  useEffect(() => {
    // Load global profile and automatically search jobs
    const profile = dataService.getGlobalProfile();
    if (profile) {
      setGlobalProfile(profile);
      setAnalysis(profile.analysis);
      setCvText(profile.cvText || "");
      if (profile.analysis?.top_skills?.[0]) {
        handleJobSearch(profile.analysis.top_skills[0]);
      } else {
        handleJobSearch("*");
      }
    } else {
      handleJobSearch("*");
    }
  }, []);

  const cvMagicRef = useRef<HTMLDivElement>(null);

  const handleOptimizeForJob = (jobTitle: string) => {
    setJobQuery(jobTitle);
    cvMagicRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoadingAnalysis(true);
    setOptimizedCv(null); // Reset optimization on new file

    try {
      const reader = new FileReader();
      
      if (file.type === "application/pdf") {
        reader.onload = async () => {
          const base64 = (reader.result as string).split(",")[1];
          const res = await geminiService.analyzeCVFromFile(base64, "application/pdf");
          setAnalysis(res);
          
          // Save to global profile
          dataService.saveGlobalProfile({ analysis: res, cvText: "" });
          setGlobalProfile({ analysis: res, cvText: "" });

          if (res?.top_skills?.[0]) handleJobSearch(res.top_skills[0]);
          setLoadingAnalysis(false);
        };
        reader.readAsDataURL(file);
      } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setCvText(result.value);
        const res = await geminiService.analyzeCV(result.value);
        setAnalysis(res);
        
        // Save to global profile
        dataService.saveGlobalProfile({ analysis: res, cvText: result.value });
        setGlobalProfile({ analysis: res, cvText: result.value });

        if (res?.top_skills?.[0]) handleJobSearch(res.top_skills[0]);
        setLoadingAnalysis(false);
      } else if (file.type === "text/plain") {
        reader.onload = async () => {
          const text = reader.result as string;
          setCvText(text);
          const res = await geminiService.analyzeCV(text);
          setAnalysis(res);
          
          // Save to global profile
          dataService.saveGlobalProfile({ analysis: res, cvText: text });
          setGlobalProfile({ analysis: res, cvText: text });

          if (res?.top_skills?.[0]) handleJobSearch(res.top_skills[0]);
          setLoadingAnalysis(false);
        };
        reader.readAsText(file);
      } else {
        alert("Format non supportÃ©. Veuillez utiliser PDF, DOCX ou TXT.");
        setLoadingAnalysis(false);
      }
    } catch (error) {
      console.error("File processing error:", error);
      setLoadingAnalysis(false);
    }
  };

  const clearFile = () => {
    setFileName(null);
    setCvText("");
    setOptimizedCv(null);
    setAnalysis(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!cvText.trim()) return;
    setLoadingAnalysis(true);
    setOptimizedCv(null);
    try {
      const res = await geminiService.analyzeCV(cvText);
      setAnalysis(res);
      
      // Save to global profile
      dataService.saveGlobalProfile({ analysis: res, cvText });
      setGlobalProfile({ analysis: res, cvText });

      if (res && res.name) {
        handleJobSearch(res.top_skills[0] || "Emploi");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleMagicOptimize = async () => {
    const textToOptimize = cvText || (analysis ? `CV de ${analysis.name}` : "");
    if (!textToOptimize) return;

    setLoadingMagic(true);
    try {
      const res = await geminiService.optimizeCV(
        textToOptimize, 
        analysis?.suggestions, 
        jobQuery,
        selectedModel
      );
      setOptimizedCv(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMagic(false);
    }
  };

  const copyToClipboard = () => {
    if (!optimizedCv) return;
    const text = JSON.stringify(optimizedCv, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('cv-preview-container');
    if (!element) return;
    
    const opt: any = {
      margin:       0,
      filename:     `CV_${analysis?.name?.replace(/\s+/g, '_') || 'Optimise'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  const handleJobSearch = async (query?: string) => {
    const q = query || jobQuery;
    if (!q.trim()) return;
    
    setLoadingJobs(true);
    try {
      const results = await geminiService.searchJobs(q, jobLocation);
      setJobs(results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingJobs(false);
    }
  };

  return (
    <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black tracking-tighter uppercase mb-2 text-[#0a1628]">CarriÃ¨re & Emploi</h1>
        <p className="text-slate-500">OpportunitÃ©s rÃ©elles synchronisÃ©es avec le Guichet Emplois Canada et votre profil.</p>
      </div>

      {globalProfile ? (
        <div className="bg-[#e87722]/10 border border-[#e87722]/20 p-6 rounded-3xl mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#e87722]/20 text-[#e87722] rounded-full flex items-center justify-center">
              <UserCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#e87722]">Profil Actif : {globalProfile.analysis?.name || "Candidat"}</h3>
              <p className="text-sm text-slate-600">Vos offres sont automatiquement filtrÃ©es selon vos compÃ©tences.</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setGlobalProfile(null);
              clearFile();
            }}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors"
          >
            Mettre Ã  jour le profil
          </button>
        </div>
      ) : null}

      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 ${globalProfile ? 'hidden' : ''}`}>
        {/* CV Input */}
        <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#e87722]/10 rounded-lg text-[#e87722]">
                <Upload className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold">Analyse de CV par IA</h2>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#e87722] hover:text-[#0a1628] transition-colors"
            >
              <FileUp className="w-4 h-4" />
              Importer PDF/Word
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,.txt"
              className="hidden"
            />
          </div>
          
          {fileName ? (
            <div className="w-full h-64 bg-black/50 border border-[#e87722]/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center mb-6 relative group">
              <button 
                onClick={clearFile}
                className="absolute top-4 right-4 p-2 bg-slate-50 rounded-full hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-16 h-16 bg-[#e87722]/10 rounded-2xl flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-[#e87722]" />
              </div>
              <p className="font-bold text-[#e87722] mb-1">{fileName}</p>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-black">Fichier prÃªt pour l'analyse</p>
            </div>
          ) : (
            <textarea 
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              placeholder="Collez le texte de votre CV ici ou importez un fichier..."
              className="w-full h-64 bg-black/50 border border-slate-200 rounded-2xl p-6 text-sm focus:border-[#e87722] outline-none resize-none mb-6"
            />
          )}

          <button 
            onClick={handleAnalyze}
            disabled={loadingAnalysis || (!cvText.trim() && !fileName)}
            className="w-full bg-[#e87722] text-white py-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loadingAnalysis ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analyser mon profil"}
            <Sparkles className="w-4 h-4" />
          </button>
        </div>

        {/* Analysis Result */}
        <div className="bg-white border border-slate-200 p-8 rounded-3xl min-h-[400px] flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">Diagnostic CarriÃ¨re</h2>
          </div>

          {!analysis ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-600">
              <FileText className="w-16 h-16 mb-4 opacity-20" />
              <p>Analysez votre CV pour voir les recommandations personnalisÃ©es.</p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Candidat</div>
                  <div className="text-2xl font-black">{analysis.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#e87722] mb-1">CompatibilitÃ©</div>
                  <div className="text-3xl font-black text-[#e87722]">{analysis.compatibility_score}%</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">ExpÃ©rience</div>
                  <div className="text-lg font-bold">{analysis.experience_years} ans</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Programmes suggÃ©rÃ©s</div>
                  <div className="flex flex-wrap gap-1">
                    {analysis.recommended_programs.map((p: string) => (
                      <span key={p} className="text-[8px] font-black bg-[#e87722]/10 text-[#e87722] px-1.5 py-0.5 rounded uppercase">{p}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">CompÃ©tences clÃ©s</div>
                <div className="flex flex-wrap gap-2">
                  {analysis.top_skills.map((s: string) => (
                    <span key={s} className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium">{s}</span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-[#e87722]/5 border border-[#e87722]/20 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-[#e87722]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#e87722]">Suggestions IA</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{analysis.suggestions}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CV MAGIC Section */}
      <div className="mb-16" ref={cvMagicRef}>
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-[#e87722]/10 rounded-2xl text-[#e87722]">
            <Wand2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tighter uppercase">CV MAGIC</h2>
            <p className="text-slate-500">Optimisez votre CV pour le marchÃ© canadien et choisissez un template professionnel.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Templates Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Layout className="w-4 h-4 text-[#e87722]" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">1. Choisissez un Template</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {CV_TEMPLATES.map(t => (
                <button 
                  key={t.id}
                  onClick={() => setSelectedTemplate(t)}
                  className={`relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all ${selectedTemplate.id === t.id ? 'border-[#e87722] scale-[1.02]' : 'border-slate-100 hover:border-slate-300'}`}
                >
                  <img src={t.preview} alt={t.name} className="w-full h-full object-cover opacity-50" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                    <span className="text-xs font-bold uppercase tracking-widest">{t.name}</span>
                  </div>
                  {selectedTemplate.id === t.id && (
                    <div className="absolute top-2 right-2 bg-[#e87722] p-1 rounded-full">
                      <Check className="w-3 h-3 text-[#0a1628]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Optimization & Preview */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-8 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#e87722]" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">2. Optimisation IA</span>
                </div>
                {analysis?.suggestions && (
                  <span className="text-[10px] text-[#e87722] font-bold uppercase tracking-tighter">Suggestions IA liÃ©es</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <select 
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-black/50 border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:border-[#e87722]"
                >
                  <option value="gemini-3-flash-preview">Gemini Flash (Rapide)</option>
                  <option value="gemini-3.1-pro-preview">Gemini Pro (QualitÃ©)</option>
                </select>
                {optimizedCv && (
                  <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-[#0a1628] transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-[#e87722]" /> : <Copy className="w-3 h-3" />}
                    {copied ? "CopiÃ© !" : "Copier"}
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 bg-black/30 border border-slate-100 rounded-2xl p-6 overflow-y-auto max-h-[800px] mb-6 custom-scrollbar">
              {loadingMagic ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#e87722]" />
                  <p className="text-xs font-black uppercase tracking-widest">Magie en cours...</p>
                </div>
              ) : optimizedCv ? (
                <div className="relative">
                  <div className="absolute top-0 right-0 flex gap-2 z-10">
                    <button 
                      onClick={() => setShowRawText(!showRawText)}
                      className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all text-[#0a1628]"
                      title="Voir le texte brut"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={handleDownloadPDF}
                      className="p-2 bg-[#e87722] text-white rounded-lg hover:bg-[#e87722]/90 transition-all text-[#0a1628]"
                      title="TÃ©lÃ©charger PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {showRawText ? (
                    <pre className="text-[10px] text-slate-600 font-mono whitespace-pre-wrap bg-black/50 p-4 rounded-xl">
                      {JSON.stringify(optimizedCv, null, 2)}
                    </pre>
                  ) : (
                    <div className="scale-[0.8] origin-top transform-gpu">
                      <div id="cv-preview-container" className="bg-white">
                        <CVPreview 
                          data={optimizedCv} 
                          templateId={selectedTemplate.id} 
                          onChange={(newData) => setOptimizedCv(newData)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-600">
                  <Wand2 className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm max-w-xs">Cliquez sur le bouton ci-dessous pour transformer votre CV en une version optimisÃ©e pour le Canada.</p>
                </div>
              )}
            </div>

            <button 
              onClick={handleMagicOptimize}
              disabled={loadingMagic || (!cvText.trim() && !analysis)}
              className="w-full bg-[#e87722] text-white py-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#e87722]/90"
            >
              {loadingMagic ? "Optimisation..." : "GÃ©nÃ©rer mon CV Magic"}
              <Wand2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Jobs Section */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
          <div>
            <h2 className="text-3xl font-black tracking-tighter uppercase mb-2">
              {jobQuery ? "RÃ©sultats de recherche" : "DerniÃ¨res offres"}
            </h2>
            <p className="text-slate-500">OpportunitÃ©s rÃ©elles synchronisÃ©es avec le Guichet Emplois Canada.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Poste (ex: DÃ©veloppeur...)"
                value={jobQuery}
                onChange={(e) => setJobQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-[#e87722] outline-none text-[#0a1628]"
              />
            </div>
            <div className="relative flex-1 md:w-48">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Lieu (ex: MontrÃ©al...)"
                value={jobLocation}
                onChange={(e) => setJobLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-[#e87722] outline-none text-[#0a1628]"
              />
            </div>
            <button 
              onClick={() => handleJobSearch()}
              disabled={loadingJobs || !jobQuery.trim()}
              className="bg-[#e87722] text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform disabled:opacity-50"
            >
              {loadingJobs ? <Loader2 className="w-4 h-4 animate-spin" /> : "Chercher"}
            </button>
          </div>
        </div>

        {loadingJobs && jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <Loader2 className="w-12 h-12 animate-spin mb-4 text-[#e87722]" />
            <p className="font-bold uppercase tracking-widest text-xs">Recherche des meilleures opportunitÃ©s...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map(job => (
              <div key={job.id} className="bg-white border border-slate-100 p-6 rounded-3xl hover:border-[#e87722]/30 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-[#0a1628] group-hover:text-[#e87722] transition-colors">{job.title}</h3>
                    <div className="flex items-center gap-2 text-slate-600 mt-1">
                      <Building2 className="w-4 h-4" />
                      <span className="text-sm font-medium">{job.company}</span>
                    </div>
                  </div>
                  <a 
                    href={job.url_officielle} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 bg-slate-50 rounded-xl hover:bg-[#e87722] hover:text-black transition-all"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
                
                <p className="text-sm text-slate-500 mb-6 line-clamp-2">{job.description_short}</p>
                
                <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-[#e87722]" />
                    {job.location}
                  </div>
                  {job.salary && (
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#e87722]">
                      <DollarSign className="w-3.5 h-3.5" />
                      {job.salary}
                    </div>
                  )}
                  <div className="ml-auto flex items-center gap-4">
                    <button 
                      onClick={() => handleOptimizeForJob(job.title)}
                      className="text-[10px] font-black uppercase tracking-widest text-[#e87722] hover:text-[#0a1628] transition-colors flex items-center gap-1.5"
                    >
                      <Wand2 className="w-3 h-3" />
                      Optimiser mon CV
                    </button>
                    <a 
                      href={job.url_officielle}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-black uppercase tracking-widest text-[#e87722] hover:underline"
                    >
                      Postuler
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loadingJobs && jobs.length === 0 && (
          <div className="text-center py-24 border-2 border-dashed border-slate-100 rounded-3xl text-gray-600">
            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Entrez un poste pour dÃ©couvrir les offres disponibles.</p>
          </div>
        )}
      </div>
    </div>
  );
}

