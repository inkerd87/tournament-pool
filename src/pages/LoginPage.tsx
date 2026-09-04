import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate('/account');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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
        {/* Toggle Mode */}
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
            Регистрация
          </button>
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-white">
          {mode === 'login' ? 'Вход в личный кабинет' : 'Создание аккаунта'}
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 leading-relaxed">
          {mode === 'login'
            ? 'Введите Email и пароль для доступа к турнирам и матчам.'
            : 'Зарегистрируйтесь, чтобы участвовать в турнирах и отслеживать призовые.'}
        </p>

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
                className="input-field mt-1 text-base sm:text-sm"
                placeholder="+7 (999) 000-00-00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
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
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-cyan-400 hover:underline"
              >
                {showPassword ? 'Скрыть' : 'Показать'}
              </button>
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
              : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-zinc-500">
          {mode === 'login' ? (
            <p>
              Впервые на платформе?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setError(null); }}
                className="text-cyan-400 hover:underline font-semibold"
              >
                Создать аккаунт
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
      </div>
    </div>
  );
};
