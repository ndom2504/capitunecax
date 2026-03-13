import React, { useState } from "react";
import { 
  User, 
  MapPin, 
  Users, 
  GraduationCap, 
  Briefcase, 
  Globe, 
  Target, 
  Wallet, 
  FileCheck,
  ChevronRight,
  ChevronLeft,
  Save,
  Plus,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { dataService } from "../services/dataService";

const ALL_STEPS = [
  { id: "project", label: "Projet", icon: Target },
  { id: "identity", label: "Identité", icon: User },
  { id: "contact", label: "Contact", icon: MapPin },
  { id: "family", label: "Famille", icon: Users },
  { id: "education", label: "Formation", icon: GraduationCap },
  { id: "experience", label: "Expérience", icon: Briefcase },
  { id: "languages", label: "Langues", icon: Globe },
  { id: "goals", label: "Objectifs", icon: Target },
  { id: "finances", label: "Finances", icon: Wallet },
  { id: "documents", label: "Documents", icon: FileCheck },
];

const COUNTRIES = ["France", "Maroc", "Sénégal", "Algérie", "Cameroun", "Côte d'Ivoire", "Tunisie", "Belgique", "Suisse", "Canada", "Autre"];
const NATIONALITIES = ["Française", "Marocaine", "Sénégalaise", "Algérienne", "Camerounaise", "Ivoirienne", "Tunisienne", "Belge", "Suisse", "Canadienne", "Autre"];
const CITIES = {
  "France": ["Paris", "Lyon", "Marseille", "Bordeaux", "Lille"],
  "Maroc": ["Casablanca", "Rabat", "Marrakech", "Tanger", "Fès"],
  "Sénégal": ["Dakar", "Thiès", "Saint-Louis", "Ziguinchor"],
  "Algérie": ["Alger", "Oran", "Constantine", "Annaba"],
  "Canada": ["Montréal", "Toronto", "Vancouver", "Québec", "Ottawa"]
};

export default function Dossier() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({
    project: {
      type: "solo",
      motive: "",
      summary: ""
    },
    identity: {},
    contact: {},
    family: { members: [] },
    education: {},
    experience: {},
    languages: {},
    goals: {},
    finances: {},
    documents: {}
  });

  // Dynamic steps based on project definition
  const getVisibleSteps = () => {
    return ALL_STEPS.filter(step => {
      const { type, motive } = formData.project;
      
      if (step.id === "family" && type === "solo") return false;
      
      // For "Visit", we might skip Education, Experience, Languages
      if (motive === "visit") {
        if (["education", "experience", "languages"].includes(step.id)) return false;
      }
      
      // For "Asylum", maybe skip some too?
      if (motive === "asylum") {
        if (["education", "experience", "goals"].includes(step.id)) return false;
      }

      return true;
    });
  };

  const visibleSteps = getVisibleSteps();
  const currentStepData = visibleSteps[currentStep] || visibleSteps[0];

  // Reset step if it goes out of bounds when filters change
  React.useEffect(() => {
    if (currentStep >= visibleSteps.length) {
      setCurrentStep(Math.max(0, visibleSteps.length - 1));
    }
  }, [visibleSteps.length, currentStep]);

  const handleInputChange = (stepId: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        [field]: value
      }
    }));
  };

  const addFamilyMember = () => {
    const newMember = { id: Math.random().toString(36).substring(7), name: "", relationship: "", age: "" };
    setFormData((prev: any) => ({
      ...prev,
      family: {
        ...prev.family,
        members: [...(prev.family.members || []), newMember]
      }
    }));
  };

  const removeFamilyMember = (id: string) => {
    setFormData((prev: any) => ({
      ...prev,
      family: {
        ...prev.family,
        members: prev.family.members.filter((m: any) => m.id !== id)
      }
    }));
  };

  const updateFamilyMember = (id: string, field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      family: {
        ...prev.family,
        members: prev.family.members.map((m: any) => m.id === id ? { ...m, [field]: value } : m)
      }
    }));
  };

  const handleNext = () => {
    if (currentStep < visibleSteps.length - 1) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const renderStepContent = () => {
    const step = currentStepData;
    const data = formData[step.id] || {};

    return (
      <motion.div
        key={step.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary">
            <step.icon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-white">{step.label}</h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Étape {currentStep + 1} sur {visibleSteps.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {step.id === "project" && (
            <>
              <div className="space-y-2 col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Type de projet</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleInputChange("project", "type", "solo")}
                    className={`p-4 rounded-2xl border transition-all text-left ${formData.project.type === "solo" ? "bg-primary/10 border-primary text-primary" : "bg-white/5 border-white/10 text-gray-500 hover:border-white/20"}`}
                  >
                    <User className="w-5 h-5 mb-2" />
                    <div className="font-bold text-sm uppercase tracking-tight">Projet Solo</div>
                    <div className="text-[10px] opacity-60">Je pars seul(e)</div>
                  </button>
                  <button 
                    onClick={() => handleInputChange("project", "type", "family")}
                    className={`p-4 rounded-2xl border transition-all text-left ${formData.project.type === "family" ? "bg-primary/10 border-primary text-primary" : "bg-white/5 border-white/10 text-gray-500 hover:border-white/20"}`}
                  >
                    <Users className="w-5 h-5 mb-2" />
                    <div className="font-bold text-sm uppercase tracking-tight">Projet Familial</div>
                    <div className="text-[10px] opacity-60">Je pars avec ma famille</div>
                  </button>
                </div>
              </div>

              <div className="space-y-2 col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Motif du voyage / Immigration</label>
                <select 
                  value={formData.project.motive || ""}
                  onChange={(e) => handleInputChange("project", "motive", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none text-white appearance-none"
                >
                  <option value="" className="bg-[#111]">Sélectionner un motif</option>
                  <option value="visit" className="bg-[#111]">Visite / Tourisme</option>
                  <option value="study" className="bg-[#111]">Permis d'études</option>
                  <option value="work" className="bg-[#111]">Permis de travail</option>
                  <option value="express" className="bg-[#111]">Entrée Express</option>
                  <option value="asylum" className="bg-[#111]">Asile / Réfugié</option>
                  <option value="sponsorship" className="bg-[#111]">Parrainage</option>
                  <option value="other" className="bg-[#111]">Autre</option>
                </select>
              </div>

              <div className="space-y-2 col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Résumé du projet</label>
                <textarea 
                  value={formData.project.summary || ""}
                  onChange={(e) => handleInputChange("project", "summary", e.target.value)}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none text-white resize-none" 
                  placeholder="Décrivez brièvement votre projet d'immigration..." 
                />
              </div>
            </>
          )}

          {step.id === "identity" && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Prénom</label>
                <input 
                  type="text" 
                  value={data.firstName || ""}
                  onChange={(e) => handleInputChange("identity", "firstName", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none text-white" 
                  placeholder="Jean" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Nom</label>
                <input 
                  type="text" 
                  value={data.lastName || ""}
                  onChange={(e) => handleInputChange("identity", "lastName", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none text-white" 
                  placeholder="Dupont" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Date de naissance</label>
                <input 
                  type="date" 
                  value={data.birthDate || ""}
                  onChange={(e) => handleInputChange("identity", "birthDate", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none text-white [color-scheme:dark]" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Sexe</label>
                <select 
                  value={data.gender || ""}
                  onChange={(e) => handleInputChange("identity", "gender", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none text-white appearance-none"
                >
                  <option value="" className="bg-[#111]">Sélectionner</option>
                  <option value="M" className="bg-[#111]">Masculin</option>
                  <option value="F" className="bg-[#111]">Féminin</option>
                  <option value="O" className="bg-[#111]">Autre</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Nationalité</label>
                <select 
                  value={data.nationality || ""}
                  onChange={(e) => handleInputChange("identity", "nationality", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none text-white appearance-none"
                >
                  <option value="" className="bg-[#111]">Sélectionner</option>
                  {NATIONALITIES.map(n => <option key={n} value={n} className="bg-[#111]">{n}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">État civil</label>
                <select 
                  value={data.maritalStatus || ""}
                  onChange={(e) => handleInputChange("identity", "maritalStatus", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none text-white appearance-none"
                >
                  <option value="" className="bg-[#111]">Sélectionner</option>
                  <option value="single" className="bg-[#111]">Célibataire</option>
                  <option value="married" className="bg-[#111]">Marié(e)</option>
                  <option value="common-law" className="bg-[#111]">Conjoint de fait</option>
                  <option value="divorced" className="bg-[#111]">Divorcé(e)</option>
                </select>
              </div>
            </>
          )}

          {step.id === "contact" && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Email</label>
                <input 
                  type="email" 
                  value={data.email || ""}
                  onChange={(e) => handleInputChange("contact", "email", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none text-white" 
                  placeholder="jean.dupont@exemple.com" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Téléphone</label>
                <input 
                  type="tel" 
                  value={data.phone || ""}
                  onChange={(e) => handleInputChange("contact", "phone", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none text-white" 
                  placeholder="+33 6 12 34 56 78" 
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Adresse</label>
                <input 
                  type="text" 
                  value={data.address || ""}
                  onChange={(e) => handleInputChange("contact", "address", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none text-white" 
                  placeholder="123 Rue de la Paix" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Pays de résidence</label>
                <select 
                  value={data.country || ""}
                  onChange={(e) => {
                    handleInputChange("contact", "country", e.target.value);
                    handleInputChange("contact", "city", ""); // Reset city
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none text-white appearance-none"
                >
                  <option value="" className="bg-[#111]">Sélectionner</option>
                  {COUNTRIES.map(c => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Ville</label>
                {data.country && CITIES[data.country as keyof typeof CITIES] ? (
                  <select 
                    value={data.city || ""}
                    onChange={(e) => handleInputChange("contact", "city", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none text-white appearance-none"
                  >
                    <option value="" className="bg-[#111]">Sélectionner</option>
                    {CITIES[data.country as keyof typeof CITIES].map(city => (
                      <option key={city} value={city} className="bg-[#111]">{city}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    value={data.city || ""}
                    onChange={(e) => handleInputChange("contact", "city", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none text-white" 
                    placeholder="Ville" 
                  />
                )}
              </div>
            </>
          )}

          {step.id === "family" && (
            <div className="col-span-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Nombre d'enfants</label>
                  <input 
                    type="number" 
                    value={data.childrenCount || 0}
                    onChange={(e) => handleInputChange("family", "childrenCount", parseInt(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none text-white" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Accompagné par un conjoint ?</label>
                  <select 
                    value={data.withSpouse ? "yes" : "no"}
                    onChange={(e) => handleInputChange("family", "withSpouse", e.target.value === "yes")}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none text-white appearance-none"
                  >
                    <option value="no" className="bg-[#111]">Non</option>
                    <option value="yes" className="bg-[#111]">Oui</option>
                  </select>
                </div>
              </div>

              <div className="pt-8 border-t border-white/5">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold uppercase tracking-tight text-white">Dossier Groupe / Famille</h3>
                    <p className="text-xs text-gray-500">Ajoutez les membres de votre famille qui vous accompagnent.</p>
                  </div>
                  <button 
                    onClick={addFamilyMember}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter un membre
                  </button>
                </div>

                <div className="space-y-4">
                  {data.members?.map((member: any, index: number) => (
                    <div key={member.id} className="bg-white/5 border border-white/10 p-6 rounded-2xl relative group">
                      <button 
                        onClick={() => removeFamilyMember(member.id)}
                        className="absolute top-4 right-4 text-gray-600 hover:text-rose-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Nom complet</label>
                          <input 
                            type="text" 
                            value={member.name}
                            onChange={(e) => updateFamilyMember(member.id, "name", e.target.value)}
                            className="w-full bg-black/30 border border-white/5 rounded-xl py-2 px-4 text-sm focus:border-primary outline-none text-white"
                            placeholder="Nom du membre"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Lien de parenté</label>
                          <select 
                            value={member.relationship}
                            onChange={(e) => updateFamilyMember(member.id, "relationship", e.target.value)}
                            className="w-full bg-black/30 border border-white/5 rounded-xl py-2 px-4 text-sm focus:border-primary outline-none text-white appearance-none"
                          >
                            <option value="" className="bg-[#111]">Sélectionner</option>
                            <option value="spouse" className="bg-[#111]">Conjoint(e)</option>
                            <option value="child" className="bg-[#111]">Enfant</option>
                            <option value="parent" className="bg-[#111]">Parent</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Âge</label>
                          <input 
                            type="number" 
                            value={member.age}
                            onChange={(e) => updateFamilyMember(member.id, "age", e.target.value)}
                            className="w-full bg-black/30 border border-white/5 rounded-xl py-2 px-4 text-sm focus:border-primary outline-none text-white"
                            placeholder="Âge"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!data.members || data.members.length === 0) && (
                    <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-3xl text-gray-600">
                      Aucun membre de la famille ajouté pour le moment.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step.id === "education" && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Plus haut diplôme</label>
                <select 
                  value={data.degree || ""}
                  onChange={(e) => handleInputChange("education", "degree", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none text-white appearance-none"
                >
                  <option value="" className="bg-[#111]">Sélectionner</option>
                  <option value="doctorate" className="bg-[#111]">Doctorat</option>
                  <option value="master" className="bg-[#111]">Master / Maîtrise</option>
                  <option value="bachelor" className="bg-[#111]">Licence / Baccalauréat</option>
                  <option value="college" className="bg-[#111]">Diplôme collégial</option>
                  <option value="high-school" className="bg-[#111]">Études secondaires</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Domaine d'études</label>
                <input 
                  type="text" 
                  value={data.fieldOfStudy || ""}
                  onChange={(e) => handleInputChange("education", "fieldOfStudy", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none text-white" 
                  placeholder="Informatique, Gestion, etc." 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Institution</label>
                <input 
                  type="text" 
                  value={data.institution || ""}
                  onChange={(e) => handleInputChange("education", "institution", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none text-white" 
                  placeholder="Université de Paris" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Année d'obtention</label>
                <input 
                  type="number" 
                  value={data.graduationYear || ""}
                  onChange={(e) => handleInputChange("education", "graduationYear", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none text-white" 
                  placeholder="2020" 
                />
              </div>
            </>
          )}

          {step.id === "experience" && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Poste actuel</label>
                <input 
                  type="text" 
                  value={data.currentJob || ""}
                  onChange={(e) => handleInputChange("experience", "currentJob", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none text-white" 
                  placeholder="Développeur Fullstack" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Années d'expérience</label>
                <input 
                  type="number" 
                  value={data.yearsOfExperience || 0}
                  onChange={(e) => handleInputChange("experience", "yearsOfExperience", parseInt(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none text-white" 
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Secteur d'activité</label>
                <select 
                  value={data.industry || ""}
                  onChange={(e) => handleInputChange("experience", "industry", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none text-white appearance-none"
                >
                  <option value="" className="bg-[#111]">Sélectionner</option>
                  <option value="it" className="bg-[#111]">Technologies de l'information</option>
                  <option value="health" className="bg-[#111]">Santé</option>
                  <option value="finance" className="bg-[#111]">Finance / Banque</option>
                  <option value="education" className="bg-[#111]">Éducation</option>
                  <option value="construction" className="bg-[#111]">Construction</option>
                  <option value="other" className="bg-[#111]">Autre</option>
                </select>
              </div>
            </>
          )}

          {step.id === "languages" && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Niveau de Français (NCLC)</label>
                <select 
                  value={data.frenchLevel || ""}
                  onChange={(e) => handleInputChange("languages", "frenchLevel", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none text-white appearance-none"
                >
                  <option value="" className="bg-[#111]">Sélectionner</option>
                  <option value="10" className="bg-[#111]">NCLC 10+</option>
                  <option value="9" className="bg-[#111]">NCLC 9</option>
                  <option value="8" className="bg-[#111]">NCLC 8</option>
                  <option value="7" className="bg-[#111]">NCLC 7</option>
                  <option value="6" className="bg-[#111]">NCLC 6 et moins</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Niveau d'Anglais (CLB)</label>
                <select 
                  value={data.englishLevel || ""}
                  onChange={(e) => handleInputChange("languages", "englishLevel", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none text-white appearance-none"
                >
                  <option value="" className="bg-[#111]">Sélectionner</option>
                  <option value="10" className="bg-[#111]">CLB 10+</option>
                  <option value="9" className="bg-[#111]">CLB 9</option>
                  <option value="8" className="bg-[#111]">CLB 8</option>
                  <option value="7" className="bg-[#111]">CLB 7</option>
                  <option value="6" className="bg-[#111]">CLB 6 et moins</option>
                </select>
              </div>
            </>
          )}

          {step.id === "goals" && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Province de destination</label>
                <select 
                  value={data.targetProvince || ""}
                  onChange={(e) => handleInputChange("goals", "targetProvince", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none text-white appearance-none"
                >
                  <option value="" className="bg-[#111]">Sélectionner</option>
                  <option value="QC" className="bg-[#111]">Québec</option>
                  <option value="ON" className="bg-[#111]">Ontario</option>
                  <option value="BC" className="bg-[#111]">Colombie-Britannique</option>
                  <option value="AB" className="bg-[#111]">Alberta</option>
                  <option value="NS" className="bg-[#111]">Nouvelle-Écosse</option>
                  <option value="NB" className="bg-[#111]">Nouveau-Brunswick</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Programme visé</label>
                <select 
                  value={data.targetProgram || ""}
                  onChange={(e) => handleInputChange("goals", "targetProgram", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none text-white appearance-none"
                >
                  <option value="" className="bg-[#111]">Sélectionner</option>
                  <option value="ee" className="bg-[#111]">Entrée Express</option>
                  <option value="pnp" className="bg-[#111]">Candidats des Provinces (PNP)</option>
                  <option value="peq" className="bg-[#111]">PEQ (Québec)</option>
                  <option value="study" className="bg-[#111]">Permis d'études</option>
                  <option value="work" className="bg-[#111]">Permis de travail</option>
                </select>
              </div>
            </>
          )}

          {step.id === "finances" && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Fonds disponibles (CAD)</label>
                <input 
                  type="number" 
                  value={data.availableFunds || 0}
                  onChange={(e) => handleInputChange("finances", "availableFunds", parseInt(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none text-white" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Preuve de fonds prête ?</label>
                <select 
                  value={data.proofReady ? "yes" : "no"}
                  onChange={(e) => handleInputChange("finances", "proofReady", e.target.value === "yes")}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none text-white appearance-none"
                >
                  <option value="no" className="bg-[#111]">Non</option>
                  <option value="yes" className="bg-[#111]">Oui</option>
                </select>
              </div>
            </>
          )}

          {step.id === "documents" && (
            <div className="col-span-2 space-y-8">
              {/* Main Applicant Documents */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest text-primary">Documents - Candidat Principal</h3>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-md font-bold uppercase">Requis pour {formData.project.motive || "votre projet"}</span>
                </div>
                {[
                  { label: "Passeport (Page d'identité)", id: "passport", motives: ["all"] },
                  { label: "Curriculum Vitae (CV)", id: "cv", motives: ["work", "express", "study"] },
                  { label: "Diplômes et Relevés de notes", id: "diplomas", motives: ["work", "express", "study"] },
                  { label: "Résultats de tests de langue", id: "languageTests", motives: ["express", "study", "work"] },
                  { label: "Preuve de fonds (Relevés bancaires)", id: "funds", motives: ["visit", "study", "work", "express"] },
                  { label: "Lettre d'invitation / Admission", id: "invitation", motives: ["visit", "study"] },
                  { label: "Offre d'emploi / LMIA", id: "jobOffer", motives: ["work"] },
                  { label: "Certificat de police", id: "police", motives: ["express", "work", "study"] },
                ].filter(doc => {
                  const motive = formData.project.motive;
                  if (doc.motives.includes("all")) return true;
                  return doc.motives.includes(motive);
                }).map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl group hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded-lg group-hover:bg-primary/10 transition-colors">
                        <FileCheck className="w-4 h-4 text-gray-400 group-hover:text-primary" />
                      </div>
                      <span className="text-sm font-medium">{doc.label}</span>
                    </div>
                    <button className="px-4 py-2 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-primary/20 transition-all">
                      Télécharger
                    </button>
                  </div>
                ))}
              </div>

              {/* Family Members Documents */}
              {formData.project.type === "family" && formData.family.members?.length > 0 && (
                <div className="space-y-6 pt-8 border-t border-white/5">
                  <h3 className="text-sm font-black uppercase tracking-widest text-primary">Documents - Membres de la famille</h3>
                  {formData.family.members.map((member: any) => (
                    <div key={member.id} className="space-y-3 p-6 bg-white/5 border border-white/10 rounded-3xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-bold text-white uppercase tracking-tight">{member.name || "Membre sans nom"}</div>
                        <div className="text-[10px] text-gray-500 uppercase font-black">{member.relationship} • {member.age} ans</div>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {[
                          { label: `Passeport - ${member.name || "Membre"}`, id: `passport_${member.id}` },
                          { label: `Acte de naissance - ${member.name || "Membre"}`, id: `birth_${member.id}` },
                          { label: `Certificat de mariage (si conjoint)`, id: `marriage_${member.id}`, relationship: "spouse" },
                        ].filter(doc => {
                          if (doc.relationship && member.relationship !== doc.relationship) return false;
                          return true;
                        }).map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-black/20 border border-white/5 rounded-xl group hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-3">
                              <FileCheck className="w-4 h-4 text-gray-600 group-hover:text-primary" />
                              <span className="text-xs font-medium">{doc.label}</span>
                            </div>
                            <button className="px-3 py-1.5 bg-white/5 text-gray-400 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-white/10 transition-all">
                              Télécharger
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1 space-y-2">
          {visibleSteps.map((step, i) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(i)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                currentStep === i 
                  ? "bg-primary text-black font-bold" 
                  : i < currentStep 
                    ? "text-primary bg-primary/5" 
                    : "text-gray-500 hover:bg-white/5"
              }`}
            >
              <step.icon className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-tight">{step.label}</span>
              {i < currentStep && <FileCheck className="w-4 h-4 ml-auto" />}
            </button>
          ))}
          
          <div className="mt-8 p-6 bg-primary/10 border border-primary/20 rounded-3xl">
            <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Score Crédibilité</div>
            <div className="text-3xl font-black mb-1">75%</div>
            <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-3/4" />
            </div>
          </div>
        </div>

        {/* Main Form Area */}
        <div className="lg:col-span-3 bg-[#111] border border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden primary-glow">
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>

          <div className="mt-12 pt-8 border-t border-white/5 flex justify-between items-center">
            <button 
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-white disabled:opacity-0 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Précédent
            </button>
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  // Save to global profile for automated matching
                  const profile = {
                    analysis: {
                      name: `${formData.identity.firstName || ''} ${formData.identity.lastName || ''}`.trim() || 'Candidat',
                      top_skills: [formData.experience.currentJob || 'Emploi'],
                      recommended_programs: [formData.education.fieldOfStudy || 'Programme'],
                    },
                    dossier: formData
                  };
                  dataService.saveGlobalProfile(profile);
                  alert("Dossier sauvegardé et profil global mis à jour !");
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all"
              >
                <Save className="w-4 h-4" />
                Sauvegarder
              </button>
              <button 
                onClick={handleNext}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-black text-sm font-black hover:scale-105 transition-transform"
              >
                {currentStep === visibleSteps.length - 1 ? "Soumettre le dossier" : "Suivant"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
