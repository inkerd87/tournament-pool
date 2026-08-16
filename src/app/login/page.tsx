import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "@/components/LoginForm";

export const metadata = { title: "Вход" };

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/account");

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_0%,rgba(139,92,246,0.12),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_0%_100%,rgba(34,211,238,0.1),transparent)]" />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-2 lg:items-center lg:py-24 sm:px-6">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1 text-xs font-medium text-cyan-400">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Live stats · wallet
          </p>
          <h2 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            Баланс, история{" "}
            <span className="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">
              и прогресс
            </span>
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-zinc-500">
            Следите за взносами, призами и K/D по прошлым турнирам — всё в одном
            кабинете.
          </p>
          <ul className="mt-10 space-y-3 text-sm text-zinc-400">
            {[
              "Единый кошелёк на все турниры",
              "История матчей с призами и статистикой",
              "Ранг аккаунта по результатам",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-cyan-500/20 bg-cyan-400/10 text-xs text-cyan-400">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
          <Link href="/tournaments" className="link-accent mt-10 inline-block text-sm font-semibold">
            Сначала выбрать турнир →
          </Link>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
