import React from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { baseUrl } from '../lib/base-url';
import { formatMoney, publicConfig } from '../lib/public-config';

interface PayPalButtonProps {
  amount: number;
  invoiceId: string;
  description?: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function PayPalButton({ 
  amount, 
  invoiceId, 
  description,
  onSuccess, 
  onError 
}: PayPalButtonProps) {
  const clientId = import.meta.env.PUBLIC_PAYPAL_CLIENT_ID || 'test';
  const currency = (publicConfig.paymentCurrency || 'CAD').toUpperCase();

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Montant à payer</p>
            <p className="text-2xl font-bold text-primary">
              {formatMoney(amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-4xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="100" height="32" viewBox="0 0 100 32">
              <path fill="#003087" d="M12 4h8c4.4 0 7 2.4 7 6.5 0 4.4-3.4 7.5-8 7.5h-3l-1.5 8H12l2-22zm5.5 11h2c2.5 0 4-1.2 4-3.5S21.5 8 19 8h-2l-1 7h1.5z"/>
              <path fill="#009cde" d="M29 4h8c4.4 0 7 2.4 7 6.5 0 4.4-3.4 7.5-8 7.5h-3l-1.5 8H29l2-22zm5.5 11h2c2.5 0 4-1.2 4-3.5S38.5 8 36 8h-2l-1 7h1.5z"/>
            </svg>
          </div>
        </div>

        <PayPalScriptProvider 
          options={{ 
            clientId,
            currency,
            intent: 'capture'
          }}
        >
          <PayPalButtons
            style={{
              layout: 'vertical',
              color: 'blue',
              shape: 'rect',
              label: 'pay'
            }}
            createOrder={async () => {
              try {
                const response = await fetch(`${baseUrl}/api/payments/paypal-create-order`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    amount, 
                    invoiceId,
                    description: description || `CAPITUNE - ${invoiceId}`
                  }),
                });
                
                const data = await response.json();
                
                if (data.error) {
                  throw new Error(data.error);
                }
                
                return data.id;
              } catch (error: any) {
                onError(error.message || 'PayPal order creation failed');
                throw error;
              }
            }}
            onApprove={async (data) => {
              try {
                const response = await fetch(`${baseUrl}/api/payments/paypal-capture-order`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ orderId: data.orderID }),
                });
                
                const captureData = await response.json();
                
                if (captureData.error) {
                  throw new Error(captureData.error);
                }
                
                onSuccess();
              } catch (error: any) {
                onError(error.message || 'PayPal capture failed');
              }
            }}
            onError={(err) => {
              console.error('PayPal error:', err);
              onError('Une erreur PayPal est survenue');
            }}
            onCancel={() => {
              onError('Paiement annulé');
            }}
          />
        </PayPalScriptProvider>
      </div>

      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Paiement sécurisé par PayPal</span>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">💡 Protection acheteur PayPal</p>
            <p>Vous bénéficiez de la protection PayPal pour tous vos paiements.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
