import { TournamentCard } from "@/components/TournamentCard";
import { getTournaments } from "@/lib/tournament-store";

export const metadata = {
  title: "Турниры",
};

export default async function TournamentsPage() {
  const tournaments = await getTournaments();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-white">Турниры</h1>
      <p className="mt-2 text-zinc-500">
        Взнос 100 ₽ · призы топ-3 · набор до лимита игроков
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {tournaments.map((t) => (
          <TournamentCard key={t.id} tournament={t} />
        ))}
      </div>
    </div>
  );
}
