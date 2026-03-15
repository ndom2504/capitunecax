import React from 'react';
import { baseUrl } from '../lib/base-url';

export function HeaderNav() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <>
      <style>{`
        .cap-header {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: #0a1628;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 2px 16px rgba(0,0,0,0.18);
        }
        .cap-header-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 72px;
          gap: 24px;
        }
        .cap-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          flex-shrink: 0;
        }
        .cap-logo img {
          height: 38px;
          width: auto;
          display: block;
        }
        .cap-nav {
          display: flex;
          align-items: center;
          gap: 4px;
          flex: 1;
          justify-content: center;
        }
        .cap-nav a {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: rgba(255,255,255,0.75);
          text-decoration: none;
          transition: color 0.18s, background 0.18s;
          white-space: nowrap;
        }
        .cap-nav a:hover, .cap-nav a.active {
          color: #fff;
          background: rgba(255,255,255,0.08);
        }
        .cap-connexion {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ff9408;
          color: #fff;
          font-weight: 700;
          font-size: 14px;
          padding: 10px 22px;
          border-radius: 50px;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 2px 10px rgba(255,148,8,0.35);
          flex-shrink: 0;
        }
        .cap-connexion:hover {
          background: #e07800;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(255,148,8,0.45);
        }
        .cap-burger {
          display: none;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 5px;
          width: 40px;
          height: 40px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          cursor: pointer;
          padding: 0;
          flex-shrink: 0;
        }
        .cap-burger span {
          display: block;
          width: 20px;
          height: 2px;
          background: #fff;
          border-radius: 2px;
          transition: transform 0.25s, opacity 0.25s;
        }
        .cap-mobile-menu {
          background: #0d1f38;
          border-top: 1px solid rgba(255,255,255,0.08);
          padding: 16px 24px 24px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .cap-mobile-menu a {
          display: block;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          color: rgba(255,255,255,0.8);
          text-decoration: none;
          transition: background 0.18s, color 0.18s;
        }
        .cap-mobile-menu a:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .cap-mobile-menu .cap-mobile-cta {
          background: #ff9408;
          color: #fff;
          margin-top: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 50px;
          padding: 14px;
        }
        .cap-mobile-menu .cap-mobile-cta:hover { background: #e07800; }
        @media (max-width: 900px) {
          .cap-nav { display: none !important; }
          .cap-connexion { display: none !important; }
          .cap-burger { display: flex !important; }
        }
      `}</style>

      <header className="cap-header">
        <div className="cap-header-inner">
          <a href={`${baseUrl}/`} className="cap-logo">
            <img src="/logo/capitune.png" alt="CAPITUNE" />
          </a>

          <nav className="cap-nav">
            <a href={`${baseUrl}/`}>Accueil</a>
            <a href={`${baseUrl}/a-propos`}>À propos</a>
            <a href={`${baseUrl}/#services`}>Services</a>
            <a href={`${baseUrl}/contact`}>Contact</a>
            <a href={`${baseUrl}/support`}>Support</a>
          </nav>

          <a href={`${baseUrl}/connexion`} className="cap-connexion">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Connexion
          </a>

          <button className="cap-burger" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Menu">
            <span style={{ transform: isMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ opacity: isMenuOpen ? 0 : 1 }} />
            <span style={{ transform: isMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </button>
        </div>

        {isMenuOpen && (
          <div className="cap-mobile-menu">
            <a href={`${baseUrl}/`} onClick={() => setIsMenuOpen(false)}>Accueil</a>
            <a href={`${baseUrl}/a-propos`} onClick={() => setIsMenuOpen(false)}>À propos</a>
            <a href={`${baseUrl}/#services`} onClick={() => setIsMenuOpen(false)}>Services</a>
            <a href={`${baseUrl}/contact`} onClick={() => setIsMenuOpen(false)}>Contact</a>
            <a href={`${baseUrl}/support`} onClick={() => setIsMenuOpen(false)}>Support</a>
            <a href={`${baseUrl}/connexion`} className="cap-mobile-cta" onClick={() => setIsMenuOpen(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              Connexion
            </a>
          </div>
        )}
      </header>
    </>
  );
}

