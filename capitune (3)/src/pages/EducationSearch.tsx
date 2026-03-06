import React, { useState, useMemo } from 'react';
import { Search, MapPin, DollarSign, BookOpen, Filter, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { ALL_SCHOOLS } from '@/data/mockData';

export default function EducationSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    level: 'all',
    province: 'all',
    city: 'all'
  });
  const [visibleCount, setVisibleCount] = useState(12);

  const filteredSchools = useMemo(() => {
    return ALL_SCHOOLS.filter(school => {
      const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            school.program.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesLevel = true;
      if (filters.level === 'university') {
        matchesLevel = school.type === 'Université';
      } else if (filters.level === 'college') {
        matchesLevel = school.type === 'Collège' || school.type === 'Cégep';
      }

      const matchesProvince = filters.province === 'all' || school.province === filters.province;
      const matchesCity = filters.city === 'all' || school.city === filters.city;

      return matchesSearch && matchesLevel && matchesProvince && matchesCity;
    });
  }, [searchTerm, filters]);

  const visibleSchools = filteredSchools.slice(0, visibleCount);

  // Extract unique provinces and cities for filters
  const provinces = Array.from(new Set(ALL_SCHOOLS.map(s => s.province))).sort();
  const cities = Array.from(new Set(ALL_SCHOOLS.filter(s => filters.province === 'all' || s.province === filters.province).map(s => s.city))).sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text">Trouver une formation</h1>
          <p className="text-text-muted mt-2">Recherchez parmi les Établissements d'Enseignement Désignés (EED) au Canada.</p>
        </div>
        <div className="bg-primary/10 px-4 py-2 rounded-lg border border-primary/20 text-primary font-medium whitespace-nowrap">
          <span className="font-bold text-xl mr-1">1,542</span> Établissements connectés
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-surface p-4 rounded-xl shadow-sm border border-border sticky top-0 z-10">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
            <input 
              type="text" 
              placeholder="Ex: Informatique, Design, Gestion..." 
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4 flex-wrap">
            <select 
              className="px-4 py-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-orange/20"
              value={filters.province}
              onChange={(e) => setFilters({...filters, province: e.target.value, city: 'all'})}
            >
              <option value="all">Toutes provinces</option>
              {provinces.map(prov => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>

            <select 
              className="px-4 py-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-orange/20"
              value={filters.city}
              onChange={(e) => setFilters({...filters, city: e.target.value})}
              disabled={filters.province === 'all'}
            >
              <option value="all">Toutes villes</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>

            <select 
              className="px-4 py-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-orange/20"
              value={filters.level}
              onChange={(e) => setFilters({...filters, level: e.target.value})}
            >
              <option value="all">Tous niveaux</option>
              <option value="university">Université</option>
              <option value="college">Collège / Cégep</option>
            </select>
            <button 
              className="px-6 py-3 bg-orange text-white font-medium rounded-lg hover:bg-orange-light transition-colors flex items-center gap-2"
            >
              Rechercher
            </button>
          </div>
        </div>
        <div className="mt-2 text-xs text-text-muted text-right">
          {visibleSchools.length} résultats affichés sur {filteredSchools.length}
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleSchools.map((school) => (
          <motion.div 
            key={school.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow flex flex-col"
          >
            <div className="h-40 bg-slate-50 relative flex items-center justify-center p-6 border-b border-border group-hover:bg-slate-100 transition-colors">
              <img 
                src={school.logo} 
                alt={school.name} 
                className="max-w-[80%] max-h-[80%] object-contain transform transition-transform group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(school.name)}&background=random&size=128`;
                }}
              />
              <div className="absolute top-4 left-4 bg-surface/90 backdrop-blur px-2 py-1 rounded text-xs font-semibold text-text-secondary border border-border shadow-sm">
                {school.type}
              </div>
            </div>
            <div className="p-5 space-y-4 flex-1 flex flex-col">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-text line-clamp-1">{school.program}</h3>
                <p className="text-text-secondary font-medium">{school.name}</p>
              </div>
              
              <div className="space-y-2 text-sm text-text-muted">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> {school.location}
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> {school.tuition}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <a 
                  href={school.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full py-2.5 bg-orange text-white rounded-lg font-medium hover:bg-orange-light transition-colors gap-2"
                >
                  Demande d'admission <ExternalLink className="w-4 h-4" />
                </a>
                <a 
                  href={school.programDir}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full py-2.5 border border-border text-text-secondary rounded-lg font-medium hover:bg-bg-light transition-colors gap-2"
                >
                  Détails du programme
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {visibleCount < filteredSchools.length && (
        <button 
          onClick={() => setVisibleCount(prev => prev + 12)}
          className="w-full py-4 bg-surface border border-border text-text-secondary font-medium rounded-xl hover:bg-bg-light transition-colors shadow-sm"
        >
          Voir plus de formations
        </button>
      )}
    </div>
  );
}
