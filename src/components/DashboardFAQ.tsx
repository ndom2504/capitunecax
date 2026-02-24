import React from 'react';
import { DevLinkProvider } from '../site-components/DevLinkProvider';
import { SectionFaq } from '../site-components/SectionFaq';

export function DashboardFAQ() {
  return (
    <div className="space-y-8">
      {/* FAQ Header */}
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Questions Fréquentes
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Retrouvez les réponses aux questions les plus courantes concernant votre dossier d'immigration
        </p>
      </div>

      {/* Custom FAQ Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* FAQ Item 1 */}
        <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-2">Combien de temps prend le traitement ?</h3>
              <p className="text-sm text-muted-foreground">
                Les délais varient selon le programme choisi. En moyenne, comptez 6 à 12 mois pour une résidence permanente et 3 à 6 mois pour un permis de travail. Nous vous tiendrons informé à chaque étape.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Item 2 */}
        <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-2">Quels documents dois-je fournir ?</h3>
              <p className="text-sm text-muted-foreground">
                Les documents requis incluent : passeport valide, diplômes, relevés de notes, lettres de référence, preuves de fonds, certificats médicaux et casier judiciaire. Une liste complète vous sera fournie selon votre cas.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Item 3 */}
        <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-2">Comment effectuer mon paiement ?</h3>
              <p className="text-sm text-muted-foreground">
                Nous acceptons les paiements par carte bancaire (Visa, Mastercard), PayPal, virement bancaire et Interac e-Transfer. Tous les paiements sont sécurisés et vous recevrez une facture détaillée.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Item 4 */}
        <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-2">Comment puis-je suivre mon dossier ?</h3>
              <p className="text-sm text-muted-foreground">
                Utilisez l'onglet "Services" pour voir l'avancement de votre dossier en temps réel. Vous pouvez aussi nous contacter via la messagerie intégrée pour toute question.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Item 5 */}
        <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-2">Mes données sont-elles sécurisées ?</h3>
              <p className="text-sm text-muted-foreground">
                Oui, toutes vos données sont cryptées et stockées de manière sécurisée. Nous respectons les normes de confidentialité canadiennes et ne partageons jamais vos informations sans votre consentement.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Item 6 */}
        <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-2">Que se passe-t-il si mon dossier est refusé ?</h3>
              <p className="text-sm text-muted-foreground">
                En cas de refus, nous analysons les raisons et vous proposons des solutions : correction du dossier, recours administratif ou nouveau programme. Votre succès est notre priorité.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Webflow FAQ Section */}
      <div className="border-t border-border pt-8">
        <DevLinkProvider>
          <SectionFaq />
        </DevLinkProvider>
      </div>

      {/* Contact Support Card */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-3">
          Vous ne trouvez pas votre réponse ?
        </h3>
        <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
          Notre équipe est disponible pour répondre à toutes vos questions personnalisées
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('tabChange', { detail: { tab: 'messagerie' } }));
            }}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
          >
            💬 Contacter le support
          </button>
          <a
            href="mailto:support@capitune.com"
            className="bg-background text-foreground border border-border px-6 py-3 rounded-lg font-semibold hover:bg-muted/50 transition"
          >
            📧 Envoyer un email
          </a>
        </div>
      </div>
    </div>
  );
}
