import Link from "next/link";
import type { Tournament, TournamentMatchAccess } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

type Item = {
  tournament: Tournament;
  match: TournamentMatchAccess | null;
};

export function RegisteredTournamentsList({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[color:var(--border)] p-8 text-center text-sm text-zinc-500">
        Вы ещё не оплатили участие в турнирах.{" "}
        <Link href="/tournaments" className="link-accent">
          Выбрать турнир
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map(({ tournament, match }) => (
        <li
          key={tournament.id}
          className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Link
                href={`/tournaments/${tournament.id}`}
                className="text-lg font-bold text-white hover:text-cyan-300"
              >
                {tournament.title}
              </Link>
              <p className="mt-1 text-sm text-zinc-500">
                Старт: {formatDateTime(tournament.startsAt)}
              </p>
            </div>
            <span className="rounded-md bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
              Оплачено
            </span>
          </div>

          {match ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-black/30 px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                  Room ID
                </p>
                <p className="mt-1 font-mono text-cyan-300">{match.roomId}</p>
              </div>
              <div className="rounded-lg bg-black/30 px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                  Пароль
                </p>
                <p className="mt-1 font-mono text-cyan-300">{match.password}</p>
              </div>
              {match.joinUrl && (
                <a
                  href={match.joinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sm:col-span-2 inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-black hover:bg-emerald-400"
                >
                  Перейти к матчу →
                </a>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-amber-200/80">
              Данные матча появятся здесь, как только администратор их опубликует.
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
