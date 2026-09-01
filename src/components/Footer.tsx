import React from 'react';
import { Link } from 'react-router-dom';
import { SITE_NAME } from '@/lib/constants';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#0a0d12]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <p className="font-extrabold tracking-tight text-white">{SITE_NAME}</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
            Турниры по CS2, Dota 2, PUBG и другим играм. Взнос 100 ₽ с игрока —
            призы топ-3.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <Link to="/tournaments" className="link-accent">
              Турниры
            </Link>
            <Link to="/how-it-works" className="text-zinc-500 hover:text-zinc-300">
              Как это работает
            </Link>
            <Link to="/privacy" className="text-zinc-500 hover:text-zinc-300">
              Конфиденциальность
            </Link>
            <Link to="/admin" className="text-zinc-700 hover:text-zinc-400">
              Админ
            </Link>
          </div>
        </div>
        <div className="max-w-xs space-y-1 text-xs leading-relaxed text-zinc-600 sm:text-right">
          <p>©Copyright NightByte. Все права защищены</p>
          <p className="text-zinc-500">ИНН: 910408161157</p>
        </div>
      </div>
    </footer>
  );
};
