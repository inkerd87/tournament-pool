import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getUserById } from "@/lib/user-store";
import { GameBadge } from "@/components/GameBadge";
import { PrizeBreakdown } from "@/components/PrizeBreakdown";
import { RegisterForm } from "@/components/RegisterForm";
import { formatDateTime, statusLabel } from "@/lib/format";
import { GAMES } from "@/lib/games";
import { isTBankConfigured } from "@/lib/tbank";
import {
  getRegistrationsForTournament,
  getTournament,
  isUserRegisteredForTournament,
} from "@/lib/tournament-store";
import { getMatchAccess } from "@/lib/match-config-store";
import { MatchAccessPanel } from "@/components/MatchAccessPanel";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const t = await getTournament(id);
  return { title: t?.title ?? "Турнир" };
}

export default async function TournamentDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { paid } = await searchParams;
  const tournament = await getTournament(id);
  if (!tournament) notFound();

  const registrations = await getRegistrationsForTournament(id);
  const game = GAMES[tournament.game];
  const session = await getSession();
  const walletUser = session ? await getUserById(session.userId) : null;
  const paymentsEnabled = isTBankConfigured();
  const isRegistered =
    !!session && (await isUserRegisteredForTournament(session.email, id));
  const matchAccess = isRegistered ? await getMatchAccess(id) : null;
  const canRegister = tournament.status === "recruiting" && !isRegistered;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Link href="/tournaments" className="link-accent text-sm font-medium opacity-80">
        ← Все турниры
      </Link>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <GameBadge game={tournament.game} />
        <span className="rounded-md bg-zinc-800/80 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
          {statusLabel(tournament.status)}
        </span>
      </div>

      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
        {tournament.title}
      </h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-zinc-400">
        {tournament.description}
      </p>

      <div className="mt-6 flex flex-wrap gap-6 text-sm text-zinc-500">
        <span>Старт: {formatDateTime(tournament.startsAt)}</span>
        <span>Формат: {tournament.format}</span>
        <span className="font-semibold" style={{ color: game.accent }}>
          {game.name}
        </span>
      </div>

      {paid === "1" && (
        <p className="mt-6 rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
          Оплата прошла успешно — вы зарегистрированы на турнир.
        </p>
      )}

      {isRegistered && matchAccess && (
        <MatchAccessPanel match={matchAccess} tournamentTitle={tournament.title} />
      )}

      {isRegistered && !matchAccess && (
        <p className="mt-6 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Вы оплатили участие. Данные матча (Room ID и пароль) появятся здесь, как
          только администратор их опубликует.
        </p>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <PrizeBreakdown
          registered={tournament.registeredCount}
          maxPlayers={tournament.maxPlayers}
        />
        <RegisterForm
          tournamentId={tournament.id}
          canRegister={canRegister}
          defaultEmail={walletUser?.email}
          defaultNickname={walletUser?.nickname}
          balanceRub={walletUser?.balanceRub}
          paymentsEnabled={paymentsEnabled}
          isLoggedIn={!!session}
        />
      </div>

      <section className="mt-12">
        <h2 className="text-lg font-bold text-white">
          Участники ({registrations.length})
        </h2>
        {registrations.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">Пока никого — будьте первым.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[color:var(--border)] overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]">
            {registrations.map((r, i) => (
              <li
                key={r.id}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span className="text-zinc-300">
                  <span className="mr-3 inline-block w-6 font-mono text-xs text-zinc-600">
                    {i + 1}.
                  </span>
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
