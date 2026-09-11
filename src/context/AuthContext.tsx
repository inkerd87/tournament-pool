import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  updateBalance: (delta: number, emailOverride?: string) => Promise<void>;
  setBalance: (exactAmount: number) => Promise<void>;
  updatePhone: (newPhone: string) => Promise<boolean>;
  updateNickname: (newNick: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [isAdmin, setIsAdmin] = useState<boolean>(() => localStorage.getItem('nb_admin') === 'true');
  const lastBalanceUpdateRef = useRef<number>(0);

  useEffect(() => {
    saveUser(user);
  }, [user]);

  const refreshUser = async () => {
    const currentUser = getStoredUser() || user;
    if (!currentUser) return;
    try {
      const cleanEmail = currentUser.email.toLowerCase().trim();
      
      // Быстрый запрос по индексу
      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      const timeoutPromise = new Promise<{ data: null; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error('Supabase sync timeout')), 5000)
      );

      const { data, error } = (await Promise.race([queryPromise, timeoutPromise])) as any;

      if (!error && data) {
        const dbBalance = Number(data.balance_rub) || 0;
        const currentLocalUser = getStoredUser() || user;
        const localBalance = Number(currentLocalUser?.balanceRub) || 0;

        // Защита от задержки репликации только в первые 5 секунд после локального пополнения:
        const recentlyUpdated = Date.now() - (lastBalanceUpdateRef.current || 0) < 5000;
        const balanceToUse = recentlyUpdated ? Math.max(dbBalance, localBalance) : dbBalance;

        if (recentlyUpdated && localBalance > dbBalance) {
          supabase
            .from('users')
            .update({ balance_rub: balanceToUse })
            .eq('email', cleanEmail)
            .then(() => {})
            .catch(() => {});
        }

        setUser((prev) => {
          const updated: User = {
            id: data.id,
            email: data.email,
            nickname: data.nickname,
            phone: (data as any).phone || currentUser.phone || '',
            balanceRub: balanceToUse,
            createdAt: data.created_at,
          };
          saveUser(updated);
          return updated;
        });
      }
    } catch (e) {
      // Игнорируем сетевые таймауты Supabase, чтобы не ломать локальную работу
      console.warn('Supabase sync notice:', e);
    }
  };

  // Sync user with Supabase on mount once and listen to live Realtime updates
  useEffect(() => {
    refreshUser();

    const currentUser = user || getStoredUser();
    if (!currentUser?.email) return;

    const cleanEmail = currentUser.email.toLowerCase();

    // Real-time subscription to changes in 'users' table
    const userChannel = supabase
      .channel(`realtime-user-${cleanEmail}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
        },
        (payload: any) => {
          if (payload?.new?.email && payload.new.email.toLowerCase() === cleanEmail) {
            refreshUser();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userChannel);
    };
  }, [user?.email]);

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
      // 1. Проверяем, существует ли уже пользователь в Supabase
      const { data: existingUser, error: checkErr } = await supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingUser) {
        // Пользователь уже в базе — обновляем профиль
        const updatePayload: Record<string, any> = {
          nickname: cleanNick,
        };
        if (cleanPhone) updatePayload.phone = cleanPhone;

        const { data: updated } = await supabase
          .from('users')
          .update(updatePayload)
          .eq('email', cleanEmail)
          .select()
          .maybeSingle();

        if (updated) {
          userObj = {
            id: updated.id,
            email: updated.email,
            nickname: updated.nickname || cleanNick,
            phone: (updated as any).phone || cleanPhone,
            balanceRub: Number(updated.balance_rub) || 0,
            createdAt: updated.created_at,
          };
        }
      } else {
        // 2. Создаем нового пользователя в Supabase
        const insertPayload: Record<string, any> = {
          email: cleanEmail,
          nickname: cleanNick,
          balance_rub: 0,
        };
        if (cleanPhone) insertPayload.phone = cleanPhone;

        const { data: inserted, error: insErr } = await supabase
          .from('users')
          .insert(insertPayload)
          .select()
          .maybeSingle();

        if (insErr) {
          console.error('Supabase user insert error:', insErr);
          // Если колонка phone отсутствует в таблице users (код 42703), пробуем без нее
          if (insErr.message?.includes('phone') || insErr.code === '42703') {
            const { data: fbInserted, error: fbErr } = await supabase
              .from('users')
              .insert({
                email: cleanEmail,
                nickname: cleanNick,
                balance_rub: 0,
              })
              .select()
              .maybeSingle();

            if (fbInserted) {
              userObj = {
                id: fbInserted.id,
                email: fbInserted.email,
                nickname: fbInserted.nickname,
                phone: cleanPhone,
                balanceRub: Number(fbInserted.balance_rub) || 0,
                createdAt: fbInserted.created_at,
              };
            } else if (fbErr) {
              console.error('Supabase fallback user insert error:', fbErr);
            }
          }
        } else if (inserted) {
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
      console.error('Could not sync user to Supabase:', e);
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
      const { data: existingUser, error: checkErr } = await supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingUser) {
        userObj = {
          id: existingUser.id,
          email: existingUser.email,
          nickname: existingUser.nickname || cleanNick,
          phone: (existingUser as any).phone || cleanPhone,
          balanceRub: Number(existingUser.balance_rub) || 0,
          createdAt: existingUser.created_at,
        };

        if (cleanPhone || (cleanNick && cleanNick !== existingUser.nickname)) {
          const updateData: Record<string, any> = {
            nickname: cleanNick || existingUser.nickname,
          };
          if (cleanPhone) updateData.phone = cleanPhone;
          await supabase
            .from('users')
            .update(updateData)
            .eq('email', cleanEmail);
        }
      } else {
        const insertPayload: Record<string, any> = {
          email: cleanEmail,
          nickname: cleanNick,
          balance_rub: 0,
        };
        if (cleanPhone) insertPayload.phone = cleanPhone;

        const { data: inserted, error: insErr } = await supabase
          .from('users')
          .insert(insertPayload)
          .select()
          .maybeSingle();

        if (insErr) {
          console.error('Supabase login insert error:', insErr);
          if (insErr.message?.includes('phone') || insErr.code === '42703') {
            const { data: fbInserted, error: fbErr } = await supabase
              .from('users')
              .insert({
                email: cleanEmail,
                nickname: cleanNick,
                balance_rub: 0,
              })
              .select()
              .maybeSingle();

            if (fbInserted) {
              userObj = {
                id: fbInserted.id,
                email: fbInserted.email,
                nickname: fbInserted.nickname,
                phone: cleanPhone,
                balanceRub: Number(fbInserted.balance_rub) || 0,
                createdAt: fbInserted.created_at,
              };
            } else if (fbErr) {
              console.error('Supabase fallback login insert error:', fbErr);
            }
          }
        } else if (inserted) {
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
      console.error('Could not sync login to Supabase:', e);
    }

    setUser(userObj);
    return { success: true };
  };

  const adminLogin = (password: string) => {
    if (password === 'Wek320_zag12_') {
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
    saveUser(null);
    setUser(null);
  };

  const updateBalance = async (delta: number, emailOverride?: string) => {
    const activeUser = user || getStoredUser();
    const targetEmail = (
      activeUser?.email || 
      emailOverride || 
      ''
    ).trim().toLowerCase();

    if (!targetEmail && !activeUser) return;

    localStorage.setItem('nb_last_balance_update', String(Date.now()));
    lastBalanceUpdateRef.current = Date.now();

    // 1. Текущий баланс активного пользователя
    const currentBalance = Number(activeUser?.balanceRub) || 0;
    const newBalance = Math.max(0, currentBalance + delta);

    // 2. Мгновенно обновляем локальный React state и localStorage
    if (activeUser) {
      const updated: User = {
        ...activeUser,
        balanceRub: newBalance,
      };
      setUser(updated);
      saveUser(updated);
    } else {
      const newUserObj: User = {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        email: targetEmail,
        nickname: targetEmail.split('@')[0],
        balanceRub: newBalance,
        createdAt: new Date().toISOString(),
      };
      setUser(newUserObj);
      saveUser(newUserObj);
    }

    // 3. Сохраняем в Supabase в фоне без блокировки интерфейса
    const finalEmail = (activeUser?.email || targetEmail).toLowerCase().trim();
    if (finalEmail) {
      supabase
        .from('users')
        .update({ balance_rub: newBalance })
        .ilike('email', finalEmail)
        .then(({ error, data }) => {
          if (error || !data) {
            supabase
              .from('users')
              .upsert(
                {
                  email: finalEmail,
                  nickname: activeUser?.nickname || finalEmail.split('@')[0],
                  phone: activeUser?.phone || '',
                  balance_rub: newBalance,
                },
                { onConflict: 'email' }
              )
              .then(() => {})
              .catch(() => {});
          }
        })
        .catch(() => {});
    }

    try {
      window.dispatchEvent(new Event('storage'));
    } catch {}
  };

  const setBalance = async (exactAmount: number) => {
    if (!user) return;
    const newBalance = Math.max(0, exactAmount);
    
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
      console.warn('Could not set balance in Supabase:', e);
    }
  };

  const updatePhone = async (newPhone: string): Promise<boolean> => {
    const cleanPhone = newPhone.trim();
    if (!user || !cleanPhone) return false;

    const updatedUser: User = {
      ...user,
      phone: cleanPhone,
    };
    setUser(updatedUser);
    saveUser(updatedUser);

    const authMap = getStoredAuthMap();
    if (authMap[user.email.toLowerCase()]) {
      authMap[user.email.toLowerCase()].phone = cleanPhone;
      saveStoredAuthMap(authMap);
    }

    try {
      await supabase
        .from('users')
        .update({ phone: cleanPhone })
        .eq('email', user.email.toLowerCase());
      return true;
    } catch (e) {
      console.warn('Could not sync phone to Supabase:', e);
      return true;
    }
  };

  const updateNickname = async (newNick: string): Promise<boolean> => {
    const cleanNick = newNick.trim();
    if (!user || !cleanNick) return false;

    const updatedUser: User = {
      ...user,
      nickname: cleanNick,
    };
    setUser(updatedUser);
    saveUser(updatedUser);

    const authMap = getStoredAuthMap();
    if (authMap[user.email.toLowerCase()]) {
      authMap[user.email.toLowerCase()].nickname = cleanNick;
      saveStoredAuthMap(authMap);
    }

    try {
      await supabase
        .from('users')
        .update({ nickname: cleanNick })
        .eq('email', user.email.toLowerCase());
      return true;
    } catch (e) {
      console.warn('Could not sync nickname to Supabase:', e);
      return true;
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
        setBalance,
        updatePhone,
        updateNickname,
        refreshUser,
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
