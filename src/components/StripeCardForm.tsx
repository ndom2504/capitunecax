import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { 
  Elements, 
  PaymentElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js';
import { baseUrl } from '../lib/base-url';

const stripePromise = loadStripe(import.meta.env.PUBLIC_STRIPE_PUBLIC_KEY || 'pk_test_placeholder');

interface CheckoutFormProps {
  amount: number;
  invoiceId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function CheckoutForm({ amount, invoiceId, onSuccess, onError }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${baseUrl}/dashboard?payment=success`,
      },
      redirect: 'if_required'
    });

    if (error) {
      setMessage(error.message || 'Une erreur est survenue');
      onError(error.message || 'Payment failed');
      setIsProcessing(false);
    } else {
      // Payment succeeded
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {message && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div>
          <p className="text-sm text-muted-foreground">Montant à payer</p>
          <p className="text-2xl font-bold text-primary">
            {new Intl.NumberFormat('fr-CA', { 
              style: 'currency', 
              currency: 'CAD' 
            }).format(amount)}
          </p>
        </div>
        
        <button
          type="submit"
          disabled={isProcessing || !stripe || !elements}
          className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Traitement...
            </span>
          ) : (
            'Payer maintenant'
          )}
        </button>
      </div>
      
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Paiement sécurisé</span>
        </div>
        <span>•</span>
        <span>Powered by Stripe</span>
      </div>
    </form>
  );
}

interface StripeCardFormProps {
  amount: number;
  invoiceId: string;
  services: any[];
  customerEmail?: string;
  customerName?: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function StripeCardForm({ 
  amount, 
  invoiceId, 
  services,
  customerEmail,
  customerName,
  onSuccess, 
  onError 
}: StripeCardFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Create PaymentIntent as soon as the component loads
    fetch(`${baseUrl}/api/payments/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        amount, 
        invoiceId, 
        services,
        customerEmail,
        customerName
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          onError(data.error);
          setLoading(false);
        } else {
          setClientSecret(data.clientSecret);
          setLoading(false);
        }
      })
      .catch((err) => {
        onError('Failed to initialize payment');
        setLoading(false);
      });
  }, [amount, invoiceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm text-muted-foreground">Initialisation du paiement...</p>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
        <p className="text-red-600 dark:text-red-400">Impossible d'initialiser le paiement</p>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#0e1011',
      },
    },
  };

  return (
    <Elements options={options} stripe={stripePromise}>
      <CheckoutForm 
        amount={amount} 
        invoiceId={invoiceId}
        onSuccess={onSuccess} 
        onError={onError} 
      />
    </Elements>
  );
}
