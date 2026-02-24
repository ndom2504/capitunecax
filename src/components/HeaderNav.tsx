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
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-row items-center justify-between h-20">
          <a href={`${baseUrl}/`} className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-base leading-none">C</span>
            <span className="text-2xl font-bold text-primary font-heading leading-none">CAPITUNE</span>
          </a>

          <nav className="hidden lg:flex flex-row items-center gap-2">
            <a
              href={`${baseUrl}/`}
              className={`px-4 py-2 rounded-lg transition font-medium leading-none ${
                isActive('accueil')
                  ? 'text-primary bg-primary/10 font-semibold'
                  : 'text-foreground hover:text-primary hover:bg-muted/50'
              }`}
            >
              Accueil
            </a>
            <a
              href={`${baseUrl}/#services`}
              className={`px-4 py-2 rounded-lg transition font-medium leading-none ${
                isActive('services')
                  ? 'text-primary bg-primary/10 font-semibold'
                  : 'text-foreground hover:text-primary hover:bg-muted/50'
              }`}
            >
              Services
            </a>
            <a
              href={`${baseUrl}/tarifs`}
              className={`px-4 py-2 rounded-lg transition font-medium leading-none ${
                isActive('tarifs')
                  ? 'text-primary bg-primary/10 font-semibold'
                  : 'text-foreground hover:text-primary hover:bg-muted/50'
              }`}
            >
              Tarifs
            </a>
            <a
              href={`${baseUrl}/a-propos`}
              className={`px-4 py-2 rounded-lg transition font-medium leading-none ${
                isActive('a-propos')
                  ? 'text-primary bg-primary/10 font-semibold'
                  : 'text-foreground hover:text-primary hover:bg-muted/50'
              }`}
            >
              À Propos
            </a>
            <a
              href={`${baseUrl}/connexion`}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg hover:bg-primary/90 transition font-semibold leading-none ml-2"
            >
              Connexion
            </a>
          </nav>

          <button
            className="lg:hidden p-2"
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
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background">
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


