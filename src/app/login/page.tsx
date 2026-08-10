import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "@/components/LoginForm";

export const metadata = { title: "Вход" };

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/account");

  return (
    <div className="relative min-h-[calc(100vh-4.25rem)] overflow-hidden">
      <div className="page-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_0%,rgba(190,242,100,0.08),transparent)]" />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-2 lg:items-center lg:py-24 sm:px-6">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-3 py-1 text-xs font-medium text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-pulse" />
            Live stats · demo wallet
          </p>
          <h2 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            Баланс, история <span className="gradient-headline">и прогресс</span>
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
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-lime-500/20 bg-lime-400/10 text-xs text-lime-400">
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
