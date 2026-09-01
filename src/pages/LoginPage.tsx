import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');

  if (user) {
    navigate('/account');
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    login(email.trim(), nickname.trim() || undefined);
    navigate('/account');
  };

  return (
    <div className="mx-auto max-w-md px-4 py-20 sm:px-6">
      <div className="surface-card p-8">
        <h1 className="text-2xl font-extrabold text-white">Вход в профиль</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Введите ваш Email для входа в личный кабинет.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Email
            </label>
            <input
              type="email"
              required
              className="input-field"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Никнейм (опционально)
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Player_One"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary w-full mt-4 py-3">
            Войти
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-zinc-600">
          Нет аккаунта? Введите Email и он создастся автоматически!
        </div>
      </div>
    </div>
  );
};
