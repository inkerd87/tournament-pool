import Link from "next/link";
import { notFound } from "next/navigation";
import { GameBadge } from "@/components/GameBadge";
import { PrizeBreakdown } from "@/components/PrizeBreakdown";
import { RegisterForm } from "@/components/RegisterForm";
import { formatDateTime, statusLabel } from "@/lib/format";
import { GAMES } from "@/lib/games";
import {
  getRegistrationsForTournament,
  getTournament,
} from "@/lib/tournament-store";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const t = await getTournament(id);
  return { title: t?.title ?? "Турнир" };
}

export default async function TournamentDetailPage({ params }: Props) {
  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) notFound();

  const registrations = await getRegistrationsForTournament(id);
  const game = GAMES[tournament.game];
  const canRegister = tournament.status === "recruiting";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Link href="/tournaments" className="text-sm text-zinc-500 hover:text-zinc-300">
        ← Все турниры
      </Link>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <GameBadge game={tournament.game} />
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400">
          {statusLabel(tournament.status)}
        </span>
      </div>

      <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
        {tournament.title}
      </h1>
      <p className="mt-2 text-zinc-400">{tournament.description}</p>

      <div className="mt-6 flex flex-wrap gap-6 text-sm text-zinc-500">
        <span>Старт: {formatDateTime(tournament.startsAt)}</span>
        <span>Формат: {tournament.format}</span>
        <span style={{ color: game.accent }}>
          {game.name}
        </span>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <PrizeBreakdown
          registered={tournament.registeredCount}
          maxPlayers={tournament.maxPlayers}
        />
        <RegisterForm tournamentId={tournament.id} canRegister={canRegister} />
      </div>

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-white">
          Участники ({registrations.length})
        </h2>
        {registrations.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">Пока никого — будьте первым.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/10 rounded-xl border border-white/10">
            {registrations.map((r, i) => (
              <li
                key={r.id}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span className="text-zinc-300">
                  <span className="mr-3 inline-block w-6 text-zinc-600">{i + 1}.</span>
                  {r.nickname}
                </span>
                <span className="font-mono text-xs text-zinc-600">{r.gameAccount}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
