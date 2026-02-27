import React from 'react';
import { baseUrl } from '../lib/base-url';
import { servicesCatalog } from '../lib/service-catalog';
import { getContactAddressLines, publicConfig } from '../lib/public-config';

export function FooterCustom() {
  const currentYear = new Date().getFullYear();
  const addressLines = getContactAddressLines();
  const locationLine = addressLines[addressLines.length - 1] ?? 'Montréal, QC, Canada';

  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <h2 className="text-2xl font-bold text-primary font-heading mb-4">CAPITUNE</h2>
            <p className="text-muted-foreground text-sm">
              Votre partenaire de confiance pour votre projet au Canada
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-bold text-foreground mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <a href={`${baseUrl}/`} className="text-muted-foreground hover:text-primary transition text-sm">
                  Accueil
                </a>
              </li>
              <li>
                <a href={`${baseUrl}/#services`} className="text-muted-foreground hover:text-primary transition text-sm">
                  Services
                </a>
              </li>
              <li>
                <a href={`${baseUrl}/a-propos`} className="text-muted-foreground hover:text-primary transition text-sm">
                  À propos
                </a>
              </li>
              <li>
                <a href={`${baseUrl}/contact`} className="text-muted-foreground hover:text-primary transition text-sm">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-bold text-foreground mb-4">Nos Services</h3>
            <ul className="space-y-2">
              {servicesCatalog.map((service) => (
                <li key={service.id} className="text-muted-foreground text-sm">
                  {service.name}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-bold text-foreground mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="text-muted-foreground text-sm">
                📧 {publicConfig.contactEmail}
              </li>
              <li className="text-muted-foreground text-sm">
                📞 {publicConfig.contactPhone}
              </li>
              <li className="text-muted-foreground text-sm">
                📍 {locationLine}
              </li>
            </ul>
            
            {/* Social Media */}
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center hover:bg-primary/20 transition" aria-label="Facebook">
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center hover:bg-primary/20 transition" aria-label="LinkedIn">
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a href="#" className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center hover:bg-primary/20 transition" aria-label="Twitter">
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} CAPITUNE. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition">
              Politique de confidentialité
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition">
              Conditions d'utilisation
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
