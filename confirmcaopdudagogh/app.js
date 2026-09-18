const { useState, useEffect, createContext, useContext } = React;

// ==========================================
// 1. CONFIGURAÇÃO DO FIREBASE (UMD COMPAT GLOBAL)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyBWF-DkHEgfdS5OeEEhEH3WqsGilIEJklE",
  authDomain: "confirmacao-de-presenca-e2c10.firebaseapp.com",
  projectId: "confirmacao-de-presenca-e2c10",
  storageBucket: "confirmacao-de-presenca-e2c10.firebasestorage.app",
  messagingSenderId: "762194803539",
  appId: "1:762194803539:web:9b29f0f048317f6e213fa6"
};

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = typeof firebase !== 'undefined' ? firebase.auth() : null;
export const db = typeof firebase !== 'undefined' ? firebase.firestore() : null;

// Adaptadores para compatibilidade Firebase v9/v10 -> UMD Global
const signInWithEmailAndPassword = (authObj, email, password) => {
  if (authObj && authObj.signInWithEmailAndPassword) {
    return authObj.signInWithEmailAndPassword(email, password);
  }
  return Promise.reject(new Error("Firebase Auth não disponível"));
};

const firebaseSignOut = (authObj) => {
  if (authObj && authObj.signOut) {
    return authObj.signOut();
  }
  return Promise.resolve();
};

const onAuthStateChanged = (authObj, callback) => {
  if (authObj && authObj.onAuthStateChanged) {
    return authObj.onAuthStateChanged(callback);
  }
  callback(null);
  return () => {};
};

const doc = (dbObj, path, ...segments) => {
  const fullPath = [path, ...segments].join('/');
  return dbObj.doc(fullPath);
};

const collection = (dbObj, path, ...segments) => {
  const fullPath = [path, ...segments].join('/');
  return dbObj.collection(fullPath);
};

const getDoc = (docRef) => docRef.get();
const getDocs = (queryOrCol) => queryOrCol.get();
const setDoc = (docRef, data, options) => docRef.set(data, options);
const updateDoc = (docRef, data) => docRef.update(data);
const deleteDoc = (docRef) => docRef.delete();

const query = (colRef, ...constraints) => {
  let q = colRef;
  for (const c of constraints) {
    if (c && c._orderBy) {
      q = q.orderBy(c._orderBy.field, c._orderBy.dir);
    }
  }
  return q;
};

const orderBy = (field, dir = 'asc') => ({ _orderBy: { field, dir } });

const normalizeEmail = (email) => (email ? email.trim().toLowerCase() : '');

// ==========================================
// 2. SERVIÇOS DO FIREBASE
// ==========================================
const isCurrentUserAdmin = async (email) => {
  if (!email) return { authorized: false, reason: "E-mail não fornecido." };
  const normEmail = normalizeEmail(email);
  try {
    const adminSnap = await getDoc(doc(db, 'adminEmails', normEmail));
    if (!adminSnap.exists()) {
      return { authorized: false, reason: "Este e-mail não possui acesso ao painel." };
    }
    const data = adminSnap.data();
    if (!data.active) {
      return { authorized: false, reason: "Este administrador está desativado." };
    }
    if (data.role !== 'admin') {
      return { authorized: false, reason: "Usuário não possui privilégio administrativo." };
    }
    return { authorized: true, record: data };
  } catch (err) {
    console.error("Erro ao verificar admin:", err);
    return { authorized: false, reason: "Falha ao verificar autorização no sistema." };
  }
};

const generatePublicToken = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 14; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

const generateId = () => 'g_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

const listGroups = async () => {
  const q = query(collection(db, 'groups'), orderBy('createdAt', 'desc'));
  const querySnap = await getDocs(q);

  const groups = await Promise.all(querySnap.docs.map(async (groupDoc) => {
    const groupData = groupDoc.data();
    const token = groupDoc.id;

    const [adultsSnap, childrenSnap] = await Promise.all([
      getDocs(collection(db, 'groups', token, 'adults')),
      getDocs(collection(db, 'groups', token, 'children'))
    ]);

    const adults = adultsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const children = childrenSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return {
      id: token,
      groupName: groupData.groupName || 'Sem Nome',
      publicToken: groupData.publicToken || token,
      childrenLimit: groupData.childrenLimit ?? children.length,
      createdAt: groupData.createdAt || new Date().toISOString(),
      updatedAt: groupData.updatedAt || new Date().toISOString(),
      adults,
      children
    };
  }));

  return groups;
};

const getGroup = async (token) => {
  const groupSnap = await getDoc(doc(db, 'groups', token));
  if (!groupSnap.exists()) return null;
  const groupData = groupSnap.data();

  const [adultsSnap, childrenSnap] = await Promise.all([
    getDocs(collection(db, 'groups', token, 'adults')),
    getDocs(collection(db, 'groups', token, 'children'))
  ]);

  const adults = await Promise.all(adultsSnap.docs.map(async (d) => {
    let priv = undefined;
    try {
      const pSnap = await getDoc(doc(db, 'privateGuestData', d.id));
      if (pSnap.exists()) priv = pSnap.data();
    } catch {}
    return { id: d.id, ...d.data(), privateData: priv };
  }));

  const children = await Promise.all(childrenSnap.docs.map(async (d) => {
    let priv = undefined;
    try {
      const pSnap = await getDoc(doc(db, 'privateGuestData', d.id));
      if (pSnap.exists()) priv = pSnap.data();
    } catch {}
    return { id: d.id, ...d.data(), privateData: priv };
  }));

  return {
    id: token,
    ...groupData,
    adults,
    children
  };
};

const createGroup = async (input) => {
  const publicToken = generatePublicToken();
  const now = new Date().toISOString();

  await setDoc(doc(db, 'groups', publicToken), {
    id: publicToken,
    groupName: input.groupName.trim(),
    publicToken: publicToken,
    childrenLimit: input.children.length,
    createdAt: now,
    updatedAt: now
  });

  const adultPromises = input.adults.map(async (adult) => {
    const adultId = adult.id || generateId();
    await Promise.all([
      setDoc(doc(db, 'groups', publicToken, 'adults', adultId), {
        id: adultId,
        name: adult.name.trim(),
        status: adult.status || 'pending',
        createdAt: now,
        updatedAt: now
      }),
      setDoc(doc(db, 'privateGuestData', adultId), {
        guestId: adultId,
        gender: adult.gender,
        ageType: 'adult',
        drinksAlcohol: adult.drinksAlcohol,
        groupId: publicToken,
        createdAt: now,
        updatedAt: now
      })
    ]);
  });

  const childPromises = input.children.map(async (child, idx) => {
    const childId = child.id || generateId();
    await Promise.all([
      setDoc(doc(db, 'groups', publicToken, 'children', childId), {
        id: childId,
        name: child.name.trim(),
        status: child.status || 'pending',
        slotIndex: idx,
        createdAt: now,
        updatedAt: now
      }),
      setDoc(doc(db, 'privateGuestData', childId), {
        guestId: childId,
        gender: child.gender,
        ageType: 'child',
        drinksAlcohol: child.drinksAlcohol,
        groupId: publicToken,
        createdAt: now,
        updatedAt: now
      })
    ]);
  });

  await Promise.all([...adultPromises, ...childPromises]);
  return publicToken;
};

const updateGroup = async (publicToken, input) => {
  const now = new Date().toISOString();
  await updateDoc(doc(db, 'groups', publicToken), {
    groupName: input.groupName.trim(),
    childrenLimit: input.children.length,
    updatedAt: now
  });

  const currentGroup = await getGroup(publicToken);
  const currentAdultIds = new Set((currentGroup?.adults || []).map(a => a.id));
  const currentChildIds = new Set((currentGroup?.children || []).map(c => c.id));

  const newAdultIds = new Set(input.adults.map(a => a.id).filter(Boolean));
  const newChildIds = new Set(input.children.map(c => c.id).filter(Boolean));

  const deletePromises = [];
  for (const oldAdultId of currentAdultIds) {
    if (!newAdultIds.has(oldAdultId)) {
      deletePromises.push(deleteDoc(doc(db, 'groups', publicToken, 'adults', oldAdultId)));
      deletePromises.push(deleteDoc(doc(db, 'privateGuestData', oldAdultId)));
    }
  }

  for (const oldChildId of currentChildIds) {
    if (!newChildIds.has(oldChildId)) {
      deletePromises.push(deleteDoc(doc(db, 'groups', publicToken, 'children', oldChildId)));
      deletePromises.push(deleteDoc(doc(db, 'privateGuestData', oldChildId)));
    }
  }
  await Promise.all(deletePromises);

  const adultPromises = input.adults.map(async (adult) => {
    const adultId = adult.id || generateId();
    await Promise.all([
      setDoc(doc(db, 'groups', publicToken, 'adults', adultId), {
        id: adultId,
        name: adult.name.trim(),
        status: adult.status || 'pending',
        updatedAt: now
      }, { merge: true }),
      setDoc(doc(db, 'privateGuestData', adultId), {
        guestId: adultId,
        gender: adult.gender,
        ageType: 'adult',
        drinksAlcohol: adult.drinksAlcohol,
        groupId: publicToken,
        updatedAt: now
      }, { merge: true })
    ]);
  });

  const childPromises = input.children.map(async (child, idx) => {
    const childId = child.id || generateId();
    await Promise.all([
      setDoc(doc(db, 'groups', publicToken, 'children', childId), {
        id: childId,
        name: child.name.trim(),
        status: child.status || 'pending',
        slotIndex: idx,
        updatedAt: now
      }, { merge: true }),
      setDoc(doc(db, 'privateGuestData', childId), {
        guestId: childId,
        gender: child.gender,
        ageType: 'child',
        drinksAlcohol: child.drinksAlcohol,
        groupId: publicToken,
        updatedAt: now
      }, { merge: true })
    ]);
  });

  await Promise.all([...adultPromises, ...childPromises]);
};

const deleteGroup = async (publicToken) => {
  const currentGroup = await getGroup(publicToken);
  if (currentGroup) {
    const deletePromises = [];
    for (const adult of currentGroup.adults || []) {
      deletePromises.push(deleteDoc(doc(db, 'groups', publicToken, 'adults', adult.id)));
      deletePromises.push(deleteDoc(doc(db, 'privateGuestData', adult.id)));
    }
    for (const child of currentGroup.children || []) {
      deletePromises.push(deleteDoc(doc(db, 'groups', publicToken, 'children', child.id)));
      deletePromises.push(deleteDoc(doc(db, 'privateGuestData', child.id)));
    }
    await Promise.all(deletePromises);
  }
  await deleteDoc(doc(db, 'groups', publicToken));
};

const getDashboardStats = async () => {
  const [groups, privateSnap] = await Promise.all([
    listGroups(),
    getDocs(collection(db, 'privateGuestData'))
  ]);

  let totalGuests = 0, confirmed = 0, pending = 0, notGoing = 0;
  let adultsCount = 0, childrenCount = 0, menCount = 0, womenCount = 0, alcoholDrinkersCount = 0;

  const privateMap = new Map();
  privateSnap.forEach(d => privateMap.set(d.id, d.data()));

  for (const group of groups) {
    const allGuests = [...(group.adults || []), ...(group.children || [])];
    totalGuests += allGuests.length;
    adultsCount += (group.adults || []).length;
    childrenCount += (group.children || []).length;

    for (const guest of allGuests) {
      if (guest.status === 'going') confirmed++;
      else if (guest.status === 'notGoing') notGoing++;
      else pending++;

      const priv = privateMap.get(guest.id) || guest.privateData;
      if (priv) {
        if (priv.gender === 'male') menCount++;
        if (priv.gender === 'female') womenCount++;
        if (priv.drinksAlcohol) alcoholDrinkersCount++;
      }
    }
  }

  return {
    totalGroups: groups.length,
    totalGuests,
    confirmed,
    pending,
    notGoing,
    adultsCount,
    childrenCount,
    menCount,
    womenCount,
    alcoholDrinkersCount
  };
};

const listAdmins = async () => {
  const q = query(collection(db, 'adminEmails'), orderBy('email', 'asc'));
  const snap = await getDocs(q);
  const list = [];
  snap.forEach(d => list.push({ email: d.id, ...d.data() }));
  return list;
};

const addAdmin = async (email) => {
  const normEmail = normalizeEmail(email);
  if (!normEmail || !normEmail.includes('@')) throw new Error('E-mail inválido.');
  const newRecord = { email: normEmail, role: 'admin', active: true, createdAt: new Date().toISOString() };
  await setDoc(doc(db, 'adminEmails', normEmail), newRecord);
  return newRecord;
};

const updateAdminStatus = async (email, active) => {
  const normEmail = normalizeEmail(email);
  await updateDoc(doc(db, 'adminEmails', normEmail), { active });
};

const removeAdmin = async (email) => {
  const normEmail = normalizeEmail(email);
  await deleteDoc(doc(db, 'adminEmails', normEmail));
};

const getPublicGroup = async (token) => {
  if (!token) return null;
  const groupSnap = await getDoc(doc(db, 'groups', token));
  if (!groupSnap.exists()) return null;
  const groupData = groupSnap.data();

  const [adultsSnap, childrenSnap] = await Promise.all([
    getDocs(collection(db, 'groups', token, 'adults')),
    getDocs(collection(db, 'groups', token, 'children'))
  ]);

  const adults = adultsSnap.docs.map(d => ({ id: d.id, name: d.data().name, status: d.data().status || 'pending' }));
  const children = childrenSnap.docs.map(d => ({ id: d.id, name: d.data().name, status: d.data().status || 'pending' }));

  return { id: token, groupName: groupData.groupName, publicToken: groupData.publicToken || token, adults, children };
};

const savePublicResponses = async (token, responses) => {
  const now = new Date().toISOString();
  const updatePromises = responses.map(resp => {
    const colName = resp.type === 'adult' ? 'adults' : 'children';
    return updateDoc(doc(db, 'groups', token, colName, resp.guestId), { status: resp.status, updatedAt: now });
  });
  await Promise.all(updatePromises);
};

// ==========================================
// 3. ÍCONES SVG LEVES
// ==========================================
const Icons = {
  Sparkles: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>,
  Users: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>,
  Shield: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
  LogOut: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>,
  Plus: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>,
  Eye: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>,
  Copy: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>,
  Check: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>,
  Clock: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  XCircle: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  Heart: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
};

// ==========================================
// 4. CONTEXTO DE AUTENTICAÇÃO
// ==========================================
const AuthContext = createContext({
  currentUser: null,
  isAdmin: false,
  loading: true,
  authError: null,
  signOutUser: async () => {},
  checkAdminStatus: async () => false
});

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const verifyAdmin = async (user) => {
    if (!user || !user.email) {
      setIsAdmin(false);
      setLoading(false);
      return false;
    }
    const check = await isCurrentUserAdmin(user.email);
    if (check.authorized) {
      setIsAdmin(true);
      setAuthError(null);
      setLoading(false);
      return true;
    } else {
      setIsAdmin(false);
      setAuthError(check.reason || "Acesso negado.");
      await firebaseSignOut(auth);
      setLoading(false);
      return false;
    }
  };

  useEffect(() => {
    if (window.__setLoadingProgress) {
      window.__setLoadingProgress(90, 'Autenticando...');
    }

    // Trava de tempo de segurança: garante que a tela NUNCA fique travada se a rede demorar
    const safetyTimer = setTimeout(() => {
      if (window.__setLoadingProgress) window.__setLoadingProgress(100, 'Concluído!');
      setLoading(false);
    }, 3500);

    const unsub = onAuthStateChanged(auth, async (user) => {
      clearTimeout(safetyTimer);
      if (window.__setLoadingProgress) window.__setLoadingProgress(100, 'Concluído!');
      if (user) {
        setCurrentUser(user);
        await verifyAdmin(user);
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      unsub();
    };
  }, []);

  const signOutUser = async () => {
    await firebaseSignOut(auth);
    setCurrentUser(null);
    setIsAdmin(false);
    setAuthError(null);
  };

  const checkAdminStatus = async () => {
    if (auth.currentUser) return await verifyAdmin(auth.currentUser);
    return false;
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAdmin, loading, authError, signOutUser, checkAdminStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// ==========================================
// 5. NAVEGAÇÃO & ROTEADOR SIMPLES
// ==========================================
const Navbar = ({ currentRoute, setRoute }) => {
  const { currentUser, signOutUser } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#0b0f19]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setRoute('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20">
              <Icons.Sparkles />
            </div>
            <div>
              <span className="text-lg font-bold text-white font-outfit block leading-none">Painel Administrativo</span>
              <span className="text-[11px] text-amber-400 font-medium">Gestão de Convidados</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setRoute('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                currentRoute === 'dashboard' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setRoute('groups')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                currentRoute === 'groups' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Grupos de Convidados
            </button>
            <button
              onClick={() => setRoute('admins')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                currentRoute === 'admins' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Administradores
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-xs font-semibold text-amber-300 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
              {currentUser?.email}
            </span>
            <button
              onClick={signOutUser}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40 rounded-xl border border-rose-900/40 transition-colors"
            >
              <Icons.LogOut /> Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// ==========================================
// 6. PÁGINAS DO SISTEMA
// ==========================================

// --- TELA DE LOGIN ---
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { checkAdminStatus } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Preencha todos os campos.');
      return;
    }
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, normalizeEmail(email), password);
      const isAuth = await checkAdminStatus();
      if (!isAuth) {
        setErrorMsg('Este e-mail não possui permissão de administrador.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0b0f19]">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 mb-3 shadow-lg shadow-amber-500/20">
            <Icons.Sparkles />
          </div>
          <h1 className="text-2xl font-bold text-white font-outfit">Painel Administrativo</h1>
          <p className="text-slate-400 text-xs mt-1">Gestão de Convidados</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yasmim.2009ferreira@gmail.com"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Senha</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-amber-500 outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-3.5 text-xs text-slate-400 hover:text-white"
              >
                {showPass ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 text-sm disabled:opacity-50 transition-all mt-2"
          >
            {loading ? 'ENTRANDO...' : 'ENTRAR'}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- DASHBOARD ---
const DashboardPage = ({ setRoute }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then(s => {
      setStats(s);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-12 text-center text-slate-400">Carregando métricas reais...</div>;

  const cards = [
    { title: 'Total de Grupos', val: stats.totalGroups, color: 'text-amber-400' },
    { title: 'Total de Convidados', val: stats.totalGuests, color: 'text-blue-400' },
    { title: 'Confirmados', val: stats.confirmed, color: 'text-emerald-400' },
    { title: 'Pendentes', val: stats.pending, color: 'text-yellow-400' },
    { title: 'Não Vão', val: stats.notGoing, color: 'text-rose-400' },
    { title: 'Adultos', val: stats.adultsCount, color: 'text-indigo-400' },
    { title: 'Crianças', val: stats.childrenCount, color: 'text-sky-400' },
    { title: 'Homens', val: stats.menCount, color: 'text-cyan-400' },
    { title: 'Mulheres', val: stats.womenCount, color: 'text-fuchsia-400' },
    { title: 'Bebem Álcool', val: stats.alcoholDrinkersCount, color: 'text-purple-400' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Visão Geral do Evento</h1>
          <p className="text-xs text-slate-400">Estatísticas agregadas dos convidados em tempo real</p>
        </div>
        <button
          onClick={() => setRoute('groups')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
        >
          <Icons.Plus /> Gerenciar Grupos
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((c, i) => (
          <div key={i} className="glass-panel p-4 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400">{c.title}</span>
            <p className={`text-2xl font-bold font-outfit mt-1 ${c.color}`}>{c.val}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- GESTÃO DE GRUPOS ---
const GroupsPage = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editGroupData, setEditGroupData] = useState(null);
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    const data = await listGroups();
    setGroups(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCopyLink = (token) => {
    const link = `${window.location.origin}${window.location.pathname}#token=${token}`;
    navigator.clipboard.writeText(link);
    setToast('Link copiado!');
    setTimeout(() => setToast(''), 3000);
  };

  const handleDelete = async (token) => {
    if (confirm('Tem certeza que deseja excluir este grupo?')) {
      await deleteGroup(token);
      setToast('Grupo excluído!');
      setTimeout(() => setToast(''), 3000);
      load();
    }
  };

  const filtered = groups.filter(g => g.groupName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      {toast && <div className="fixed bottom-5 right-5 bg-emerald-900 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-xl z-50 text-xs font-bold">{toast}</div>}

      <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Grupos de Convidados</h1>
          <p className="text-xs text-slate-400">Cadastre grupos e compartilhe os links de confirmação</p>
        </div>
        <button
          onClick={() => { setEditGroupData(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
        >
          <Icons.Plus /> Criar Novo Grupo
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar grupo..."
        className="w-full max-w-xs px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-amber-500"
      />

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs">Carregando grupos...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel p-8 rounded-2xl text-center text-slate-400 text-xs">Nenhum grupo encontrado.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(g => {
            const total = (g.adults?.length || 0) + (g.children?.length || 0);
            const confirmed = [...(g.adults || []), ...(g.children || [])].filter(x => x.status === 'going').length;

            return (
              <div key={g.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-white font-outfit text-base">{g.groupName}</h3>
                  <span className="text-[10px] bg-slate-900 text-amber-300 px-2 py-0.5 rounded-full border border-slate-800 font-semibold">{total} pessoas</span>
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <p>Adultos: <strong className="text-white">{g.adults?.length || 0}</strong> | Crianças: <strong className="text-white">{g.children?.length || 0}</strong></p>
                  <p>Confirmados: <strong className="text-emerald-400">{confirmed}</strong> / {total}</p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between items-center gap-2 text-xs">
                  <button onClick={() => { setEditGroupData(g); setIsModalOpen(true); }} className="text-blue-400 hover:underline">Editar</button>
                  <button onClick={() => handleCopyLink(g.publicToken)} className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">Copiar Link</button>
                  <button onClick={() => handleDelete(g.publicToken)} className="text-rose-400 hover:underline">Excluir</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <GroupModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialData={editGroupData}
          onSave={load}
        />
      )}
    </div>
  );
};

// --- MODAL GRUPO ---
const GroupModal = ({ isOpen, onClose, initialData, onSave }) => {
  const [groupName, setGroupName] = useState(initialData?.groupName || '');
  const [adults, setAdults] = useState(initialData?.adults?.map(a => ({ name: a.name, gender: a.privateData?.gender || 'male', drinksAlcohol: a.privateData?.drinksAlcohol ?? true, status: a.status || 'pending' })) || [{ name: '', gender: 'male', drinksAlcohol: true, status: 'pending' }]);
  const [children, setChildren] = useState(initialData?.children?.map(c => ({ name: c.name, gender: c.privateData?.gender || 'male', drinksAlcohol: c.privateData?.drinksAlcohol ?? false, status: c.status || 'pending' })) || []);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return alert('Informe o nome do grupo.');
    try {
      setSubmitting(true);
      if (initialData) {
        await updateGroup(initialData.publicToken, { groupName, adults, children });
      } else {
        await createGroup({ groupName, adults, children });
      }
      onSave();
      onClose();
    } catch (err) {
      alert('Erro ao salvar.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0f19]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#131b2e] border border-slate-700 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
        <h2 className="text-lg font-bold text-white font-outfit">{initialData ? 'Editar Grupo' : 'Novo Grupo'}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-300 font-semibold mb-1">Nome do Grupo</label>
            <input
              type="text"
              required
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Ex: Família Silva"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none focus:border-amber-500"
            />
          </div>

          {/* ADULTOS */}
          <div className="space-y-2 border-t border-slate-800 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-amber-400">ADULTOS ({adults.length})</span>
              <button type="button" onClick={() => setAdults([...adults, { name: '', gender: 'male', drinksAlcohol: true, status: 'pending' }])} className="text-xs text-amber-300 hover:underline">+ Adulto</button>
            </div>
            {adults.map((a, i) => (
              <div key={i} className="p-3 bg-slate-900 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <input type="text" required placeholder="Nome Completo" value={a.name} onChange={e => { const copy = [...adults]; copy[i].name = e.target.value; setAdults(copy); }} className="px-2 py-1.5 bg-slate-950 border border-slate-800 text-white rounded" />
                <select value={a.gender} onChange={e => { const copy = [...adults]; copy[i].gender = e.target.value; setAdults(copy); }} className="px-2 py-1.5 bg-slate-950 border border-slate-800 text-white rounded"><option value="male">Homem</option><option value="female">Mulher</option></select>
                <select value={a.drinksAlcohol ? 'true' : 'false'} onChange={e => { const copy = [...adults]; copy[i].drinksAlcohol = e.target.value === 'true'; setAdults(copy); }} className="px-2 py-1.5 bg-slate-950 border border-slate-800 text-white rounded"><option value="true">Bebe Álcool: Sim</option><option value="false">Bebe Álcool: Não</option></select>
              </div>
            ))}
          </div>

          {/* CRIANÇAS */}
          <div className="space-y-2 border-t border-slate-800 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-sky-400">CRIANÇAS ({children.length})</span>
              <button type="button" onClick={() => setChildren([...children, { name: '', gender: 'male', drinksAlcohol: false, status: 'pending' }])} className="text-xs text-sky-300 hover:underline">+ Criança</button>
            </div>
            {children.map((c, i) => (
              <div key={i} className="p-3 bg-slate-900 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <input type="text" required placeholder="Nome da Criança" value={c.name} onChange={e => { const copy = [...children]; copy[i].name = e.target.value; setChildren(copy); }} className="px-2 py-1.5 bg-slate-950 border border-slate-800 text-white rounded" />
                <select value={c.gender} onChange={e => { const copy = [...children]; copy[i].gender = e.target.value; setChildren(copy); }} className="px-2 py-1.5 bg-slate-950 border border-slate-800 text-white rounded"><option value="male">Homem</option><option value="female">Mulher</option></select>
                <select value={c.drinksAlcohol ? 'true' : 'false'} onChange={e => { const copy = [...children]; copy[i].drinksAlcohol = e.target.value === 'true'; setChildren(copy); }} className="px-2 py-1.5 bg-slate-950 border border-slate-800 text-white rounded"><option value="false">Bebe Álcool: Não</option><option value="true">Bebe Álcool: Sim</option></select>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800 text-xs font-bold">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
            <button type="submit" disabled={submitting} className="px-5 py-2 bg-amber-500 text-slate-950 rounded-xl">{submitting ? 'Salvando...' : 'Salvar Grupo'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- GESTÃO DE ADMINS ---
const AdminsPage = () => {
  const [admins, setAdmins] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await listAdmins();
    setAdmins(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await addAdmin(email);
      setEmail('');
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggle = async (a) => {
    await updateAdminStatus(a.email, !a.active);
    load();
  };

  const handleDelete = async (a) => {
    if (confirm(`Remover admin ${a.email}?`)) {
      await removeAdmin(a.email);
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white font-outfit">Gerenciamento de Administradores</h1>
        <p className="text-xs text-slate-400">Cadastre e-mails com permissão de acesso ao painel</p>
      </div>

      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white">Adicionar Administrador</h3>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="admin@gmail.com"
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-500"
          />
          <button type="submit" className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl">Adicionar</button>
        </form>
      </div>

      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white">Administradores ({admins.length})</h3>
        {loading ? (
          <div className="text-xs text-slate-400">Carregando...</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {admins.map(a => (
              <div key={a.email} className="py-3 flex justify-between items-center text-xs">
                <div>
                  <p className="font-semibold text-white">{a.email}</p>
                  <span className={`text-[10px] font-bold ${a.active ? 'text-emerald-400' : 'text-rose-400'}`}>{a.active ? 'Ativo' : 'Desativado'}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleToggle(a)} className="text-yellow-400 hover:underline">{a.active ? 'Desativar' : 'Reativar'}</button>
                  <button onClick={() => handleDelete(a)} className="text-rose-400 hover:underline">Remover</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- PÁGINA PÚBLICA DE CONFIRMAÇÃO ---
const PublicPage = ({ token }) => {
  const [group, setGroup] = useState(null);
  const [guestStates, setGuestStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const safetyTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 3000);

    getPublicGroup(token).then(g => {
      if (isMounted) {
        clearTimeout(safetyTimer);
        setGroup(g);
        if (g) {
          const list = [];
          (g.adults || []).forEach(a => list.push({ id: a.id, name: a.name, type: 'adult', status: a.status || 'pending' }));
          (g.children || []).forEach(c => list.push({ id: c.id, name: c.name, type: 'child', status: c.status || 'pending' }));
          setGuestStates(list);
        }
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) {
        clearTimeout(safetyTimer);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, [token]);

  const handleToggleStatus = (id, newStatus) => {
    setSavedSuccess(false);
    setGuestStates(prev => prev.map(x => x.id === id ? { ...x, status: x.status === newStatus ? 'pending' : newStatus } : x));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await savePublicResponses(token, guestStates.map(x => ({ guestId: x.id, type: x.type, status: x.status })));
      setSavedSuccess(true);
    } catch (err) {
      alert('Erro ao salvar respostas.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-slate-400 text-xs">Carregando convite...</div>;

  if (!group) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4">
        <div className="glass-panel p-6 rounded-2xl text-center space-y-2 max-w-sm">
          <h2 className="text-lg font-bold text-white">Convite Não Encontrado</h2>
          <p className="text-xs text-slate-400">Verifique o link de confirmação enviado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] py-8 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="glass-panel p-6 rounded-3xl text-center border border-amber-500/20 shadow-2xl">
          <h1 className="text-2xl font-bold text-white font-outfit">Confirmação de Presença</h1>
          <div className="mt-2 inline-block px-3 py-1 rounded-full bg-slate-900 border border-amber-500/30 text-amber-300 font-semibold text-xs">
            {group.groupName}
          </div>
          <p className="text-slate-400 text-xs mt-3">Por favor, selecione abaixo quem estará presente no evento.</p>
        </div>

        {savedSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-200 text-center font-bold text-xs">
            Suas respostas foram registradas.
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3">
          {guestStates.map(guest => (
            <div key={guest.id} className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-white font-outfit">{guest.name}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(guest.id, 'going')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${guest.status === 'going' ? 'bg-emerald-500 text-slate-950 font-extrabold' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}
                >
                  Vou
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleStatus(guest.id, 'notGoing')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${guest.status === 'notGoing' ? 'bg-rose-600 text-white font-extrabold' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}
                >
                  Não vou
                </button>
              </div>
            </div>
          ))}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold rounded-2xl text-sm shadow-xl shadow-amber-500/20 disabled:opacity-50 mt-4"
          >
            {saving ? 'Salvando...' : 'Confirmar respostas'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 7. APLICAÇÃO PRINCIPAL & ROTEAMENTO COMPATÍVEL
// ==========================================
export const MainApp = () => {
  const { currentUser, isAdmin, loading } = useAuth();
  const [currentRoute, setRoute] = useState('dashboard');
  const [publicToken, setPublicToken] = useState(null);

  useEffect(() => {
    const checkUrl = () => {
      const hash = window.location.hash || '';
      const search = window.location.search || '';

      if (hash.includes('token=')) {
        setPublicToken(hash.split('token=')[1]);
      } else if (search.includes('token=')) {
        const params = new URLSearchParams(search);
        setPublicToken(params.get('token'));
      } else if (hash.includes('confirmacao/')) {
        setPublicToken(hash.split('confirmacao/')[1]);
      } else {
        setPublicToken(null);
      }
    };

    checkUrl();
    window.addEventListener('hashchange', checkUrl);
    return () => window.removeEventListener('hashchange', checkUrl);
  }, []);

  if (publicToken) {
    return <PublicPage token={publicToken} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center text-amber-400 text-sm font-semibold">
        <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-3"></div>
        Verificando acesso...
      </div>
    );
  }

  if (!currentUser || !isAdmin) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col">
      <Navbar currentRoute={currentRoute} setRoute={setRoute} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentRoute === 'dashboard' && <DashboardPage setRoute={setRoute} />}
        {currentRoute === 'groups' && <GroupsPage />}
        {currentRoute === 'admins' && <AdminsPage />}
      </main>
    </div>
  );
};

// RENDERIZAÇÃO NO DOM COM INICIALIZAÇÃO SEGURA
const startApp = () => {
  const rootEl = document.getElementById('root');
  if (rootEl) {
    ReactDOM.createRoot(rootEl).render(
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    );
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

