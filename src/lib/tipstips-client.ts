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

/**
 * Создание новой заявки на оплату через tips.tips
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
  const payment: TipsTipsPayment = {
    id: `ttp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
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
    createdAt: new Date().toISOString(),
  };

  const list = getStoredTipsTipsPayments();
  list.unshift(payment);
  saveTipsTipsPayments(list);

  // Попытка асинхронно сохранить в Supabase (если таблица настроена)
  try {
    await supabase.from('tipstips_payments').insert([
      {
        id: payment.id,
        code: payment.code,
        amount: payment.amount,
        type: payment.type,
        user_id: payment.userId,
        email: payment.email,
        phone: payment.phone,
        nickname: payment.nickname,
        game_account: payment.gameAccount,
        tournament_id: payment.tournamentId,
        tournament_title: payment.tournamentTitle,
        status: payment.status,
        created_at: payment.createdAt,
      },
    ]);
  } catch {
    // Graceful fallback to LocalStorage
  }

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
  const index = list.findIndex((p) => p.id === paymentId);
  if (index === -1) return false;

  const payment = list[index];
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

    // Также пробуем обновить в Supabase users
    try {
      if (payment.userId) {
        const { data: dbUser } = await supabase.from('users').select('balance_rub').eq('id', payment.userId).single();
        if (dbUser) {
          await supabase.from('users').update({ balance_rub: (dbUser.balance_rub || 0) + payment.amount }).eq('id', payment.userId);
        }
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

  list[index] = payment;
  saveTipsTipsPayments(list);

  // Обновляем статус в Supabase
  try {
    await supabase.from('tipstips_payments').update({
      status: 'confirmed',
      confirmed_at: payment.confirmedAt,
    }).eq('id', payment.id);
  } catch {
    // Ignore Supabase update error
  }

  return true;
}

/**
 * Отклонение платежа администратором
 */
export async function rejectTipsTipsPayment(paymentId: string, note?: string): Promise<boolean> {
  const list = getStoredTipsTipsPayments();
  const index = list.findIndex((p) => p.id === paymentId);
  if (index === -1) return false;

  list[index].status = 'rejected';
  if (note) list[index].note = note;

  saveTipsTipsPayments(list);

  try {
    await supabase.from('tipstips_payments').update({
      status: 'rejected',
      note: note || null,
    }).eq('id', paymentId);
  } catch {
    // Ignore
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
