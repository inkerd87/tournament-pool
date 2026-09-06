import React from 'react';
import { Link } from 'react-router-dom';
import { SITE_NAME } from '@/lib/constants';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#0a0d12]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:py-12 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <div className="flex items-center gap-2.5">
            <img
              src="/logo-icon.jpg"
              alt="NightByte Logo"
              className="h-9 w-9 rounded-xl object-contain border border-cyan-500/20 shadow-sm shadow-cyan-500/10"
            />
            <div className="flex flex-col">
              <p className="font-extrabold tracking-tight text-white leading-tight">{SITE_NAME}</p>
              <span className="text-[9px] font-semibold tracking-wider text-cyan-400 uppercase leading-none">
                ONLINE.RU
              </span>
            </div>
          </div>
          <p className="mt-2.5 max-w-md text-xs sm:text-sm leading-relaxed text-zinc-400">
            Турниры по CS2, Dota 2, PUBG, Warzone и Fortnite. Организационный сбор 100 ₽ —
            награды за 1–3 призовые места.{' '}
            <span className="inline-block font-bold text-amber-400 font-mono">18+</span>
          </p>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm">
            <Link to="/tournaments" className="link-accent">
              Турниры
            </Link>
            <Link to="/how-it-works" className="text-zinc-400 hover:text-zinc-200">
              Как это работает
            </Link>
            <Link to="/offer" className="text-zinc-400 hover:text-zinc-200">
              Публичная оферта
            </Link>
            <Link to="/privacy" className="text-zinc-400 hover:text-zinc-200">
              Конфиденциальность
            </Link>
            <Link to="/admin" className="text-zinc-600 hover:text-zinc-400">
              Администратор
            </Link>
          </div>
          <div className="mt-4">
            <a
              href="https://freekassa.net"
              target="_blank"
              rel="noopener noreferrer"
              title="big-dark-1"
              className="inline-block transition-opacity hover:opacity-80"
            >
              <img
                src="https://cdn.freekassa.net/images/logos/banners/f/big-dark-1.png"
                alt="big-dark-1"
                className="h-8"
              />
            </a>
          </div>
        </div>

        <div className="border-t border-white/5 pt-4 sm:border-t-0 sm:pt-0 max-w-xs space-y-1.5 text-xs text-zinc-500 sm:text-right">
          <p className="text-zinc-400">© NightByte. Все права защищены</p>
          <p className="text-zinc-400 font-mono">ИНН: 910408161157</p>
          <p>
            Тел:{' '}
            <a href="tel:+79787847414" className="text-cyan-400 hover:underline">
              +7 978 784-74-14
            </a>
          </p>
          <p>
            Email:{' '}
            <a href="mailto:inkerdany@mail.ru" className="text-cyan-400 hover:underline">
              inkerdany@mail.ru
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};
