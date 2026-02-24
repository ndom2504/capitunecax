import React, { useState } from 'react';

// Document Upload Field Component
interface DocumentUploadFieldProps {
  id: string;
  label: string;
  required?: boolean;
  multiple?: boolean;
  onChange: (files: FileList | null) => void;
}

function DocumentUploadField({ id, label, required = false, multiple = false, onChange }: DocumentUploadFieldProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const fileArray = Array.from(selectedFiles);
      setFiles(multiple ? [...files, ...fileArray] : [fileArray[0]]);
      onChange(selectedFiles);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles(multiple ? [...files, ...droppedFiles] : [droppedFiles[0]]);
      
      const dataTransfer = new DataTransfer();
      droppedFiles.forEach(file => dataTransfer.items.add(file));
      onChange(dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-foreground">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          id={id}
          type="file"
          multiple={multiple}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept=".pdf,.jpg,.jpeg,.png"
        />
        
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-muted-foreground mb-3" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-sm text-foreground font-medium mb-1">
            Cliquez pour téléverser ou glissez-déposez
          </p>
          <p className="text-xs text-muted-foreground">
            PDF, JPG, PNG (max. 10 MB{multiple ? ' chacun' : ''})
          </p>
        </div>
      </div>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="space-y-2 mt-3">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-muted/50 border border-border rounded-lg p-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {file.type.includes('pdf') ? (
                    <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 18h12V6h-4V2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="ml-3 text-red-500 hover:text-red-700 transition flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18H18V6H6zm0 0a6 6 0 016-6H6a6 6 0 016 6v12a6 6 0 01-6 6h12a6 6 0 01-6-6V6a6 6 0 016 6z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Types
interface SubService {
  id: string;
  name: string;
  description: string;
  automated?: boolean;
  price: number;
}

interface Service {
  id: string;
  name: string;
  description: string;
  icon: string;
  basePrice: number;
  subServices: SubService[];
}

interface Package {
  id: string;
  name: string;
  description: string;
  badge: string;
  price: number;
  services: string[];
  features: string[];
  popular?: boolean;
}

// Data
const packages: Package[] = [
  {
    id: 'essentiel',
    name: 'Pack Essentiel',
    description: 'Pour démarrer votre projet',
    badge: '🥉',
    price: 500,
    services: ['consultation', 'orientation'],
    features: [
      'Évaluation complète du profil',
      'Analyse d\'admissibilité',
      'Plan d\'immigration personnalisé',
      'Orientation programme adapté',
      'Support par email'
    ]
  },
  {
    id: 'standard',
    name: 'Pack Standard',
    description: 'Solution complète et structurée',
    badge: '🥈',
    price: 1500,
    services: ['consultation', 'orientation', 'dossier'],
    features: [
      'Tout du Pack Essentiel',
      'Montage complet du dossier',
      'Formulaires officiels',
      'Vérification conformité',
      'Soumission électronique',
      'Support prioritaire'
    ],
    popular: true
  },
  {
    id: 'premium',
    name: 'Pack Premium',
    description: 'Accompagnement intégral de A à Z',
    badge: '🥇',
    price: 2500,
    services: ['consultation', 'orientation', 'dossier', 'suivi', 'recherche', 'integration'],
    features: [
      'Tout du Pack Standard',
      'Suivi complet avec les autorités',
      'Réponses aux demandes additionnelles',
      'Recherche d\'établissements/employeurs',
      'Assistance installation au Canada',
      'Support VIP 7j/7'
    ]
  }
];

const services: Service[] = [
  {
    id: 'consultation',
    name: 'Consultation Stratégique',
    description: 'Analyser et définir la meilleure stratégie',
    icon: '🎯',
    basePrice: 250,
    subServices: [
      { id: 'eval-complete', name: 'Évaluation complète du profil', description: 'Analyse admissibilité, CRS, points Québec, financière', automated: true, price: 150 },
      { id: 'simulation', name: 'Simulation de scénarios', description: 'Entrée Express, PNP, Études→RP, Permis→RP', price: 100 },
      { id: 'plan-perso', name: 'Plan d\'immigration personnalisé', description: 'Feuille de route, calendrier, budget prévisionnel', automated: true, price: 150 },
      { id: 'optimisation', name: 'Optimisation du dossier', description: 'Stratégie amélioration score, expérience, linguistique', price: 100 }
    ]
  },
  {
    id: 'orientation',
    name: 'Orientation & Choix du Programme',
    description: 'Choisir le bon programme officiel',
    icon: '🗺️',
    basePrice: 200,
    subServices: [
      { id: 'orient-immigration', name: 'Orientation Immigration', description: 'RP, Immigration Québec, Parrainage, Humanitaire', price: 100 },
      { id: 'orient-etudes', name: 'Orientation Études', description: 'Choix programme, province, établissement', price: 100 },
      { id: 'orient-travail', name: 'Orientation Travail', description: 'LMIA, Permis fermé, Permis ouvert', price: 100 },
      { id: 'orient-entrepreneur', name: 'Orientation Entrepreneur', description: 'Start-up Visa, Investisseur, Travailleur autonome', price: 150 }
    ]
  },
  {
    id: 'dossier',
    name: 'Montage Complet du Dossier',
    description: 'Préparer et structurer tous les documents',
    icon: '📁',
    basePrice: 600,
    subServices: [
      { id: 'prep-admin', name: 'Préparation administrative', description: 'Formulaires officiels, vérification conformité', automated: true, price: 200 },
      { id: 'structuration', name: 'Structuration des documents', description: 'Classement stratégique, vérification cohérence', automated: true, price: 150 },
      { id: 'redaction', name: 'Rédaction spécialisée', description: 'Lettres d\'explication, intention, motivation, business plan', price: 250 },
      { id: 'soumission', name: 'Soumission électronique', description: 'Création compte IRCC, téléversement, vérification finale', automated: true, price: 200 }
    ]
  },
  {
    id: 'suivi',
    name: 'Suivi & Communication',
    description: 'Gérer les échanges avec les autorités',
    icon: '📅',
    basePrice: 400,
    subServices: [
      { id: 'suivi-admin', name: 'Suivi administratif', description: 'Vérification statut, mise à jour dossier', automated: true, price: 150 },
      { id: 'reponses', name: 'Réponses aux demandes additionnelles', description: 'Préparation documents, rédaction réponses', price: 200 },
      { id: 'entrevue', name: 'Préparation entrevue', description: 'Simulation, coaching personnalisé', price: 150 },
      { id: 'post-soumission', name: 'Assistance post-soumission', description: 'Biométrie, visite médicale, passeport', price: 100 }
    ]
  },
  {
    id: 'recherche',
    name: 'Recherche d\'Institutions',
    description: 'Trouver établissement ou employeur',
    icon: '🔍',
    basePrice: 300,
    subServices: [
      { id: 'recherche-ecoles', name: 'Recherche établissements scolaires', description: 'Collèges, universités, centres professionnels', price: 150 },
      { id: 'recherche-employeurs', name: 'Recherche employeurs', description: 'Entreprises LMIA, recrutement ciblé', price: 200 },
      { id: 'accomp-admission', name: 'Accompagnement admission', description: 'Préparation dossier, suivi admission', price: 150 }
    ]
  },
  {
    id: 'integration',
    name: 'Accueil & Intégration',
    description: 'Installation au Canada',
    icon: '🏠',
    basePrice: 250,
    subServices: [
      { id: 'logement', name: 'Recherche logement', description: 'Aide à la recherche et sélection', price: 100 },
      { id: 'services-base', name: 'Services essentiels', description: 'Compte bancaire, NAS, assurance maladie', price: 100 },
      { id: 'integration-famille', name: 'Intégration famille', description: 'Inscription enfants école, coaching installation', price: 150 }
    ]
  }
];

export function ServiceSelector() {
  const [selectionMode, setSelectionMode] = useState<'pack' | 'custom'>('custom');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [selectedSubServices, setSelectedSubServices] = useState<{ [key: string]: string[] }>({});
  const [currentStep, setCurrentStep] = useState<'selection' | 'details' | 'documents'>('selection');
  const [uploadedDocuments, setUploadedDocuments] = useState<{ [key: string]: FileList | File[] }>({});

  const handleFileUpload = (documentId: string, files: FileList | null) => {
    if (files) {
      setUploadedDocuments(prev => ({
        ...prev,
        [documentId]: files
      }));
      console.log(`Document ${documentId} uploaded:`, files);
    }
  };

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId);
    const pkg = packages.find(p => p.id === packageId);
    if (pkg) {
      setSelectedServices(pkg.services);
      const autoSubServices: { [key: string]: string[] } = {};
      pkg.services.forEach(serviceId => {
        const service = services.find(s => s.id === serviceId);
        if (service) {
          autoSubServices[serviceId] = service.subServices.map(ss => ss.id);
        }
      });
      setSelectedSubServices(autoSubServices);
    }
  };

  const toggleService = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(prev => prev.filter(id => id !== serviceId));
      const newSubServices = { ...selectedSubServices };
      delete newSubServices[serviceId];
      setSelectedSubServices(newSubServices);
    } else {
      setSelectedServices(prev => [...prev, serviceId]);
      const service = services.find(s => s.id === serviceId);
      if (service) {
        setSelectedSubServices(prev => ({
          ...prev,
          [serviceId]: service.subServices.map(ss => ss.id)
        }));
      }
    }
    setExpandedService(null);
    setSelectedPackage(null);
  };

  const toggleSubService = (serviceId: string, subServiceId: string) => {
    setSelectedSubServices(prev => {
      const current = prev[serviceId] || [];
      if (current.includes(subServiceId)) {
        return { ...prev, [serviceId]: current.filter(id => id !== subServiceId) };
      } else {
        return { ...prev, [serviceId]: [...current, subServiceId] };
      }
    });
    setSelectedPackage(null);
  };

  const handleContinue = () => {
    if (selectedServices.length > 0) {
      setCurrentStep('details');
    }
  };

  const getTotalSubServices = () => {
    return Object.values(selectedSubServices).reduce((acc, arr) => acc + arr.length, 0);
  };

  const calculateCustomPrice = () => {
    let total = 0;
    selectedServices.forEach(serviceId => {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        const selectedSubs = selectedSubServices[serviceId] || [];
        selectedSubs.forEach(subId => {
          const subService = service.subServices.find(ss => ss.id === subId);
          if (subService) {
            total += subService.price;
          }
        });
      }
    });
    return total;
  };

  const getPriceBreakdown = () => {
    const breakdown: { serviceName: string; items: { name: string; price: number }[] }[] = [];
    
    selectedServices.forEach(serviceId => {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        const selectedSubs = selectedSubServices[serviceId] || [];
        const items = selectedSubs.map(subId => {
          const subService = service.subServices.find(ss => ss.id === subId);
          return subService ? { name: subService.name, price: subService.price } : null;
        }).filter(Boolean) as { name: string; price: number }[];
        
        if (items.length > 0) {
          breakdown.push({
            serviceName: service.name,
            items
          });
        }
      }
    });
    
    return breakdown;
  };

  const getCurrentPrice = () => {
    if (selectionMode === 'pack' && selectedPackage) {
      const pkg = packages.find(p => p.id === selectedPackage);
      return pkg ? pkg.price : 0;
    }
    return calculateCustomPrice();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {currentStep === 'selection' && (
        <>
          {/* Mode Selection - HUGE BUTTONS */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-3">👇 CLIQUEZ POUR CHOISIR VOTRE MODE DE SÉLECTION</h2>
              <p className="text-lg text-muted-foreground">Deux façons de créer votre accompagnement</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <button
                onClick={() => setSelectionMode('custom')}
                className={`group relative p-8 rounded-2xl font-bold transition-all duration-300 transform ${
                  selectionMode === 'custom'
                    ? 'bg-primary text-primary-foreground shadow-2xl scale-105 ring-4 ring-primary/50'
                    : 'bg-card border-4 border-primary/30 text-foreground hover:bg-primary/10 hover:border-primary hover:scale-102 hover:shadow-xl'
                }`}
              >
                <div className="text-center">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-2xl font-bold mb-3">Sélection Personnalisée</h3>
                  <p className="text-base opacity-90">
                    Je choisis uniquement les services dont j'ai besoin
                  </p>
                  {selectionMode === 'custom' && (
                    <div className="mt-4 pt-4 border-t border-primary-foreground/20">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        MODE ACTIF
                      </span>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 rounded-2xl border-4 border-transparent group-hover:border-primary/50 transition-all duration-300"></div>
              </button>

              <button
                onClick={() => setSelectionMode('pack')}
                className={`group relative p-8 rounded-2xl font-bold transition-all duration-300 transform ${
                  selectionMode === 'pack'
                    ? 'bg-primary text-primary-foreground shadow-2xl scale-105 ring-4 ring-primary/50'
                    : 'bg-card border-4 border-primary/30 text-foreground hover:bg-primary/10 hover:border-primary hover:scale-102 hover:shadow-xl'
                }`}
              >
                <div className="text-center">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="text-2xl font-bold mb-3">Packs Recommandés</h3>
                  <p className="text-base opacity-90">
                    Je choisis un forfait tout-inclus adapté à mon profil
                  </p>
                  {selectionMode === 'pack' && (
                    <div className="mt-4 pt-4 border-t border-primary-foreground/20">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        MODE ACTIF
                      </span>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 rounded-2xl border-4 border-transparent group-hover:border-primary/50 transition-all duration-300"></div>
              </button>
            </div>
          </div>

          {/* CUSTOM MODE */}
          {selectionMode === 'custom' && (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Services Selection */}
              <div className="lg:col-span-2">
                <div className="bg-yellow-500/10 border-2 border-yellow-500/30 rounded-xl p-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">👆</div>
                    <div>
                      <h3 className="font-bold text-foreground text-lg mb-2">Comment ça marche ?</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        <strong className="text-foreground">ÉTAPE 1 :</strong> Cliquez sur la <strong className="text-foreground">GRANDE CASE À DROITE (☐)</strong> pour sélectionner un service<br/>
                        <strong className="text-foreground">ÉTAPE 2 :</strong> Une fois sélectionné, cliquez sur le bouton <strong className="text-primary">⚙️ "PERSONNALISER LES SOUS-SERVICES"</strong> pour voir et choisir les options<br/>
                        <strong className="text-foreground">ÉTAPE 3 :</strong> Le prix total s'affiche automatiquement dans le panneau de droite
                      </p>
                      <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-3 mt-3">
                        <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs text-foreground font-semibold">
                          💡 Astuce : Chaque service contient plusieurs sous-services que vous pouvez activer ou désactiver selon vos besoins !
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {services.map(service => (
                    <div key={service.id} className="group">
                      {/* Main Service - HUGE CLICKABLE CARD */}
                      <div
                        className={`relative border-4 rounded-2xl overflow-hidden transition-all duration-300 ${
                          selectedServices.includes(service.id) 
                            ? 'border-primary bg-primary/10 shadow-2xl ring-4 ring-primary/30' 
                            : 'border-border hover:border-primary/60 hover:shadow-xl bg-card'
                        }`}
                      >
                        <div className="p-6 md:p-8">
                          <div className="flex items-center gap-6">
                            {/* Icon */}
                            <div className="text-6xl flex-shrink-0">{service.icon}</div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-3 mb-2">
                                <h3 className="text-xl md:text-2xl font-bold text-foreground flex-1">{service.name}</h3>
                                {!selectedServices.includes(service.id) && (
                                  <span className="flex items-center gap-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap animate-pulse">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                    </svg>
                                    {service.subServices.length} options
                                  </span>
                                )}
                              </div>
                              <p className="text-sm md:text-base text-muted-foreground mb-4">{service.description}</p>
                              
                              {selectedServices.includes(service.id) && (
                                <div className="space-y-3">
                                  {/* Helper Text with Animated Arrow - Only show if NOT expanded */}
                                  {expandedService !== service.id && (
                                    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30 rounded-xl p-4 mb-3">
                                      <div className="flex items-center gap-3">
                                        <div className="text-3xl animate-bounce">👇</div>
                                        <div>
                                          <p className="text-sm font-bold text-foreground mb-1">
                                            🎉 Service ajouté ! Maintenant personnalisez-le :
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            Cliquez sur le bouton ci-dessous pour choisir exactement les options dont vous avez besoin
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* HUGE PROMINENT BUTTON */}
                                  <button
                                    onClick={() => setExpandedService(expandedService === service.id ? null : service.id)}
                                    className={`w-full inline-flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold text-base transition-all duration-300 transform hover:scale-105 ${
                                      expandedService === service.id
                                        ? 'bg-yellow-500 text-white shadow-xl ring-4 ring-yellow-500/30'
                                        : 'bg-primary text-primary-foreground shadow-lg hover:shadow-2xl ring-2 ring-primary/30 animate-pulse'
                                    }`}
                                  >
                                    <svg
                                      className={`w-6 h-6 transition-transform duration-300 ${expandedService === service.id ? 'rotate-180' : ''}`}
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                    </svg>
                                    <span className="text-lg">
                                      {expandedService === service.id ? '✓ MASQUER LES OPTIONS' : '⚙️ PERSONNALISER LES SOUS-SERVICES'}
                                    </span>
                                    <span className="bg-white/20 px-3 py-1 rounded-lg text-sm font-bold">
                                      {service.subServices.length}
                                    </span>
                                  </button>

                                  {/* Info Badge */}
                                  <div className="flex items-center gap-2 text-sm">
                                    <div className="flex items-center gap-2 bg-green-500/10 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-lg font-semibold">
                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      <span>{selectedSubServices[service.id]?.length || 0} / {service.subServices.length} options incluses</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* HUGE CHECKBOX BUTTON */}
                            <button
                              onClick={() => toggleService(service.id)}
                              className={`flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
                                selectedServices.includes(service.id)
                                  ? 'bg-primary border-primary shadow-2xl ring-4 ring-primary/50'
                                  : 'border-input hover:border-primary hover:bg-primary/5 hover:shadow-lg'
                              }`}
                              title={selectedServices.includes(service.id) ? "Désélectionner" : "Sélectionner"}
                            >
                              {selectedServices.includes(service.id) ? (
                                <svg className="w-12 h-12 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <span className="text-4xl text-muted-foreground">☐</span>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Sub Services */}
                        {selectedServices.includes(service.id) && expandedService === service.id && (
                          <div className="border-t-4 border-border bg-muted/30 p-6">
                            <div className="grid gap-4">
                              {service.subServices.map(subService => (
                                <button
                                  key={subService.id}
                                  onClick={() => toggleSubService(service.id, subService.id)}
                                  className={`text-left border-3 rounded-xl p-5 transition-all duration-200 ${
                                    selectedSubServices[service.id]?.includes(subService.id)
                                      ? 'border-primary bg-primary/5 shadow-lg ring-2 ring-primary/30'
                                      : 'border-border hover:border-primary/50 hover:bg-background/50 hover:shadow-md'
                                  }`}
                                >
                                  <div className="flex items-start gap-4">
                                    <div className={`w-8 h-8 rounded-lg border-3 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${
                                      selectedSubServices[service.id]?.includes(subService.id)
                                        ? 'bg-primary border-primary'
                                        : 'border-input'
                                    }`}>
                                      {selectedSubServices[service.id]?.includes(subService.id) && (
                                        <svg className="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                          <p className="font-bold text-base text-foreground mb-1">{subService.name}</p>
                                          <p className="text-sm text-muted-foreground">{subService.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          {subService.automated && (
                                            <span className="bg-green-500/15 text-green-700 dark:text-green-400 px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap">
                                              ⚡ Auto
                                            </span>
                                          )}
                                          <span className="font-bold text-lg text-primary whitespace-nowrap">{formatPrice(subService.price)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-6">
                  {/* Price Summary */}
                  <div className="bg-card border-3 border-border rounded-2xl p-6 shadow-xl">
                    <h3 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Récapitulatif
                    </h3>

                    {selectedServices.length === 0 ? (
                      <div className="text-center py-12 bg-muted/30 rounded-xl">
                        <div className="text-5xl mb-4">⬅️</div>
                        <p className="text-sm font-semibold text-foreground mb-2">
                          Cliquez sur les cases à gauche
                        </p>
                        <p className="text-xs text-muted-foreground">
                          pour sélectionner vos services
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3 mb-6">
                          {getPriceBreakdown().map((serviceBreakdown, index) => (
                            <div key={index} className="border-b border-border pb-3 last:border-0">
                              <p className="font-bold text-sm text-foreground mb-2">{serviceBreakdown.serviceName}</p>
                              <div className="space-y-1.5">
                                {serviceBreakdown.items.map((item, itemIndex) => (
                                  <div key={itemIndex} className="flex justify-between items-start text-xs gap-2">
                                    <span className="text-muted-foreground flex-1">{item.name}</span>
                                    <span className="font-semibold text-foreground">{formatPrice(item.price)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="border-t-2 border-border pt-4">
                          <div className="flex justify-between items-center text-2xl font-bold text-primary mb-2">
                            <span>Total</span>
                            <span>{formatPrice(getCurrentPrice())}</span>
                          </div>
                          <p className="text-xs text-muted-foreground text-center">
                            {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} • {getTotalSubServices()} option{getTotalSubServices() > 1 ? 's' : ''}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PACKS MODE - HUGE CARDS */}
          {selectionMode === 'pack' && (
            <div>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-foreground mb-3">👇 CLIQUEZ SUR UNE CARTE POUR CHOISIR VOTRE PACK</h2>
                <p className="text-lg text-muted-foreground">Solutions complètes et prêtes à l'emploi</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 mb-12">
                {packages.map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => handlePackageSelect(pkg.id)}
                    className={`relative border-4 rounded-2xl p-8 transition-all duration-300 transform text-left ${
                      selectedPackage === pkg.id
                        ? 'border-primary bg-primary/10 shadow-2xl scale-105 ring-4 ring-primary/30'
                        : 'border-border hover:border-primary/60 hover:shadow-xl hover:scale-102 bg-card'
                    } ${pkg.popular ? 'ring-4 ring-yellow-500/50' : ''}`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                        ⭐ LE PLUS POPULAIRE
                      </div>
                    )}
                    
                    <div className="text-center mb-6">
                      <div className="text-7xl mb-4">{pkg.badge}</div>
                      <h3 className="text-2xl font-bold text-foreground mb-3">{pkg.name}</h3>
                      <p className="text-sm text-muted-foreground mb-6">{pkg.description}</p>
                      <div className="text-4xl font-bold text-primary mb-2">{formatPrice(pkg.price)}</div>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {pkg.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm">
                          <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-foreground font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {selectedPackage === pkg.id && (
                      <div className="pt-6 border-t-2 border-border">
                        <div className="flex items-center justify-center gap-3 text-primary font-bold text-lg">
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>PACK SÉLECTIONNÉ</span>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* HUGE Continue Button */}
          {(selectedPackage || selectedServices.length > 0) && (
            <div className="flex justify-center mt-12">
              <button
                onClick={handleContinue}
                className="bg-primary text-primary-foreground px-12 py-6 rounded-2xl text-xl font-bold hover:bg-primary/90 transition-all transform hover:scale-105 shadow-2xl flex items-center gap-4 ring-4 ring-primary/30"
              >
                <span>CONTINUER VERS L'ÉTAPE SUIVANTE</span>
                <span className="bg-primary-foreground/20 px-4 py-2 rounded-xl text-lg font-bold">
                  {formatPrice(getCurrentPrice())}
                </span>
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}

      {/* Details and Documents steps remain unchanged... */}
    </div>
  );
}




