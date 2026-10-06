import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTournaments } from '@/context/TournamentContext';
import { AdminLoginForm } from '@/components/AdminLoginForm';
import { AdminMatchForm } from '@/components/AdminMatchForm';
import { AdminRegistrationsManager } from '@/components/AdminRegistrationsManager';
import { AdminTipsTipsPayments } from '@/components/AdminTipsTipsPayments';
import { AdminGamesManager } from '@/components/AdminGamesManager';
import { AdminCreateTournamentModal } from '@/components/AdminCreateTournamentModal';
import { getStoredTipsTipsPayments } from '@/lib/tipstips-client';

export const AdminPage: React.FC = () => {
  const { isAdmin, adminLogout } = useAuth();
  const { tournaments, matches, registrations, allGames } = useTournaments();
  const [activeTab, setActiveTab] = useState<'tipstips' | 'matches' | 'games' | 'registrations'>('tipstips');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [openWithCustomGame, setOpenWithCustomGame] = useState(false);
  const [matchStatusFilter, setMatchStatusFilter] = useState<'all' | 'recruiting' | 'live' | 'finished' | 'soon'>('all');
  const [matchGameFilter, setMatchGameFilter] = useState<string>('all');
  const [matchSearchQuery, setMatchSearchQuery] = useState<string>('');
  const [expandAllMatches, setExpandAllMatches] = useState<boolean>(false);
  const [pendingTipsCount, setPendingTipsCount] = useState<number>(() => {
    return getStoredTipsTipsPayments().filter((p) => p.status === 'pending').length;
  });

  useEffect(() => {
    const updateCount = () => {
      setPendingTipsCount(getStoredTipsTipsPayments().filter((p) => p.status === 'pending').length);
    };
    window.addEventListener('nb_tipstips_updated', updateCount);
    return () => window.removeEventListener('nb_tipstips_updated', updateCount);
  }, []);

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <AdminLoginForm />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Панель администратора</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Управление матчами, расписанием, играми и иконками, участниками и платежами
          </p>
        </div>
        <button
          onClick={adminLogout}
          className="self-start sm:self-auto rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
        >
          Выйти
        </button>
      </div>

      {/* Переключатель вкладок */}
      <div className="mt-6 flex flex-wrap items-center gap-3 border-b border-white/10 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab('tipstips')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
            activeTab === 'tipstips'
              ? 'bg-amber-400 text-black shadow-md'
              : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-white'
          }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
          <span>Платежи tips.tips</span>
          {pendingTipsCount > 0 ? (
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-extrabold text-white animate-pulse">
              {pendingTipsCount}
            </span>
          ) : (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                activeTab === 'tipstips' ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-400'
              }`}
            >
              0
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('matches')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
            activeTab === 'matches'
              ? 'bg-cyan-400 text-black shadow-md'
              : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-white'
          }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4M6 4h12a2 2 0 012 2v2a6 6 0 01-6 6h-4a6 6 0 01-6-6V6a2 2 0 012-2z" />
          </svg>
          <span>Матчи и расписание</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              activeTab === 'matches' ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-400'
            }`}
          >
            {tournaments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('games')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
            activeTab === 'games'
              ? 'bg-cyan-400 text-black shadow-md'
              : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-white'
          }`}
        >
          <span className="text-base leading-none">🎮</span>
          <span>Игры и иконки</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              activeTab === 'games' ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-400'
            }`}
          >
            {allGames.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('registrations')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
            activeTab === 'registrations'
              ? 'bg-cyan-400 text-black shadow-md'
              : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-white'
          }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>Участники соревнований</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              activeTab === 'registrations' ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-400'
            }`}
          >
            {registrations.length}
          </span>
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'tipstips' ? (
          <AdminTipsTipsPayments />
        ) : activeTab === 'games' ? (
          <AdminGamesManager />
        ) : activeTab === 'registrations' ? (
          <AdminRegistrationsManager />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 border border-white/10 p-5 rounded-2xl">
              <div>
                <h2 className="text-xl font-bold text-white">Управление матчами и турнирами</h2>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Полное редактирование: названия, дисциплины, описания и регламента, времени старта, доступов к лобби и победителей.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('games')}
                  className="rounded-xl border border-cyan-500/40 bg-cyan-500/15 hover:bg-cyan-500 hover:text-black text-cyan-300 px-4 py-2.5 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-cyan-500/10 transition whitespace-nowrap"
                >
                  <span>🎮</span>
                  <span>Настроить иконки и игры</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenWithCustomGame(false);
                    setIsCreateModalOpen(true);
                  }}
                  className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2.5 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition whitespace-nowrap"
                >
                  <span>➕</span>
                  <span>Создать новый матч</span>
                </button>
              </div>
            </div>

            {/* ПАНЕЛЬ ФИЛЬТРОВ И ПОИСКА МАТЧЕЙ */}
            <div className="rounded-2xl border border-white/10 bg-[#0c1018] p-4 space-y-3.5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Фильтр по статусу */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMatchStatusFilter('all')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      matchStatusFilter === 'all'
                        ? 'bg-cyan-500 text-black shadow-sm font-black'
                        : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5'
                    }`}
                  >
                    Все ({tournaments.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setMatchStatusFilter('recruiting')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                      matchStatusFilter === 'recruiting'
                        ? 'bg-emerald-500 text-black shadow-sm font-black'
                        : 'bg-white/5 text-emerald-400/80 hover:text-emerald-300 border border-white/5'
                    }`}
                  >
                    <span>🟢</span>
                    <span>Набор ({tournaments.filter((t) => t.status === 'recruiting').length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMatchStatusFilter('live')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                      matchStatusFilter === 'live'
                        ? 'bg-red-500 text-white shadow-sm font-black'
                        : 'bg-white/5 text-red-400/80 hover:text-red-300 border border-white/5'
                    }`}
                  >
                    <span>🔴</span>
                    <span>В эфире ({tournaments.filter((t) => t.status === 'live').length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMatchStatusFilter('finished')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                      matchStatusFilter === 'finished'
                        ? 'bg-purple-500 text-white shadow-sm font-black'
                        : 'bg-white/5 text-purple-400/80 hover:text-purple-300 border border-white/5'
                    }`}
                  >
                    <span>🏆</span>
                    <span>Завершены ({tournaments.filter((t) => t.status === 'finished').length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMatchStatusFilter('soon')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                      matchStatusFilter === 'soon'
                        ? 'bg-cyan-400 text-black shadow-sm font-black'
                        : 'bg-white/5 text-cyan-300/80 hover:text-cyan-200 border border-white/5'
                    }`}
                  >
                    <span>⏳</span>
                    <span>Скоро ({tournaments.filter((t) => t.status === 'soon').length})</span>
                  </button>
                </div>

                {/* Кнопка свернуть / развернуть все */}
                <button
                  type="button"
                  onClick={() => setExpandAllMatches(!expandAllMatches)}
                  className="self-start md:self-auto rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition"
                >
                  {expandAllMatches ? '▲ Свернуть все карточки' : '▼ Развернуть все карточки'}
                </button>
              </div>

              {/* Поиск и фильтр по дисциплине */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2 border-t border-white/5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Поиск по названию матча, победителю или ID..."
                    className="input-field text-xs text-white w-full pl-8"
                    value={matchSearchQuery}
                    onChange={(e) => setMatchSearchQuery(e.target.value)}
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">
                    🔍
                  </span>
                  {matchSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setMatchSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-400 shrink-0 font-medium">Игра:</span>
                  <select
                    value={matchGameFilter}
                    onChange={(e) => setMatchGameFilter(e.target.value)}
                    className="input-field text-xs bg-zinc-900 border-white/15 text-white font-bold"
                  >
                    <option value="all">Все дисциплины</option>
                    {allGames.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.short || g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* СПИСОК МАТЧЕЙ */}
            {(() => {
              const filtered = tournaments.filter((t) => {
                if (matchStatusFilter !== 'all' && t.status !== matchStatusFilter) {
                  return false;
                }
                if (matchGameFilter !== 'all' && t.game !== matchGameFilter) {
                  return false;
                }
                if (matchSearchQuery.trim()) {
                  const q = matchSearchQuery.trim().toLowerCase();
                  const matchTitle = (t.title || '').toLowerCase().includes(q);
                  const matchGame = (t.game || '').toLowerCase().includes(q);
                  const matchWinner = (t.winner || '').toLowerCase().includes(q);
                  const matchId = (t.id || '').toLowerCase().includes(q);
                  if (!matchTitle && !matchGame && !matchWinner && !matchId) {
                    return false;
                  }
                }
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="surface-card p-10 text-center rounded-2xl border border-white/10">
                    <span className="text-3xl">🔍</span>
                    <h3 className="mt-2 text-base font-bold text-white">Матчи не найдены</h3>
                    <p className="mt-1 text-xs text-zinc-400">
                      По выбранным фильтрам или запросу «{matchSearchQuery}» ничего не найдено.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setMatchStatusFilter('all');
                        setMatchGameFilter('all');
                        setMatchSearchQuery('');
                      }}
                      className="mt-3 text-xs text-cyan-400 hover:underline font-bold"
                    >
                      Сбросить все фильтры
                    </button>
                  </div>
                );
              }

              return (
                <div className="flex flex-col gap-3.5">
                  {filtered.map((tournament) => (
                    <AdminMatchForm
                      key={tournament.id + (expandAllMatches ? '-expanded' : '-collapsed')}
                      tournament={tournament}
                      initialMatch={matches[tournament.id] || null}
                      initiallyExpanded={expandAllMatches}
                    />
                  ))}
                </div>
              );
            })()}

            {/* Модальное окно создания нового матча/турнира */}
            <AdminCreateTournamentModal
              isOpen={isCreateModalOpen}
              onClose={() => setIsCreateModalOpen(false)}
              initialShowCustomGame={openWithCustomGame}
            />
          </div>
        )}
      </div>
    </div>
  );
};
