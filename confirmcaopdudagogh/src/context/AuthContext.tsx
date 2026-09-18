import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { isCurrentUserAdmin, logout } from '../services/authService';
import { AdminRecord } from '../types';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  adminRecord: AdminRecord | null;
  loading: boolean;
  authError: string | null;
  clearError: () => void;
  signOutUser: () => Promise<void>;
  checkAdminStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAdmin: false,
  adminRecord: null,
  loading: true,
  authError: null,
  clearError: () => {},
  signOutUser: async () => {},
  checkAdminStatus: async () => false
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminRecord, setAdminRecord] = useState<AdminRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const verifyUserAdmin = async (user: User): Promise<boolean> => {
    if (!user.email) {
      setAuthError("Usuário sem e-mail cadastrado.");
      setIsAdmin(false);
      setAdminRecord(null);
      await logout();
      return false;
    }

    const check = await isCurrentUserAdmin(user.email);
    if (check.authorized && check.record) {
      setIsAdmin(true);
      setAdminRecord(check.record);
      setAuthError(null);
      return true;
    } else {
      setAuthError(check.reason || "Acesso não autorizado ao painel administrativo.");
      setIsAdmin(false);
      setAdminRecord(null);
      await logout();
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setCurrentUser(user);
        await verifyUserAdmin(user);
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
        setAdminRecord(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOutUser = async () => {
    await logout();
    setCurrentUser(null);
    setIsAdmin(false);
    setAdminRecord(null);
    setAuthError(null);
  };

  const clearError = () => setAuthError(null);

  const checkAdminStatus = async (): Promise<boolean> => {
    if (currentUser) {
      return await verifyUserAdmin(currentUser);
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        adminRecord,
        loading,
        authError,
        clearError,
        signOutUser,
        checkAdminStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
