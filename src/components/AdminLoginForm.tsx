import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export const AdminLoginForm: React.FC = () => {
  const { adminLogin } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const success = adminLogin(password);
    if (!success) {
      setError('Неверный пароль администратора');
    }
  };

  return (
    <div className="mx-auto max-w-md surface-card p-8 shadow-2xl">
      <h1 className="text-2xl font-extrabold text-white">Вход в панель управления</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Управление турнирами и выдача доступов к матчам.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Пароль администратора
          </label>
          <input
            type="password"
            required
            className="input-field"
            placeholder="Введите пароль..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/15 border border-red-500/30 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary w-full py-3">
          Войти как администратор
        </button>
      </form>
    </div>
  );
};
