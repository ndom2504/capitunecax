import { useState, useMemo } from 'react';
import { Search, MapPin, DollarSign, Clock, Briefcase, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { ALL_JOBS } from '@/data/mockData';

export default function JobSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);

  const filteredJobs = useMemo(() => {
    return ALL_JOBS.filter(job => 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const visibleJobs = filteredJobs.slice(0, visibleCount);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text">Recherche d'emploi</h1>
          <p className="text-text-muted mt-2">Explorez les opportunités sur le Guichet-Emplois et Jobillico.</p>
        </div>
        <div className="bg-success/10 px-4 py-2 rounded-lg border border-success/20 text-success font-medium whitespace-nowrap">
          <span className="font-bold text-xl mr-1">124,050</span> Offres en direct
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-surface p-4 rounded-xl shadow-sm border border-border sticky top-0 z-10">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
            <input 
              type="text" 
              placeholder="Poste, mots-clés..." 
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-orange/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
            <input 
              type="text" 
              placeholder="Ville ou province" 
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-orange/20"
            />
          </div>
          <button className="px-6 py-3 bg-orange text-white font-medium rounded-lg hover:bg-orange-light transition-colors">
            Rechercher
          </button>
        </div>
        <div className="mt-2 text-xs text-text-muted text-right">
          Affichage de {visibleJobs.length} sur {filteredJobs.length} résultats
        </div>
      </div>

      {/* Job Grid */}
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleJobs.map((job) => (
            <motion.div 
              key={job.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface p-6 rounded-xl border border-border hover:shadow-md transition-all group flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold text-xl shrink-0">
                  {job.company[0]}
                </div>
                <span className="bg-orange/10 text-orange px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                  {job.type}
                </span>
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-lg text-text group-hover:text-orange transition-colors line-clamp-1" title={job.title}>
                  {job.title}
                </h3>
                <p className="text-text-secondary font-medium mb-4">{job.company}</p>

                <div className="space-y-2 text-sm text-text-muted">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-text-muted" /> {job.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-text-muted" /> {job.salary}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-text-muted" /> {job.posted}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <a 
                  href={`https://www.guichetemplois.gc.ca/jobsearch/jobsearch?searchstring=${encodeURIComponent(job.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full py-2.5 bg-orange text-white font-medium rounded-lg hover:bg-orange-light transition-colors gap-2"
                >
                  Postuler <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {visibleCount < filteredJobs.length && (
          <button 
            onClick={() => setVisibleCount(prev => prev + 20)}
            className="w-full py-4 bg-surface border border-border text-text-secondary font-medium rounded-xl hover:bg-bg-light transition-colors shadow-sm"
          >
            Charger plus d'offres ({filteredJobs.length - visibleCount} restantes)
          </button>
        )}
      </div>
    </div>
  );
}
