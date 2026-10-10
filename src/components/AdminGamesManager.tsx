import React, { useState, useRef } from 'react';
import { useTournaments } from '@/context/TournamentContext';
import {
  FullGameInfo,
  compressGameIconFile,
  compressGameWallpaperFile,
  hexToRgbaGlow,
} from '@/lib/games';
import { GameIcon } from '@/components/GameIcons';

export const AdminGamesManager: React.FC = () => {
  const { allGames, updateGameConfig, resetGameConfig, addCustomGame, deleteCustomGame } = useTournaments();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'builtin' | 'custom' | 'modified'>('all');
  const [notice, setNotice] = useState<{ id: string; text: string; type: 'success' | 'error' } | null>(null);
  const [isCreatingGame, setIsCreatingGame] = useState(false);

  // Состояние создания новой игры
  const [newGameName, setNewGameName] = useState('');
  const [newGameShort, setNewGameShort] = useState('');
  const [newGameTag, setNewGameTag] = useState('');
  const [newGameAccent, setNewGameAccent] = useState('#22d3ee');
  const [newGameIconUrl, setNewGameIconUrl] = useState('');
  const [newGameWallpaperUrl, setNewGameWallpaperUrl] = useState('');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  const showNotification = (id: string, text: string, type: 'success' | 'error' = 'success') => {
    setNotice({ id, text, type });
    setTimeout(() => {
      setNotice((prev) => (prev?.id === id ? null : prev));
    }, 4000);
  };

  const filteredGames = allGames.filter((g) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      g.name.toLowerCase().includes(q) ||
      g.short.toLowerCase().includes(q) ||
      (g.tag || '').toLowerCase().includes(q) ||
      g.id.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (filterType === 'builtin') return !g.isCustom;
    if (filterType === 'custom') return g.isCustom;
    if (filterType === 'modified') return g.isModified || g.hasCustomIcon;
    return true;
  });

  const handleCreateNewGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameName.trim()) return;

    const baseId = newGameName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 20);
    const uniqueId = `game_${baseId || 'custom'}_${Math.random().toString(36).substring(2, 6)}`;

    setIsSubmittingNew(true);
    try {
      const ok = await addCustomGame({
        id: uniqueId,
        name: newGameName.trim(),
        short: newGameShort.trim() || newGameName.trim().slice(0, 10),
        tag: newGameTag.trim() || 'Tournament',
        accent: newGameAccent,
        glow: hexToRgbaGlow(newGameAccent),
        iconUrl: newGameIconUrl.trim(),
        wallpaperUrl: newGameWallpaperUrl.trim() || newGameIconUrl.trim(),
        isBuiltin: false,
      });

      if (ok) {
        setIsCreatingGame(false);
        setNewGameName('');
        setNewGameShort('');
        setNewGameTag('');
        setNewGameAccent('#22d3ee');
        setNewGameIconUrl('');
        setNewGameWallpaperUrl('');
        showNotification(uniqueId, `Игра «${newGameName}» успешно добавлена!`);
      } else {
        alert('Ошибка при сохранении игры. Попробуйте еще раз.');
      }
    } finally {
      setIsSubmittingNew(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Шапка раздела */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-lg">
              🎮
            </span>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Управление играми, иконками и баннерами
              </h2>
              <p className="mt-0.5 text-xs text-zinc-400">
                Замена иконок, названий, тегов и фоновых обоев для всех дисциплин (включая CS2, Dota 2, PUBG, Minecraft, Apex и др.)
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCreatingGame(true)}
          className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2.5 text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition self-start sm:self-auto shrink-0"
        >
          <span>➕</span>
          <span>Добавить новую игру</span>
        </button>
      </div>

      {/* Поиск и фильтры */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${
              filterType === 'all'
                ? 'bg-white/20 text-white'
                : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            Все ({allGames.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('builtin')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${
              filterType === 'builtin'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            Стандартные ({allGames.filter((g) => !g.isCustom).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('custom')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${
              filterType === 'custom'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            Свои игры ({allGames.filter((g) => g.isCustom).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('modified')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${
              filterType === 'modified'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            Кастомизированные ({allGames.filter((g) => g.isModified || g.hasCustomIcon).length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Поиск по названию или ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field text-xs py-2 pr-8 w-full bg-black/40 border-white/15"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Сетка карточек игр */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {filteredGames.map((game) => (
          <GameEditorCard
            key={game.id}
            game={game}
            onUpdate={async (updates) => {
              const ok = await updateGameConfig(game.id, updates);
              if (ok) {
                showNotification(game.id, `Изменения для «${game.name}» сохранены!`);
              } else {
                showNotification(game.id, `Ошибка при сохранении в базу`, 'error');
              }
            }}
            onReset={async () => {
              if (window.confirm(`Сбросить все настройки и иконку игры «${game.name}» к заводским?`)) {
                await resetGameConfig(game.id);
                showNotification(game.id, `«${game.name}» сброшена к заводским настройкам`);
              }
            }}
            onDelete={async () => {
              if (window.confirm(`Удалить игру «${game.name}» из списка?`)) {
                await deleteCustomGame(game.id);
                showNotification(game.id, `Игра «${game.name}» удалена`);
              }
            }}
            notification={notice?.id === game.id ? notice : null}
          />
        ))}
      </div>

      {filteredGames.length === 0 && (
        <div className="p-12 text-center border border-white/10 rounded-2xl bg-black/20">
          <p className="text-sm text-zinc-400">Игры по заданным критериям не найдены.</p>
        </div>
      )}

      {/* Модальное окно добавления новой игры */}
      {isCreatingGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-zinc-950 p-6 shadow-2xl text-left">
            <button
              type="button"
              onClick={() => setIsCreatingGame(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition"
            >
              ✕
            </button>

            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-lg">
                🎮
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Добавление новой дисциплины / игры
                </h3>
                <p className="text-xs text-zinc-400">
                  Игра появится во всех разделах сайта, в фильтрах турниров и в карточках
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateNewGame} className="mt-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Название игры *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Standoff 2, Valorant, Rainbow Six"
                  value={newGameName}
                  onChange={(e) => {
                    setNewGameName(e.target.value);
                    if (!newGameShort) {
                      setNewGameShort(e.target.value.slice(0, 10));
                    }
                  }}
                  className="input-field text-sm w-full"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Короткое имя (на бейджах) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Например: SO2"
                    value={newGameShort}
                    onChange={(e) => setNewGameShort(e.target.value)}
                    className="input-field text-sm w-full font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Тег режима (на карточке)
                  </label>
                  <input
                    type="text"
                    placeholder="Например: 5v5 Bomb, Solo, BR"
                    value={newGameTag}
                    onChange={(e) => setNewGameTag(e.target.value)}
                    className="input-field text-sm w-full"
                  />
                </div>
              </div>

              {/* Акцентный цвет */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Акцентный цвет игры
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newGameAccent}
                    onChange={(e) => setNewGameAccent(e.target.value)}
                    className="h-10 w-14 rounded-lg border border-white/20 bg-black cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={newGameAccent}
                    onChange={(e) => setNewGameAccent(e.target.value)}
                    className="input-field text-xs font-mono font-bold w-28 uppercase"
                  />
                  <div
                    className="rounded-lg px-3 py-1.5 text-xs font-bold"
                    style={{
                      backgroundColor: `${newGameAccent}20`,
                      color: newGameAccent,
                      border: `1px solid ${newGameAccent}40`,
                    }}
                  >
                    Превью цвета
                  </div>
                </div>
              </div>

              {/* Загрузка иконки */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Иконка игры (PNG, JPG, WEBP, SVG)
                </label>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl border border-white/20 bg-black/50 flex items-center justify-center shrink-0 overflow-hidden">
                    {newGameIconUrl ? (
                      <img src={newGameIconUrl} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xl">🎮</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="btn-secondary py-1.5 px-3 text-xs inline-flex items-center gap-2 cursor-pointer font-bold">
                      <span>📁 Загрузить файл с ПК</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressed = await compressGameIconFile(file, 160);
                              setNewGameIconUrl(compressed);
                            } catch (err: any) {
                              alert(err.message || 'Ошибка сжатия изображения');
                            }
                          }
                        }}
                      />
                    </label>
                    <input
                      type="text"
                      placeholder="Или укажите прямую ссылку на иконку..."
                      value={newGameIconUrl}
                      onChange={(e) => setNewGameIconUrl(e.target.value)}
                      className="input-field text-xs w-full py-1.5"
                    />
                  </div>
                </div>
              </div>

              {/* Фоновые обои / Баннер */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Фоновый баннер / Обои (16:9)
                </label>
                <div className="space-y-1">
                  <label className="btn-secondary py-1.5 px-3 text-xs inline-flex items-center gap-2 cursor-pointer font-bold">
                    <span>🖼️ Загрузить фоновый баннер</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressGameWallpaperFile(file, 1280);
                            setNewGameWallpaperUrl(compressed);
                          } catch (err: any) {
                            alert(err.message || 'Ошибка сжатия изображения');
                          }
                        }
                      }}
                    />
                  </label>
                  <input
                    type="text"
                    placeholder="Или укажите прямую ссылку на фоновые обои..."
                    value={newGameWallpaperUrl}
                    onChange={(e) => setNewGameWallpaperUrl(e.target.value)}
                    className="input-field text-xs w-full py-1.5"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreatingGame(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew || !newGameName.trim()}
                  className="btn-primary py-2.5 px-5 text-xs font-bold shadow-md shadow-cyan-500/20"
                >
                  {isSubmittingNew ? 'Создание...' : 'Создать игру'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface GameEditorCardProps {
  game: FullGameInfo;
  onUpdate: (updates: {
    name?: string;
    short?: string;
    tag?: string;
    accent?: string;
    iconUrl?: string;
    wallpaperUrl?: string;
  }) => Promise<void>;
  onReset: () => Promise<void>;
  onDelete: () => Promise<void>;
  notification: { text: string; type: 'success' | 'error' } | null;
}

const GameEditorCard: React.FC<GameEditorCardProps> = ({
  game,
  onUpdate,
  onReset,
  onDelete,
  notification,
}) => {
  const [name, setName] = useState(game.name);
  const [short, setShort] = useState(game.short);
  const [tag, setTag] = useState(game.tag || '');
  const [accent, setAccent] = useState(game.accent);
  const [iconUrl, setIconUrl] = useState(game.iconUrl || '');
  const [wallpaperUrl, setWallpaperUrl] = useState(game.wallpaperUrl || '');
  const [hasPremiumMode, setHasPremiumMode] = useState<boolean>(Boolean(game.hasPremiumMode));
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [isUploadingWall, setIsUploadingWall] = useState(false);

  const iconFileInputRef = useRef<HTMLInputElement>(null);
  const wallFileInputRef = useRef<HTMLInputElement>(null);

  // Синхронизация при смене пропсов
  React.useEffect(() => {
    setName(game.name);
    setShort(game.short);
    setTag(game.tag || '');
    setAccent(game.accent);
    setIconUrl(game.iconUrl || '');
    setWallpaperUrl(game.wallpaperUrl || '');
    setHasPremiumMode(Boolean(game.hasPremiumMode));
  }, [game]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdate({
        name: name.trim(),
        short: short.trim(),
        tag: tag.trim(),
        accent: accent.trim(),
        iconUrl: iconUrl.trim(),
        wallpaperUrl: wallpaperUrl.trim(),
        hasPremiumMode,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleIconFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingIcon(true);
    try {
      const compressed = await compressGameIconFile(file, 160);
      setIconUrl(compressed);
      await onUpdate({ iconUrl: compressed });
    } catch (err: any) {
      alert(err.message || 'Ошибка обработки иконки');
    } finally {
      setIsUploadingIcon(false);
      if (iconFileInputRef.current) iconFileInputRef.current.value = '';
    }
  };

  const handleWallFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingWall(true);
    try {
      const compressed = await compressGameWallpaperFile(file, 1280);
      setWallpaperUrl(compressed);
      await onUpdate({ wallpaperUrl: compressed });
    } catch (err: any) {
      alert(err.message || 'Ошибка обработки обоев');
    } finally {
      setIsUploadingWall(false);
      if (wallFileInputRef.current) wallFileInputRef.current.value = '';
    }
  };

  return (
    <div
      className="surface-card p-5 sm:p-6 border relative overflow-hidden transition-all duration-300"
      style={{
        borderColor: `${accent}40`,
        boxShadow: `0 8px 30px ${accent}12`,
      }}
    >
      {/* Задний мягкий градиент под цвет игры */}
      <div
        className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: accent }}
      />

      {/* Шапка карточки игры */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4 relative">
        <div className="flex items-center gap-3.5">
          {/* Превью иконки */}
          <div className="relative group">
            <div className="h-14 w-14 rounded-2xl border border-white/20 bg-black/60 p-1 flex items-center justify-center overflow-hidden shadow-md">
              <GameIcon game={game.id} customIconUrl={iconUrl} className="h-full w-full object-cover rounded-xl" />
            </div>
            <button
              type="button"
              onClick={() => iconFileInputRef.current?.click()}
              className="absolute inset-0 bg-black/70 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-extrabold text-white transition cursor-pointer"
              title="Нажмите, чтобы заменить иконку"
            >
              Заменить
            </button>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-extrabold text-white tracking-tight">{name}</h3>
              <span className="font-mono text-xs font-bold text-zinc-500">({game.id})</span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span
                className="rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase"
                style={{
                  backgroundColor: `${accent}25`,
                  color: accent,
                  border: `1px solid ${accent}50`,
                }}
              >
                {short}
              </span>

              {tag && (
                <span className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                  {tag}
                </span>
              )}

              {game.isCustom ? (
                <span className="rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold">
                  Своя игра
                </span>
              ) : (
                <span className="rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 text-[10px] font-bold">
                  Стандартная
                </span>
              )}

              {game.hasCustomIcon && (
                <span className="rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold">
                  ✓ Своя иконка
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start">
          {!game.isCustom && game.isModified && (
            <button
              type="button"
              onClick={onReset}
              className="rounded-lg border border-white/15 bg-white/5 hover:bg-white/15 text-zinc-300 px-2.5 py-1.5 text-xs font-semibold transition"
              title="Сбросить все параметры игры к заводским значениям"
            >
              ↩ Сброс
            </button>
          )}

          {game.isCustom && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 px-2.5 py-1.5 text-xs font-bold transition"
              title="Удалить эту созданную игру"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Уведомление о сохранении */}
      {notification && (
        <div
          className={`mt-3 rounded-xl p-2.5 text-xs font-bold flex items-center gap-2 ${
            notification.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/60 border border-red-500/40 text-red-300'
          }`}
        >
          <span>{notification.type === 'success' ? '✓' : '✕'}</span>
          <span>{notification.text}</span>
        </div>
      )}

      {/* Форма редактирования */}
      <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
        {/* Блок 1: Управление иконкой */}
        <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <span>🖼️</span>
              <span>Иконка игры</span>
            </label>
            {iconUrl && (
              <button
                type="button"
                onClick={() => {
                  setIconUrl('');
                  onUpdate({ iconUrl: '' });
                }}
                className="text-[10px] text-zinc-500 hover:text-red-400 transition"
              >
                Вернуть заводскую
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
            <button
              type="button"
              disabled={isUploadingIcon}
              onClick={() => iconFileInputRef.current?.click()}
              className="btn-secondary py-2 px-3 text-xs font-bold flex items-center justify-center gap-2 shrink-0 bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <span>📁</span>
              <span>{isUploadingIcon ? 'Сжатие...' : 'Загрузить иконку с ПК'}</span>
            </button>
            <input
              type="file"
              ref={iconFileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleIconFileSelected}
            />
            <input
              type="text"
              placeholder="Или прямая ссылка на иконку (URL)..."
              value={iconUrl}
              onChange={(e) => setIconUrl(e.target.value)}
              className="input-field text-xs py-2 flex-1"
            />
          </div>
          <p className="text-[10px] text-zinc-500">
            Поддерживаются любые картинки (PNG, JPG, SVG, WEBP). Фото автоматически кадрируется и сжимается до легкого формата.
          </p>
        </div>

        {/* Блок 2: Название, короткое имя, тег */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Название:
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field text-xs w-full font-bold text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Тег на бейдже:
            </label>
            <input
              type="text"
              required
              value={short}
              onChange={(e) => setShort(e.target.value)}
              className="input-field text-xs w-full font-mono font-bold text-white uppercase"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Тег режима:
            </label>
            <input
              type="text"
              placeholder="5v5, BR, Hunger Games"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="input-field text-xs w-full text-zinc-300"
            />
          </div>
        </div>

        {/* Блок 3: Акцентный цвет */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/25 p-3">
          <div className="flex items-center gap-2.5">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="h-8 w-12 rounded-lg border border-white/20 bg-black cursor-pointer p-0.5 shrink-0"
            />
            <div>
              <span className="block text-[11px] font-semibold text-zinc-300">Цвет оформления:</span>
              <span className="font-mono text-xs text-zinc-400">{accent}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="input-field text-xs font-mono font-bold w-28 uppercase text-center"
            />
            <div
              className="rounded-lg px-2.5 py-1 text-[11px] font-extrabold uppercase shrink-0"
              style={{
                backgroundColor: `${accent}20`,
                color: accent,
                border: `1px solid ${accent}50`,
              }}
            >
              {short || 'TAG'}
            </div>
          </div>
        </div>

        {/* Блок 4: Фоновые обои / Баннер */}
        <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <span>🌌</span>
              <span>Фоновые обои (баннер в шапке)</span>
            </label>
            {wallpaperUrl && (
              <button
                type="button"
                onClick={() => {
                  setWallpaperUrl('');
                  onUpdate({ wallpaperUrl: '' });
                }}
                className="text-[10px] text-zinc-500 hover:text-red-400 transition"
              >
                Очистить
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              disabled={isUploadingWall}
              onClick={() => wallFileInputRef.current?.click()}
              className="btn-secondary py-2 px-3 text-xs font-bold flex items-center justify-center gap-2 shrink-0 bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <span>🖼️</span>
              <span>{isUploadingWall ? 'Сжатие...' : 'Загрузить обои с ПК'}</span>
            </button>
            <input
              type="file"
              ref={wallFileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleWallFileSelected}
            />
            <input
              type="text"
              placeholder="Или ссылка на обои..."
              value={wallpaperUrl}
              onChange={(e) => setWallpaperUrl(e.target.value)}
              className="input-field text-xs py-2 flex-1"
            />
          </div>

          {wallpaperUrl && (
            <div className="relative mt-2 h-20 w-full rounded-xl overflow-hidden border border-white/10 bg-black/50">
              <img
                src={wallpaperUrl}
                alt="Wallpaper Preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="absolute bottom-1 right-2 text-[10px] font-mono bg-black/70 px-1.5 py-0.5 rounded text-zinc-300">
                Превью баннера
              </span>
            </div>
          )}
        </div>

        {/* Блок 5: Премиум ползунок (100 ₽ / 1 000 ₽) */}
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold text-sm">★</span>
              <span className="text-xs font-bold text-white">Премиум ползунок (100 ₽ / 1 000 ₽)</span>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${
                  hasPremiumMode
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                    : 'bg-white/10 text-zinc-400'
                }`}
              >
                {hasPremiumMode ? 'ВКЛЮЧЕН' : 'ВЫКЛЮЧЕН'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-tight">
              Добавляет интерактивный переключатель «100 ₽ / 1 000 ₽» на карточки соревнований этой игры на сайте
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              const nextVal = !hasPremiumMode;
              setHasPremiumMode(nextVal);
              await onUpdate({ hasPremiumMode: nextVal });
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              hasPremiumMode ? 'bg-amber-400' : 'bg-zinc-700'
            }`}
            title={hasPremiumMode ? 'Выключить премиум ползунок' : 'Включить премиум ползунок'}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow-lg ring-0 transition duration-200 ease-in-out ${
                hasPremiumMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Кнопка сохранения */}
        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto btn-primary py-2.5 px-6 text-xs font-bold shadow-md shadow-cyan-500/20"
          >
            {isSaving ? 'Сохранение...' : '💾 Сохранить изменения игры'}
          </button>
        </div>
      </form>
    </div>
  );
};
