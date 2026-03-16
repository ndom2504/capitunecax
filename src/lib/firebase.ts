import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Configuration Firebase (à récupérer depuis la console Firebase)
// https://console.firebase.google.com → Paramètres du projet → Apps → Config
const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID || '',
};

let firebaseApp: any = null;
let firebaseAuth: any = null;

export function getFirebaseApp() {
  if (!firebaseApp) {
    if (!firebaseConfig.apiKey) {
      console.warn('[Firebase] Configuration manquante dans les variables d\'environnement');
      return null;
    }
    firebaseApp = initializeApp(firebaseConfig);
  }
  return firebaseApp;
}

export function getFirebaseAuth() {
  if (!firebaseAuth) {
    const app = getFirebaseApp();
    if (!app) return null;
    firebaseAuth = getAuth(app);
  }
  return firebaseAuth;
}

export const firebaseConfigPublic = firebaseConfig;
