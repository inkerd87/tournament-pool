import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTournaments } from "@/context/TournamentContext";
import { useAuth } from "@/context/AuthContext";
import { TournamentCard } from "@/components/TournamentCard";
import { GameIcon } from "@/components/GameIcons";
import { VK_GROUP_URL } from "@/lib/constants";
import { GAME_WALLPAPERS } from "@/lib/games";
import { formatRub } from "@/lib/format";

// Teams for leaderboard showcase
const TOP_TEAMS = [
  {
    rank: 1,
    name: "Realm Eclipse",
    tag: "REC",
    points: "2,840",
    winRate: "94%",
    matches: 48,
    color: "#ff1e44",
    bgGradient: "from-red-950/40 via-red-900/10 to-transparent",
    iconBg: "bg-red-500/20 text-red-400 border-red-500/40",
  },
  {
    rank: 2,
    name: "Oblivion Force",
    tag: "OBF",
    points: "2,710",
    winRate: "91%",
    matches: 45,
    color: "#00f0ff",
    bgGradient: "from-cyan-950/40 via-cyan-900/10 to-transparent",
    iconBg: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
  },
  {
    rank: 3,
    name: "Nova Strike",
    tag: "NVS",
    points: "2,580",
    winRate: "88%",
    matches: 42,
    color: "#a855f7",
    bgGradient: "from-purple-950/40 via-purple-900/10 to-transparent",
    iconBg: "bg-purple-500/20 text-purple-400 border-purple-500/40",
  },
  {
    rank: 4,
    name: "Inferno Esports",
    tag: "INF",
    points: "2,420",
    winRate: "85%",
    matches: 39,
    color: "#f59e0b",
    bgGradient: "from-amber-950/40 via-amber-900/10 to-transparent",
    iconBg: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  },
  {
    rank: 5,
    name: "Velocity Gaming",
    tag: "VLC",
    points: "2,390",
    winRate: "82%",
    matches: 37,
    color: "#10b981",
    bgGradient: "from-emerald-950/40 via-emerald-900/10 to-transparent",
    iconBg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  },
];

// Latest esports news
const LATEST_NEWS = [
  {
    id: 1,
    tag: "TOURNAMENT",
    date: "12 ОКТ 2026",
    title: "Старт осенней серии NightByte Championship 2026",
    excerpt: "Открыта регистрация по всем ключевым дисциплинам. Совокупный призовой фонд превышает 250 000 ₽ с гарантированными выплатами через СБП.",
    badgeColor: "border-red-500/40 bg-red-500/10 text-red-400",
  },
  {
    id: 2,
    tag: "SYSTEM",
    date: "10 ОКТ 2026",
    title: "Обновление протоколов античита и арбитража матчей",
    excerpt: "Внедрена автоматическая валидация результатов лобби и ускоренная выплата призовых победителям в течение 24 часов после протокола.",
    badgeColor: "border-cyan-500/40 bg-cyan-500/10 text-cyan-400",
  },
  {
    id: 3,
    tag: "COMMUNITY",
    date: "08 ОКТ 2026",
    title: "Итоги прошедшего уикенда в CS2 и Dota 2",
    excerpt: "Лучшие клатчи, хайлайты и финальные протоколы прошедших соревнований доступны в официальном сообществе ВКонтакте.",
    badgeColor: "border-purple-500/40 bg-purple-500/10 text-purple-400",
  },
];

export const HomePage: React.FC = () => {
  const { tournaments, allGames } = useTournaments();
  const { user } = useAuth();

  const [activeGameId, setActiveGameId] = useState<string>("cs2");
  const [matchFilterGame, setMatchFilterGame] = useState<string>("all");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Live countdown state (calculating time to next major event)
  const [timeLeft, setTimeLeft] = useState({
    days: 4,
    hours: 18,
    minutes: 32,
    seconds: 45,
  });

  useEffect(() => {
    // Target date: 4 days ahead
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 4);
    targetDate.setHours(21, 0, 0, 0);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate.getTime() - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const openAuth = () => {
    if (user) {
      window.location.href = "/tournaments";
    } else {
      window.dispatchEvent(new CustomEvent("nb_open_auth_modal"));
    }
  };

  const heroGames = (allGames && allGames.length > 0 ? allGames : []).map((g) => ({
    id: g.id,
    name: g.name,
    short: g.short || g.name,
    color: g.accent || "#00d4ff",
    glow: g.glow || "rgba(0, 212, 255, 0.35)",
    tag: g.tag || "Турнир",
    standardFee: g.standardFee ?? 100,
    premiumFee: g.premiumFee ?? 1000,
    wallpaperUrl: g.wallpaperUrl || GAME_WALLPAPERS[g.id] || g.iconUrl,
  }));

  const activeGameConfig = heroGames.find((g) => g.id === activeGameId) || heroGames[0] || {
    id: "cs2",
    name: "Counter-Strike 2",
    short: "CS2",
    color: "#ff1e44",
    standardFee: 100,
    premiumFee: 1000,
    tag: "5v5 BO1",
    wallpaperUrl: "/games/wallpapers/cs2.jpg",
  };

  const filteredTournaments = tournaments.filter((t) => {
    if (t.isPremium) return false;
    if (matchFilterGame !== "all" && t.game !== matchFilterGame) return false;
    return true;
  });

  const activeCount = tournaments.filter((t) => t.status === "recruiting" || t.status === "live").length;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubscribed(true);
      setNewsletterEmail("");
    }
  };

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION (NEXUS ARENA STYLE) */}
      {/* ========================================================================= */}
      <section className="relative pt-6 sm:pt-12 overflow-hidden">
        {/* Ambient background glows */}
        <div className="pointer-events-none absolute -top-40 left-1/4 h-[550px] w-[550px] rounded-full bg-red-600/15 blur-[160px]" />
        <div className="pointer-events-none absolute top-10 right-10 h-[450px] w-[450px] rounded-full bg-cyan-500/10 blur-[150px]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Hero Text & Actions */}
            <div className="lg:col-span-7 space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2.5 rounded-full border border-red-500/30 bg-red-500/10 px-3.5 py-1 text-xs font-bold tracking-wider text-red-400 font-rajdhani uppercase">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                <span>JOIN THE NEXT GENERATION OF ESPORTS</span>
              </div>

              {/* Big Athletic Title */}
              <h1 className="font-teko uppercase font-bold text-6xl sm:text-7xl lg:text-8xl tracking-wide leading-[0.88] text-white">
                DOMINATE <span className="text-white block sm:inline">THE ARENA</span>
              </h1>

              {/* Description */}
              <p className="max-w-xl text-base sm:text-lg text-zinc-300 font-rajdhani font-medium leading-relaxed">
                Compete in high-stakes tournaments across your favorite titles. Form your team, climb the leaderboards, and claim your share of massive prize pools.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={openAuth}
                  className="btn-crimson font-rajdhani uppercase tracking-wider text-base font-extrabold px-8 py-3.5 flex items-center gap-2 cursor-pointer"
                >
                  <span>REGISTER NOW</span>
                  <span className="text-lg">→</span>
                </button>

                <Link
                  to="/tournaments"
                  className="rounded-lg border border-white/20 bg-white/[0.04] px-7 py-3.5 font-rajdhani uppercase tracking-wider text-base font-bold text-white hover:bg-white/[0.08] hover:border-white/40 transition-all cursor-pointer"
                >
                  EXPLORE MATCHES
                </Link>
              </div>

              {/* Key Platform Stats */}
              <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/[0.08]">
                <div>
                  <div className="font-teko text-3xl sm:text-4xl font-bold text-white tracking-wide">150K+</div>
                  <div className="font-rajdhani text-xs font-bold uppercase tracking-wider text-zinc-400">ACTIVE PLAYERS</div>
                </div>
                <div>
                  <div className="font-teko text-3xl sm:text-4xl font-bold text-[#ff1e44] tracking-wide">250 000 ₽</div>
                  <div className="font-rajdhani text-xs font-bold uppercase tracking-wider text-zinc-400">TOTAL PRIZE POOL</div>
                </div>
                <div>
                  <div className="font-teko text-3xl sm:text-4xl font-bold text-white tracking-wide">1,200+</div>
                  <div className="font-rajdhani text-xs font-bold uppercase tracking-wider text-zinc-400">MATCHES PLAYED</div>
                </div>
                <div>
                  <div className="font-teko text-3xl sm:text-4xl font-bold text-[#00f0ff] tracking-wide">48</div>
                  <div className="font-rajdhani text-xs font-bold uppercase tracking-wider text-zinc-400">TOP TEAMS</div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Pro Controller */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="relative w-full max-w-lg aspect-square rounded-2xl overflow-hidden border border-red-500/30 bg-[#080b11] shadow-[0_0_50px_rgba(255,30,68,0.2)] group">
                {/* Visual Image */}
                <img
                  src="/hero-controller.jpg"
                  alt="Esports Arena Pro Controller"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />

                {/* Cyber Arena Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#06070a] via-transparent to-transparent opacity-60" />
                <div className="absolute inset-0 border border-white/10 rounded-2xl pointer-events-none" />

                {/* Futuristic Cyber Badge Overlay */}
                <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-md border border-cyan-500/40 bg-black/70 backdrop-blur-md px-3 py-1.5 text-xs font-mono font-bold text-cyan-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>NIGHTBYTE PRO SERIES</span>
                </div>

                <div className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-md border border-red-500/40 bg-black/70 backdrop-blur-md px-3 py-1.5 text-xs font-mono font-bold text-red-400">
                  <span>SEASON 2026</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. LIVE COUNTDOWN BANNER */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-xl border border-red-500/30 bg-gradient-to-r from-[#12080a] via-[#0b0e14] to-[#0b0e14] p-5 sm:p-6 shadow-xl">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Left title & live badge */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded bg-red-600/20 border border-red-500/40 px-2.5 py-0.5 text-[11px] font-extrabold tracking-wider text-red-400 font-rajdhani uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                <span>● LIVE IN</span>
              </div>
              <h2 className="font-rajdhani font-extrabold uppercase text-xl sm:text-2xl text-white tracking-wide">
                NEXT TOURNAMENT: NIGHTBYTE CHAMPIONSHIP 2026
              </h2>
            </div>

            {/* Countdown timer blocks */}
            <div className="flex items-center gap-2 sm:gap-4 self-center lg:self-auto font-mono">
              <div className="flex flex-col items-center bg-black/70 border border-white/10 rounded-lg px-3 sm:px-4 py-2 min-w-[62px]">
                <span className="font-teko text-2xl sm:text-3xl font-bold text-white leading-none">
                  {String(timeLeft.days).padStart(2, "0")}
                </span>
                <span className="font-rajdhani text-[10px] uppercase font-bold text-zinc-400">DAYS</span>
              </div>
              <span className="font-teko text-xl text-red-500 font-bold">:</span>
              <div className="flex flex-col items-center bg-black/70 border border-white/10 rounded-lg px-3 sm:px-4 py-2 min-w-[62px]">
                <span className="font-teko text-2xl sm:text-3xl font-bold text-white leading-none">
                  {String(timeLeft.hours).padStart(2, "0")}
                </span>
                <span className="font-rajdhani text-[10px] uppercase font-bold text-zinc-400">HOURS</span>
              </div>
              <span className="font-teko text-xl text-red-500 font-bold">:</span>
              <div className="flex flex-col items-center bg-black/70 border border-white/10 rounded-lg px-3 sm:px-4 py-2 min-w-[62px]">
                <span className="font-teko text-2xl sm:text-3xl font-bold text-white leading-none">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </span>
                <span className="font-rajdhani text-[10px] uppercase font-bold text-zinc-400">MINS</span>
              </div>
              <span className="font-teko text-xl text-red-500 font-bold">:</span>
              <div className="flex flex-col items-center bg-black/70 border border-red-500/40 rounded-lg px-3 sm:px-4 py-2 min-w-[62px]">
                <span className="font-teko text-2xl sm:text-3xl font-bold text-[#ff1e44] leading-none">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
                <span className="font-rajdhani text-[10px] uppercase font-bold text-red-400">SECS</span>
              </div>
            </div>

            {/* Right CTA */}
            <div className="flex items-center gap-3">
              <Link
                to="/tournaments"
                className="btn-crimson font-rajdhani uppercase font-extrabold tracking-wider text-sm px-6 py-2.5 w-full sm:w-auto text-center"
              >
                VIEW TOURNAMENT
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. FEATURED GAMES & PRIZE POOL SHOWCASE */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
        
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2">
            <span className="text-[#ff1e44] text-lg">✦</span>
            <h2 className="font-rajdhani font-extrabold uppercase text-2xl sm:text-3xl text-white tracking-wide">
              FEATURED GAMES
            </h2>
          </div>
          <Link
            to="/tournaments"
            className="font-rajdhani font-bold uppercase text-xs sm:text-sm tracking-wider text-zinc-400 hover:text-white transition flex items-center gap-1"
          >
            <span>VIEW ALL GAMES</span>
            <span>→</span>
          </Link>
        </div>

        {/* Featured Games Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {heroGames.slice(0, 6).map((g) => {
            const isSelected = activeGameId === g.id;
            return (
              <div
                key={g.id}
                onClick={() => {
                  setActiveGameId(g.id);
                  setMatchFilterGame(g.id);
                }}
                className={`group relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer flex flex-col justify-end p-3.5 min-h-[170px] ${
                  isSelected
                    ? "border-[#ff1e44] shadow-[0_0_20px_rgba(255,30,68,0.35)] scale-[1.02]"
                    : "border-white/[0.08] bg-[#0c1017] hover:border-white/30 hover:scale-[1.01]"
                }`}
              >
                {/* Wallpaper */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110 opacity-35 group-hover:opacity-50"
                  style={{ backgroundImage: `url(${g.wallpaperUrl})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06070a] via-[#06070a]/60 to-transparent" />

                {/* Bottom Active Glow Bar */}
                {isSelected && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#ff1e44] shadow-[0_0_10px_#ff1e44]" />
                )}

                {/* Card Content */}
                <div className="relative z-10 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <GameIcon game={g.id} className="w-4 h-4 object-contain rounded" />
                    <span className="font-rajdhani text-[11px] font-bold uppercase text-zinc-400 tracking-wider">
                      {g.tag}
                    </span>
                  </div>
                  <h3 className="font-rajdhani font-black uppercase text-base sm:text-lg text-white leading-tight">
                    {g.short}
                  </h3>
                  <div className="text-[11px] font-mono text-zinc-300 font-bold">
                    от {formatRub(g.standardFee)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* PRIZE POOL SHOWCASE CARD (Trophy cup with 250 000 ₽) */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[#090c12] p-6 sm:p-8 shadow-2xl">
          {/* Subtle back illumination */}
          <div className="pointer-events-none absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-red-600/10 blur-[130px]" />
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Trophy visual */}
            <div className="md:col-span-5 flex items-center justify-center">
              <div className="relative w-full max-w-sm aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-black/60 shadow-xl group">
                <img
                  src="/trophy-cup.jpg"
                  alt="Championship Trophy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090c12] via-transparent to-transparent opacity-40" />
                <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded bg-black/80 border border-amber-500/40 px-2.5 py-1 text-[10px] font-mono font-bold text-amber-300">
                  <span>🏆 SEASON CHAMPIONSHIP</span>
                </div>
              </div>
            </div>

            {/* Prize pool details */}
            <div className="md:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-0.5 text-xs font-bold text-red-400 font-rajdhani uppercase tracking-wider">
                <span>✦ SEASON PRIZE POOL</span>
              </div>

              <div>
                <div className="font-teko uppercase font-bold text-5xl sm:text-7xl text-white tracking-wide leading-none">
                  250 000 ₽
                </div>
                <div className="font-rajdhani uppercase font-extrabold text-sm sm:text-base tracking-widest text-[#ff1e44]">
                  TOTAL PRIZE DISTRIBUTION
                </div>
              </div>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-rajdhani font-medium max-w-xl">
                Соревнуйтесь за крупнейший призовой фонд сезона 2026. Победители получают гарантированные выплаты прямо на банковские карты или через СБП в течение 24 часов после завершения турнира.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs">
                  <span className="font-mono font-bold text-amber-300">1-е место:</span>
                  <span className="font-bold text-white">125 000 ₽</span>
                </div>
                <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs">
                  <span className="font-mono font-bold text-zinc-300">2-е место:</span>
                  <span className="font-bold text-white">65 000 ₽</span>
                </div>
                <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs">
                  <span className="font-mono font-bold text-amber-600">3-е место:</span>
                  <span className="font-bold text-white">35 000 ₽</span>
                </div>
                <Link
                  to="/tournaments"
                  className="btn-crimson font-rajdhani uppercase font-bold tracking-wider text-xs px-5 py-2.5 ml-auto cursor-pointer"
                >
                  PRIZE BREAKDOWN →
                </Link>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* 4. TOP TEAMS LEADERBOARD ROW */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2">
            <span className="text-[#ff1e44] text-lg">✦</span>
            <h2 className="font-rajdhani font-extrabold uppercase text-2xl sm:text-3xl text-white tracking-wide">
              TOP TEAMS
            </h2>
          </div>
          <Link
            to="/tournaments"
            className="font-rajdhani font-bold uppercase text-xs sm:text-sm tracking-wider text-zinc-400 hover:text-white transition flex items-center gap-1"
          >
            <span>VIEW LEADERBOARD</span>
            <span>→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {TOP_TEAMS.map((team) => (
            <div
              key={team.name}
              className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a0d14] p-4 flex flex-col justify-between hover:border-white/25 transition group"
            >
              {/* Subtle top indicator bar */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ backgroundColor: team.color }}
              />

              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono text-xs font-bold text-zinc-400">
                    #{team.rank}
                  </span>
                  <span className="font-mono text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    {team.tag}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border font-teko text-xl font-bold ${team.iconBg}`}>
                    {team.tag.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-rajdhani font-extrabold uppercase text-sm sm:text-base text-white group-hover:text-red-400 transition">
                      {team.name}
                    </h3>
                    <div className="font-mono text-xs text-zinc-400">
                      {team.matches} MATCHES
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between font-mono text-xs">
                <div>
                  <span className="text-[10px] uppercase text-zinc-500 block">POINTS</span>
                  <span className="font-bold text-white">{team.points}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-zinc-500 block">WIN RATE</span>
                  <span className="font-bold text-emerald-400">{team.winRate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. LIVE & UPCOMING MATCHES CATALOG */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#ff1e44] text-lg">✦</span>
              <h2 className="font-rajdhani font-extrabold uppercase text-2xl sm:text-3xl text-white tracking-wide">
                LIVE & UPCOMING MATCHES
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 px-2.5 py-0.5 text-xs font-bold text-cyan-300 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                {activeCount} открыто
              </span>
            </div>
            <p className="mt-1 font-rajdhani text-xs sm:text-sm text-zinc-400">
              Выберите дисциплину, зарегистрируйтесь на матч и получите данные комнаты в личном кабинете.
            </p>
          </div>

          <Link
            to="/tournaments"
            className="font-rajdhani font-bold uppercase text-xs sm:text-sm tracking-wider text-[#00f0ff] hover:text-white transition shrink-0"
          >
            ALL MATCHES →
          </Link>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setMatchFilterGame("all")}
            className={`rounded-lg px-4 py-2 font-rajdhani uppercase font-bold text-xs tracking-wider transition whitespace-nowrap cursor-pointer ${
              matchFilterGame === "all"
                ? "bg-[#ff1e44] text-white shadow-[0_0_15px_rgba(255,30,68,0.4)]"
                : "bg-white/[0.04] text-zinc-400 hover:text-white border border-white/[0.08]"
            }`}
          >
            ALL GAMES
          </button>
          {heroGames.map((g) => {
            const isSel = matchFilterGame === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setMatchFilterGame(g.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 font-rajdhani uppercase font-bold text-xs tracking-wider transition whitespace-nowrap cursor-pointer ${
                  isSel
                    ? "bg-[#ff1e44] text-white shadow-[0_0_15px_rgba(255,30,68,0.4)]"
                    : "bg-white/[0.04] text-zinc-400 hover:text-white border border-white/[0.08]"
                }`}
              >
                <GameIcon game={g.id} className="w-3.5 h-3.5 rounded-sm object-cover" />
                <span>{g.short}</span>
              </button>
            );
          })}
        </div>

        {/* Tournament Grid */}
        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredTournaments.slice(0, 9).map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>

        {filteredTournaments.length === 0 && (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-10 text-center font-rajdhani">
            <p className="text-zinc-400 text-sm">
              В данной дисциплине нет открытых матчей на сегодня. Попробуйте выбрать другую игру или загляните позже.
            </p>
            <button
              type="button"
              onClick={() => setMatchFilterGame("all")}
              className="mt-3 text-xs font-bold text-[#ff1e44] hover:underline uppercase tracking-wider cursor-pointer"
            >
              Сбросить фильтр
            </button>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 6. LATEST NEWS & STAY UPDATED */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2">
            <span className="text-[#ff1e44] text-lg">✦</span>
            <h2 className="font-rajdhani font-extrabold uppercase text-2xl sm:text-3xl text-white tracking-wide">
              LATEST NEWS
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {LATEST_NEWS.map((item) => (
            <div
              key={item.id}
              className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#090c12] p-5 flex flex-col justify-between hover:border-white/20 transition group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`inline-flex items-center rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase border ${item.badgeColor}`}>
                    {item.tag}
                  </span>
                  <span className="font-mono text-[11px] text-zinc-500 font-bold">{item.date}</span>
                </div>
                <h3 className="font-rajdhani font-extrabold uppercase text-base sm:text-lg text-white group-hover:text-red-400 transition leading-snug">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs text-zinc-400 font-rajdhani leading-relaxed">
                  {item.excerpt}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.06]">
                <a
                  href={VK_GROUP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-rajdhani uppercase text-xs font-bold text-red-400 hover:text-red-300 transition inline-flex items-center gap-1"
                >
                  <span>READ MORE</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* STAY UPDATED NEWSLETTER */}
        <div className="relative overflow-hidden rounded-xl border border-red-500/20 bg-gradient-to-r from-red-950/20 via-[#0a0d14] to-[#0a0d14] p-6 sm:p-8 mt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="font-rajdhani font-black uppercase text-xl sm:text-2xl text-white tracking-wide">
                STAY UPDATED
              </div>
              <p className="font-rajdhani text-xs sm:text-sm text-zinc-400 max-w-md">
                Подпишитесь на уведомления о старте новых турниров, открытии лобби и эксклюзивных розыгрышах платформы.
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md w-full">
              {newsletterSubscribed ? (
                <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-300 flex items-center gap-2">
                  <span>✓</span>
                  <span>Вы успешно подписаны на уведомления соревнований!</span>
                </div>
              ) : (
                <>
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Ваш email адрес..."
                    required
                    className="flex-1 rounded-lg border border-white/10 bg-black/60 px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="btn-crimson font-rajdhani uppercase font-extrabold tracking-wider text-xs px-6 py-2.5 cursor-pointer whitespace-nowrap"
                  >
                    SUBSCRIBE
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. VK OFFICIAL COMMUNITY CARD */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-[#0077ff]/30 bg-gradient-to-br from-[#0c1424] via-[#090d16] to-[#090d16] p-6 sm:p-8 shadow-2xl">
          <div className="pointer-events-none absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-[#0077ff]/15 blur-3xl" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-md border border-[#0077ff]/40 bg-[#0077ff]/15 px-2.5 py-1 text-xs font-semibold text-[#5ea4ff]">
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.67 2 15.07 2zm3.08 14.27h-1.46c-.55 0-.72-.44-1.71-1.43-.86-.83-1.24-.94-1.46-.94-.3 0-.38.08-.38.49v1.31c0 .35-.11.56-1.04.56-1.54 0-3.24-.93-4.44-2.66-1.81-2.54-2.3-4.45-2.3-4.84 0-.21.08-.41.49-.41h1.46c.37 0 .51.17.65.56.72 2.08 1.92 3.9 2.41 3.9.19 0 .27-.09.27-.56V9.97c-.06-.99-.58-1.07-.58-1.42 0-.17.14-.34.37-.34h2.29c.31 0 .42.17.42.53v2.89c0 .31.14.42.23.42.19 0 .34-.11.68-.45 1.05-1.18 1.8-3 1.8-3 .1-.21.27-.41.64-.41h1.46c.44 0 .54.23.44.53-.18.85-1.95 3.35-1.95 3.35-.16.25-.22.36 0 .65.16.21.69.67 1.04 1.08.65.74 1.14 1.36 1.28 1.79.14.42-.08.64-.51.64z" />
                </svg>
                <span>ОФИЦИАЛЬНОЕ СООБЩЕСТВО</span>
              </div>

              <h2 className="font-rajdhani font-black uppercase text-2xl sm:text-3xl text-white tracking-wide">
                Сообщество NightByte Club
              </h2>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-rajdhani">
                Следите за расписанием новых соревнований, отчетами о выплатах победителям и общайтесь с судьями и участниками напрямую.
              </p>

              <div className="flex flex-wrap gap-2 text-xs pt-1 font-rajdhani font-bold">
                <span className="rounded-lg border border-[#0077ff]/30 bg-[#0077ff]/10 text-cyan-200 px-2.5 py-1">Анонсы соревнований</span>
                <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 px-2.5 py-1">Чеки выплат призовых</span>
                <span className="rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 px-2.5 py-1">Чат игроков и арбитраж</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
              <a
                href={VK_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-6 text-sm font-rajdhani font-extrabold uppercase tracking-wider rounded-lg border border-[#0077ff]/50 bg-[#0077ff]/20 text-white hover:bg-[#0077ff]/35 shadow-md shadow-[#0077ff]/25 transition cursor-pointer"
              >
                <span>Вступить в группу ВК →</span>
              </a>
              <span className="font-mono text-xs text-cyan-400/80">
                vk.ru/nightbyte.club
              </span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
