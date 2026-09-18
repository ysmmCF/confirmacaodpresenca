export type AttendanceStatus = 'pending' | 'going' | 'notGoing';
export type Gender = 'male' | 'female';
export type AgeType = 'adult' | 'child';

export interface AdultGuest {
  id: string;
  name: string;
  status: AttendanceStatus;
  createdAt?: string;
  updatedAt?: string;
  // Dados privados incluídos dinamicamente para o painel admin
  privateData?: PrivateGuestData;
}

export interface ChildGuest {
  id: string;
  name: string;
  status: AttendanceStatus;
  slotIndex: number;
  createdAt?: string;
  updatedAt?: string;
  // Dados privados incluídos dinamicamente para o painel admin
  privateData?: PrivateGuestData;
}

export interface PrivateGuestData {
  id?: string;
  guestId: string;
  gender: Gender;
  ageType: AgeType;
  drinksAlcohol: boolean;
  groupId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GuestGroup {
  id: string; // token ou id doc no firestore
  groupName: string;
  publicToken: string;
  childrenLimit: number;
  createdAt: string;
  updatedAt: string;
  adults?: AdultGuest[];
  children?: ChildGuest[];
}

export interface AdminRecord {
  email: string;
  role: 'admin';
  active: boolean;
  createdAt?: string;
}

export interface DashboardStats {
  totalGroups: number;
  totalGuests: number;
  confirmed: number;
  pending: number;
  notGoing: number;
  adultsCount: number;
  childrenCount: number;
  menCount: number;
  womenCount: number;
  alcoholDrinkersCount: number;
}
