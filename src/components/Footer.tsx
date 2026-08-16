import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[color:var(--border)] bg-[color:var(--surface)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <p className="font-extrabold tracking-tight text-white">{SITE_NAME}</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
            Турниры по CS2, Dota 2, PUBG и другим играм. Взнос 100 ₽ с игрока —
            призы топ-3.
          </p>
          <div className="mt-4 flex gap-4 text-sm">
            <Link href="/tournaments" className="link-accent">
              Турниры
            </Link>
            <Link href="/how-it-works" className="text-zinc-500 hover:text-zinc-300">
              Правила
            </Link>
          </div>
        </div>
        <p className="max-w-xs text-xs leading-relaxed text-zinc-600">
          Оплата через СБП (Т-Банк). Для продакшена нужен договор с юрлицом или ИП.
        </p>
      </div>
    </footer>
  );
}
