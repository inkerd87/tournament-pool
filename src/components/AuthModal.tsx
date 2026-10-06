import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { formatPhoneNumber, isValidPhone, isValidEmail } from '@/lib/validation';
import { SITE_NAME } from '@/lib/constants';

interface AuthModalProps {
  forcedOpen?: boolean;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ forcedOpen, onClose }) => {
  const { user, login, register } = useAuth();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'register' | 'login'>('register');

  // Поля формы
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [isAdult, setIsAdult] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Статусы
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Проверка первого открытия сайта
  useEffect(() => {
    // Если пользователь уже авторизован, окно не требуется
    if (user) {
      setIsOpen(false);
      return;
    }

    // Не открывать поверх страниц /login или /admin
    if (location.pathname === '/login' || location.pathname === '/admin') {
      return;
    }

    const seen = localStorage.getItem('nb_auth_modal_seen');
    if (!seen) {
      // Плавная задержка 600мс для естественного появления после отрисовки сайта
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [user, location.pathname]);

  // Поддержка принудительного открытия
  useEffect(() => {
    if (forcedOpen !== undefined) {
      setIsOpen(forcedOpen);
    }
    const handleOpen = () => {
      setIsOpen(true);
      setError(null);
      setSuccessMsg(null);
    };
    window.addEventListener('nb_open_auth_modal', handleOpen);
    return () => window.removeEventListener('nb_open_auth_modal', handleOpen);
  }, [forcedOpen]);

  const handleDismiss = () => {
    localStorage.setItem('nb_auth_modal_seen', 'true');
    setIsOpen(false);
    onClose?.();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!isValidEmail(cleanEmail)) {
      setError('Укажите корректный адрес электронной почты.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Пароль должен содержать не менее 6 символов.');
      return;
    }

    if (tab === 'register') {
      if (!nickname.trim() || nickname.trim().length < 2) {
        setError('Игровой никнейм должен содержать минимум 2 символа.');
        return;
      }

      if (!isValidPhone(phone)) {
        setError('Укажите корректный номер телефона (не менее 10 цифр).');
        return;
      }

      if (!isAdult) {
        setError('Участие и регистрация разрешены лицам старше 18 лет.');
        return;
      }
    }

    setLoading(true);

    try {
      if (tab === 'register') {
        const res = await register(cleanEmail, password, nickname.trim(), phone.trim());
        if (!res.success) {
          setError(res.error || 'Ошибка при регистрации. Возможно, этот email уже зарегистрирован.');
          setLoading(false);
          return;
        }
        setSuccessMsg(`✓ Добро пожаловать, ${nickname.trim()}! Аккаунт успешно создан.`);
      } else {
        const res = await login(cleanEmail, password);
        if (!res.success) {
          setError(res.error || 'Неверный email или пароль.');
          setLoading(false);
          return;
        }
        setSuccessMsg('✓ Вход выполнен успешно!');
      }

      localStorage.setItem('nb_auth_modal_seen', 'true');
      setTimeout(() => {
        setIsOpen(false);
        onClose?.();
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Произошла непредвиденная ошибка');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div
        className="relative w-full max-w-md rounded-3xl border border-cyan-500/30 bg-[#0a0e17] p-6 sm:p-7 shadow-2xl overflow-hidden text-left my-8"
        style={{
          boxShadow: '0 25px 60px -15px rgba(0, 240, 255, 0.2)',
        }}
      >
        {/* Фоновые градиенты */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-blue-600/15 blur-3xl" />

        {/* Кнопка закрытия */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-4 top-4 rounded-xl p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition"
          aria-label="Закрыть"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Шапка модального окна */}
        <div className="relative text-left mb-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/60 px-3 py-1 text-[11px] font-extrabold text-cyan-300 mb-2.5 shadow-sm">
            <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>ДОБРО ПОЖАЛОВАТЬ В {SITE_NAME}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {tab === 'register' ? 'Создайте игровой аккаунт' : 'Вход в личный кабинет'}
          </h2>
          <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
            {tab === 'register'
              ? 'Участвуйте в открытых турнирах, боритесь за победу и отслеживайте вознаграждения.'
              : 'Введите ваш email и пароль для доступа к матчам и балансу.'}
          </p>
        </div>

        {/* Вкладки: Регистрация / Вход */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-black/60 p-1 border border-white/10 mb-4">
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`rounded-lg py-2 text-xs font-black transition-all ${
              tab === 'register'
                ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-black shadow-md shadow-cyan-400/25'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Регистрация
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`rounded-lg py-2 text-xs font-black transition-all ${
              tab === 'login'
                ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-black shadow-md shadow-cyan-400/25'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Вход
          </button>
        </div>

        {/* Ошибки и уведомления об успехе */}
        {error && (
          <div className="mb-3.5 rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-300 font-medium">
            ⚠️ {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-3.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs text-emerald-300 font-bold">
            {successMsg}
          </div>
        )}

        {/* Форма */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === 'register' && (
            <div>
              <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                Игровой никнейм:
              </label>
              <input
                type="text"
                required
                placeholder="Например: CyberNinja"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="input-field text-xs text-white bg-black/60 border-white/15 focus:border-cyan-400 w-full"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-zinc-300 mb-1">
              Email (электронная почта):
            </label>
            <input
              type="email"
              required
              placeholder="you@mail.ru"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field text-xs text-white bg-black/60 border-white/15 focus:border-cyan-400 w-full"
            />
          </div>

          {tab === 'register' && (
            <div>
              <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                Номер телефона:
              </label>
              <input
                type="tel"
                required
                placeholder="+7 (999) 000-00-00"
                value={phone}
                onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                className="input-field text-xs font-mono text-white bg-black/60 border-white/15 focus:border-cyan-400 w-full"
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-zinc-300">
                Пароль:
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[10px] text-zinc-400 hover:text-white"
              >
                {showPassword ? 'Скрыть' : 'Показать'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Минимум 6 символов"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field text-xs text-white bg-black/60 border-white/15 focus:border-cyan-400 w-full font-mono"
            />
          </div>

          {tab === 'register' && (
            <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={isAdult}
                onChange={(e) => setIsAdult(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-black/60 text-cyan-400 focus:ring-cyan-500"
              />
              <span className="text-[11px] text-zinc-400 leading-tight">
                Мне исполнилось <strong className="text-zinc-200">18 лет</strong>, и я согласен с регламентом соревнований.
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 py-3 text-xs font-black text-black shadow-lg shadow-cyan-500/25 transition active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <span>Обработка...</span>
            ) : tab === 'register' ? (
              <span>Создать аккаунт и войти</span>
            ) : (
              <span>Войти в аккаунт</span>
            )}
          </button>
        </form>

        {/* Нижняя кнопка для пропуска */}
        <div className="mt-4 pt-3 border-t border-white/10 text-center">
          <button
            type="button"
            onClick={handleDismiss}
            className="text-xs text-zinc-400 hover:text-white transition font-medium"
          >
            Продолжить без входа (просмотр соревнований) →
          </button>
        </div>
      </div>
    </div>
  );
};
