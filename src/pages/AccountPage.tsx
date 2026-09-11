import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTournaments } from '@/context/TournamentContext';
import { formatRub } from '@/lib/format';
import { formatPhoneNumber, isValidPhone } from '@/lib/validation';
import { WalletTopUpForm } from '@/components/WalletTopUpForm';
import { RegisteredTournamentsList } from '@/components/RegisteredTournamentsList';
import { MatchHistoryList } from '@/components/MatchHistoryList';
import { getStoredHistory } from '@/lib/storage';

export const AccountPage: React.FC = () => {
  const { user, logout, refreshUser, updatePhone, updateNickname } = useAuth();
  const { tournaments, getUserRegistrations, matches } = useTournaments();

  const [isEditingPhone, setIsEditingPhone] = useState(!user?.phone);
  const [phoneInput, setPhoneInput] = useState(user?.phone || '');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneSuccess, setPhoneSuccess] = useState(false);
  const [isSavingPhone, setIsSavingPhone] = useState(false);

  const [isEditingNick, setIsEditingNick] = useState(false);
  const [nickInput, setNickInput] = useState(user?.nickname || '');
  const [nickError, setNickError] = useState<string | null>(null);
  const [nickSuccess, setNickSuccess] = useState(false);
  const [isSavingNick, setIsSavingNick] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);

    if (!phoneInput.trim() || !isValidPhone(phoneInput)) {
      setPhoneError('Укажите корректный номер телефона (не менее 10 цифр). Номер обязателен для выплат через СБП.');
      return;
    }

    setIsSavingPhone(true);
    try {
      await updatePhone(phoneInput.trim());
      setIsEditingPhone(false);
      setPhoneSuccess(true);
      setTimeout(() => setPhoneSuccess(false), 3000);
    } catch {
      setPhoneError('Ошибка при сохранении номера телефона.');
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleSaveNick = async (e: React.FormEvent) => {
    e.preventDefault();
    setNickError(null);
    const clean = nickInput.trim();
    if (!clean || clean.length < 3) {
      setNickError('Никнейм должен содержать не менее 3 символов.');
      return;
    }

    setIsSavingNick(true);
    try {
      await updateNickname(clean);
      setIsEditingNick(false);
      setNickSuccess(true);
      setTimeout(() => setNickSuccess(false), 3000);
    } catch {
      setNickError('Ошибка при обновлении никнейма.');
    } finally {
      setIsSavingNick(false);
    }
  };

  const userRegistrations = getUserRegistrations(user.email);
  const registeredTournaments = userRegistrations
    .map((reg) => {
      const tournament = tournaments.find((t) => t.id === reg.tournamentId) || {
        id: reg.tournamentId,
        title: reg.tournamentId.replace(/-/g, ' ').toUpperCase(),
        game: (reg.tournamentId.split('-')[0] || 'cs2') as any,
        maxPlayers: 100,
        minPlayers: 10,
        registeredCount: 1,
        startsAt: reg.paidAt || new Date().toISOString(),
        status: 'recruiting' as const,
        format: 'Матч',
        description: 'Регистрация подтверждена',
        entryFeeRub: 100,
        prizePoolRub: 0,
      };
      const match = matches[reg.tournamentId] || null;
      return { tournament, match };
    });

  const history = getStoredHistory(user.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Личный кабинет</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-zinc-400">
            <span className="font-bold text-white">{user.nickname}</span>
            <span>•</span>
            <span className="font-mono">{user.email}</span>
            {user.phone && !isEditingPhone && (
              <>
                <span>•</span>
                <span className="font-mono text-cyan-300 font-semibold">{user.phone}</span>
                <button
                  type="button"
                  onClick={() => {
                    setPhoneInput(user.phone || '');
                    setIsEditingPhone(true);
                  }}
                  className="text-[11px] text-zinc-500 hover:text-cyan-400 underline transition"
                >
                  изменить
                </button>
              </>
            )}
          </div>
        </div>
        <button
          onClick={logout}
          className="self-start sm:self-auto rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
        >
          Выйти из аккаунта
        </button>
      </div>

      {/* Обязательный блок привязки телефона для выплат СБП */}
      {(!user.phone || isEditingPhone) && (
        <form
          onSubmit={handleSavePhone}
          className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 sm:p-5 text-xs text-zinc-300 space-y-3"
        >
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-base">⚠️</span>
            <h3 className="font-bold text-white text-sm">
              Номер телефона обязателен для участия в соревнованиях и выплат наград
            </h3>
          </div>
          <p className="text-zinc-400 leading-relaxed">
            Пожалуйста, укажите ваш действующий номер мобильного телефона. Он используется для связи с судьями соревнований и перечисления денежных наград через Систему быстрых платежей (СБП).
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
            <input
              type="tel"
              required
              className="input-field text-sm font-mono max-w-xs"
              placeholder="+7 (999) 000-00-00"
              value={phoneInput}
              onChange={(e) => setPhoneInput(formatPhoneNumber(e.target.value))}
            />
            <button
              type="submit"
              disabled={isSavingPhone}
              className="btn-primary text-xs py-2.5 px-4 font-bold"
            >
              {isSavingPhone ? 'Сохранение...' : 'Сохранить номер телефона'}
            </button>
            {user.phone && (
              <button
                type="button"
                onClick={() => setIsEditingPhone(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Отмена
              </button>
            )}
          </div>

          {phoneError && (
            <p className="text-xs text-rose-400 font-semibold">{phoneError}</p>
          )}
        </form>
      )}

      {phoneSuccess && (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs font-bold text-emerald-400">
          ✓ Номер телефона успешно сохранён!
        </div>
      )}

      {/* Обязательное правило: соответствие ника в игре */}
      <div className="mt-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 sm:p-5 text-xs text-zinc-300 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 text-sm">🎮</span>
              <h3 className="font-bold text-white text-sm">
                Никнейм в игре: <span className="text-cyan-300 font-mono underline">{user.nickname}</span>
              </h3>
            </div>
            <p className="text-zinc-400 leading-relaxed max-w-2xl">
              Ваш никнейм на сайте <strong>обязан строго совпадать</strong> с никнеймом в игре (CS2, Dota 2, PUBG, Warzone, Fortnite). Судьи верифицируют игроков в лобби перед стартом матча. Несовпадение ников влечет отстранение без возврата оплаты.
            </p>
          </div>
          {!isEditingNick && (
            <button
              type="button"
              onClick={() => {
                setNickInput(user.nickname || '');
                setIsEditingNick(true);
              }}
              className="self-start sm:self-center shrink-0 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
            >
              Сменить никнейм
            </button>
          )}
        </div>

        {isEditingNick && (
          <form onSubmit={handleSaveNick} className="pt-2 border-t border-white/10 space-y-2">
            <p className="text-xs text-zinc-300">
              Введите ваш точный внутриигровой ник:
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                required
                className="input-field text-sm font-mono max-w-xs"
                placeholder="Точный ник в игре"
                value={nickInput}
                onChange={(e) => setNickInput(e.target.value)}
              />
              <button
                type="submit"
                disabled={isSavingNick}
                className="btn-primary text-xs py-2.5 px-4 font-bold"
              >
                {isSavingNick ? 'Сохранение...' : 'Сохранить никнейм'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditingNick(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Отмена
              </button>
            </div>
            {nickError && (
              <p className="text-xs text-rose-400 font-semibold">{nickError}</p>
            )}
          </form>
        )}

        {nickSuccess && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-2.5 text-xs font-bold text-emerald-400">
            ✓ Никнейм успешно обновлён!
          </div>
        )}
      </div>

      <div className="mt-6 sm:mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <div className="surface-card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Баланс кошелька</p>
              <button
                type="button"
                onClick={() => refreshUser()}
                className="text-[11px] text-zinc-500 hover:text-cyan-400 transition"
                title="Синхронизировать баланс"
              >
                🔄 Обновить
              </button>
            </div>

            <p className="mt-2 text-3xl font-black text-white">{formatRub(user.balanceRub)}</p>
            <p className="mt-1 text-xs text-zinc-400">Для мгновенной оплаты орг. услуг без комиссии</p>
          </div>

          <WalletTopUpForm />
        </div>

        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">
              Мои соревнования ({registeredTournaments.length})
            </h2>
            <RegisteredTournamentsList items={registeredTournaments} />
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">История матчей</h2>
            <MatchHistoryList matches={history} />
          </div>
        </div>
      </div>
    </div>
  );
};
