import { useState, useMemo } from 'react';
import { Search, MapPin, DollarSign, Users, Calendar, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { ALL_HOUSING } from '@/data/mockData';

export default function HousingSearch() {
  const [filters, setFilters] = useState({
    city: 'Montreal',
    budget: 2500,
    people: 1
  });
  const [visibleCount, setVisibleCount] = useState(12);

  const filteredHousing = useMemo(() => {
    return ALL_HOUSING.filter(item => item.price <= filters.budget);
  }, [filters.budget]);

  const visibleHousing = filteredHousing.slice(0, visibleCount);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text">Trouver un logement</h1>
          <p className="text-text-muted mt-2">Recherchez des appartements, colocations ou maisons à louer.</p>
        </div>
        <div className="bg-orange/10 px-4 py-2 rounded-lg border border-orange/20 text-orange font-medium whitespace-nowrap">
          <span className="font-bold text-xl mr-1">54,320</span> Logements disponibles
        </div>
      </div>

      {/* Search Filters */}
      <div className="bg-surface p-6 rounded-xl shadow-sm border border-border sticky top-0 z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Ville</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
              <select 
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-orange/20"
                value={filters.city}
                onChange={(e) => setFilters({...filters, city: e.target.value})}
              >
                <option value="Montreal">Montréal</option>
                <option value="Quebec">Québec</option>
                <option value="Sherbrooke">Sherbrooke</option>
                <option value="Gatineau">Gatineau</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Budget Max ({filters.budget} $)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
              <input 
                type="range" 
                min="500"
                max="5000"
                step="100"
                className="w-full mt-3 accent-orange"
                value={filters.budget}
                onChange={(e) => setFilters({...filters, budget: parseInt(e.target.value)})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Personnes</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
              <select 
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-orange/20"
                value={filters.people}
                onChange={(e) => setFilters({...filters, people: parseInt(e.target.value)})}
              >
                <option value={1}>1 personne</option>
                <option value={2}>2 personnes</option>
                <option value={3}>3+ personnes</option>
              </select>
            </div>
          </div>

          <div className="flex items-end">
            <button className="w-full py-2.5 bg-orange text-white font-medium rounded-lg hover:bg-orange-light transition-colors">
              Rechercher
            </button>
          </div>
        </div>
        <div className="mt-4 text-xs text-text-muted text-right border-t border-border pt-2">
          {visibleHousing.length} résultats affichés sur {filteredHousing.length}
        </div>
      </div>

      {/* Listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {visibleHousing.map((item) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface rounded-xl border border-border overflow-hidden flex flex-col sm:flex-row hover:shadow-md transition-shadow"
          >
            <div className="sm:w-48 h-48 sm:h-auto bg-bg-light relative shrink-0 overflow-hidden group">
              {/* Try to fetch OG image from the URL using Microlink */}
              <img 
                src={`https://api.microlink.io/?url=${encodeURIComponent(item.url)}&embed=image.url`} 
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                onError={(e) => {
                  // Fallback to generic image if microlink fails or no image found
                  e.currentTarget.src = `https://picsum.photos/seed/${item.img}${item.id}/400/400`;
                }}
              />
              <div className="absolute top-2 right-2 bg-surface/90 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-sm border border-border">
                {item.price} $
              </div>
            </div>
            <div className="p-5 flex flex-col flex-1">
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-text line-clamp-1">{item.title}</h3>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-bold text-orange">{item.price} $</span>
                    <span className="text-xs bg-bg-light px-2 py-1 rounded text-text-secondary shrink-0">{item.type}</span>
                  </div>
                </div>
                <p className="text-text-muted text-sm mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {item.location}
                </p>
                <div className="mt-4 flex gap-4 text-sm text-text-secondary">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-text-muted" /> {item.beds > 0 ? `${item.beds} ch.` : 'Studio'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-text-muted" /> Libre
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border flex gap-2">
                <a 
                  href={`https://rentals.ca/${item.location.split(',')[0].toLowerCase()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center py-2 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-light transition-colors"
                >
                  Contacter
                </a>
                <a 
                  href={`https://www.realtor.ca/map#ZoomLevel=10&Center=45.5017%2C-73.5673&LatitudeMax=45.7&LongitudeMax=-73.4&LatitudeMin=45.3&LongitudeMin=-73.8&Sort=6-D&PropertyTypeGroupID=1&PropertySearchTypeId=1&TransactionTypeId=3&Currency=CAD`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 border border-border text-text-secondary rounded-lg hover:bg-bg-light flex items-center"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {visibleCount < filteredHousing.length && (
        <button 
          onClick={() => setVisibleCount(prev => prev + 12)}
          className="w-full py-4 bg-surface border border-border text-text-secondary font-medium rounded-xl hover:bg-bg-light transition-colors shadow-sm"
        >
          Voir plus de logements
        </button>
      )}
    </div>
  );
}
