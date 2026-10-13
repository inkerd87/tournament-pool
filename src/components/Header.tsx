import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SITE_NAME, VK_GROUP_URL } from '@/lib/constants';
import { formatRub } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';

const links = [
  { href: '/tournaments', label: 'Соревнования' },
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
          <img
            src="/logo-icon.jpg"
            alt="NightByte Logo"
            className="h-10 w-10 rounded-xl object-contain border border-cyan-500/25 shadow-md shadow-cyan-500/25 group-hover:border-cyan-400/50 group-hover:scale-105 transition-all duration-200"
          />
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-tight text-white group-hover:text-cyan-300 transition leading-tight">
              {SITE_NAME}
            </span>
            <span className="text-[10px] font-semibold tracking-wider text-cyan-400 uppercase leading-none">
              ONLINE.RU
            </span>
          </div>
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
          <a
            href={VK_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#0077FF]/40 bg-[#0077FF]/15 px-3 py-1.5 text-xs font-bold text-white transition hover:border-[#0077FF] hover:bg-[#0077FF]/30 hover:shadow-md hover:shadow-[#0077FF]/20"
            title="Официальное сообщество ВКонтакте"
          >
            <svg className="h-4 w-4 fill-[#3b9dff]" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.67 2 15.07 2zm3.08 14.27h-1.46c-.55 0-.72-.44-1.71-1.43-.86-.83-1.24-.94-1.46-.94-.3 0-.38.08-.38.49v1.31c0 .35-.11.56-1.04.56-1.54 0-3.24-.93-4.44-2.66-1.81-2.54-2.3-4.45-2.3-4.84 0-.21.08-.41.49-.41h1.46c.37 0 .51.17.65.56.72 2.08 1.92 3.9 2.41 3.9.19 0 .27-.09.27-.56V9.97c-.06-.99-.58-1.07-.58-1.42 0-.17.14-.34.37-.34h2.29c.31 0 .42.17.42.53v2.89c0 .31.14.42.23.42.19 0 .34-.11.68-.45 1.05-1.18 1.8-3 1.8-3 .1-.21.27-.41.64-.41h1.46c.44 0 .54.23.44.53-.18.85-1.95 3.35-1.95 3.35-.16.25-.22.36 0 .65.16.21.69.67 1.04 1.08.65.74 1.14 1.36 1.28 1.79.14.42-.08.64-.51.64z" />
            </svg>
            <span>ВК</span>
          </a>
          {user ? (
            <Link
              to="/account"
              className="ml-1 flex items-center gap-2 rounded-lg border border-white/10 bg-[#12161f] py-1.5 pl-3 pr-2 text-sm transition hover:border-cyan-500/30"
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
              className="ml-1 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white"
            >
              Войти
            </Link>
          )}
          <Link
            to="/tournaments"
            className="btn-primary ml-1 px-4 py-2 text-xs font-bold shrink-0 shadow-sm shadow-cyan-400/20"
          >
            Участвовать
          </Link>
        </nav>

        {/* Mobile & Tablet Bar (< 1024px) */}
        <div className="flex lg:hidden items-center gap-2">
          <a
            href={VK_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Группа ВКонтакте"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#0077FF]/40 bg-[#0077FF]/15 text-[#3b9dff] hover:bg-[#0077FF]/30 transition"
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.67 2 15.07 2zm3.08 14.27h-1.46c-.55 0-.72-.44-1.71-1.43-.86-.83-1.24-.94-1.46-.94-.3 0-.38.08-.38.49v1.31c0 .35-.11.56-1.04.56-1.54 0-3.24-.93-4.44-2.66-1.81-2.54-2.3-4.45-2.3-4.84 0-.21.08-.41.49-.41h1.46c.37 0 .51.17.65.56.72 2.08 1.92 3.9 2.41 3.9.19 0 .27-.09.27-.56V9.97c-.06-.99-.58-1.07-.58-1.42 0-.17.14-.34.37-.34h2.29c.31 0 .42.17.42.53v2.89c0 .31.14.42.23.42.19 0 .34-.11.68-.45 1.05-1.18 1.8-3 1.8-3 .1-.21.27-.41.64-.41h1.46c.44 0 .54.23.44.53-.18.85-1.95 3.35-1.95 3.35-.16.25-.22.36 0 .65.16.21.69.67 1.04 1.08.65.74 1.14 1.36 1.28 1.79.14.42-.08.64-.51.64z" />
            </svg>
          </a>
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
            🏆 Все соревнования
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
          <a
            href={VK_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeMenu}
            className="flex items-center gap-2.5 rounded-xl border border-[#0077FF]/40 bg-[#0077FF]/15 px-3 py-2.5 text-sm font-bold text-white hover:bg-[#0077FF]/25 transition"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0077FF] text-white">
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.67 2 15.07 2zm3.08 14.27h-1.46c-.55 0-.72-.44-1.71-1.43-.86-.83-1.24-.94-1.46-.94-.3 0-.38.08-.38.49v1.31c0 .35-.11.56-1.04.56-1.54 0-3.24-.93-4.44-2.66-1.81-2.54-2.3-4.45-2.3-4.84 0-.21.08-.41.49-.41h1.46c.37 0 .51.17.65.56.72 2.08 1.92 3.9 2.41 3.9.19 0 .27-.09.27-.56V9.97c-.06-.99-.58-1.07-.58-1.42 0-.17.14-.34.37-.34h2.29c.31 0 .42.17.42.53v2.89c0 .31.14.42.23.42.19 0 .34-.11.68-.45 1.05-1.18 1.8-3 1.8-3 .1-.21.27-.41.64-.41h1.46c.44 0 .54.23.44.53-.18.85-1.95 3.35-1.95 3.35-.16.25-.22.36 0 .65.16.21.69.67 1.04 1.08.65.74 1.14 1.36 1.28 1.79.14.42-.08.64-.51.64z" />
              </svg>
            </span>
            <span>Группа ВКонтакте · NightByte Club</span>
          </a>
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
              Выбрать соревнование
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
