import React from 'react';
import { Link } from 'react-router-dom';
import { SITE_NAME, VK_GROUP_URL } from '@/lib/constants';

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
              Соревнования по CS2, Dota 2, PUBG, PUBG Mobile, Apex Legends, Minecraft, Warzone и Fortnite. Соревнуйтесь в любимых играх, побеждайте и получайте вознаграждение.{' '}
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

            {/* Красивая плашка сообщества ВКонтакте в подвале */}
            <div className="mt-5">
              <a
                href={VK_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 rounded-2xl border border-[#0077FF]/40 bg-gradient-to-r from-[#0077FF]/20 via-[#0077FF]/10 to-cyan-500/10 px-4 py-2.5 transition-all duration-200 hover:border-[#0077FF]/80 hover:from-[#0077FF]/30 hover:to-cyan-500/20 hover:shadow-lg hover:shadow-[#0077FF]/20 active:scale-[0.99]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0077FF] text-white shadow-md shadow-[#0077FF]/40 transition-transform duration-200 group-hover:scale-105">
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.67 2 15.07 2zm3.08 14.27h-1.46c-.55 0-.72-.44-1.71-1.43-.86-.83-1.24-.94-1.46-.94-.3 0-.38.08-.38.49v1.31c0 .35-.11.56-1.04.56-1.54 0-3.24-.93-4.44-2.66-1.81-2.54-2.3-4.45-2.3-4.84 0-.21.08-.41.49-.41h1.46c.37 0 .51.17.65.56.72 2.08 1.92 3.9 2.41 3.9.19 0 .27-.09.27-.56V9.97c-.06-.99-.58-1.07-.58-1.42 0-.17.14-.34.37-.34h2.29c.31 0 .42.17.42.53v2.89c0 .31.14.42.23.42.19 0 .34-.11.68-.45 1.05-1.18 1.8-3 1.8-3 .1-.21.27-.41.64-.41h1.46c.44 0 .54.23.44.53-.18.85-1.95 3.35-1.95 3.35-.16.25-.22.36 0 .65.16.21.69.67 1.04 1.08.65.74 1.14 1.36 1.28 1.79.14.42-.08.64-.51.64z" />
                  </svg>
                </span>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-white group-hover:text-cyan-300 transition">
                      Мы ВКонтакте · NightByte Club
                    </span>
                    <span className="text-xs text-[#3b9dff] group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Анонсы матчей, результаты и общение игроков
                  </p>
                </div>
              </a>
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
            <p>
              Группа ВК:{' '}
              <a
                href={VK_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#3b9dff] hover:text-cyan-300 hover:underline"
              >
                vk.ru/nightbyte.club
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
