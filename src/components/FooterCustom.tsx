import React from 'react';
import { baseUrl } from '../lib/base-url';
import { publicConfig } from '../lib/public-config';

export function FooterCustom() {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <style>{`
        .cap-footer {
          background: #0a1628;
          border-top: 1px solid rgba(255,255,255,0.07);
          padding: 56px 24px 28px;
          color: #fff;
        }
        .cap-footer-inner {
          max-width: 1200px;
          margin: 0 auto;
        }
        .cap-footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.5fr;
          gap: 40px;
          margin-bottom: 40px;
        }
        @media (max-width: 900px) { .cap-footer-grid { grid-template-columns: 1fr 1fr; gap: 28px; } }
        @media (max-width: 560px) { .cap-footer-grid { grid-template-columns: 1fr; gap: 24px; } }

        .cap-footer-brand img { height: 36px; width: auto; margin-bottom: 14px; }
        .cap-footer-brand p { color: rgba(255,255,255,0.55); font-size: 14px; line-height: 1.65; margin: 0 0 20px; max-width: 280px; }
        .cap-footer-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ff9408;
          color: #fff;
          font-weight: 700;
          font-size: 13px;
          padding: 10px 20px;
          border-radius: 50px;
          text-decoration: none;
          transition: background .2s;
        }
        .cap-footer-cta:hover { background: #e07800; }

        .cap-footer-col-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          margin: 0 0 18px;
        }
        .cap-footer-links { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
        .cap-footer-links a {
          color: rgba(255,255,255,0.6);
          text-decoration: none;
          font-size: 14px;
          transition: color .18s;
        }
        .cap-footer-links a:hover { color: #ff9408; }

        .cap-footer-contact { display: flex; flex-direction: column; gap: 12px; }
        .cap-footer-contact-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13px;
          color: rgba(255,255,255,0.6);
          line-height: 1.5;
        }
        .cap-footer-contact-item svg { flex-shrink: 0; color: #ff9408; margin-top: 1px; }
        .cap-footer-contact-item a { color: rgba(255,255,255,0.6); text-decoration: none; }
        .cap-footer-contact-item a:hover { color: #ff9408; }

        .cap-footer-bottom {
          border-top: 1px solid rgba(255,255,255,0.08);
          padding-top: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
        }
        .cap-footer-bottom p { font-size: 13px; color: rgba(255,255,255,0.35); margin: 0; }
        .cap-footer-legal { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
        .cap-footer-legal a { font-size: 13px; color: rgba(255,255,255,0.4); text-decoration: none; transition: color .18s; }
        .cap-footer-legal a:hover { color: #ff9408; }
      `}</style>

      <footer className="cap-footer">
        <div className="cap-footer-inner">
          <div className="cap-footer-grid">

            {/* Brand */}
            <div className="cap-footer-brand">
              <img src="/logo/capitune.png" alt="CAPITUNE" />
              <p>Votre partenaire de confiance pour votre projet d'immigration et d'installation au Canada.</p>
              <a href={`${baseUrl}/connexion`} className="cap-footer-cta">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Accéder à mon espace
              </a>
            </div>

            {/* Navigation */}
            <div>
              <div className="cap-footer-col-title">Navigation</div>
              <ul className="cap-footer-links">
                <li><a href={`${baseUrl}/`}>Accueil</a></li>
                <li><a href={`${baseUrl}/a-propos`}>À propos</a></li>
                <li><a href={`${baseUrl}/#services`}>Services</a></li>
                <li><a href={`${baseUrl}/contact`}>Contact</a></li>
                <li><a href={`${baseUrl}/support`}>Support</a></li>
              </ul>
            </div>

            {/* Légal */}
            <div>
              <div className="cap-footer-col-title">Légal</div>
              <ul className="cap-footer-links">
                <li><a href={`${baseUrl}/mentions-legales`}>Mentions légales</a></li>
                <li><a href={`${baseUrl}/confidentialite`}>Confidentialité</a></li>
                <li><a href={`${baseUrl}/support`}>Centre d'aide</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <div className="cap-footer-col-title">Contact</div>
              <div className="cap-footer-contact">
                <div className="cap-footer-contact-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg>
                  <a href={`mailto:${publicConfig.contactEmail}`}>{publicConfig.contactEmail}</a>
                </div>
                <div className="cap-footer-contact-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.44 2 2 0 0 1 3.58 2.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l1.03-1.03a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  <a href={`tel:${publicConfig.contactPhone}`}>{publicConfig.contactPhone}</a>
                </div>
                <div className="cap-footer-contact-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span>93 Rue des Castels, Lévis<br />QC G6V 2B8, Canada</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom */}
          <div className="cap-footer-bottom">
            <p>© {currentYear} CAPITUNE – Export Monde Prestige Inc. Tous droits réservés.</p>
            <div className="cap-footer-legal">
              <a href={`${baseUrl}/mentions-legales`}>Mentions légales</a>
              <a href={`${baseUrl}/confidentialite`}>Politique de confidentialité</a>
              <a href={`${baseUrl}/support`}>Centre d'aide</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

