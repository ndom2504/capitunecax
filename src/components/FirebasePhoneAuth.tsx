import React, { useRef, useState, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { getFirebaseAuth, firebaseConfigPublic } from '../lib/firebase';

interface FirebasePhoneAuthProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
}

export function FirebasePhoneAuth({ onSuccess, onError }: FirebasePhoneAuthProps) {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const confirmResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const auth = getFirebaseAuth();

  // 1. Charger le script reCAPTCHA depuis Google
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Vérifier si grecaptcha est déjà chargé
    if ((window as any).grecaptcha) {
      setRecaptchaReady(true);
      return;
    }

    // Charger le script reCAPTCHA
    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/recaptcha/releases/v3_Ll3aMlQXRz8TgnHhIURJlH4m/recaptcha__en.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('[reCAPTCHA] Script chargé');
      setRecaptchaReady(true);
    };
    script.onerror = () => {
      console.error('[reCAPTCHA] Erreur chargement script');
    };
    document.head.appendChild(script);

    return () => {
      // Nettoyage optionnel
    };
  }, []);

  // 2. Initialiser reCAPTCHA une fois le script prêt
  useEffect(() => {
    if (!auth || !firebaseConfigPublic.apiKey || !recaptchaReady) {
      return;
    }

    if (!recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(
          'firebase-phone-recaptcha',
          {
            size: 'invisible',
            callback: () => {
              console.log('[reCAPTCHA] Validé');
            },
          },
          auth
        );
        console.log('[reCAPTCHA] Initialisé avec succès');
      } catch (err) {
        console.error('[reCAPTCHA init]', err);
        setErrorMsg('Erreur initialisation reCAPTCHA. Rechargez la page.');
      }
    }

    return () => {
      // Optionnel : nettoyer reCAPTCHA à la désinscription
    };
  }, [auth, recaptchaReady]);

  const formatPhone = (value: string) => {
    // Accepter +1 (Canada) ou reformatter
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 10) return '+1' + cleaned;
    if (cleaned.length === 11 && cleaned.startsWith('1')) return '+' + cleaned;
    return '+' + cleaned;
  };

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setMessage('');

    if (!phone || phone.length < 10) {
      setErrorMsg('Numéro de téléphone invalide (min 10 chiffres).');
      return;
    }

    if (!auth) {
      setErrorMsg('Firebase non disponible.');
      return;
    }

    if (!recaptchaVerifierRef.current) {
      setErrorMsg('reCAPTCHA non prêt. Rechargez la page.');
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatPhone(phone);
      console.log('[SMS] Envoi vers:', formattedPhone);

      const result = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifierRef.current);
      confirmResultRef.current = result;
      setStep('code');
      setMessage(`Code envoyé à ${formattedPhone}. Vérifiez votre SMS.`);
    } catch (err: any) {
      console.error('[SMS error]', err);
      setErrorMsg(
        err.code === 'auth/invalid-phone-number'
          ? 'Numéro invalide. Format: +1 XXX XXX XXXX'
          : err.message || 'Erreur lors de l\'envoi du code.'
      );
      // Recréer reCAPTCHA en cas d'erreur (elle est consommée après l'erreur)
      recaptchaVerifierRef.current?.clear();
      recaptchaVerifierRef.current = null;
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setMessage('');

    if (!code || code.length !== 6) {
      setErrorMsg('Code invalide (6 chiffres).');
      return;
    }

    if (!confirmResultRef.current) {
      setErrorMsg('Aucun code en attente. Réessayez.');
      return;
    }

    setLoading(true);
    try {
      const result = await confirmResultRef.current.confirm(code);
      setMessage('✓ Authentification réussie !');
      if (onSuccess) onSuccess(result.user);
    } catch (err: any) {
      console.error('[Code verify error]', err);
      setErrorMsg(err.code === 'auth/invalid-verification-code' ? 'Code incorrect.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('phone');
    setPhone('');
    setCode('');
    setMessage('');
    setErrorMsg('');
    confirmResultRef.current = null;
  };

  if (!firebaseConfigPublic.apiKey) {
    return (
      <div style={{ padding: '16px', background: '#ffebee', color: '#c62828', borderRadius: '8px' }}>
        Firebase non configuré. Vérifiez PUBLIC_FIREBASE_API_KEY dans .env.
      </div>
    );
  }

  if (!recaptchaReady) {
    return (
      <div style={{ padding: '16px', background: '#fff3e0', color: '#e65100', borderRadius: '8px' }}>
        Chargement du formulaire SMS... Veuillez patienter.
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '600' }}>
        Connexion par SMS
      </h3>

      {step === 'phone' ? (
        <form onSubmit={sendCode} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="tel"
            placeholder="+1 (XXX) XXX-XXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
            style={{
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
          <button
            type="submit"
            disabled={loading || !phone}
            style={{
              padding: '10px 16px',
              background: '#ff9408',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              opacity: loading || !phone ? 0.6 : 1,
            }}
          >
            {loading ? 'Envoi...' : 'Envoyer un code'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="Code 6 chiffres"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            disabled={loading}
            maxLength={6}
            style={{
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '6px',
              fontSize: '14px',
              letterSpacing: '2px',
            }}
          />
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            style={{
              padding: '10px 16px',
              background: '#ff9408',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              opacity: loading || code.length !== 6 ? 0.6 : 1,
            }}
          >
            {loading ? 'Vérification...' : 'Vérifier'}
          </button>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: '8px',
              background: 'transparent',
              color: '#666',
              border: '1px solid #ddd',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            ← Retour
          </button>
        </form>
      )}

      {/* Container reCAPTCHA (invisible) */}
      <div id="firebase-phone-recaptcha" style={{ marginTop: '12px' }} />

      {/* Messages */}
      {message && (
        <div style={{ marginTop: '12px', padding: '8px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '4px', fontSize: '13px' }}>
          {message}
        </div>
      )}
      {errorMsg && (
        <div style={{ marginTop: '12px', padding: '8px', background: '#ffebee', color: '#c62828', borderRadius: '4px', fontSize: '13px' }}>
          {errorMsg}
        </div>
      )}
    </div>
  );
}
