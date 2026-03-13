import React, { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { 
  FileText, 
  Users, 
  GraduationCap, 
  Briefcase, 
  TrendingUp,
  Clock,
  Award,
  Plus,
  ShieldCheck,
  Zap,
  AlertCircle,
  Activity,
  DollarSign
} from "lucide-react";
import { User, Dossier } from "../types";
import { dataService } from "../services/dataService";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [u, d] = await Promise.all([
          dataService.getCurrentUser(),
          dataService.getDossiers()
        ]);
        setUser(u);
        setDossiers(d);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <div className="p-20 text-center">Chargement du dashboard...</div>;

  const getRoleConfig = () => {
    switch (user?.role) {
      case "PROFESSIONNEL":
        return {
          label: "Professionnel",
          color: "text-primary",
          bgColor: "bg-primary/10",
          kpis: [
            { label: "Dossiers Assignés", val: "12", icon: FileText, color: "text-primary" },
            { label: "Taux Réussite", val: "94%", icon: Award, color: "text-primary" },
            { label: "Revenus (Points)", val: "2 450", icon: Zap, color: "text-amber-500" },
            { label: "Clients Actifs", val: "8", icon: Users, color: "text-blue-500" }
          ],
          steps: [
            { title: "Vérification Licence", desc: "Téléchargez votre licence RCIC à jour.", status: "Faire" },
            { title: "Compléter Spécialité", desc: "Précisez vos domaines d'expertise (PEQ, Entrée Express).", status: "Faire" },
            { title: "Répondre aux messages", desc: "3 nouveaux prospects attendent une réponse.", status: "Urgent" }
          ]
        };
      case "PARTENAIRE":
        return {
          label: "Partenaire",
          color: "text-amber-500",
          bgColor: "bg-amber-500/10",
          kpis: [
            { label: "Demandes DLI", val: "45", icon: GraduationCap, color: "text-amber-500" },
            { label: "Taux Conversion", val: "18%", icon: TrendingUp, color: "text-primary" },
            { label: "Visibilité", val: "1.2k", icon: Activity, color: "text-blue-500" },
            { label: "Partenariats", val: "4", icon: Briefcase, color: "text-primary" }
          ],
          steps: [
            { title: "Vérification NEQ/DLI", desc: "Confirmez votre numéro d'établissement.", status: "Faire" },
            { title: "Mise à jour Programmes", desc: "Actualisez vos frais de scolarité pour 2026.", status: "Faire" },
            { title: "Contact Admin", desc: "Validez votre entente de partenariat annuelle.", status: "Attente" }
          ]
        };
      case "ADMIN":
        return {
          label: "Administrateur",
          color: "text-rose-500",
          bgColor: "bg-rose-500/10",
          kpis: [
            { label: "Total Users", val: "1 240", icon: Users, color: "text-rose-500" },
            { label: "Revenus Plateforme", val: "12.5k$", icon: DollarSign, color: "text-primary" },
            { label: "Dossiers Critiques", val: "5", icon: AlertCircle, color: "text-amber-500" },
            { label: "Alertes Système", val: "0", icon: ShieldCheck, color: "text-blue-500" }
          ],
          steps: [
            { title: "Valider nouveaux pros", desc: "4 consultants attendent la vérification de licence.", status: "Urgent" },
            { title: "Maintenance système", desc: "Mise à jour de la base DLI prévue à 02:00.", status: "Faire" },
            { title: "Rapports mensuels", desc: "Générez le rapport financier de Janvier.", status: "Faire" }
          ]
        };
      default: // PARTICULIER
        return {
          label: "Particulier",
          color: "text-primary",
          bgColor: "bg-primary/10",
          kpis: [
            { label: "Dossiers Actifs", val: dossiers.length, icon: FileText, color: "text-blue-500" },
            { label: "Score Crédibilité", val: `${user?.credibility_score}%`, icon: Award, color: "text-primary" },
            { label: "Temps Traitement", val: "14j", icon: Clock, color: "text-orange-500" },
            { label: "Experts Sollicités", val: "3", icon: Users, color: "text-primary" }
          ],
          steps: [
            { title: "Validation Identité", desc: "Téléchargez un selfie avec votre pièce d'identité.", status: "Faire" },
            { title: "Soumettre Test de Langue", desc: "Ajoutez vos résultats IELTS ou TEF/TCF.", status: "Faire" },
            { title: "RDV consultant (Zoom)", desc: "Prévoyez votre première session avec un expert.", status: "Attente" }
          ]
        };
    }
  };

  const config = getRoleConfig();

  const chartData = [
    { name: "Jan", val: 400 },
    { name: "Fév", val: 300 },
    { name: "Mar", val: 600 },
    { name: "Avr", val: 800 },
    { name: "Mai", val: 500 },
    { name: "Juin", val: 700 },
  ];

  const pieData = [
    { name: "Ouvert", value: 40 },
    { name: "En cours", value: 30 },
    { name: "Expert", value: 20 },
    { name: "Clôturé", value: 10 },
  ];

  return (
    <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/5">
              <img src={user?.avatar} alt={user?.name} className="w-full h-full object-cover" />
            </div>
            {user?.specialty && (
              <div className="absolute -top-2 -right-2 bg-primary text-black p-1 rounded-lg shadow-xl">
                <ShieldCheck className="w-4 h-4" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black tracking-tight text-white">Bonjour, {user?.name} 👋</h1>
              <div className="flex items-center gap-1 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3 text-primary" />
                <span className="text-[8px] font-black uppercase text-primary tracking-widest">Vérifié</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <span className={`text-[10px] font-black ${config.color} ${config.bgColor} px-2 py-0.5 rounded uppercase tracking-widest`}>
                {config.label}
              </span>
              <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1 uppercase tracking-widest">
                <MapPin className="w-3 h-3" />
                {user?.province || "Canada"}
              </span>
              <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1 uppercase tracking-widest">
                <Zap className="w-3 h-3 fill-current" />
                {user?.points} Points
              </span>
              {user?.specialty && (
                <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-widest">
                  Expert {user.specialty}
                </span>
              )}
            </div>
            {user?.bio && <p className="text-xs text-gray-500 mt-2 italic">"{user.bio}"</p>}
          </div>
        </div>
        <div className="flex gap-3">
          <button className="bg-primary text-black px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:scale-105 transition-transform">
            <Plus className="w-4 h-4" />
            Nouveau Rapport IA
          </button>
          <button className="bg-white/5 border border-white/10 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors">
            Éditer Profil
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {config.kpis.map((stat, i) => (
          <div key={i} className="bg-white/5 border border-white/5 p-6 rounded-3xl">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-primary">+0%</span>
            </div>
            <div className="text-3xl font-black mb-1">{stat.val}</div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        <div className="lg:col-span-2 bg-white/5 border border-white/5 p-8 rounded-3xl">
          <h3 className="text-xl font-bold mb-8 uppercase text-xs tracking-widest text-gray-500">Évolution de l'activité</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="name" stroke="#555" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#555" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#111", border: "1px solid #333", borderRadius: "12px" }}
                  itemStyle={{ color: "#10b981" }}
                />
                <Bar dataKey="val" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white/5 border border-white/5 p-8 rounded-3xl">
          <h3 className="text-xl font-bold mb-8 uppercase text-xs tracking-widest text-gray-500">Statuts des dossiers</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "#111", border: "1px solid #333", borderRadius: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Steps */}
        <div className="lg:col-span-2 bg-white/5 border border-white/5 p-8 rounded-3xl">
          <h3 className="text-xl font-bold mb-8 uppercase text-xs tracking-widest text-gray-500">Prochaines étapes personnalisées</h3>
          <div className="space-y-4">
            {config.steps.map((step, i) => (
              <div key={i} className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/5">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  step.status === "Urgent" ? "bg-rose-500 text-white" : "bg-primary text-black"
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm">{step.title}</div>
                  <div className="text-xs text-gray-500">{step.desc}</div>
                </div>
                <button className={`text-xs font-black uppercase tracking-widest ${
                  step.status === "Urgent" ? "text-rose-500" : "text-primary"
                }`}>
                  {step.status}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Premium Block */}
        <div className="bg-primary/10 border border-primary/20 p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <TrendingUp className="w-32 h-32 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-primary mb-4">
              <Zap className="w-5 h-5 fill-current" />
              <span className="text-xs font-black uppercase tracking-widest">Accès Premium</span>
            </div>
            <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter text-white">Passez au Premium</h3>
            <p className="text-sm text-gray-400 mb-8 leading-relaxed">
              Analyse IA illimitée, accès prioritaire aux experts RCIC et suivi de dossier en temps réel.
            </p>
          </div>
          <button className="w-full bg-primary text-black py-4 rounded-xl font-black text-sm hover:scale-105 transition-transform">
            Découvrir les offres
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper component for MapPin which was missing in imports
function MapPin(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
