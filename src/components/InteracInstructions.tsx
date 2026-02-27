import React, { useState } from 'react';
import { formatMoney } from '../lib/public-config';

interface InteracInstructionsProps {
  amount: number;
  invoiceNumber: string;
  onConfirm: () => void;
}

export function InteracInstructions({ amount, invoiceNumber, onConfirm }: InteracInstructionsProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const interacEmail = import.meta.env.PUBLIC_INTERAC_EMAIL || import.meta.env.INTERAC_EMAIL || 'paiements@capitune.com';

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatPrice = (price: number) => {
    return formatMoney(price, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="text-6xl mb-4">📧</div>
        <h3 className="text-2xl font-bold text-foreground mb-2">Paiement par Interac e-Transfer</h3>
        <p className="text-muted-foreground">
          Suivez les étapes ci-dessous pour effectuer votre paiement
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-6">
        {/* Step 1: Email */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <p className="text-sm font-semibold text-foreground">Destinataire (email)</p>
          </div>
          <div className="ml-10">
            <div className="flex items-center justify-between bg-muted p-4 rounded-lg border border-border">
              <span className="font-mono text-lg font-semibold text-foreground">{interacEmail}</span>
              <button
                onClick={() => copyToClipboard(interacEmail, 'email')}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-sm font-semibold"
              >
                {copied === 'email' ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copié !
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copier
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Step 2: Amount */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <p className="text-sm font-semibold text-foreground">Montant exact à envoyer</p>
          </div>
          <div className="ml-10">
            <div className="bg-primary/10 border-2 border-primary/30 p-6 rounded-lg text-center">
              <p className="text-4xl font-bold text-primary">{formatPrice(amount)}</p>
            </div>
          </div>
        </div>

        {/* Step 3: Reference */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <p className="text-sm font-semibold text-foreground">Numéro de référence (IMPORTANT)</p>
          </div>
          <div className="ml-10">
            <div className="flex items-center justify-between bg-muted p-4 rounded-lg border border-border">
              <span className="font-mono text-lg font-bold text-primary">{invoiceNumber}</span>
              <button
                onClick={() => copyToClipboard(invoiceNumber, 'reference')}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-sm font-semibold"
              >
                {copied === 'reference' ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copié !
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copier
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ⚠️ Ajoutez ce numéro dans le message ou la question de sécurité
            </p>
          </div>
        </div>

        {/* Step 4: Security Question */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
              4
            </div>
            <p className="text-sm font-semibold text-foreground">Question de sécurité (optionnel)</p>
          </div>
          <div className="ml-10">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Question :</span>
                  <span className="font-semibold text-foreground">CAPITUNE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Réponse :</span>
                  <span className="font-mono font-bold text-primary">{invoiceNumber}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
        <div className="flex gap-3">
          <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="text-sm">
            <p className="font-semibold text-foreground mb-2">📋 Points importants :</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Les virements Interac sont généralement instantanés</li>
              <li>• <strong>Le numéro de référence est obligatoire</strong> pour identifier votre paiement</li>
              <li>• Nous confirmerons la réception sous 1h durant les heures ouvrables</li>
              <li>• Conservez votre confirmation de virement</li>
            </ul>
          </div>
        </div>
      </div>

      {/* How to send */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Comment envoyer un virement Interac ?
        </h4>
        <ol className="space-y-3 text-sm text-muted-foreground">
          <li>1. Connectez-vous à votre banque en ligne ou application mobile</li>
          <li>2. Sélectionnez "Interac e-Transfer" ou "Virement Interac"</li>
          <li>3. Entrez le destinataire : <strong className="text-foreground">{interacEmail}</strong></li>
          <li>4. Entrez le montant : <strong className="text-foreground">{formatPrice(amount)}</strong></li>
          <li>5. Ajoutez la référence : <strong className="text-foreground">{invoiceNumber}</strong></li>
          <li>6. Confirmez et envoyez</li>
        </ol>
      </div>

      {/* Confirmation Button */}
      <button
        onClick={onConfirm}
        className="w-full bg-primary text-primary-foreground py-4 rounded-lg font-semibold hover:bg-primary/90 transition flex items-center justify-center gap-3 text-lg"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        J'ai envoyé le virement
      </button>

      <p className="text-xs text-center text-muted-foreground">
        Après avoir cliqué, nous recevrons une notification et traiterons votre paiement rapidement
      </p>
    </div>
  );
}
