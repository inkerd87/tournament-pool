import { TournamentCard } from "@/components/TournamentCard";
import { getTournaments } from "@/lib/tournament-store";

export const metadata = {
  title: "Турниры",
};

export default async function TournamentsPage() {
  const tournaments = await getTournaments();

  return (
    <div>
      <div className="border-b border-[color:var(--border)] bg-[color:var(--surface)]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400/80">
            Каталог
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Турниры
          </h1>
          <p className="mt-2 text-zinc-500">
            Взнос 100 ₽ · призы топ-3 · набор до лимита игроков
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-5 md:grid-cols-2">
          {tournaments.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      </div>
    </div>
  );
}
