import React, { useState } from 'react';
import { PaymentModal } from './PaymentModal';

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  title: string;
  issuedDate: string;
  dueDate?: string;
  paidDate?: string;
  services: any[];
}

export function PaymentsTab() {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Mock data - Replace with real data from your backend
  const invoices: Invoice[] = [
    {
      id: '1',
      invoiceNumber: 'INV-2026-002',
      amount: 1200,
      status: 'pending',
      title: 'Accompagnement Standard',
      issuedDate: '15 janvier 2026',
      dueDate: '15 février 2026',
      services: [
        { id: 'consultation', name: 'Consultation' },
        { id: 'orientation', name: 'Orientation' },
        { id: 'dossier', name: 'Montage du dossier' }
      ]
    },
    {
      id: '2',
      invoiceNumber: 'INV-2026-001',
      amount: 300,
      status: 'paid',
      title: 'Consultation initiale',
      issuedDate: '5 janvier 2026',
      paidDate: '5 janvier 2026',
      services: [
        { id: 'consultation', name: 'Consultation stratégique' }
      ]
    }
  ];

  const totalDue = invoices
    .filter(inv => inv.status === 'pending')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalPaid = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const handlePayNow = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPaymentModalOpen(true);
  };

  const downloadInvoice = (invoiceNumber: string) => {
    // TODO: Implement PDF download
    console.log('Downloading invoice:', invoiceNumber);
    alert('La génération de PDF sera implémentée prochainement');
  };

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Paiements et Facturation</h2>
          <p className="text-muted-foreground">Gérez vos paiements et consultez vos factures</p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Solde dû</p>
            <p className="text-2xl font-bold text-foreground">{formatPrice(totalDue)}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Payé à ce jour</p>
            <p className="text-2xl font-bold text-foreground">{formatPrice(totalPaid)}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Factures</p>
            <p className="text-2xl font-bold text-foreground">{invoices.length} factures</p>
          </div>
        </div>

        {/* Invoices List */}
        <div className="bg-card border border-border rounded-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-bold text-foreground">Factures récentes</h3>
          </div>
          
          <div className="divide-y divide-border">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="p-6 hover:bg-muted/30 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {invoice.status === 'pending' && (
                        <span className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-semibold">
                          En attente
                        </span>
                      )}
                      {invoice.status === 'paid' && (
                        <span className="bg-green-500/10 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
                          Payée
                        </span>
                      )}
                      {invoice.status === 'overdue' && (
                        <span className="bg-red-500/10 text-red-700 dark:text-red-400 px-3 py-1 rounded-full text-xs font-semibold">
                          En retard
                        </span>
                      )}
                      <span className="text-sm font-mono text-muted-foreground">#{invoice.invoiceNumber}</span>
                    </div>
                    <p className="font-semibold text-foreground mb-1">{invoice.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Émise le {invoice.issuedDate}
                      {invoice.status === 'pending' && invoice.dueDate && ` • Échéance: ${invoice.dueDate}`}
                      {invoice.status === 'paid' && invoice.paidDate && ` • Payée le ${invoice.paidDate}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold mb-3 ${
                      invoice.status === 'paid' 
                        ? 'text-muted-foreground line-through' 
                        : 'text-foreground'
                    }`}>
                      {formatPrice(invoice.amount)}
                    </p>
                    <div className="flex gap-2">
                      {invoice.status === 'pending' && (
                        <button 
                          onClick={() => handlePayNow(invoice)}
                          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition"
                        >
                          Payer maintenant
                        </button>
                      )}
                      <button 
                        onClick={() => downloadInvoice(invoice.invoiceNumber)}
                        className="bg-background border border-input text-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-muted/50 transition"
                      >
                        Télécharger
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-bold text-foreground">Méthodes de paiement acceptées</h3>
          </div>
          
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-border rounded-lg p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">
                  💳
                </div>
                <div>
                  <p className="font-semibold text-foreground">Carte bancaire</p>
                  <p className="text-sm text-muted-foreground">Visa, Mastercard, Amex</p>
                </div>
              </div>

              <div className="border border-border rounded-lg p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">
                  🅿️
                </div>
                <div>
                  <p className="font-semibold text-foreground">PayPal</p>
                  <p className="text-sm text-muted-foreground">Paiement sécurisé</p>
                </div>
              </div>

              <div className="border border-border rounded-lg p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">
                  📧
                </div>
                <div>
                  <p className="font-semibold text-foreground">Interac e-Transfer</p>
                  <p className="text-sm text-muted-foreground">Virement instantané</p>
                </div>
              </div>

              <div className="border border-border rounded-lg p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">
                  🏦
                </div>
                <div>
                  <p className="font-semibold text-foreground">Virement bancaire</p>
                  <p className="text-sm text-muted-foreground">Transfert direct</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <p className="font-semibold text-foreground mb-1">🔒 Paiement 100% sécurisé</p>
                  <p className="text-sm text-muted-foreground">
                    Tous les paiements sont cryptés et sécurisés. Nous n'enregistrons jamais vos informations bancaires complètes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedInvoice && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedInvoice(null);
          }}
          amount={selectedInvoice.amount}
          invoiceNumber={selectedInvoice.invoiceNumber}
          services={selectedInvoice.services}
          customerEmail="client@example.com"
          customerName="Client Example"
        />
      )}
    </>
  );
}
