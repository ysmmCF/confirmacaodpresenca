/* ======================================================
   AUTENTICAÇÃO DO ADMINISTRADOR (js/auth.js)
   Firebase Auth — E-mail + Senha, Verificação em adminEmails
   ====================================================== */

(function () {
  const { auth, db } = window.AppFirebase;

  // Elementos do DOM
  const loginWrapper   = document.getElementById('loginWrapper');
  const adminLayout    = document.getElementById('adminLayout');
  const loginForm      = document.getElementById('loginForm');
  const loginEmail     = document.getElementById('loginEmail');
  const loginPassword  = document.getElementById('loginPassword');
  const loginError     = document.getElementById('loginError');
  const loginBtn       = document.getElementById('loginBtn');
  const userEmailDisplay = document.getElementById('userEmailDisplay');
  const logoutBtn      = document.getElementById('logoutBtn');

  if (!auth) {
    console.error('Firebase Auth não inicializado.');
    return;
  }

  // Persistência LOCAL: o dispositivo lembra o login mesmo após fechar o navegador.
  // Isso elimina a necessidade de logar novamente em celulares/tablets de confiança.
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(err => {
    console.warn('[Auth] Falha ao definir persistência LOCAL:', err.message);
  });

  // Monitorar Estado de Autenticação
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      const allowed = await isAuthorized(user.email);
      if (allowed) {
        if (loginWrapper) loginWrapper.style.display = 'none';
        if (adminLayout)  adminLayout.style.display  = 'flex';
        if (userEmailDisplay) userEmailDisplay.textContent = user.email;
        window.dispatchEvent(new CustomEvent('adminReady', { detail: { user } }));
      } else {
        await auth.signOut();
        showError('Acesso negado. Este e-mail não está autorizado como administrador.');
        if (loginWrapper) loginWrapper.style.display = 'flex';
        if (adminLayout)  adminLayout.style.display  = 'none';
      }
    } else {
      if (loginWrapper) loginWrapper.style.display = 'flex';
      if (adminLayout)  adminLayout.style.display  = 'none';
    }
  });

  // Verificar e-mail na coleção adminEmails
  async function isAuthorized(email) {
    if (!db || !email) return false;
    try {
      const emailKey = email.toLowerCase().trim();
      const doc = await db.collection('adminEmails').doc(emailKey).get();
      if (doc.exists && doc.data().active !== false) return true;

      // Fallback: se a coleção estiver vazia, permite o primeiro login
      const snapshot = await db.collection('adminEmails').limit(1).get();
      if (snapshot.empty) {
        console.warn('[Auth] coleção adminEmails vazia. Permitindo acesso temporariamente.');
        return true;
      }
      return false;
    } catch (err) {
      // Se as regras bloquearem a leitura pública, confia no Firebase Auth
      console.warn('[Auth] Falha ao verificar adminEmails:', err.code);
      return true;
    }
  }

  // Submit do formulário
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email    = loginEmail.value.trim();
      const password = loginPassword.value;

      if (!email || !password) {
        showError('Informe e-mail e senha.');
        return;
      }

      setLoading(true);
      hideError();

      try {
        await auth.signInWithEmailAndPassword(email, password);
      } catch (err) {
        let msg = 'Erro ao fazer login.';
        switch (err.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            msg = 'E-mail ou senha incorretos.'; break;
          case 'auth/too-many-requests':
            msg = 'Muitas tentativas. Aguarde e tente novamente.'; break;
          case 'auth/invalid-email':
            msg = 'Endereço de e-mail inválido.'; break;
          default:
            msg = err.message;
        }
        showError(msg);
      } finally {
        setLoading(false);
      }
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => auth.signOut());
  }

  function showError(msg) {
    if (loginError) {
      loginError.textContent = msg;
      loginError.style.display = 'block';
    }
  }

  function hideError() {
    if (loginError) loginError.style.display = 'none';
  }

  function setLoading(on) {
    if (!loginBtn) return;
    loginBtn.disabled = on;
    loginBtn.innerHTML = on
      ? '<span class="spinner" style="width:18px;height:18px;border-width:2px;margin-right:8px;vertical-align:middle;display:inline-block;"></span>Verificando...'
      : 'Entrar';
  }
})();
