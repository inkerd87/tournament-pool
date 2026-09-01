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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0d12]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 text-sm font-black text-black">
            NB
          </span>
          <span className="text-lg font-semibold tracking-tight text-white group-hover:text-cyan-300">
            {SITE_NAME}
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <Link
              href="/account"
              className="ml-1 flex items-center gap-2 rounded-lg border border-white/10 bg-[#12161f] py-1.5 pl-3 pr-2 text-sm transition hover:border-cyan-500/30"
            >
              <span className="hidden max-w-[100px] truncate text-zinc-300 sm:inline">
                {user.nickname}
              </span>
              <span className="rounded-md bg-cyan-500/15 px-2 py-0.5 font-mono text-xs font-semibold text-cyan-300">
                {formatRub(user.balanceRub)}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="ml-1 rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"
            >
              Войти
            </Link>
          )}
          <Link
            href="/tournaments"
            className="btn-primary ml-2 hidden sm:inline-flex"
          >
            Участвовать
          </Link>
        </nav>
      </div>
    </header>
  );
}
