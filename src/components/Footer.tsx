import React from 'react';
import { Link } from 'react-router-dom';
import { SITE_NAME } from '@/lib/constants';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#0a0d12]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
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
              Соревнования по CS2, Dota 2, PUBG, Warzone и Fortnite. Соревнуйтесь в любимых играх, побеждайте и получайте вознаграждение.{' '}
              <span className="inline-block font-bold text-amber-400 font-mono">18+</span>
            </p>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm">
              <Link to="/tournaments" className="link-accent">
                Соревнования
              </Link>
              <Link to="/how-it-works" className="text-zinc-400 hover:text-zinc-200">
                Как это работает
              </Link>
              <Link to="/offer" className="text-zinc-400 hover:text-zinc-200">
                Публичная оферта
              </Link>
              <Link to="/privacy" className="text-zinc-400 hover:text-zinc-200">
                Политика конфиденциальности
              </Link>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 sm:border-t-0 sm:pt-0 max-w-sm space-y-1.5 text-xs text-zinc-400 sm:text-right">
            <p className="font-semibold text-white">© {SITE_NAME}. Все права защищены</p>
            <p className="text-zinc-300">
              Самозанятый <span className="font-medium text-white">Дегтярев Владимир Михайлович</span>
            </p>
            <p className="font-mono text-zinc-400">ИНН: 910408161157</p>
            <p>
              Телефон:{' '}
              <a href="tel:+79787847414" className="text-cyan-400 hover:underline">
                +7 978 784-74-14
              </a>
            </p>
            <p>
              Поддержка:{' '}
              <a href="mailto:inkerdany@mail.ru" className="text-cyan-400 hover:underline">
                inkerdany@mail.ru
              </a>
            </p>
          </div>
        </div>

        {/* Блок поддерживаемых платёжных систем */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-zinc-400 mr-1">Способы оплаты:</span>
            <span className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2.5 py-1 font-bold text-zinc-200 text-[11px] tracking-wider">
              МИР
            </span>
            <span className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2.5 py-1 font-bold text-emerald-400 text-[11px] tracking-wider">
              СБП
            </span>
            <span className="inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1 font-bold text-emerald-300 text-[11px] tracking-wider">
              tips.tips
            </span>
            <span className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2.5 py-1 font-bold text-zinc-300 text-[11px] tracking-wider">
              Mastercard
            </span>
            <span className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2.5 py-1 font-bold text-zinc-300 text-[11px] tracking-wider">
              VISA
            </span>
          </div>

          <p className="text-center sm:text-right text-[11px] text-zinc-500 leading-relaxed">
            Приём переводов организован через сервис <strong className="text-zinc-300">tips.tips</strong> (СБП и банковские карты РФ). Безопасность гарантируется протоколами шифрования SSL/TLS и стандартом PCI DSS.
          </p>
        </div>
      </div>
    </footer>
  );
};
