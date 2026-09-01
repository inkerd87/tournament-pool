import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { getStoredUser, saveUser } from '@/lib/storage';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  login: (email: string, nickname?: string) => void;
  adminLogin: (password: string) => boolean;
  adminLogout: () => void;
  logout: () => void;
  updateBalance: (delta: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [isAdmin, setIsAdmin] = useState<boolean>(() => localStorage.getItem('nb_admin') === 'true');

  useEffect(() => {
    saveUser(user);
  }, [user]);

  const login = (email: string, nickname?: string) => {
    const existing = getStoredUser();
    const newUser: User = {
      id: existing && existing.email === email ? existing.id : 'usr_' + Math.random().toString(36).substring(2, 9),
      email,
      nickname: nickname || (existing ? existing.nickname : email.split('@')[0]),
      balanceRub: existing ? existing.balanceRub : 0,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
    };
    setUser(newUser);
  };

  const adminLogin = (password: string) => {
    if (password === 'admin' || password === 'admin123' || password === 'nightbyte') {
      setIsAdmin(true);
      localStorage.setItem('nb_admin', 'true');
      return true;
    }
    return false;
  };

  const adminLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('nb_admin');
  };

  const logout = () => {
    setUser(null);
  };

  const updateBalance = (delta: number) => {
    if (!user) return;
    setUser({
      ...user,
      balanceRub: Math.max(0, user.balanceRub + delta),
    });
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, login, adminLogin, adminLogout, logout, updateBalance }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
