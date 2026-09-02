import React from 'react';
import { Link } from 'react-router-dom';
import { SITE_NAME } from '@/lib/constants';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#0a0d12]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:py-12 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-gradient-to-br from-cyan-400 to-violet-500 text-xs font-black text-black">
              NB
            </span>
            <p className="font-extrabold tracking-tight text-white">{SITE_NAME}</p>
          </div>
          <p className="mt-2.5 max-w-md text-xs sm:text-sm leading-relaxed text-zinc-400">
            Турниры по CS2, Dota 2, PUBG и Valorant. Фиксированный взнос 100 ₽ с игрока —
            гарантированные призы за 1–3 места.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm">
            <Link to="/tournaments" className="link-accent">
              Турниры
            </Link>
            <Link to="/how-it-works" className="text-zinc-400 hover:text-zinc-200">
              Как это работает
            </Link>
            <Link to="/privacy" className="text-zinc-400 hover:text-zinc-200">
              Конфиденциальность
            </Link>
            <Link to="/admin" className="text-zinc-600 hover:text-zinc-400">
              Администратор
            </Link>
          </div>
        </div>
        <div className="border-t border-white/5 pt-4 sm:border-t-0 sm:pt-0 max-w-xs space-y-1 text-xs text-zinc-500 sm:text-right">
          <p>© NightByte. Все права защищены</p>
          <p className="text-zinc-400 font-mono">ИНН: 910408161157</p>
        </div>
      </div>
    </footer>
  );
};
