import React, { useState } from 'react';
import { formatMoney } from '../lib/public-config';

interface BankTransferInstructionsProps {
  amount: number;
  invoiceNumber: string;
  onConfirm: () => void;
}

export function BankTransferInstructions({ amount, invoiceNumber, onConfirm }: BankTransferInstructionsProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const bankInfo = {
    accountName: import.meta.env.PUBLIC_BANK_ACCOUNT_NAME || import.meta.env.BANK_ACCOUNT_NAME || 'Export Monde Prestige Inc.',
    bankName: import.meta.env.PUBLIC_BANK_NAME || import.meta.env.BANK_NAME || 'Banque TD',
    transit: import.meta.env.PUBLIC_BANK_TRANSIT || import.meta.env.BANK_TRANSIT || '12345',
    institution: import.meta.env.PUBLIC_BANK_INSTITUTION || import.meta.env.BANK_INSTITUTION || '004',
    account: import.meta.env.PUBLIC_BANK_ACCOUNT || import.meta.env.BANK_ACCOUNT || '1234567'
  };

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
        <div className="text-6xl mb-4">🏦</div>
        <h3 className="text-2xl font-bold text-foreground mb-2">Virement bancaire</h3>
        <p className="text-muted-foreground">
          Effectuez un virement depuis votre institution bancaire
        </p>
      </div>

      {/* Bank Details Card */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-8">
        <div className="space-y-6">
          {/* Account Name */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Nom du bénéficiaire
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-foreground">{bankInfo.accountName}</span>
            </div>
          </div>

          {/* Bank Name */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Institution financière
            </p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-foreground">{bankInfo.bankName}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Transit */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Numéro de transit
              </p>
              <div className="bg-background/80 backdrop-blur p-3 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-lg font-bold text-foreground">{bankInfo.transit}</span>
                  <button
                    onClick={() => copyToClipboard(bankInfo.transit, 'transit')}
                    className="text-primary hover:text-primary/80 transition"
                  >
                    {copied === 'transit' ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Institution */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Numéro d'institution
              </p>
              <div className="bg-background/80 backdrop-blur p-3 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-lg font-bold text-foreground">{bankInfo.institution}</span>
                  <button
                    onClick={() => copyToClipboard(bankInfo.institution, 'institution')}
                    className="text-primary hover:text-primary/80 transition"
                  >
                    {copied === 'institution' ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Account Number */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Numéro de compte
            </p>
            <div className="bg-background/80 backdrop-blur p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <span className="font-mono text-2xl font-bold text-foreground tracking-wider">{bankInfo.account}</span>
                <button
                  onClick={() => copyToClipboard(bankInfo.account, 'account')}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-sm font-semibold"
                >
                  {copied === 'account' ? '✓ Copié' : 'Copier'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Amount Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">Montant à transférer</p>
          <p className="text-4xl font-bold text-primary mb-2">{formatPrice(amount)}</p>
        </div>
      </div>

      {/* Reference */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Référence obligatoire</p>
            <p className="text-xs text-muted-foreground">À inclure dans le champ "Description" ou "Référence"</p>
          </div>
        </div>
        <div className="flex items-center justify-between bg-yellow-500/10 border-2 border-yellow-500/30 p-4 rounded-lg">
          <span className="font-mono text-xl font-bold text-foreground">{invoiceNumber}</span>
          <button
            onClick={() => copyToClipboard(invoiceNumber, 'reference')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-sm font-semibold"
          >
            {copied === 'reference' ? '✓ Copié' : 'Copier'}
          </button>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
        <div className="flex gap-3">
          <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="text-sm">
            <p className="font-semibold text-foreground mb-2">⚠️ Important</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Le virement bancaire peut prendre <strong>2 à 5 jours ouvrables</strong></li>
              <li>• Assurez-vous d'inclure le <strong>numéro de référence {invoiceNumber}</strong> dans votre virement</li>
              <li>• Sans référence, nous ne pourrons pas identifier votre paiement</li>
              <li>• Conservez votre preuve de virement</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Comment effectuer le virement ?
        </h4>
        <ol className="space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <span className="font-bold text-primary">1.</span>
            <span>Connectez-vous au service bancaire en ligne de votre institution</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-primary">2.</span>
            <span>Sélectionnez "Virement" ou "Paiement à un autre compte"</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-primary">3.</span>
            <span>Ajoutez un nouveau bénéficiaire avec les informations ci-dessus</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-primary">4.</span>
            <span>Entrez le montant et <strong className="text-foreground">la référence {invoiceNumber}</strong></span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-primary">5.</span>
            <span>Vérifiez toutes les informations et confirmez le virement</span>
          </li>
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
        J'ai effectué le virement
      </button>

      <p className="text-xs text-center text-muted-foreground">
        Nous vous contacterons dès réception du virement pour confirmer votre paiement
      </p>
    </div>
  );
}
