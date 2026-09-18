import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AdminRecord } from '../types';
import { normalizeEmail } from './authService';

export const listAdmins = async (): Promise<AdminRecord[]> => {
  const adminsRef = collection(db, 'adminEmails');
  const q = query(adminsRef, orderBy('email', 'asc'));
  const querySnap = await getDocs(q);

  const admins: AdminRecord[] = [];
  querySnap.forEach((d) => {
    const data = d.data();
    admins.push({
      email: data.email || d.id,
      role: data.role || 'admin',
      active: data.active ?? true,
      createdAt: data.createdAt || new Date().toISOString()
    });
  });

  return admins;
};

export const addAdmin = async (email: string): Promise<AdminRecord> => {
  const normEmail = normalizeEmail(email);

  if (!normEmail || !normEmail.includes('@')) {
    throw new Error('Insira um e-mail válido.');
  }

  const adminRef = doc(db, 'adminEmails', normEmail);
  const newAdmin: AdminRecord = {
    email: normEmail,
    role: 'admin',
    active: true,
    createdAt: new Date().toISOString()
  };

  await setDoc(adminRef, newAdmin);
  return newAdmin;
};

export const updateAdminStatus = async (email: string, active: boolean): Promise<void> => {
  const normEmail = normalizeEmail(email);
  const adminRef = doc(db, 'adminEmails', normEmail);
  await updateDoc(adminRef, { active });
};

export const removeAdmin = async (email: string): Promise<void> => {
  const normEmail = normalizeEmail(email);
  const adminRef = doc(db, 'adminEmails', normEmail);
  await deleteDoc(adminRef);
};
