import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { formatPhoneNumber, isValidPhone, isValidEmail } from '@/lib/validation';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, login, register, verifyResetIdentity, resetPassword } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [isAdult, setIsAdult] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Состояние для восстановления пароля (Forgot Password)
  const [resetPhoneOrNick, setResetPhoneOrNick] = useState('');
  const [isResetVerified, setIsResetVerified] = useState(false);
  const [verifiedNick, setVerifiedNick] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/account" replace />;
  }

  const handleResetVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setError('Укажите корректный адрес электронной почты.');
      return;
    }

    if (!resetPhoneOrNick.trim()) {
      setError('Укажите привязанный номер телефона или никнейм в игре.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyResetIdentity(email, resetPhoneOrNick);
      if (!res.success) {
        setError(res.error || 'Данные не совпадают с информацией аккаунта.');
      } else {
        setIsResetVerified(true);
        setVerifiedNick(res.nickname || null);
        setError(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Ошибка проверки данных.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || newPassword.length < 6) {
      setError('Новый пароль должен содержать не менее 6 символов.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают. Пожалуйста, проверьте ввод.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(email, resetPhoneOrNick, newPassword);
      if (!res.success) {
        setError(res.error || 'Ошибка смены пароля.');
      } else {
        setResetSuccessMessage('✓ Пароль успешно изменён! Выполняется вход в личный кабинет...');
        setTimeout(() => {
          navigate('/account');
        }, 1200);
      }
    } catch (err: any) {
      setError(err?.message || 'Ошибка при сохранении нового пароля.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setError('Укажите корректный адрес электронной почты.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Пароль должен содержать не менее 6 символов.');
      return;
    }

    if (mode === 'register') {
      if (!nickname.trim()) {
        setError('Укажите ваш игровой никнейм.');
        return;
      }

      if (!isValidPhone(phone)) {
        setError('Укажите корректный номер телефона (не менее 10 цифр, без букв).');
        return;
      }

      if (!isAdult) {
        setError('Регистрация и участие разрешены только совершеннолетним лицам (18+).');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        const res = await register(email, password, nickname, phone);
        if (!res.success) {
          setError(res.error || 'Ошибка при регистрации');
          setLoading(false);
          return;
        }
      } else {
        const res = await login(email, password);
        if (!res.success) {
          setError(res.error || 'Ошибка входа');
          setLoading(false);
          return;
        }
      }
      navigate('/account');
    } catch (err: any) {
      setError(err.message || 'Произошла непредвиденная ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="surface-card p-6 sm:p-8">
        {/* Переключатель режимов: Вход / Регистрация */}
        {mode !== 'forgot' && (
          <div className="flex rounded-xl bg-black/40 p-1 border border-white/10 mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition ${
                mode === 'login'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Вход в профиль
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition ${
                mode === 'register'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Регистрация 18+
            </button>
          </div>
        )}

        {/* Заголовок страницы */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            {mode === 'login'
              ? 'Вход в личный кабинет'
              : mode === 'register'
              ? 'Создание аккаунта'
              : 'Восстановление пароля'}
          </h1>
          {mode === 'register' && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-extrabold text-amber-300">
              🔞 18+
            </span>
          )}
        </div>

        <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 leading-relaxed">
          {mode === 'login'
            ? 'Введите Email и пароль для доступа к соревнованиям.'
            : mode === 'register'
            ? 'Зарегистрируйтесь, чтобы участвовать в соревнованиях и получать вознаграждение.'
            : 'Подтвердите привязанный телефон или никнейм, чтобы установить новый пароль.'}
        </p>

        {/* ----------------- РЕЖИМ ВОССТАНОВЛЕНИЯ ПАРОЛЯ (FORGOT) ----------------- */}
        {mode === 'forgot' ? (
          <div className="mt-6 space-y-4">
            {resetSuccessMessage ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-center">
                <span className="text-2xl block mb-2">🎉</span>
                <p className="text-sm font-bold text-emerald-300">{resetSuccessMessage}</p>
              </div>
            ) : !isResetVerified ? (
              /* Шаг 1: Проверка Email и Телефона/Никнейма */
              <form onSubmit={handleResetVerification} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Email аккаунта *
                  </label>
                  <input
                    type="email"
                    required
                    className="input-field mt-1 text-base sm:text-sm"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Привязанный телефон или никнейм *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field mt-1 text-base sm:text-sm font-mono"
                    placeholder="+7 (999) 000-00-00 или никнейм"
                    value={resetPhoneOrNick}
                    onChange={(e) => setResetPhoneOrNick(e.target.value)}
                  />
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    Укажите номер телефона, который вы вводили при регистрации, или игровой никнейм.
                  </span>
                </div>

                {error && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs sm:text-sm text-rose-300">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full mt-2 py-3 text-sm font-bold shadow-lg shadow-cyan-500/20"
                >
                  {loading ? 'Проверка данных...' : 'Подтвердить личность →'}
                </button>
              </form>
            ) : (
              /* Шаг 2: Ввод нового пароля */
              <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-300 flex items-center justify-between">
                  <span>✓ Личность подтверждена ({verifiedNick || email})</span>
                  <span className="text-emerald-400 font-bold">100% совпадение</span>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Новый пароль *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="text-xs text-cyan-400 hover:underline"
                    >
                      {showNewPassword ? 'Скрыть' : 'Показать'}
                    </button>
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    className="input-field mt-1 text-base sm:text-sm"
                    placeholder="Минимум 6 символов"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Повторите новый пароль *
                  </label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    className="input-field mt-1 text-base sm:text-sm"
                    placeholder="Повторите пароль..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs sm:text-sm text-rose-300">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black w-full py-3 text-sm font-extrabold shadow-lg shadow-emerald-500/20 transition"
                >
                  {loading ? 'Сохранение...' : '✓ Сохранить новый пароль и войти'}
                </button>
              </form>
            )}

            {/* Подсказка для ручного сброса через администратора */}
            <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-3.5 text-xs text-zinc-400 space-y-1.5">
              <p className="font-semibold text-zinc-300">Не помните телефон или никнейм?</p>
              <p className="text-[11px] leading-relaxed">
                Напишите администратору в Telegram:{' '}
                <a
                  href="https://t.me/nightbyte_official"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline font-semibold"
                >
                  @nightbyte_official
                </a>{' '}
                или на почту{' '}
                <a
                  href="mailto:support@nightbyteonline.ru"
                  className="text-cyan-400 hover:underline font-semibold"
                >
                  support@nightbyteonline.ru
                </a>
                . Администратор сверит данные и сбросит пароль вручную.
              </p>
            </div>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setIsResetVerified(false);
                  setResetSuccessMessage(null);
                }}
                className="text-xs text-zinc-400 hover:text-white transition font-medium"
              >
                ← Вернуться ко входу в профиль
              </button>
            </div>
          </div>
        ) : (
          /* ----------------- РЕЖИМ ВХОДА ИЛИ РЕГИСТРАЦИИ ----------------- */
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Игровой Никнейм *
                </label>
                <input
                  type="text"
                  required
                  className="input-field mt-1 text-base sm:text-sm"
                  placeholder="CyberNinja"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
                <span className="text-[10px] text-amber-300/90 mt-1 block">
                  ⚠️ Указывайте ваш точный никнейм в игре (CS2, PUBG, Dota 2). Ник в игре обязан строго совпадать с ником регистрации для судейской проверки и допуска к соревнованиям.
                </span>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Номер телефона *
                </label>
                <input
                  type="tel"
                  required
                  className="input-field mt-1 text-base sm:text-sm font-mono"
                  placeholder="+7 (999) 000-00-00"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                />
                <span className="text-[10px] text-zinc-500 mt-0.5 block">Только цифры, без букв</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Email *
              </label>
              <input
                type="email"
                required
                className="input-field mt-1 text-base sm:text-sm"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Пароль *
                </label>
                <div className="flex items-center gap-3">
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError(null);
                        setIsResetVerified(false);
                      }}
                      className="text-xs text-amber-400 hover:text-amber-300 hover:underline"
                    >
                      Забыли пароль?
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-cyan-400 hover:underline"
                  >
                    {showPassword ? 'Скрыть' : 'Показать'}
                  </button>
                </div>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                className="input-field mt-1 text-base sm:text-sm"
                placeholder="Минимум 6 символов"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {mode === 'register' && (
              <div className="rounded-xl border border-white/10 bg-black/30 p-3 sm:p-3.5">
                <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    required
                    checked={isAdult}
                    onChange={(e) => setIsAdult(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-white/20 bg-black/40 text-cyan-500 focus:ring-cyan-500/30 accent-cyan-400 shrink-0"
                  />
                  <span className="leading-snug">
                    Подтверждаю, что мне исполнилось <strong className="text-white">18 лет</strong>, и я обладаю полной дееспособностью.
                  </span>
                </label>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs sm:text-sm text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-5 py-3 text-sm font-bold shadow-lg shadow-cyan-500/20"
            >
              {loading
                ? 'Обработка...'
                : mode === 'login'
                ? 'Войти в профиль'
                : 'Зарегистрироваться (18+)'}
            </button>

            <p className="mt-3.5 text-[11px] text-zinc-500 text-center leading-relaxed">
              Нажимая кнопку, вы подтверждаете совершеннолетие (18+), соглашаетесь с условиями{' '}
              <Link to="/offer" target="_blank" className="text-cyan-400 hover:underline">
                Публичной оферты
              </Link>{' '}
              и даёте согласие на обработку персональных данных в соответствии с{' '}
              <Link to="/privacy" target="_blank" className="text-cyan-400 hover:underline">
                Политикой конфиденциальности
              </Link>
              .
            </p>
          </form>
        )}

        {mode !== 'forgot' && (
          <div className="mt-6 text-center text-xs text-zinc-500">
            {mode === 'login' ? (
              <p>
                Впервые на платформе?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(null); }}
                  className="text-cyan-400 hover:underline font-semibold"
                >
                  Создать аккаунт (18+)
                </button>
              </p>
            ) : (
              <p>
                Уже зарегистрированы?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); }}
                  className="text-cyan-400 hover:underline font-semibold"
                >
                  Войти в профиль
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
