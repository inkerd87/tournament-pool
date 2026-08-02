import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

const links = [
  { href: "/tournaments", label: "Турниры" },
  { href: "/how-it-works", label: "Как это работает" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0d12]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 text-sm font-black text-black">
            PA
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
          <Link
            href="/tournaments"
            className="ml-2 hidden rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-cyan-400 sm:inline-block"
          >
            Участвовать
          </Link>
        </nav>
      </div>
    </header>
  );
}
