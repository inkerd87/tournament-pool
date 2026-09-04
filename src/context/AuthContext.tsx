import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { getStoredUser, saveUser } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

interface StoredAuthUser {
  password?: string;
  phone?: string;
  nickname?: string;
}

function getStoredAuthMap(): Record<string, StoredAuthUser> {
  try {
    const raw = localStorage.getItem('nb_auth_users');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredAuthMap(map: Record<string, StoredAuthUser>) {
  try {
    localStorage.setItem('nb_auth_users', JSON.stringify(map));
  } catch (e) {
    console.warn('Error saving auth map:', e);
  }
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  login: (email: string, password?: string, nickname?: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, nickname: string, phone: string) => Promise<{ success: boolean; error?: string }>;
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
            phone: (data as any).phone || user.phone || '',
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

  const register = async (
    email: string,
    password: string,
    nickname: string,
    phone: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanNick = nickname.trim() || cleanEmail.split('@')[0];
    const cleanPhone = phone.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Укажите корректный Email адрес.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Пароль должен содержать не менее 6 символов.' };
    }
    if (!cleanPhone) {
      return { success: false, error: 'Укажите номер телефона.' };
    }

    const authMap = getStoredAuthMap();
    if (authMap[cleanEmail] && authMap[cleanEmail].password) {
      return { success: false, error: 'Пользователь с таким Email уже зарегистрирован. Пожалуйста, выполните вход.' };
    }

    // Сохраняем пароль и телефон в локальную карту
    authMap[cleanEmail] = {
      password,
      phone: cleanPhone,
      nickname: cleanNick,
    };
    saveStoredAuthMap(authMap);

    let userObj: User = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email: cleanEmail,
      nickname: cleanNick,
      phone: cleanPhone,
      balanceRub: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      // Upsert into Supabase
      const { data: inserted } = await supabase
        .from('users')
        .upsert(
          {
            email: cleanEmail,
            nickname: cleanNick,
            phone: cleanPhone,
            balance_rub: 0,
          } as any,
          { onConflict: 'email' }
        )
        .select()
        .maybeSingle();

      if (inserted) {
        userObj = {
          id: inserted.id,
          email: inserted.email,
          nickname: inserted.nickname,
          phone: (inserted as any).phone || cleanPhone,
          balanceRub: Number(inserted.balance_rub) || 0,
          createdAt: inserted.created_at,
        };
      }
    } catch (e) {
      console.warn('Could not sync user to Supabase:', e);
    }

    setUser(userObj);
    return { success: true };
  };

  const login = async (
    email: string,
    passwordOrNick?: string,
    optionalNick?: string,
    optionalPhone?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Введите Email.' };
    }

    const authMap = getStoredAuthMap();
    const storedAuth = authMap[cleanEmail];

    // Если пароль передан и в базе есть сохранённый пароль — проверяем
    let providedPassword = '';
    let providedNick = '';
    let providedPhone = optionalPhone || '';

    if (passwordOrNick && passwordOrNick.length >= 6 && !optionalNick) {
      // Это вызов login(email, password)
      providedPassword = passwordOrNick;
    } else {
      // Это вызов login(email, nickname)
      providedNick = passwordOrNick || '';
    }

    if (optionalNick) {
      providedNick = optionalNick;
    }

    if (storedAuth?.password && providedPassword && storedAuth.password !== providedPassword) {
      return { success: false, error: 'Неверный пароль для этого Email.' };
    }

    const cleanNick = providedNick || storedAuth?.nickname || cleanEmail.split('@')[0];
    const cleanPhone = providedPhone || storedAuth?.phone || '';

    // Если был передан новый пароль или телефон, сохраняем в карту
    if (providedPassword || cleanPhone) {
      authMap[cleanEmail] = {
        password: providedPassword || storedAuth?.password,
        phone: cleanPhone || storedAuth?.phone,
        nickname: cleanNick,
      };
      saveStoredAuthMap(authMap);
    }

    let userObj: User = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email: cleanEmail,
      nickname: cleanNick,
      phone: cleanPhone,
      balanceRub: 0,
      createdAt: new Date().toISOString(),
    };

    try {
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
          phone: (existingUser as any).phone || cleanPhone,
          balanceRub: Number(existingUser.balance_rub) || 0,
          createdAt: existingUser.created_at,
        };
      } else {
        const { data: inserted } = await supabase
          .from('users')
          .insert({
            email: cleanEmail,
            nickname: cleanNick,
            phone: cleanPhone,
            balance_rub: 0,
          } as any)
          .select()
          .maybeSingle();

        if (inserted) {
          userObj = {
            id: inserted.id,
            email: inserted.email,
            nickname: inserted.nickname,
            phone: (inserted as any).phone || cleanPhone,
            balanceRub: Number(inserted.balance_rub) || 0,
            createdAt: inserted.created_at,
          };
        }
      }
    } catch (e) {
      console.warn('Could not sync login to Supabase:', e);
    }

    setUser(userObj);
    return { success: true };
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
    } catch (e) {
      console.warn('Could not update balance in Supabase:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        login,
        register,
        adminLogin,
        adminLogout,
        logout,
        updateBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
