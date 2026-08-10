import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { formatRub } from "@/lib/format";
import { getSession } from "@/lib/session";
import { getUserById } from "@/lib/user-store";

const links = [
  { href: "/tournaments", label: "Турниры" },
  { href: "/how-it-works", label: "Как это работает" },
];

export async function Header() {
  const session = await getSession();
  const user = session ? await getUserById(session.userId) : null;

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--border)] bg-[color:var(--background)]/90 backdrop-blur-lg">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-md border border-lime-500/30 bg-lime-400/10 font-mono text-xs font-bold tracking-tighter text-lime-400">
            PA
            <span className="absolute -bottom-px -right-px h-2 w-2 rounded-sm bg-lime-400" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-white group-hover:text-lime-300">
            {SITE_NAME}
          </span>
        </Link>
        <nav className="flex items-center gap-0.5 sm:gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-zinc-400 transition hover:bg-white/[0.04] hover:text-zinc-100"
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <Link
              href="/account"
              className="ml-1 flex items-center gap-2 rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface)] py-1.5 pl-3 pr-2 text-sm transition hover:border-lime-500/25"
            >
              <span className="hidden max-w-[100px] truncate text-zinc-300 sm:inline">
                {user.nickname}
              </span>
              <span className="rounded-md bg-lime-400/15 px-2 py-0.5 font-mono text-xs font-semibold text-lime-300">
                {formatRub(user.balanceRub)}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="ml-1 rounded-md px-3 py-2 text-sm font-medium text-zinc-400 transition hover:bg-white/[0.04] hover:text-zinc-100"
            >
              Войти
            </Link>
          )}
          <Link href="/tournaments" className="btn-primary ml-2 hidden sm:inline-flex">
            Участвовать
          </Link>
        </nav>
      </div>
    </header>
  );
}
