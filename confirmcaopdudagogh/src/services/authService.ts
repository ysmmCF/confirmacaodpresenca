import { signInWithEmailAndPassword, signOut as firebaseSignOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { AdminRecord } from '../types';

export const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

export const signIn = async (email: string, pass: string): Promise<User> => {
  const normEmail = normalizeEmail(email);
  const userCredential = await signInWithEmailAndPassword(auth, normEmail, pass);
  return userCredential.user;
};

export const logout = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const isCurrentUserAdmin = async (email: string): Promise<{ authorized: boolean; reason?: string; record?: AdminRecord }> => {
  if (!email) {
    return { authorized: false, reason: "E-mail não fornecido." };
  }

  const normEmail = normalizeEmail(email);
  try {
    const adminRef = doc(db, 'adminEmails', normEmail);
    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists()) {
      return { authorized: false, reason: "Este e-mail não possui acesso ao painel." };
    }

    const data = adminSnap.data() as AdminRecord;

    if (!data.active) {
      return { authorized: false, reason: "Este administrador está desativado." };
    }

    if (data.role !== 'admin') {
      return { authorized: false, reason: "Usuário não possui privilégio administrativo." };
    }

    return { authorized: true, record: data };
  } catch (error: any) {
    console.error("Erro ao verificar permissões de admin:", error);
    return { authorized: false, reason: "Falha ao verificar autorização no sistema." };
  }
};
