import React, { useState, useRef, useEffect } from "react";
import { 
  ChevronRight, 
  ShieldCheck, 
  Users, 
  CheckCircle2, 
  Brain, 
  FileText, 
  GraduationCap, 
  Calendar, 
  TrendingUp,
  ArrowRight,
  Play,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { IMMIGRATION_PROGRAMS, APP_TAGLINE } from "../constants";

// --- Components ---

const Ticker = () => (
  <div className="bg-primary py-3 overflow-hidden whitespace-nowrap border-y border-primary/80/20">
    <div className="flex animate-ticker">
      {[...IMMIGRATION_PROGRAMS, ...IMMIGRATION_PROGRAMS].map((item, i) => (
        <span key={i} className="text-black font-black uppercase text-sm tracking-widest mx-12 flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-black rounded-full" />
          {item}
        </span>
      ))}
    </div>
  </div>
);

const EligibilityCalculator = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const questions = [
    { q: "Quel est votre pays d'origine ?", options: ["France", "Maroc", "Sénégal", "Algérie", "Autre"] },
    { q: "Quel est votre plus haut niveau d'études ?", options: ["Doctorat", "Master", "Licence", "Secondaire", "Autre"] },
    { q: "Combien d'années d'expérience professionnelle ?", options: ["0-1 an", "1-3 ans", "3-5 ans", "5+ ans"] },
    { q: "Quel est votre niveau de langue (Français/Anglais) ?", options: ["Bilingue", "Avancé", "Intermédiaire", "Débutant"] }
  ];

  const handleAnswer = (ans: string) => {
    const newAnswers = [...answers, ans];
    setAnswers(newAnswers);
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setIsFinished(true);
    }
  };

  const getRecommendation = () => {
    if (answers[1] === "Doctorat" || answers[1] === "Master") return { title: "Entrée Express", color: "text-primary", tag: "Hautement Éligible" };
    if (answers[2] === "5+ ans") return { title: "PNP (Programme des Candidats des Provinces)", color: "text-blue-500", tag: "Profil Recherché" };
    return { title: "Permis de Travail / Études", color: "text-orange-500", tag: "Potentiel" };
  };

  return (
    <div className="bg-[#111] border border-white/5 rounded-3xl p-8 max-w-2xl mx-auto primary-glow">
      {!isFinished ? (
        <div>
          <div className="flex justify-between items-center mb-8">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Étape {step + 1} / {questions.length}</span>
            <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary" 
                initial={{ width: 0 }}
                animate={{ width: `${((step + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-6">{questions[step].q}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {questions[step].options.map(opt => (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                className="p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-primary hover:text-black transition-all text-left font-medium"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="text-primary w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Analyse terminée !</h3>
          <p className="text-gray-400 mb-8">Basé sur vos réponses, voici notre recommandation :</p>
          
          <div className="bg-white/5 p-6 rounded-2xl border border-white/5 mb-8">
            <span className={getRecommendation().color + " text-xs font-black uppercase tracking-widest mb-2 block"}>
              {getRecommendation().tag}
            </span>
            <h4 className="text-3xl font-black mb-4">{getRecommendation().title}</h4>
            <p className="text-sm text-gray-400">Ce programme semble le plus adapté à votre profil actuel. Connectez-vous avec un expert pour valider votre dossier.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-primary text-black px-8 py-4 rounded-xl font-bold hover:scale-105 transition-transform">
              Contacter un expert
            </button>
            <button 
              onClick={() => { setStep(0); setAnswers([]); setIsFinished(false); }}
              className="px-8 py-4 rounded-xl font-bold border border-white/10 hover:bg-white/5 transition-colors"
            >
              Recommencer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main View ---

export default function Landing() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-8"
          >
            <ShieldCheck className="w-4 h-4" />
            Immigration Canadienne — Plateforme Certifiée
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 text-white"
          >
            VOTRE IMMIGRATION.<br />
            <span className="text-primary">STRUCTURÉE.</span><br />
            SÉCURISÉE.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-gray-400 text-lg mb-10"
          >
            Connectez-vous aux meilleurs experts RCIC, gérez votre dossier de A à Z et accédez aux institutions DLI via notre écosystème intelligent.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <button className="w-full sm:w-auto bg-primary hover:bg-primary/80 text-black px-10 py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2">
              Commencer gratuitement
              <ChevronRight className="w-5 h-5" />
            </button>
            <button className="w-full sm:w-auto px-10 py-5 rounded-2xl font-black text-lg border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-2">
              <Play className="w-5 h-5 fill-current" />
              Voir la démo
            </button>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-8 text-gray-500"
          >
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Certifié RCIC
            </div>
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Dossiers AES-256
            </div>
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
              <Users className="w-4 h-4 text-primary" />
              500+ Experts
            </div>
          </motion.div>
        </div>
      </section>

      <Ticker />

      {/* Stats Bar */}
      <section className="py-12 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Projets", val: "10 000+" },
            { label: "Experts", val: "500+" },
            { label: "Satisfaction", val: "98%" },
            { label: "Délai", val: "48h" }
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-5xl font-black mb-1">{stat.val}</div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 uppercase text-white">Nos Services</h2>
            <p className="text-gray-400">Une suite d'outils puissants pour chaque étape de votre parcours.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: "Brain Match IA", tag: "Intelligence Artificielle", desc: "Algorithme de matching intelligent pour trouver le programme idéal." },
              { icon: FileText, title: "Dossier numérique", tag: "Sécurisé AES-256", desc: "Centralisez et sécurisez tous vos documents officiels." },
              { icon: Users, title: "Réseau certifié RCIC", tag: "Vérifié", desc: "Accès direct aux consultants réglementés en immigration canadienne." },
              { icon: GraduationCap, title: "Institutions DLI", tag: "1 526 DLI", desc: "Base de données complète des établissements d'enseignement désignés." },
              { icon: Calendar, title: "Événements", tag: "Communauté", desc: "Webinaires et sessions d'information en direct." },
              { icon: TrendingUp, title: "Marketplace", tag: "Partenaires vérifiés", desc: "Services bancaires, assurances et logement." }
            ].map((service, i) => (
              <div key={i} className="group p-8 bg-white/5 border border-white/5 rounded-3xl hover:border-primary/50 transition-all">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <service.icon className="text-primary w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2 block">{service.tag}</span>
                <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 px-6 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {[
              { step: "01", title: "Créez votre profil", desc: "Remplissez vos informations de base en quelques minutes." },
              { step: "02", title: "Évaluez votre éligibilité", desc: "Utilisez notre IA pour découvrir vos options." },
              { step: "03", title: "Connectez un expert", desc: "Choisissez parmi nos consultants certifiés RCIC." },
              { step: "04", title: "Soumettez votre dossier", desc: "Laissez-nous gérer la complexité administrative." }
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-6xl font-black text-white/5 mb-4">{item.step}</div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
                {i < 3 && <div className="hidden md:block absolute top-8 -right-6 text-primary/20"><ArrowRight /></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eligibility Calculator */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 uppercase text-white">Calculateur d'éligibilité</h2>
            <p className="text-gray-400">Découvrez vos chances d'immigration en moins de 2 minutes.</p>
          </div>
          <EligibilityCalculator />
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 uppercase text-white">Témoignages</h2>
            <p className="text-gray-400">Ils ont réussi leur projet avec CAPITUNE.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Amira B.", origin: "Maroc", text: "Grâce à l'analyse IA, j'ai pu cibler le bon programme PNP en moins d'une semaine." },
              { name: "Carlos M.", origin: "Brésil", text: "Le dossier numérique sécurisé m'a permis de tout centraliser sans stress." },
              { name: "Fatou D.", origin: "Sénégal", text: "L'expert RCIC qui m'a été assigné était d'un professionnalisme exemplaire." }
            ].map((t, i) => (
              <div key={i} className="p-8 bg-white/5 border border-white/5 rounded-3xl italic text-gray-400">
                <p className="mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3 not-italic">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{t.name}</div>
                    <div className="text-[10px] uppercase tracking-widest font-black text-primary/50">{t.origin}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-2 text-white">Ressources</h2>
              <p className="text-gray-400">Les dernières actualités sur l'immigration canadienne.</p>
            </div>
            <button className="hidden md:flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs">
              Voir tout le blog
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Entrée Express 2025 — Nouvelles règles", time: "5 min", cat: "Officiel" },
              { title: "Permis de travail ouvert Québec", time: "8 min", cat: "Guide" },
              { title: "PEQ : Ce qui change en 2025", time: "6 min", cat: "Annonce" }
            ].map((post, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="aspect-video bg-white/5 rounded-3xl mb-6 overflow-hidden border border-white/5 relative">
                  <img 
                    src={`https://picsum.photos/seed/blog${i}/800/450`} 
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 bg-primary text-black px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    {post.cat}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{post.title}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-bold uppercase tracking-widest">
                  <Clock className="w-3 h-3" />
                  {post.time} de lecture
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 uppercase text-white">Commencez votre parcours aujourd'hui.</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto bg-primary text-black px-10 py-5 rounded-2xl font-black text-lg hover:scale-105 transition-transform">
              Créer mon compte
            </button>
            <button className="w-full sm:w-auto px-10 py-5 rounded-2xl font-black text-lg border border-white/10 hover:bg-white/5 transition-all">
              Parler à un expert
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
