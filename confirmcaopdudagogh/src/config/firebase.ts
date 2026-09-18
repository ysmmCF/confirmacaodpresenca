import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// Inicializa o Firebase (evita re-inicialização no HMR do Vite)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Inicializa a autenticação com persistência de sessão local
export const auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: browserLocalPersistence
    });
  } catch {
    // Se o auth já estiver inicializado
    return getAuth(app);
  }
})();

// Inicializa o Cloud Firestore
export const db = getFirestore(app);

export default app;
