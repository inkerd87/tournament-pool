import Link from "next/link";
import { redirect } from "next/navigation";
import { MatchHistoryList } from "@/components/MatchHistoryList";
import { LogoutButton } from "@/components/LogoutButton";
import { WalletTopUpForm } from "@/components/WalletTopUpForm";
import { formatDateShort, formatRub } from "@/lib/format";
import { getSession } from "@/lib/session";
import { isTBankConfigured } from "@/lib/tbank";
import {
  computeAccountStats,
  getMatchHistory,
  getUserById,
  rankLabel,
  rankTierColor,
} from "@/lib/user-store";

export const metadata = { title: "Личный кабинет" };

type Props = {
  searchParams: Promise<{ topup?: string }>;
};

function initials(nickname: string) {
  return nickname
    .split(/[\s_-]+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function AccountPage({ searchParams }: Props) {
  const { topup } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getUserById(session.userId);
  if (!user) redirect("/login");

  const matches = await getMatchHistory(user.id);
  const stats = computeAccountStats(matches);
  const rank = rankLabel(stats);
  const rankColor = rankTierColor(rank);
  const paymentsEnabled = isTBankConfigured();

  return (
    <div className="relative overflow-hidden">
      <div className="page-grid pointer-events-none absolute inset-x-0 top-0 h-[480px] opacity-50" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(34,211,238,0.12),transparent)]" />

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400/80">
              Player hub
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Привет, {user.nickname}
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Аккаунт с {formatDateShort(user.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/tournaments" className="btn-primary">
              В турнир
            </Link>
            <LogoutButton />
          </div>
        </div>

        {topup === "1" && (
          <p className="mt-6 rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
            Баланс пополнен. Средства уже доступны для регистрации на турниры.
          </p>
        )}

        <div className="mt-10 grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="account-panel h-full p-6">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-lg font-mono text-xl font-black text-black"
                  style={{
                    background: `linear-gradient(135deg, ${rankColor}, var(--accent))`,
                  }}
                >
                  {initials(user.nickname)}
                </div>
                <div>
                  <p className="text-sm text-zinc-500">{user.email}</p>
                  <p
                    className="mt-1 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide"
                    style={{
                      borderColor: `${rankColor}55`,
                      color: rankColor,
                      background: `${rankColor}15`,
                    }}
                  >
                    {rank}
                  </p>
                </div>
              </div>
              <dl className="mt-8 grid grid-cols-2 gap-3">
                {[
                  { label: "Побед", value: stats.wins },
                  { label: "Топ-3", value: stats.podiums },
                  { label: "Win rate", value: `${stats.winRatePercent}%` },
                  { label: "Матчей", value: stats.matchesPlayed },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-[color:var(--border)] bg-black/30 px-3 py-3"
                  >
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                      {item.label}
                    </dt>
                    <dd className="mt-1 font-mono text-xl font-bold text-white">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="relative overflow-hidden rounded-xl border border-cyan-500/15 bg-gradient-to-br from-[color:var(--surface-raised)] via-[#0c1018] to-[#12101f] p-8">
              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-600/15 blur-3xl account-glow" />
              <div className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-cyan-400/80">
                    Доступный баланс
                  </p>
                  <p className="mt-2 font-mono text-5xl font-bold tracking-tight text-white sm:text-6xl">
                    {formatRub(user.balanceRub)}
                  </p>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-500">
                    Списывается при регистрации на турнир. Пополните через СБП (Т-Банк).
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:text-right">
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-600">
                    Всего выиграно
                  </p>
                  <p className="font-mono text-2xl font-bold text-cyan-400">
                    +{formatRub(stats.totalPrizeRub)}
                  </p>
                  <p className="text-xs text-zinc-600">
                    Взносов: {formatRub(stats.totalFeesRub)}
                  </p>
                </div>
              </div>
              <WalletTopUpForm paymentsEnabled={paymentsEnabled} />
            </div>
          </div>
        </div>

        <section className="mt-12">
          <div>
            <h2 className="text-xl font-extrabold text-white">История матчей</h2>
            <p className="mt-1 text-sm text-zinc-500">Турниры, K/D и выплаты</p>
          </div>
          <div className="mt-6">
            <MatchHistoryList matches={matches} />
          </div>
        </section>
      </div>
    </div>
  );
}
