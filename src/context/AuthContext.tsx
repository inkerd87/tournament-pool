import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { getStoredUser, saveUser } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  login: (email: string, nickname?: string) => Promise<void>;
  adminLogin: (password: string) => boolean;
  adminLogout: () => void;
  logout: () => void;
  updateBalance: (delta: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [isAdmin, setIsAdmin] = useState<boolean>(() => localStorage.getItem('nb_admin') === 'true');

  useEffect(() => {
    saveUser(user);
  }, [user]);

  // Sync user with Supabase on mount
  useEffect(() => {
    if (!user) return;
    const fetchLatestUser = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email.toLowerCase())
          .maybeSingle();

        if (!error && data) {
          setUser({
            id: data.id,
            email: data.email,
            nickname: data.nickname,
            balanceRub: Number(data.balance_rub) || 0,
            createdAt: data.created_at,
          });
        }
      } catch (e) {
        console.warn('Supabase user sync error:', e);
      }
    };
    fetchLatestUser();
  }, []);

  const login = async (email: string, nickname?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanNick = nickname?.trim() || cleanEmail.split('@')[0];

    let userObj: User = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email: cleanEmail,
      nickname: cleanNick,
      balanceRub: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      // Check if user exists in Supabase
      const { data: existingUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (!error && existingUser) {
        userObj = {
          id: existingUser.id,
          email: existingUser.email,
          nickname: existingUser.nickname,
          balanceRub: Number(existingUser.balance_rub) || 0,
          createdAt: existingUser.created_at,
        };
      } else {
        // Insert new user into Supabase
        const { data: inserted } = await supabase
          .from('users')
          .insert({
            email: cleanEmail,
            nickname: cleanNick,
            balance_rub: 0,
          })
          .select()
          .maybeSingle();

        if (inserted) {
          userObj = {
            id: inserted.id,
            email: inserted.email,
            nickname: inserted.nickname,
            balanceRub: Number(inserted.balance_rub) || 0,
            createdAt: inserted.created_at,
          };
        }
      }
    } catch (e) {
      console.warn('Could not sync login to Supabase, fallback to local:', e);
    }

    setUser(userObj);
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

  const updateBalance = async (delta: number) => {
    if (!user) return;
    const newBalance = Math.max(0, user.balanceRub + delta);
    
    setUser({
      ...user,
      balanceRub: newBalance,
    });

    try {
      await supabase
        .from('users')
        .update({ balance_rub: newBalance })
        .eq('email', user.email.toLowerCase());

      await supabase.from('transactions').insert({
        user_id: user.id.includes('usr_') ? null : user.id,
        type: delta >= 0 ? 'deposit' : 'entry_fee',
        amount_rub: Math.abs(delta),
        status: 'completed',
        description: delta >= 0 ? 'Пополнение баланса' : 'Оплата участия в турнире',
      });
    } catch (e) {
      console.warn('Could not sync balance to Supabase:', e);
    }
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
