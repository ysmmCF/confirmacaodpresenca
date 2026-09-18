import { doc, getDoc, getDocs, collection, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { GuestGroup, AdultGuest, ChildGuest, AttendanceStatus } from '../types';

export const getPublicGroup = async (token: string): Promise<GuestGroup | null> => {
  if (!token) return null;

  try {
    const groupRef = doc(db, 'groups', token);
    const groupSnap = await getDoc(groupRef);

    if (!groupSnap.exists()) {
      return null;
    }

    const groupData = groupSnap.data();

    // Busca apenas adultos sem dados privados
    const adultsSnap = await getDocs(collection(db, 'groups', token, 'adults'));
    const adults: AdultGuest[] = adultsSnap.docs.map(d => ({
      id: d.id,
      name: d.data().name,
      status: d.data().status || 'pending',
      createdAt: d.data().createdAt,
      updatedAt: d.data().updatedAt
    }));

    // Busca apenas crianças sem dados privados
    const childrenSnap = await getDocs(collection(db, 'groups', token, 'children'));
    const children: ChildGuest[] = childrenSnap.docs.map(d => ({
      id: d.id,
      name: d.data().name,
      status: d.data().status || 'pending',
      slotIndex: d.data().slotIndex ?? 0,
      createdAt: d.data().createdAt,
      updatedAt: d.data().updatedAt
    }));

    return {
      id: token,
      groupName: groupData.groupName,
      publicToken: groupData.publicToken || token,
      childrenLimit: groupData.childrenLimit ?? children.length,
      createdAt: groupData.createdAt || new Date().toISOString(),
      updatedAt: groupData.updatedAt || new Date().toISOString(),
      adults,
      children
    };
  } catch (error) {
    console.error("Erro ao carregar grupo público:", error);
    return null;
  }
};

export interface PublicResponseInput {
  guestId: string;
  type: 'adult' | 'child';
  status: AttendanceStatus;
}

export const savePublicResponses = async (token: string, responses: PublicResponseInput[]): Promise<void> => {
  const now = new Date().toISOString();

  for (const resp of responses) {
    const collectionName = resp.type === 'adult' ? 'adults' : 'children';
    const guestRef = doc(db, 'groups', token, collectionName, resp.guestId);

    await updateDoc(guestRef, {
      status: resp.status,
      updatedAt: now
    });
  }
};
