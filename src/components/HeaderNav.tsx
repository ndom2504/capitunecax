import React from 'react';
import { baseUrl } from '../lib/base-url';

export function HeaderNav() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('accueil');

  React.useEffect(() => {
    // Determine active tab based on current URL
    const path = window.location.pathname;
    const hash = window.location.hash;
    
    if (path.endsWith('/tarifs')) {
      setActiveTab('tarifs');
    } else if (path.endsWith('/a-propos')) {
      setActiveTab('a-propos');
    } else if (hash === '#services') {
      setActiveTab('services');
    } else if (path.endsWith('/') || path.endsWith('/index.astro')) {
      setActiveTab('accueil');
    }
  }, []);

  const isActive = (tab: string) => activeTab === tab;

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto">
        <nav className="flex items-center justify-between py-4 px-4 md:px-6">
          {/* Logo */}
          <a href={`${baseUrl}/`} className="flex items-center">
            <span className="text-2xl font-bold text-primary font-heading">CAPITUNE</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <a 
              href={`${baseUrl}/`} 
              className={`px-4 py-2 rounded-lg transition font-medium relative ${
                isActive('accueil')
                  ? 'text-primary bg-primary/10 font-semibold'
                  : 'text-foreground hover:text-primary hover:bg-muted/50'
              }`}
            >
              Accueil
              {isActive('accueil') && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>
              )}
            </a>
            <a 
              href={`${baseUrl}/#services`} 
              className={`px-4 py-2 rounded-lg transition font-medium relative ${
                isActive('services')
                  ? 'text-primary bg-primary/10 font-semibold'
                  : 'text-foreground hover:text-primary hover:bg-muted/50'
              }`}
            >
              Services
              {isActive('services') && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>
              )}
            </a>
            <a 
              href={`${baseUrl}/tarifs`} 
              className={`px-4 py-2 rounded-lg transition font-medium relative ${
                isActive('tarifs')
                  ? 'text-primary bg-primary/10 font-semibold'
                  : 'text-foreground hover:text-primary hover:bg-muted/50'
              }`}
            >
              Tarifs
              {isActive('tarifs') && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>
              )}
            </a>
            <a 
              href={`${baseUrl}/a-propos`} 
              className={`px-4 py-2 rounded-lg transition font-medium relative ${
                isActive('a-propos')
                  ? 'text-primary bg-primary/10 font-semibold'
                  : 'text-foreground hover:text-primary hover:bg-muted/50'
              }`}
            >
              À Propos
              {isActive('a-propos') && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>
              )}
            </a>
            <a
              href={`${baseUrl}/connexion`}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg hover:bg-primary/90 transition font-semibold ml-2"
            >
              Connexion
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-6 h-5 relative flex flex-col justify-between">
              <div
                className={`h-0.5 bg-foreground transition-all duration-300 ${
                  isMenuOpen ? 'rotate-45 translate-y-2' : ''
                }`}
              />
              <div
                className={`h-0.5 bg-foreground transition-all duration-300 ${
                  isMenuOpen ? 'opacity-0' : ''
                }`}
              />
              <div
                className={`h-0.5 bg-foreground transition-all duration-300 ${
                  isMenuOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
              />
            </div>
          </button>
        </nav>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="py-4 px-4 flex flex-col gap-3">
              <a
                href={`${baseUrl}/`}
                className={`text-foreground ${isActive('accueil') ? 'text-primary font-semibold' : 'hover:text-primary transition font-medium'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Accueil
              </a>
              <a
                href={`${baseUrl}/#services`}
                className={`text-foreground ${isActive('services') ? 'text-primary font-semibold' : 'hover:text-primary transition font-medium'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Services
              </a>
              <a
                href={`${baseUrl}/tarifs`}
                className={`text-foreground ${isActive('tarifs') ? 'text-primary font-semibold' : 'hover:text-primary transition font-medium'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Tarifs
              </a>
              <a
                href={`${baseUrl}/a-propos`}
                className={`text-foreground ${isActive('a-propos') ? 'text-primary font-semibold' : 'hover:text-primary transition font-medium'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                À Propos
              </a>
              <a
                href={`${baseUrl}/connexion`}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition text-center mt-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Connexion
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}


