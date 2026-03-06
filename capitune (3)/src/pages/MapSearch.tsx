import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { GraduationCap, Briefcase, Home, Filter, Map as MapIcon, List, Loader2 } from 'lucide-react';
import { fetchUniversities } from '@/services/education';
import { fetchJobs } from '@/services/jobs';
import { fetchHousing } from '@/services/housing';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';

// Fix for default Leaflet icons in Vite/Webpack
// ... (keep existing icon code)
const createCustomIcon = (icon: React.ReactNode, color: string) => {
  const html = renderToStaticMarkup(
    <div style={{ 
      backgroundColor: color, 
      width: '32px', 
      height: '32px', 
      borderRadius: '50%', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      border: '2px solid white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
      color: 'white'
    }}>
      {icon}
    </div>
  );
  
  return L.divIcon({
    html: html,
    className: 'custom-marker-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const icons = {
  education: createCustomIcon(<GraduationCap size={18} />, '#1f4b6e'), // Primary
  job: createCustomIcon(<Briefcase size={18} />, '#22c55e'), // Success
  housing: createCustomIcon(<Home size={18} />, '#e87722'), // Orange
};

// Component to update map center when city changes
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

export default function MapSearch() {
  const [activeTab, setActiveTab] = useState<'education' | 'job' | 'housing'>('education');
  const [selectedCity, setSelectedCity] = useState<string>('Montréal');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [schools, setSchools] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [housing, setHousing] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        const [uniData, jobData, houseData] = await Promise.all([
          fetchUniversities(),
          fetchJobs(),
          fetchHousing()
        ]);
        setSchools(uniData);
        setJobs(jobData);
        setHousing(houseData);
      } catch (e) {
        console.error("Error loading map data", e);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, []);
  
  // Center coordinates for cities
  const cityCenters: Record<string, [number, number]> = {
    'Montréal': [45.5017, -73.5673],
    'Québec': [46.8139, -71.2080],
    'Sherbrooke': [45.4010, -71.8824],
    'Gatineau': [45.4765, -75.7013],
    'Trois-Rivières': [46.3427, -72.5425],
    'Toronto': [43.6532, -79.3832],
    'Ottawa': [45.4215, -75.6972],
    'Vancouver': [49.2827, -123.1207]
  };

  const currentData = useMemo(() => {
    switch (activeTab) {
      case 'education': return schools;
      case 'job': return jobs;
      case 'housing': return housing;
      default: return [];
    }
  }, [activeTab, schools, jobs, housing]);

  // Filter data by city and search term
  const filteredData = useMemo(() => {
    let data = currentData;
    
    // Filter by City
    if (selectedCity !== 'All') {
      data = data.filter(item => item.location.includes(selectedCity));
    }

    // Filter by Search Term
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      data = data.filter(item => {
        if (activeTab === 'education') {
          return (item as any).name.toLowerCase().includes(lowerTerm) || 
                 (item as any).program.toLowerCase().includes(lowerTerm);
        } else if (activeTab === 'job') {
          return (item as any).title.toLowerCase().includes(lowerTerm) || 
                 (item as any).company.toLowerCase().includes(lowerTerm);
        } else if (activeTab === 'housing') {
          return (item as any).title.toLowerCase().includes(lowerTerm) || 
                 (item as any).type.toLowerCase().includes(lowerTerm);
        }
        return false;
      });
    }
    
    return data;
  }, [currentData, selectedCity, searchTerm, activeTab]);

  // Limit markers for performance if too many
  const displayData = filteredData.slice(0, 100);

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text">Carte Interactive</h1>
          <p className="text-text-muted mt-1">Explorez les opportunités géographiquement.</p>
        </div>
        
        <div className="flex bg-surface p-1 rounded-xl border border-border shadow-sm">
          <button
            onClick={() => setActiveTab('education')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'education' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-bg-light'
            }`}
          >
            <GraduationCap size={16} /> Formation
          </button>
          <button
            onClick={() => setActiveTab('job')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'job' ? 'bg-success text-white' : 'text-text-secondary hover:bg-bg-light'
            }`}
          >
            <Briefcase size={16} /> Emploi
          </button>
          <button
            onClick={() => setActiveTab('housing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'housing' ? 'bg-orange text-white' : 'text-text-secondary hover:bg-bg-light'
            }`}
          >
            <Home size={16} /> Logement
          </button>
        </div>
      </div>

      <div className="flex-1 bg-surface rounded-2xl border border-border overflow-hidden shadow-sm relative flex flex-col md:flex-row">
        {/* Sidebar Filter */}
        <div className="w-full md:w-64 bg-surface border-b md:border-b-0 md:border-r border-border p-4 z-10 flex flex-col gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <List className="h-4 w-4 text-text-muted" />
            </div>
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-bg-light text-text focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-text-secondary mb-2 block">Ville</label>
            <select 
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg-light text-text focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {Object.keys(cityCenters).map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto hidden md:block space-y-2">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>{displayData.length} Résultats</span>
              {loading && <Loader2 className="h-3 w-3 animate-spin" />}
            </h3>
            
            {loading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => (
                  <div key={i} className="h-16 bg-slate-100 rounded animate-pulse"></div>
                ))}
              </div>
            ) : (
              displayData.map((item: any) => (
                <div key={item.id} className="p-3 rounded-lg border border-border hover:bg-bg-light cursor-pointer transition-colors">
                  <h4 className="font-medium text-text text-sm line-clamp-1">{item.name || item.title}</h4>
                  <p className="text-xs text-text-muted mt-1">{item.location}</p>
                  {item.price && <p className="text-xs font-bold text-orange mt-1">{item.price} $</p>}
                  {item.salary && <p className="text-xs font-bold text-success mt-1">{item.salary}</p>}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative z-0">
          <MapContainer 
            center={cityCenters[selectedCity] || [45.5017, -73.5673]} 
            zoom={12} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={cityCenters[selectedCity] || [45.5017, -73.5673]} />
            
            {!loading && displayData.map((item: any) => (
              <Marker 
                key={item.id} 
                position={[item.lat, item.lng]}
                icon={icons[activeTab]}
              >
                <Popup className="custom-popup">
                  <div className="p-1 min-w-[200px]">
                    {activeTab === 'education' && (
                      <div className="mb-2 h-24 w-full overflow-hidden rounded bg-slate-50 border border-slate-100 flex items-center justify-center p-2">
                        <img 
                          src={item.logo} 
                          alt={item.name}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=random&size=128`;
                          }}
                        />
                      </div>
                    )}

                    <h3 className="font-bold text-sm mb-1 text-slate-900">{item.name || item.title}</h3>
                    <p className="text-xs text-slate-600 mb-2 flex items-center gap-1">
                      <span className="opacity-70">📍</span> {item.location}
                    </p>
                    
                    {activeTab === 'education' && (
                      <div className="space-y-1">
                        <p className="text-xs text-slate-700"><span className="font-semibold">Programme:</span> {item.program}</p>
                        <p className="text-xs text-slate-700"><span className="font-semibold">Frais:</span> {item.tuition}</p>
                        <a href={item.url} target="_blank" rel="noreferrer" className="block mt-2 text-xs text-center bg-primary text-white py-1.5 rounded hover:bg-primary-dark transition-colors">Admission</a>
                      </div>
                    )}
                    
                    {activeTab === 'job' && (
                      <div className="space-y-1">
                        <p className="text-xs text-slate-700"><span className="font-semibold">Entreprise:</span> {item.company}</p>
                        <p className="text-xs text-slate-700"><span className="font-semibold">Salaire:</span> {item.salary}</p>
                        <a href={`https://www.guichetemplois.gc.ca/jobsearch/jobsearch?searchstring=${encodeURIComponent(item.title)}`} target="_blank" rel="noreferrer" className="block mt-2 text-xs text-center bg-success text-white py-1.5 rounded hover:bg-green-600 transition-colors">Postuler</a>
                      </div>
                    )}
                    
                    {activeTab === 'housing' && (
                      <div className="space-y-1">
                        <p className="text-xs text-slate-700"><span className="font-semibold">Type:</span> {item.type}</p>
                        <p className="text-xs text-slate-700"><span className="font-semibold">Prix:</span> {item.price} $</p>
                        <a href={`https://rentals.ca/${item.location.split(',')[0].toLowerCase()}`} target="_blank" rel="noreferrer" className="block mt-2 text-xs text-center bg-orange text-white py-1.5 rounded hover:bg-orange-light transition-colors">Contacter</a>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
