import React, { useState } from 'react';
import { StripeCardForm } from './StripeCardForm';
import { PayPalButton } from './PayPalButton';
import { InteracInstructions } from './InteracInstructions';
import { BankTransferInstructions } from './BankTransferInstructions';
import { formatMoney } from '../lib/public-config';

type PaymentMethod = 'card' | 'paypal' | 'interac' | 'bank_transfer';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  invoiceNumber: string;
  services: any[];
  customerEmail?: string;
  customerName?: string;
}

export function PaymentModal({
  isOpen,
  onClose,
  amount,
  invoiceNumber,
  services,
  customerEmail,
  customerName
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const formatPrice = (price: number) => {
    return formatMoney(price, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const paymentMethods = [
    {
      id: 'card' as PaymentMethod,
      name: 'Carte bancaire',
      description: 'Visa, Mastercard, Amex',
      icon: '💳',
      badge: 'Instantané',
      badgeColor: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
    },
    {
      id: 'paypal' as PaymentMethod,
      name: 'PayPal',
      description: 'Compte PayPal ou carte',
      icon: '🅿️',
      badge: 'Sécurisé',
      badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
    },
    {
      id: 'interac' as PaymentMethod,
      name: 'Interac e-Transfer',
      description: 'Virement instantané',
      icon: '📧',
      badge: 'Populaire au Canada',
      badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20'
    },
    {
      id: 'bank_transfer' as PaymentMethod,
      name: 'Virement bancaire',
      description: 'Transfert direct',
      icon: '🏦',
      badge: '2-5 jours',
      badgeColor: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20'
    }
  ];

  const handlePaymentSuccess = () => {
    setPaymentStatus('success');
    setTimeout(() => {
      onClose();
      // Redirect or refresh
      window.location.href = '/dashboard?payment=success&invoice=' + invoiceNumber;
    }, 2000);
  };

  const handlePaymentError = (error: string) => {
    setPaymentStatus('error');
    setErrorMessage(error);
  };

  const handleManualConfirm = () => {
    // For Interac and Bank Transfer
    setPaymentStatus('success');
    setTimeout(() => {
      onClose();
      window.location.href = '/dashboard?payment=pending&invoice=' + invoiceNumber;
    }, 1500);
  };

  const resetSelection = () => {
    setSelectedMethod(null);
    setPaymentStatus('idle');
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Paiement sécurisé</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Facture : <span className="font-mono font-semibold text-foreground">{invoiceNumber}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg hover:bg-muted/50 transition flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {paymentStatus === 'success' ? (
            // Success State
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Paiement confirmé !</h3>
              <p className="text-muted-foreground text-center mb-4">
                Votre paiement a été traité avec succès
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Redirection en cours...</span>
              </div>
            </div>
          ) : !selectedMethod ? (
            // Method Selection
            <div>
              <div className="text-center mb-8">
                <div className="inline-block bg-primary/10 px-6 py-3 rounded-lg mb-4">
                  <p className="text-sm text-muted-foreground mb-1">Montant total</p>
                  <p className="text-4xl font-bold text-primary">{formatPrice(amount)}</p>
                </div>
                <p className="text-muted-foreground">
                  Choisissez votre mode de paiement préféré
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className="group relative bg-card border-2 border-border hover:border-primary/50 rounded-xl p-6 text-left transition-all hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-5xl">{method.icon}</div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${method.badgeColor}`}>
                        {method.badge}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition">
                      {method.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {method.description}
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition">
                      <span className="text-sm font-semibold">Sélectionner</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>

              {/* Trust Badges */}
              <div className="mt-8 pt-6 border-t border-border">
                <div className="flex items-center justify-center gap-8 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Paiement 100% sécurisé</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Données cryptées SSL</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Payment Form
            <div>
              {/* Back Button */}
              <button
                onClick={resetSelection}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-6"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Changer de mode de paiement</span>
              </button>

              {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-red-600 dark:text-red-400 mb-1">Erreur de paiement</p>
                      <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Render selected payment method */}
              {selectedMethod === 'card' && (
                <StripeCardForm
                  amount={amount}
                  invoiceId={invoiceNumber}
                  services={services}
                  customerEmail={customerEmail}
                  customerName={customerName}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              )}

              {selectedMethod === 'paypal' && (
                <PayPalButton
                  amount={amount}
                  invoiceId={invoiceNumber}
                  description={`CAPITUNE - Services - ${invoiceNumber}`}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              )}

              {selectedMethod === 'interac' && (
                <InteracInstructions
                  amount={amount}
                  invoiceNumber={invoiceNumber}
                  onConfirm={handleManualConfirm}
                />
              )}

              {selectedMethod === 'bank_transfer' && (
                <BankTransferInstructions
                  amount={amount}
                  invoiceNumber={invoiceNumber}
                  onConfirm={handleManualConfirm}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
