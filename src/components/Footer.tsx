import { SITE_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#080a0e]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-medium text-white">{SITE_NAME}</p>
          <p className="mt-1 max-w-md text-sm text-zinc-500">
            Турниры по CS2, Dota 2, PUBG и другим играм. Взнос 100 ₽ с игрока —
            призы топ-3.
          </p>
        </div>
        <p className="text-xs text-zinc-600">
          Демо-версия: оплата симулируется. Для продакшена нужна интеграция
          платёжного провайдера и юридическая модель.
        </p>
      </div>
    </footer>
  );
}
