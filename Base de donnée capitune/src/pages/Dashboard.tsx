import { useState } from 'react';
import { CheckCircle2, Circle, ArrowRight, ExternalLink, AlertCircle, GraduationCap, Briefcase, Home } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const steps = [
  {
    id: 1,
    title: "Trouver un établissement",
    description: "Recherchez un programme d'études et un établissement désigné (EED).",
    status: "completed",
    link: "/education",
    action: "Rechercher une formation"
  },
  {
    id: 2,
    title: "Faire ma demande d'admission",
    description: "Préparez vos documents (passeport, diplômes) et soumettez votre candidature.",
    status: "in_progress",
    link: "/education", // Could be a specific sub-page
    action: "Voir la checklist documents"
  },
  {
    id: 3,
    title: "Ouvrir mon compte MIFI",
    description: "Créez votre compte sur Arrima pour le CAQ (Certificat d'Acceptation du Québec).",
    status: "pending",
    externalLink: "https://arrima.immigration-quebec.gouv.qc.ca",
    action: "Accéder à Arrima"
  },
  {
    id: 4,
    title: "Ouvrir mon compte IRCC",
    description: "Créez votre compte GCKey pour le permis d'études fédéral.",
    status: "pending",
    externalLink: "https://www.canada.ca",
    action: "Accéder à IRCC"
  },
  {
    id: 5,
    title: "Rédiger ma lettre explicative",
    description: "Générez une lettre de motivation solide pour votre demande.",
    status: "pending",
    link: "/letter",
    action: "Générer ma lettre"
  },
  {
    id: 6,
    title: "Préparer le budget",
    description: "Calculez les frais de visa, scolarité et subsistance.",
    status: "pending",
    link: "/budget",
    action: "Calculer mon budget"
  },
  {
    id: 7,
    title: "Biométrie & Décision",
    description: "Prenez rendez-vous pour la biométrie et attendez la décision finale.",
    status: "pending",
    action: "En savoir plus"
  }
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text">Mon projet Canada</h1>
        <p className="text-text-muted mt-2">Suivez l'avancement de vos démarches d'immigration étape par étape.</p>
      </div>

      {/* Market Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-primary p-6 rounded-2xl text-white shadow-lg shadow-primary/20">
          <div className="flex items-center gap-3 mb-2 opacity-80">
            <GraduationCap className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Formations</span>
          </div>
          <div className="text-4xl font-bold">1,542</div>
          <div className="text-sm mt-1 opacity-80">Établissements désignés (EED)</div>
        </div>
        <div className="bg-success p-6 rounded-2xl text-white shadow-lg shadow-success/20">
          <div className="flex items-center gap-3 mb-2 opacity-80">
            <Briefcase className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Emplois</span>
          </div>
          <div className="text-4xl font-bold">124,050</div>
          <div className="text-sm mt-1 opacity-80">Offres en temps réel</div>
        </div>
        <div className="bg-orange p-6 rounded-2xl text-white shadow-lg shadow-orange/20">
          <div className="flex items-center gap-3 mb-2 opacity-80">
            <Home className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Logements</span>
          </div>
          <div className="text-4xl font-bold">54,320</div>
          <div className="text-sm mt-1 opacity-80">Disponibles maintenant</div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-text">Progression globale</h2>
          <span className="text-primary font-bold">15%</span>
        </div>
        <div className="h-3 bg-bg-light rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '15%' }}
            className="h-full bg-primary rounded-full"
          />
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-warning/10 rounded-xl border border-warning/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-warning">Action requise</p>
              <p className="text-sm text-text-muted mt-1">Finalisez votre demande d'admission pour débloquer l'étape CAQ.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Steps Timeline */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "bg-surface p-6 rounded-2xl border transition-all duration-200",
              step.status === 'in_progress' 
                ? "border-primary/30 shadow-md ring-1 ring-primary/10" 
                : "border-border shadow-sm hover:border-text-muted/30"
            )}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex items-center gap-4 min-w-[200px]">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  step.status === 'completed' ? "bg-success/10 text-success" :
                  step.status === 'in_progress' ? "bg-primary/10 text-primary" :
                  "bg-bg-light text-text-muted"
                )}>
                  {step.status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : 
                   step.status === 'in_progress' ? <div className="w-3 h-3 bg-current rounded-full animate-ping" /> :
                   <span className="font-bold">{step.id}</span>}
                </div>
                <div>
                  <h3 className={cn("font-semibold", step.status === 'pending' ? "text-text-muted" : "text-text")}>
                    {step.title}
                  </h3>
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    step.status === 'completed' ? "bg-success/10 text-success" :
                    step.status === 'in_progress' ? "bg-primary/10 text-primary" :
                    "bg-bg-light text-text-muted"
                  )}>
                    {step.status === 'completed' ? 'Terminé' : 
                     step.status === 'in_progress' ? 'En cours' : 'En attente'}
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <p className="text-text-secondary text-sm">{step.description}</p>
              </div>

              <div className="flex shrink-0">
                {step.link ? (
                  <Link 
                    to={step.link}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      step.status === 'pending' 
                        ? "bg-bg-light text-text-muted cursor-not-allowed" 
                        : "bg-orange text-white hover:bg-orange-light"
                    )}
                  >
                    {step.action} <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : step.externalLink ? (
                  <a 
                    href={step.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      step.status === 'pending' 
                        ? "bg-bg-light text-text-muted cursor-not-allowed" 
                        : "bg-surface border border-border text-text hover:bg-bg-light"
                    )}
                  >
                    {step.action} <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <button disabled className="px-4 py-2 rounded-lg text-sm font-medium bg-bg-light text-text-muted cursor-not-allowed">
                    {step.action}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
