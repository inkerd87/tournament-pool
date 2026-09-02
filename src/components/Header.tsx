import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SITE_NAME } from '@/lib/constants';
import { formatRub } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';

const links = [
  { href: '/tournaments', label: 'Турниры' },
  { href: '/how-it-works', label: 'Как это работает' },
];

export const Header: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0a0d12]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" onClick={closeMenu} className="group flex items-center gap-2.5 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 text-sm font-black text-black shadow-md shadow-cyan-500/20">
            NB
          </span>
          <span className="text-lg font-bold tracking-tight text-white group-hover:text-cyan-300 transition">
            {SITE_NAME}
          </span>
        </Link>

        {/* Desktop Navigation (>= 1024px) */}
        <nav className="hidden lg:flex items-center gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                location.pathname === l.href
                  ? 'text-cyan-300 bg-white/5'
                  : 'text-zinc-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <Link
              to="/account"
              className="ml-2 flex items-center gap-2 rounded-lg border border-white/10 bg-[#12161f] py-1.5 pl-3 pr-2 text-sm transition hover:border-cyan-500/30"
            >
              <span className="max-w-[120px] truncate text-zinc-200">
                {user.nickname}
              </span>
              <span className="rounded-md bg-cyan-500/15 px-2 py-0.5 font-mono text-xs font-semibold text-cyan-300">
                {formatRub(user.balanceRub)}
              </span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="ml-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white"
            >
              Войти
            </Link>
          )}
          <Link
            to="/tournaments"
            className="btn-primary ml-2 px-4 py-2 text-xs font-bold shrink-0 shadow-sm shadow-cyan-400/20"
          >
            Участвовать
          </Link>
        </nav>

        {/* Mobile & Tablet Bar (< 1024px) */}
        <div className="flex lg:hidden items-center gap-2">
          {user ? (
            <Link
              to="/account"
              onClick={closeMenu}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#12161f] px-2.5 py-1 text-xs font-mono font-semibold text-cyan-300"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              {formatRub(user.balanceRub)}
            </Link>
          ) : (
            <Link
              to="/login"
              onClick={closeMenu}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white"
            >
              Войти
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Меню"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 hover:text-white transition active:scale-95"
          >
            {mobileMenuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-white/10 bg-[#0a0d12] px-4 py-4 space-y-2 shadow-2xl">
          <Link
            to="/tournaments"
            onClick={closeMenu}
            className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              location.pathname === '/tournaments' ? 'bg-cyan-500/15 text-cyan-300' : 'text-zinc-300 hover:bg-white/5'
            }`}
          >
            🏆 Все турниры
          </Link>
          <Link
            to="/how-it-works"
            onClick={closeMenu}
            className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              location.pathname === '/how-it-works' ? 'bg-cyan-500/15 text-cyan-300' : 'text-zinc-300 hover:bg-white/5'
            }`}
          >
            ℹ️ Как это работает
          </Link>
          <Link
            to="/account"
            onClick={closeMenu}
            className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              location.pathname === '/account' ? 'bg-cyan-500/15 text-cyan-300' : 'text-zinc-300 hover:bg-white/5'
            }`}
          >
            👤 Личный кабинет {user ? `(${user.nickname})` : ''}
          </Link>
          <Link
            to="/offer"
            onClick={closeMenu}
            className="block rounded-lg px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200"
          >
            📄 Публичная оферта
          </Link>
          <Link
            to="/privacy"
            onClick={closeMenu}
            className="block rounded-lg px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300"
          >
            🔒 Политика конфиденциальности
          </Link>

          <div className="pt-2 w-full">
            <Link
              to="/tournaments"
              onClick={closeMenu}
              className="btn-primary w-full py-2.5 text-center text-xs font-bold"
            >
              Выбрать турнир и участвовать
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
