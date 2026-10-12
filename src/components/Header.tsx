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
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#06070a]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" onClick={closeMenu} className="group flex items-center gap-2.5 shrink-0">
            {/* Киберспортивный полигональный логотип Nexus-стиля */}
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff1e44] to-[#990a20] shadow-md shadow-red-500/30 group-hover:scale-105 transition-transform">
              <svg className="h-5 w-5 text-white fill-current" viewBox="0 0 24 24">
                <path d="M12 2L2 9.5l3.5 12.5L12 18l6.5 4L22 9.5 12 2zm0 4.2l6.2 4.7-2.1 7.6-4.1-2.5-4.1 2.5-2.1-7.6L12 6.2z"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-rajdhani text-lg font-black tracking-wider text-white group-hover:text-[#ff1e44] transition leading-tight">
                {SITE_NAME.toUpperCase()}
              </span>
              <span className="text-[9px] font-bold tracking-widest text-[#ff1e44] uppercase leading-none">
                ESPORTS ARENA
              </span>
            </div>
          </Link>

          {/* Desktop Navigation (>= 1024px) */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link
              to="/"
              className={`font-rajdhani text-xs font-bold uppercase tracking-widest transition relative py-1 ${
                location.pathname === '/'
                  ? 'text-[#ff1e44]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Главная
              {location.pathname === '/' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff1e44] rounded-full shadow-[0_0_8px_#ff1e44]" />
              )}
            </Link>

            <Link
              to="/tournaments"
              className={`font-rajdhani text-xs font-bold uppercase tracking-widest transition relative py-1 ${
                location.pathname === '/tournaments'
                  ? 'text-[#ff1e44]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Турниры
              {location.pathname === '/tournaments' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff1e44] rounded-full shadow-[0_0_8px_#ff1e44]" />
              )}
            </Link>

            <Link
              to="/how-it-works"
              className={`font-rajdhani text-xs font-bold uppercase tracking-widest transition relative py-1 ${
                location.pathname === '/how-it-works'
                  ? 'text-[#ff1e44]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Регламент
              {location.pathname === '/how-it-works' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff1e44] rounded-full shadow-[0_0_8px_#ff1e44]" />
              )}
            </Link>

            <a
              href={VK_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-rajdhani text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-[#5ea4ff] transition flex items-center gap-1.5"
            >
              <span>Сообщество VK</span>
            </a>
          </nav>

          {/* Правый блок: Вход / Регистрация */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <Link
                to="/account"
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0d0e14] py-1.5 pl-3 pr-2 text-xs transition hover:border-[#ff1e44]/40"
              >
                <span className="max-w-[120px] truncate font-medium text-zinc-200">
                  {user.nickname}
                </span>
                <span className="rounded bg-cyan-500/15 px-2 py-0.5 font-mono text-[11px] font-bold text-cyan-300">
                  {formatRub(user.balanceRub)}
                </span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="rounded-lg px-3.5 py-1.5 font-rajdhani text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition hover:bg-white/5"
              >
                Войти
              </Link>
            )}

            <Link
              to="/tournaments"
              className="btn-crimson py-2 px-4 text-xs font-extrabold tracking-wider"
            >
              Участвовать
            </Link>
          </div>

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
              className="btn-crimson w-full py-2.5 text-center text-xs font-bold"
            >
              Выбрать соревнование
            </Link>
          </div>
        </div>
      )}
    </header>

    {/* Floating Right-Edge Social Rail (as shown in reference design) */}
    <aside aria-label="Социальные сети" className="fixed right-3 sm:right-5 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-center gap-3 text-zinc-500 pointer-events-auto">
      <a
        href={VK_GROUP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="h-8 w-8 rounded-lg border border-white/10 bg-black/60 flex items-center justify-center text-zinc-400 hover:text-white hover:border-[#ff1e44]/50 hover:bg-[#ff1e44]/10 transition shadow-sm"
        title="ВКонтакте"
      >
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.67 2 15.07 2zm3.08 14.27h-1.46c-.55 0-.72-.44-1.71-1.43-.86-.83-1.24-.94-1.46-.94-.3 0-.38.08-.38.49v1.31c0 .35-.11.56-1.04.56-1.54 0-3.24-.93-4.44-2.66-1.81-2.54-2.3-4.45-2.3-4.84 0-.21.08-.41.49-.41h1.46c.37 0 .51.17.65.56.72 2.08 1.92 3.9 2.41 3.9.19 0 .27-.09.27-.56V9.97c-.06-.99-.58-1.07-.58-1.42 0-.17.14-.34.37-.34h2.29c.31 0 .42.17.42.53v2.89c0 .31.14.42.23.42.19 0 .34-.11.68-.45 1.05-1.18 1.8-3 1.8-3 .1-.21.27-.41.64-.41h1.46c.44 0 .54.23.44.53-.18.85-1.95 3.35-1.95 3.35-.16.25-.22.36 0 .65.16.21.69.67 1.04 1.08.65.74 1.14 1.36 1.28 1.79.14.42-.08.64-.51.64z" />
        </svg>
      </a>
      <a
        href="https://t.me"
        target="_blank"
        rel="noopener noreferrer"
        className="h-8 w-8 rounded-lg border border-white/10 bg-black/60 flex items-center justify-center text-zinc-400 hover:text-white hover:border-[#ff1e44]/50 hover:bg-[#ff1e44]/10 transition shadow-sm"
        title="Telegram"
      >
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z"/>
        </svg>
      </a>
      <div className="h-8 w-px bg-white/10 my-1" />
      <span className="font-rajdhani text-[10px] font-bold uppercase tracking-[0.25em] text-[#ff1e44] [writing-mode:vertical-rl] rotate-180">
        СОЦСЕТИ
      </span>
    </aside>
  </>
);
};
