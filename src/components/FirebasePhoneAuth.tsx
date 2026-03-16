import React, { useRef, useState, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { getFirebaseAuth, firebaseConfigPublic } from '../lib/firebase';

interface FirebasePhoneAuthProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
}

// Stocker le verifier globalement pour éviter les re-renders multiples
let globalRecaptchaVerifier: RecaptchaVerifier | null = null;

export function FirebasePhoneAuth({ onSuccess, onError }: FirebasePhoneAuthProps) {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const confirmResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const auth = getFirebaseAuth();

  // Initialiser RecaptchaVerifier une seule fois
  useEffect(() => {
    if (!auth) return;

    // Réutiliser le verifier global s'il existe déjà
    if (globalRecaptchaVerifier) {
      recaptchaVerifierRef.current = globalRecaptchaVerifier;
      console.log('[reCAPTCHA] Réutilisation du verifier existant');
      return;
    }

    // Créer une nouvelle instance seulement si elle n'existe pas
    if (!recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(
          auth,
          'firebase-phone-recaptcha',
          {
            size: 'invisible',
          }
        );

        // Stocker dans la variable globale
        globalRecaptchaVerifier = recaptchaVerifierRef.current;

        console.log('[reCAPTCHA] Initialisé avec succès');
      } catch (err) {
        console.error('[reCAPTCHA init error]', err);
        setErrorMsg('Erreur initialisation reCAPTCHA. Rechargez la page.');
      }
    }

    // Ne pas nettoyer le verifier au démontage pour éviter les erreurs
    return () => {
      // Laisser le verifier actif globalement
    };
  }, [auth]);

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
      // Le verifier est réutilisable - pas besoin de recréer
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
