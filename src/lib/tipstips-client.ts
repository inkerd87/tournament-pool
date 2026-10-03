import { supabase } from './supabase';
import { getStoredUser, saveUser } from './storage';

export const TIPSTIPS_URL = 'https://tips.tips/000482808';
export const TIPSTIPS_CODE = '000482808';
export const TIPSTIPS_RECIPIENT = 'Владимир (NightByte)';
export const TIPSTIPS_QR_IMAGE = '/tipstips-qr.png';

export interface TipsTipsPayment {
  id: string;
  code: string; // e.g. "NB-4918"
  amount: number;
  type: 'topup' | 'registration';
  userId?: string;
  email: string;
  phone?: string;
  nickname: string;
  gameAccount?: string;
  tournamentId?: string;
  tournamentTitle?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  createdAt: string;
  confirmedAt?: string;
  note?: string;
}

const STORAGE_KEY = 'nb_tipstips_payments_v1';

/**
 * Генерация короткого уникального кода заявки (например: NB-4821)
 */
export function generatePaymentCode(): string {
  const existing = getStoredTipsTipsPayments();
  const existingCodes = new Set(existing.map((p) => p.code));

  for (let i = 0; i < 100; i++) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const code = `NB-${randomNum}`;
    if (!existingCodes.has(code)) {
      return code;
    }
  }
  return `NB-${Date.now().toString().slice(-4)}`;
}

/**
 * Получение всех сохранённых платежей tips.tips из LocalStorage
 */
export function getStoredTipsTipsPayments(): TipsTipsPayment[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TipsTipsPayment[];
  } catch (err) {
    console.error('Failed to read tips.tips payments from storage:', err);
    return [];
  }
}

/**
 * Сохранение списка платежей
 */
export function saveTipsTipsPayments(payments: TipsTipsPayment[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
    window.dispatchEvent(new CustomEvent('nb_tipstips_updated', { detail: payments }));
  } catch (err) {
    console.error('Failed to save tips.tips payments:', err);
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Преобразование строки из таблицы transactions в объект TipsTipsPayment
 */
export function parseTransactionToPayment(tx: any): TipsTipsPayment | null {
  if (!tx) return null;
  let meta: any = {};
  if (tx.description) {
    try {
      meta = JSON.parse(tx.description);
    } catch {
      meta = { note: tx.description };
    }
  }

  const status: 'pending' | 'confirmed' | 'rejected' =
    tx.status === 'completed' || tx.status === 'confirmed'
      ? 'confirmed'
      : tx.status === 'failed' || tx.status === 'cancelled' || tx.status === 'rejected'
      ? 'rejected'
      : 'pending';

  return {
    id: tx.id,
    code: meta.code || `NB-${String(tx.id).slice(0, 4).toUpperCase()}`,
    amount: Number(tx.amount_rub) || 0,
    type: tx.type === 'registration' || meta.type === 'registration' ? 'registration' : 'topup',
    userId: tx.user_id || meta.userId || undefined,
    email: meta.email || '',
    phone: meta.phone || undefined,
    nickname: meta.nickname || 'Игрок',
    gameAccount: meta.gameAccount || undefined,
    tournamentId: meta.tournamentId || undefined,
    tournamentTitle: meta.tournamentTitle || undefined,
    status,
    createdAt: tx.created_at || new Date().toISOString(),
    confirmedAt: meta.confirmedAt || (status === 'confirmed' ? tx.created_at : undefined),
    note: meta.note || undefined,
  };
}

/**
 * Получение всех платежей из Supabase (таблица transactions) с объединением с LocalStorage
 */
export async function fetchTipsTipsPaymentsFromDb(): Promise<TipsTipsPayment[]> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('Could not fetch transactions from Supabase:', error);
      return getStoredTipsTipsPayments();
    }

    const dbPayments = data
      .map(parseTransactionToPayment)
      .filter((p): p is TipsTipsPayment => p !== null);

    const local = getStoredTipsTipsPayments();
    const map = new Map<string, TipsTipsPayment>();

    // Сначала добавляем платежи из базы данных
    dbPayments.forEach((p) => {
      map.set(p.id, p);
      if (p.code) map.set(p.code, p);
    });

    // Добавляем локальные, если они ещё не дошли до базы
    local.forEach((lp) => {
      const existing = map.get(lp.id) || (lp.code ? map.get(lp.code) : null);
      if (!existing) {
        map.set(lp.id, lp);
      }
    });

    const merged = Array.from(new Set(map.values())).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    saveTipsTipsPayments(merged);
    return merged;
  } catch (err) {
    console.error('Error fetching payments from Supabase:', err);
    return getStoredTipsTipsPayments();
  }
}

/**
 * Создание новой заявки на оплату через tips.tips
 * Генерирует валидный UUID и код NB-XXXX, мгновенно сохраняет в LocalStorage (0 мс задержки для UI)
 * и параллельно на фоне регистрирует запись в Supabase transactions.
 */
export async function createTipsTipsPayment(data: {
  amount: number;
  type: 'topup' | 'registration';
  userId?: string;
  email: string;
  phone?: string;
  nickname: string;
  gameAccount?: string;
  tournamentId?: string;
  tournamentTitle?: string;
}): Promise<TipsTipsPayment> {
  const code = generatePaymentCode();
  const now = new Date().toISOString();
  const paymentId = generateUUID();

  const meta = {
    code,
    type: data.type,
    userId: data.userId,
    email: data.email.trim().toLowerCase(),
    phone: data.phone?.trim() || '',
    nickname: data.nickname.trim(),
    gameAccount: data.gameAccount?.trim() || '',
    tournamentId: data.tournamentId || '',
    tournamentTitle: data.tournamentTitle || '',
    createdAt: now,
  };

  const payment: TipsTipsPayment = {
    id: paymentId,
    code,
    amount: data.amount,
    type: data.type,
    userId: data.userId,
    email: data.email.trim().toLowerCase(),
    phone: data.phone?.trim(),
    nickname: data.nickname.trim(),
    gameAccount: data.gameAccount?.trim(),
    tournamentId: data.tournamentId,
    tournamentTitle: data.tournamentTitle,
    status: 'pending',
    createdAt: now,
  };

  // 1. Немедленно сохраняем локально, чтобы модалка открылась без малейшей задержки
  const list = getStoredTipsTipsPayments();
  list.unshift(payment);
  saveTipsTipsPayments(list);

  // 2. Фоново асинхронно синхронизируем с Supabase transactions
  // Запускаем через IIFE, чтобы никогда не блокировать UI модалки
  (async () => {
    try {
      await supabase.from('transactions').insert([
        {
          id: paymentId,
          user_id: data.userId || null,
          type: data.type === 'registration' ? 'registration' : 'deposit',
          amount_rub: data.amount,
          status: 'pending',
          description: JSON.stringify(meta),
        },
      ]);
    } catch (err) {
      console.warn('Background sync payment to Supabase transactions:', err);
    }
  })();

  return payment;
}

/**
 * Подтверждение платежа администратором
 */
export async function confirmTipsTipsPayment(
  paymentId: string,
  onRegisterUser?: (
    tournamentId: string,
    nickname: string,
    gameAccount: string,
    email: string,
    phone: string
  ) => Promise<boolean> | boolean
): Promise<boolean> {
  const list = getStoredTipsTipsPayments();
  let payment = list.find((p) => p.id === paymentId || p.code === paymentId);

  const isUUID = UUID_REGEX.test(paymentId);

  if (!payment) {
    try {
      if (isUUID) {
        const { data: dbRow } = await supabase.from('transactions').select('*').eq('id', paymentId).maybeSingle();
        if (dbRow) {
          payment = parseTransactionToPayment(dbRow) || undefined;
        }
      }
    } catch (e) {
      console.warn('Error fetching payment for confirmation:', e);
    }
  }

  if (!payment) return false;
  if (payment.status === 'confirmed') return true;

  payment.status = 'confirmed';
  payment.confirmedAt = new Date().toISOString();

  // 1. Если это пополнение баланса пользователя
  if (payment.type === 'topup') {
    const currentUser = getStoredUser();
    if (currentUser && (currentUser.id === payment.userId || currentUser.email.toLowerCase() === payment.email.toLowerCase())) {
      currentUser.balanceRub = (currentUser.balanceRub || 0) + payment.amount;
      saveUser(currentUser);
      window.dispatchEvent(new CustomEvent('nb_balance_updated', { detail: currentUser.balanceRub }));
    }

    // Также обновляем в Supabase users
    try {
      let userQuery = supabase.from('users').select('*');
      if (payment.userId && UUID_REGEX.test(payment.userId)) {
        userQuery = userQuery.eq('id', payment.userId);
      } else if (payment.email) {
        userQuery = userQuery.eq('email', payment.email.toLowerCase().trim());
      }
      const { data: dbUser } = await userQuery.maybeSingle();
      if (dbUser) {
        await supabase
          .from('users')
          .update({ balance_rub: (Number(dbUser.balance_rub) || 0) + payment.amount })
          .eq('id', dbUser.id);
      }
    } catch (e) {
      console.warn('Could not sync user balance to Supabase:', e);
    }
  }

  // 2. Если это регистрация на турнир
  if (payment.type === 'registration' && payment.tournamentId) {
    if (onRegisterUser) {
      try {
        await onRegisterUser(
          payment.tournamentId,
          payment.nickname,
          payment.gameAccount || '',
          payment.email,
          payment.phone || ''
        );
      } catch (err) {
        console.error('Error auto-registering user after tips.tips payment confirm:', err);
      }
    }
  }

  const idx = list.findIndex((p) => p.id === payment.id || p.code === payment.code);
  if (idx !== -1) {
    list[idx] = payment;
  } else {
    list.unshift(payment);
  }
  saveTipsTipsPayments(list);

  // Обновляем статус в Supabase transactions: статус 'completed'
  try {
    const meta = {
      code: payment.code,
      type: payment.type,
      userId: payment.userId,
      email: payment.email,
      phone: payment.phone,
      nickname: payment.nickname,
      gameAccount: payment.gameAccount,
      tournamentId: payment.tournamentId,
      tournamentTitle: payment.tournamentTitle,
      confirmedAt: payment.confirmedAt,
      note: payment.note,
    };

    if (UUID_REGEX.test(payment.id)) {
      await supabase
        .from('transactions')
        .update({
          status: 'completed',
          description: JSON.stringify(meta),
        })
        .eq('id', payment.id);
    } else if (payment.code) {
      await supabase
        .from('transactions')
        .update({
          status: 'completed',
          description: JSON.stringify(meta),
        })
        .ilike('description', `%"code":"${payment.code}"%`);
    }
  } catch (err) {
    console.warn('Could not update transaction status in Supabase:', err);
  }

  return true;
}

/**
 * Отклонение платежа администратором
 * Важно: в PostgreSQL для transactions_status_check допустим статус 'failed' (не 'cancelled')
 */
export async function rejectTipsTipsPayment(paymentId: string, note?: string): Promise<boolean> {
  const list = getStoredTipsTipsPayments();
  let payment = list.find((p) => p.id === paymentId || p.code === paymentId);

  const isUUID = UUID_REGEX.test(paymentId);

  if (!payment) {
    try {
      if (isUUID) {
        const { data: dbRow } = await supabase.from('transactions').select('*').eq('id', paymentId).maybeSingle();
        if (dbRow) {
          payment = parseTransactionToPayment(dbRow) || undefined;
        }
      }
    } catch (e) {
      console.warn('Error fetching payment for rejection:', e);
    }
  }

  if (!payment) {
    payment = {
      id: paymentId,
      code: paymentId,
      amount: 0,
      type: 'topup',
      email: '',
      nickname: 'Игрок',
      status: 'rejected',
      createdAt: new Date().toISOString(),
    };
  }

  payment.status = 'rejected';
  if (note) payment.note = note;

  const idx = list.findIndex((p) => p.id === payment.id || p.code === payment.code);
  if (idx !== -1) {
    list[idx] = payment;
  } else {
    list.unshift(payment);
  }
  saveTipsTipsPayments(list);

  try {
    const meta = {
      code: payment.code,
      type: payment.type,
      userId: payment.userId,
      email: payment.email,
      phone: payment.phone,
      nickname: payment.nickname,
      gameAccount: payment.gameAccount,
      tournamentId: payment.tournamentId,
      tournamentTitle: payment.tournamentTitle,
      note: note || 'Отклонено администратором',
    };

    // PostgreSQL check constraint "transactions_status_check" требует статус 'failed'
    if (UUID_REGEX.test(payment.id)) {
      const { error } = await supabase
        .from('transactions')
        .update({
          status: 'failed',
          description: JSON.stringify(meta),
        })
        .eq('id', payment.id);
      if (error) console.warn('Supabase reject error:', error);
    } else if (payment.code) {
      const { error } = await supabase
        .from('transactions')
        .update({
          status: 'failed',
          description: JSON.stringify(meta),
        })
        .ilike('description', `%"code":"${payment.code}"%`);
      if (error) console.warn('Supabase reject error by code:', error);
    }
  } catch (err) {
    console.warn('Network error rejecting payment in Supabase:', err);
  }

  return true;
}

/**
 * Получение истории платежей конкретного пользователя
 */
export function getUserTipsTipsPayments(userEmailOrId: string): TipsTipsPayment[] {
  const target = userEmailOrId.trim().toLowerCase();
  const all = getStoredTipsTipsPayments();
  return all.filter(
    (p) => p.email.toLowerCase() === target || p.userId === userEmailOrId
  );
}

