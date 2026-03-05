import { useState } from 'react';
import { Send, Sparkles, Download, Copy, Check } from 'lucide-react';
import { motion } from 'motion/react';

export default function LetterGenerator() {
  const [formData, setFormData] = useState({
    fullName: '',
    program: '',
    institution: '',
    background: '',
    goals: '',
    financial: 'Mes parents me soutiennent financièrement et j\'ai des économies personnelles.'
  });
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: {
            fullName: formData.fullName,
            background: formData.background,
            goals: formData.goals,
            financial: formData.financial
          },
          program: formData.program,
          institution: formData.institution
        })
      });
      const data = await res.json();
      setGeneratedLetter(data.letter);
    } catch (e) {
      console.error(e);
      // Fallback for demo if API fails or key missing
      setGeneratedLetter(`Objet : Demande de permis d'études

Madame, Monsieur,

Je souhaite par la présente soumettre ma demande de permis d'études pour le Canada. J'ai été admis au programme de ${formData.program} à ${formData.institution}.

Ce programme représente une étape cruciale dans mon parcours académique. ${formData.background}

Mon objectif professionnel est clair : ${formData.goals}

Concernant le financement de mes études : ${formData.financial}

Je vous remercie de l'attention que vous porterez à ma demande.

Cordialement,
${formData.fullName}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text">Générateur de Lettre Explicative</h1>
        <p className="text-text-muted mt-2">Créez une lettre de motivation professionnelle pour votre demande de permis d'études avec l'aide de l'IA.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-6">
          <div className="bg-surface p-6 rounded-xl shadow-sm border border-border space-y-4">
            <h2 className="font-semibold text-text flex items-center gap-2">
              <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs">1</span>
              Vos informations
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Nom complet</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-orange/20 focus:outline-none"
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                placeholder="Jean Dupont"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Programme</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-orange/20 focus:outline-none"
                  value={formData.program}
                  onChange={e => setFormData({...formData, program: e.target.value})}
                  placeholder="Informatique"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Établissement</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-orange/20 focus:outline-none"
                  value={formData.institution}
                  onChange={e => setFormData({...formData, institution: e.target.value})}
                  placeholder="Université Laval"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Parcours actuel (bref)</label>
              <textarea 
                className="w-full px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-orange/20 focus:outline-none h-24 resize-none"
                value={formData.background}
                onChange={e => setFormData({...formData, background: e.target.value})}
                placeholder="Je viens de terminer mon baccalauréat en..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Objectifs professionnels</label>
              <textarea 
                className="w-full px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-orange/20 focus:outline-none h-24 resize-none"
                value={formData.goals}
                onChange={e => setFormData({...formData, goals: e.target.value})}
                placeholder="Je souhaite devenir développeur full-stack au Canada..."
              />
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !formData.fullName}
              className="w-full py-3 bg-orange text-white font-medium rounded-lg hover:bg-orange-light disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" /> Génération...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Générer ma lettre
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <div className="bg-surface p-6 rounded-xl shadow-sm border border-border h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-text">Aperçu</h2>
              {generatedLetter && (
                <div className="flex gap-2">
                  <button 
                    onClick={copyToClipboard}
                    className="p-2 text-text-muted hover:text-orange hover:bg-orange/10 rounded-lg transition-colors"
                    title="Copier"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button className="p-2 text-text-muted hover:text-orange hover:bg-orange/10 rounded-lg transition-colors" title="Télécharger PDF">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 bg-bg-light rounded-lg p-6 font-serif text-text whitespace-pre-wrap text-sm leading-relaxed border border-border overflow-y-auto max-h-[600px]">
              {generatedLetter ? (
                generatedLetter
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-text-muted">
                  <FileTextIcon className="w-12 h-12 mb-2 opacity-20" />
                  <p>Remplissez le formulaire pour générer votre lettre.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
