/* ======================================================
   INICIALIZAÇÃO DO FIREBASE (js/firebase.js)
   Conexão Real com o Firebase Auth e Firestore
   ====================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyBWF-DkHEgfdS5OeEEhEH3WqsGilIEJklE",
  authDomain: "confirmacao-de-presenca-e2c10.firebaseapp.com",
  projectId: "confirmacao-de-presenca-e2c10",
  storageBucket: "confirmacao-de-presenca-e2c10.firebasestorage.app",
  messagingSenderId: "762194803539",
  appId: "1:762194803539:web:9b29f0f048317f6e213fa6"
};

// Inicializa a aplicação Firebase se ainda não tiver sido inicializada
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Instâncias globais do Auth e Firestore
const auth = typeof firebase !== 'undefined' ? firebase.auth() : null;
const db = typeof firebase !== 'undefined' ? firebase.firestore() : null;

window.AppFirebase = {
  auth,
  db,
  isReady: !!(auth && db)
};
