import React, { useState } from 'react';
import { useTournaments } from '@/context/TournamentContext';
import { GameBadge } from '@/components/GameBadge';
import { formatDateTime } from '@/lib/format';

export const AdminRegistrationsManager: React.FC = () => {
  const {
    tournaments,
    registrations,
    deleteRegistration,
    clearTournamentRegistrations,
    refreshData,
  } = useTournaments();

  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('all');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const filteredRegistrations = selectedTournamentId === 'all'
    ? registrations
    : registrations.filter((r) => r.tournamentId === selectedTournamentId);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleDeleteOne = async (id: string, nickname: string) => {
    if (!window.confirm(`Удалить регистрацию игрока "${nickname}"?`)) return;
    setIsProcessing(true);
    try {
      await deleteRegistration(id);
      showNotice(`Игрок "${nickname}" успешно удален из списка участников.`);
    } catch {
      showNotice('Ошибка при удалении игрока.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearTournament = async (tId: string, title: string) => {
    if (!window.confirm(`Вы уверены, что хотите удалить ВСЕХ участников турнира "${title}" и сбросить счетчик на 0?`)) return;
    setIsProcessing(true);
    try {
      await clearTournamentRegistrations(tId);
      showNotice(`Все участники турнира "${title}" удалены, счетчик сброшен на 0.`);
    } catch {
      showNotice('Ошибка при очистке участников турнира.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('ВНИМАНИЕ! Это действие удалит ВСЕ тестовые регистрации со всей платформы и сбросит счетчики всех турниров на 0. Продолжить?')) return;
    setIsProcessing(true);
    try {
      await clearTournamentRegistrations();
      localStorage.removeItem('nb_registrations_v4');
      await refreshData();
      showNotice('Все тестовые регистрации успешно удалены! Счетчики сброшены на 0.');
    } catch {
      showNotice('Ошибка при сбросе всех регистраций.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="surface-card p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">Управление участниками турниров</h2>
            <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-extrabold text-cyan-400 border border-cyan-500/30">
              {registrations.length} игроков
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Просмотр реальных регистраций, удаление тестовых заявок и сброс счетчиков
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => refreshData()}
            disabled={isProcessing}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition"
            title="Обновить данные из базы"
          >
            🔄 Обновить
          </button>
          {registrations.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              disabled={isProcessing}
              className="rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-900/60 transition"
              title="Удалить все тестовые заявки"
            >
              🗑️ Очистить все ({registrations.length})
            </button>
          )}
        </div>
      </div>

      {actionNotice && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs font-semibold text-emerald-400">
          ✓ {actionNotice}
        </div>
      )}

      {/* Фильтры по турнирам */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedTournamentId('all')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            selectedTournamentId === 'all'
              ? 'bg-cyan-500 text-black font-bold'
              : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-white'
          }`}
        >
          Все турниры ({registrations.length})
        </button>
        {tournaments.map((t) => {
          const count = registrations.filter((r) => r.tournamentId === t.id).length;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTournamentId(t.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                selectedTournamentId === t.id
                  ? 'bg-cyan-500 text-black font-bold'
                  : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              {t.title} ({count})
            </button>
          );
        })}
      </div>

      {/* Кнопка сброса для выбранного турнира */}
      {selectedTournamentId !== 'all' && (
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs">
          <div>
            <span className="text-zinc-400">Турнир: </span>
            <strong className="text-white">
              {tournaments.find((t) => t.id === selectedTournamentId)?.title || selectedTournamentId}
            </strong>
            <span className="ml-2 text-zinc-500">
              (Зарегистрировано: {filteredRegistrations.length})
            </span>
          </div>
          {filteredRegistrations.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const tourney = tournaments.find((t) => t.id === selectedTournamentId);
                handleClearTournament(selectedTournamentId, tourney?.title || selectedTournamentId);
              }}
              disabled={isProcessing}
              className="rounded-md border border-red-500/30 bg-red-950/60 px-2.5 py-1 text-xs font-bold text-red-400 hover:bg-red-900/80 transition"
            >
              Сбросить участников этого турнира
            </button>
          )}
        </div>
      )}

      {/* Список регистраций */}
      {filteredRegistrations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
          <p className="text-sm font-semibold text-zinc-400">
            {selectedTournamentId === 'all'
              ? 'Нет зарегистрированных участников ни на один турнир.'
              : 'В этом турнире нет зарегистрированных участников.'}
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            Счетчики участников отображают строго реальное количество записей (0 игроков).
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-white/5 text-[11px] uppercase font-bold text-zinc-400">
              <tr>
                <th className="px-4 py-3">Турнир</th>
                <th className="px-4 py-3">Никнейм</th>
                <th className="px-4 py-3">Игровой аккаунт</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Телефон</th>
                <th className="px-4 py-3">Дата регистрации</th>
                <th className="px-4 py-3 text-right">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRegistrations.map((reg) => {
                const tourney = tournaments.find((t) => t.id === reg.tournamentId);
                return (
                  <tr key={reg.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {tourney && <GameBadge game={tourney.game} />}
                        <span className="font-semibold text-white">
                          {tourney?.title || reg.tournamentId}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-cyan-300 whitespace-nowrap">
                      {reg.nickname}
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-300 whitespace-nowrap">
                      {reg.gameAccount || '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-400 whitespace-nowrap">
                      {reg.email}
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-400 whitespace-nowrap">
                      {reg.phone || '—'}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                      {formatDateTime(reg.paidAt)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDeleteOne(reg.id, reg.nickname)}
                        disabled={isProcessing}
                        className="rounded border border-red-500/30 bg-red-950/40 px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-900/60 hover:text-red-200 transition"
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
