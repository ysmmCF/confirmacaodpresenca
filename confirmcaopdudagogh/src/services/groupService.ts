import { 
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { GuestGroup, AdultGuest, ChildGuest, PrivateGuestData, DashboardStats, Gender } from '../types';

// Função para gerar um publicToken aleatório e difícil de adivinhar (ex: K8xP2mQ7vL4nZ9)
export const generatePublicToken = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 14; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

// Função para gerar ID único para convidados
export const generateId = (): string => {
  return 'g_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

export interface CreateGroupInput {
  groupName: string;
  adults: Array<{
    id?: string;
    name: string;
    gender: Gender;
    drinksAlcohol: boolean;
    status?: 'pending' | 'going' | 'notGoing';
  }>;
  children: Array<{
    id?: string;
    name: string;
    gender: Gender;
    drinksAlcohol: boolean;
    status?: 'pending' | 'going' | 'notGoing';
  }>;
}

export const listGroups = async (): Promise<GuestGroup[]> => {
  const groupsRef = collection(db, 'groups');
  const q = query(groupsRef, orderBy('createdAt', 'desc'));
  const querySnap = await getDocs(q);

  const groups: GuestGroup[] = [];

  for (const groupDoc of querySnap.docs) {
    const groupData = groupDoc.data();
    const token = groupDoc.id;

    // Busca adultos
    const adultsSnap = await getDocs(collection(db, 'groups', token, 'adults'));
    const adults: AdultGuest[] = adultsSnap.docs.map(d => ({
      id: d.id,
      name: d.data().name,
      status: d.data().status || 'pending',
      createdAt: d.data().createdAt,
      updatedAt: d.data().updatedAt
    }));

    // Busca crianças
    const childrenSnap = await getDocs(collection(db, 'groups', token, 'children'));
    const children: ChildGuest[] = childrenSnap.docs.map(d => ({
      id: d.id,
      name: d.data().name,
      status: d.data().status || 'pending',
      slotIndex: d.data().slotIndex ?? 0,
      createdAt: d.data().createdAt,
      updatedAt: d.data().updatedAt
    }));

    groups.push({
      id: token,
      groupName: groupData.groupName || 'Sem Nome',
      publicToken: groupData.publicToken || token,
      childrenLimit: groupData.childrenLimit ?? children.length,
      createdAt: groupData.createdAt || new Date().toISOString(),
      updatedAt: groupData.updatedAt || new Date().toISOString(),
      adults,
      children
    });
  }

  return groups;
};

export const getGroup = async (token: string): Promise<GuestGroup | null> => {
  const groupRef = doc(db, 'groups', token);
  const groupSnap = await getDoc(groupRef);

  if (!groupSnap.exists()) {
    return null;
  }

  const groupData = groupSnap.data();

  // Busca adultos e seus dados privados
  const adultsSnap = await getDocs(collection(db, 'groups', token, 'adults'));
  const adults: AdultGuest[] = [];

  for (const d of adultsSnap.docs) {
    const adultData = d.data();
    let privData: PrivateGuestData | undefined = undefined;

    try {
      const privSnap = await getDoc(doc(db, 'privateGuestData', d.id));
      if (privSnap.exists()) {
        privData = privSnap.data() as PrivateGuestData;
      }
    } catch {
      // Ignora falha de privado se não admin
    }

    adults.push({
      id: d.id,
      name: adultData.name,
      status: adultData.status || 'pending',
      createdAt: adultData.createdAt,
      updatedAt: adultData.updatedAt,
      privateData: privData
    });
  }

  // Busca crianças e seus dados privados
  const childrenSnap = await getDocs(collection(db, 'groups', token, 'children'));
  const children: ChildGuest[] = [];

  for (const d of childrenSnap.docs) {
    const childData = d.data();
    let privData: PrivateGuestData | undefined = undefined;

    try {
      const privSnap = await getDoc(doc(db, 'privateGuestData', d.id));
      if (privSnap.exists()) {
        privData = privSnap.data() as PrivateGuestData;
      }
    } catch {
      // Ignora
    }

    children.push({
      id: d.id,
      name: childData.name,
      status: childData.status || 'pending',
      slotIndex: childData.slotIndex ?? 0,
      createdAt: childData.createdAt,
      updatedAt: childData.updatedAt,
      privateData: privData
    });
  }

  return {
    id: token,
    groupName: groupData.groupName,
    publicToken: groupData.publicToken || token,
    childrenLimit: groupData.childrenLimit ?? children.length,
    createdAt: groupData.createdAt,
    updatedAt: groupData.updatedAt,
    adults,
    children
  };
};

export const createGroup = async (input: CreateGroupInput): Promise<string> => {
  const publicToken = generatePublicToken();
  const now = new Date().toISOString();

  // 1. Cria o documento principal do grupo
  const groupRef = doc(db, 'groups', publicToken);
  await setDoc(groupRef, {
    id: publicToken,
    groupName: input.groupName.trim(),
    publicToken: publicToken,
    childrenLimit: input.children.length,
    createdAt: now,
    updatedAt: now
  });

  // 2. Adiciona adultos e cria privateGuestData
  for (const adult of input.adults) {
    const adultId = adult.id || generateId();
    const adultRef = doc(db, 'groups', publicToken, 'adults', adultId);

    await setDoc(adultRef, {
      id: adultId,
      name: adult.name.trim(),
      status: adult.status || 'pending',
      createdAt: now,
      updatedAt: now
    });

    const privateRef = doc(db, 'privateGuestData', adultId);
    await setDoc(privateRef, {
      guestId: adultId,
      gender: adult.gender,
      ageType: 'adult',
      drinksAlcohol: adult.drinksAlcohol,
      groupId: publicToken,
      createdAt: now,
      updatedAt: now
    });
  }

  // 3. Adiciona crianças e cria privateGuestData
  for (let idx = 0; idx < input.children.length; idx++) {
    const child = input.children[idx];
    const childId = child.id || generateId();
    const childRef = doc(db, 'groups', publicToken, 'children', childId);

    await setDoc(childRef, {
      id: childId,
      name: child.name.trim(),
      status: child.status || 'pending',
      slotIndex: idx,
      createdAt: now,
      updatedAt: now
    });

    const privateRef = doc(db, 'privateGuestData', childId);
    await setDoc(privateRef, {
      guestId: childId,
      gender: child.gender,
      ageType: 'child',
      drinksAlcohol: child.drinksAlcohol,
      groupId: publicToken,
      createdAt: now,
      updatedAt: now
    });
  }

  return publicToken;
};

export const updateGroup = async (publicToken: string, input: CreateGroupInput): Promise<void> => {
  const now = new Date().toISOString();
  const groupRef = doc(db, 'groups', publicToken);

  // Atualiza nome do grupo mantendo o mesmo publicToken
  await updateDoc(groupRef, {
    groupName: input.groupName.trim(),
    childrenLimit: input.children.length,
    updatedAt: now
  });

  // Obter lista atual no banco para remover convidados excluídos do formulário
  const currentGroup = await getGroup(publicToken);
  const currentAdultIds = new Set((currentGroup?.adults || []).map(a => a.id));
  const currentChildIds = new Set((currentGroup?.children || []).map(c => c.id));

  const newAdultIds = new Set(input.adults.map(a => a.id).filter(Boolean));
  const newChildIds = new Set(input.children.map(c => c.id).filter(Boolean));

  // Deleta adultos removidos
  for (const oldAdultId of currentAdultIds) {
    if (!newAdultIds.has(oldAdultId)) {
      await deleteDoc(doc(db, 'groups', publicToken, 'adults', oldAdultId));
      await deleteDoc(doc(db, 'privateGuestData', oldAdultId));
    }
  }

  // Deleta crianças removidas
  for (const oldChildId of currentChildIds) {
    if (!newChildIds.has(oldChildId)) {
      await deleteDoc(doc(db, 'groups', publicToken, 'children', oldChildId));
      await deleteDoc(doc(db, 'privateGuestData', oldChildId));
    }
  }

  // Salva/Atualiza adultos
  for (const adult of input.adults) {
    const adultId = adult.id || generateId();
    const adultRef = doc(db, 'groups', publicToken, 'adults', adultId);

    await setDoc(adultRef, {
      id: adultId,
      name: adult.name.trim(),
      status: adult.status || 'pending',
      updatedAt: now
    }, { merge: true });

    const privateRef = doc(db, 'privateGuestData', adultId);
    await setDoc(privateRef, {
      guestId: adultId,
      gender: adult.gender,
      ageType: 'adult',
      drinksAlcohol: adult.drinksAlcohol,
      groupId: publicToken,
      updatedAt: now
    }, { merge: true });
  }

  // Salva/Atualiza crianças
  for (let idx = 0; idx < input.children.length; idx++) {
    const child = input.children[idx];
    const childId = child.id || generateId();
    const childRef = doc(db, 'groups', publicToken, 'children', childId);

    await setDoc(childRef, {
      id: childId,
      name: child.name.trim(),
      status: child.status || 'pending',
      slotIndex: idx,
      updatedAt: now
    }, { merge: true });

    const privateRef = doc(db, 'privateGuestData', childId);
    await setDoc(privateRef, {
      guestId: childId,
      gender: child.gender,
      ageType: 'child',
      drinksAlcohol: child.drinksAlcohol,
      groupId: publicToken,
      updatedAt: now
    }, { merge: true });
  }
};

export const deleteGroup = async (publicToken: string): Promise<void> => {
  const currentGroup = await getGroup(publicToken);

  if (currentGroup) {
    // Exclui adultos e dados privados
    for (const adult of currentGroup.adults || []) {
      await deleteDoc(doc(db, 'groups', publicToken, 'adults', adult.id));
      await deleteDoc(doc(db, 'privateGuestData', adult.id));
    }

    // Exclui crianças e dados privados
    for (const child of currentGroup.children || []) {
      await deleteDoc(doc(db, 'groups', publicToken, 'children', child.id));
      await deleteDoc(doc(db, 'privateGuestData', child.id));
    }
  }

  // Exclui documento do grupo
  await deleteDoc(doc(db, 'groups', publicToken));
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const groups = await listGroups();

  let totalGuests = 0;
  let confirmed = 0;
  let pending = 0;
  let notGoing = 0;
  let adultsCount = 0;
  let childrenCount = 0;
  let menCount = 0;
  let womenCount = 0;
  let alcoholDrinkersCount = 0;

  // Busca coleção de dados privados para estatísticas gerais
  const privateSnap = await getDocs(collection(db, 'privateGuestData'));
  const privateMap = new Map<string, PrivateGuestData>();
  privateSnap.forEach(d => {
    privateMap.set(d.id, d.data() as PrivateGuestData);
  });

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
