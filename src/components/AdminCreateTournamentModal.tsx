import React, { useState, useEffect, useRef } from 'react';
import { CustomGame, GameId, TournamentStatus } from '@/lib/types';
import { useTournaments } from '@/context/TournamentContext';
import { compressGameIconFile, hexToRgbaGlow } from '@/lib/games';
import { GameIcon } from '@/components/GameIcons';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialShowCustomGame?: boolean;
}

const BUILTIN_GAME_OPTIONS: {
  id: GameId;
  name: string;
  defaultMax: number;
  defaultFee: number;
  defaultPrize: number;
  defaultFormat: string;
  defaultDesc: string;
}[] = [
  {
    id: 'cs2',
    name: 'Counter-Strike 2 (5v5)',
    defaultMax: 10,
    defaultFee: 1500,
    defaultPrize: 12000,
    defaultFormat: '5v5, BO1 — Регламент соревнований',
    defaultDesc:
      'Командные киберспортивные соревнования 5 на 5 (2 команды по 5 игроков, 10 участников). Оплата орг. услуг 1 500 ₽ с игрока. Фиксированное вознаграждение 12 000 ₽ учреждено организатором за спортивные достижения!',
  },
  {
    id: 'dota2',
    name: 'Dota 2 (5v5)',
    defaultMax: 10,
    defaultFee: 1500,
    defaultPrize: 12000,
    defaultFormat: '5v5, Captains Mode — Регламент соревнований',
    defaultDesc:
      'Командные киберспортивные соревнования 5 на 5 (2 команды по 5 игроков, 10 участников). Оплата орг. услуг 1 500 ₽ с игрока. Фиксированное вознаграждение 12 000 ₽ учреждено организатором за спортивные достижения!',
  },
  {
    id: 'pubg',
    name: 'PUBG: BATTLEGROUNDS',
    defaultMax: 100,
    defaultFee: 100,
    defaultPrize: 2200,
    defaultFormat: 'Solo, 1 соревнование',
    defaultDesc:
      'Одиночные соревнования до 100 игроков (старт от 50 участников). Оплата организационных услуг 100 ₽. Фиксированное вознаграждение 2 200 ₽ учреждено организатором (1-е: 1 000 ₽, 2-е: 700 ₽, 3-е: 500 ₽).',
  },
  {
    id: 'pubg_mobile',
    name: 'PUBG MOBILE',
    defaultMax: 100,
    defaultFee: 100,
    defaultPrize: 2200,
    defaultFormat: 'Solo, 1 соревнование',
    defaultDesc:
      'Одиночные мобильные соревнования по PUBG MOBILE до 100 игроков (старт от 50 участников). Оплата организационных услуг 100 ₽. Фиксированное вознаграждение 2 200 ₽ учреждено организатором (1-е: 1 000 ₽, 2-е: 700 ₽, 3-е: 500 ₽).',
  },
  {
    id: 'warzone',
    name: 'Call of Duty: Warzone',
    defaultMax: 100,
    defaultFee: 100,
    defaultPrize: 2200,
    defaultFormat: 'Solo Resurgence, 1 катка',
    defaultDesc:
      'Соревнования по Call of Duty: Warzone. Оплата организационных услуг 100 ₽. Фиксированное вознаграждение победителям.',
  },
  {
    id: 'fortnite',
    name: 'Fortnite',
    defaultMax: 100,
    defaultFee: 100,
    defaultPrize: 2200,
    defaultFormat: 'Solo Zero Build, 1 катка',
    defaultDesc:
      'Соревнования по Fortnite Zero Build. Оплата организационных услуг 100 ₽. Фиксированное вознаграждение победителям.',
  },
];

const COLOR_PRESETS = [
  { label: 'Циан', hex: '#22d3ee' },
  { label: 'Оранжевый', hex: '#f97316' },
  { label: 'Красный', hex: '#ef4444' },
  { label: 'Золотой', hex: '#facc15' },
  { label: 'Изумруд', hex: '#22c55e' },
  { label: 'Фиолетовый', hex: '#a855f7' },
  { label: 'Розовый', hex: '#ec4899' },
  { label: 'Синий', hex: '#3b82f6' },
];

function getDefaultStartsAt(): string {
  const d = new Date();
  if (d.getHours() >= 20) {
    d.setDate(d.getDate() + 1);
  }
  d.setHours(20, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const AdminCreateTournamentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialShowCustomGame = false,
}) => {
  const { createTournament, customGames, addCustomGame, deleteCustomGame } = useTournaments();
  const [selectedGame, setSelectedGame] = useState<GameId>('cs2');
  const [title, setTitle] = useState('CS2 5v5 Night Cup');
  const [startsAtLocal, setStartsAtLocal] = useState(getDefaultStartsAt);
  const [format, setFormat] = useState('5v5, BO1 — Регламент соревнований');
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [minPlayers, setMinPlayers] = useState(10);
  const [entryFeeRub, setEntryFeeRub] = useState(1500);
  const [prizePoolRub, setPrizePoolRub] = useState(12000);
  const [winningPlacesCount, setWinningPlacesCount] = useState(1);
  const [prizesByPlace, setPrizesByPlace] = useState<Record<number, number>>({ 1: 12000 });
  const [status, setStatus] = useState<TournamentStatus>('recruiting');
  const [description, setDescription] = useState(
    'Командные киберспортивные соревнования 5 на 5. Оплата организационных услуг с игрока. Фиксированное вознаграждение за спортивные достижения!'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Состояние формы добавления своей игры
  const [showCustomGameForm, setShowCustomGameForm] = useState(initialShowCustomGame);
  const [customGameName, setCustomGameName] = useState('');
  const [customGameShort, setCustomGameShort] = useState('');
  const [customGameTag, setCustomGameTag] = useState('Tournament');
  const [customGameColor, setCustomGameColor] = useState('#22d3ee');
  const [customGameIcon, setCustomGameIcon] = useState('');
  const [isSavingGame, setIsSavingGame] = useState(false);
  const [gameSuccessMsg, setGameSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setShowCustomGameForm(initialShowCustomGame);
      setError(null);
      setGameSuccessMsg(null);
    }
  }, [isOpen, initialShowCustomGame]);

  if (!isOpen) return null;

  const allGameOptions = [
    ...BUILTIN_GAME_OPTIONS,
    ...customGames.map((cg) => ({
      id: cg.id as GameId,
      name: cg.name,
      defaultMax: 100,
      defaultFee: 100,
      defaultPrize: 2200,
      defaultFormat: `${cg.tag || 'Solo'}, 1 соревнование`,
      defaultDesc: `Соревнования по дисциплине ${cg.name}. Оплата организационных услуг 100 ₽. Фиксированное вознаграждение победителям от организатора.`,
      isCustom: true,
    })),
  ];

  const handleWinningPlacesCountChange = (newCountRaw: number) => {
    const newCount = Math.max(1, Math.min(20, newCountRaw || 1));
    setWinningPlacesCount(newCount);
    setPrizesByPlace((prev) => {
      const next: Record<number, number> = {};
      for (let i = 1; i <= newCount; i++) {
        next[i] = prev[i] ?? 0;
      }
      const sum = Object.values(next).reduce((acc, v) => acc + (Number(v) || 0), 0);
      if (sum > 0) setPrizePoolRub(sum);
      return next;
    });
  };

  const handlePlacePrizeChange = (place: number, amount: number) => {
    const cleanVal = Math.max(0, Number(amount) || 0);
    setPrizesByPlace((prev) => {
      const next: Record<number, number> = { ...prev, [place]: cleanVal };
      let sum = 0;
      for (let i = 1; i <= winningPlacesCount; i++) {
        sum += Number(next[i]) || 0;
      }
      setPrizePoolRub(sum);
      return next;
    });
  };

  const handleGameChange = (gameId: GameId) => {
    setSelectedGame(gameId);
    const opt = allGameOptions.find((g) => g.id === gameId);
    if (opt) {
      const isTeam = gameId === 'cs2' || gameId === 'dota2';
      setTitle(`${opt.name} Cup`);
      setFormat(opt.defaultFormat);
      setMaxPlayers(opt.defaultMax);
      setMinPlayers(isTeam ? 10 : 50);
      setEntryFeeRub(opt.defaultFee);
      setPrizePoolRub(opt.defaultPrize);
      setWinningPlacesCount(isTeam ? 1 : 3);
      setPrizesByPlace(isTeam ? { 1: opt.defaultPrize } : { 1: 1000, 2: 700, 3: 500 });
      setDescription(opt.defaultDesc);
    }
  };

  const handleIconFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const compressedDataUrl = await compressGameIconFile(file, 140);
      setCustomGameIcon(compressedDataUrl);
    } catch (err: any) {
      setError(err?.message || 'Не удалось обработать иконку');
    }
  };

  const handleSaveCustomGame = async (andCloseModal = false) => {
    const cleanName = customGameName.trim();
    if (!cleanName) {
      setError('Введите название своей игры');
      return;
    }
    if (!customGameIcon.trim()) {
      setError('Загрузите иконку для вашей игры (PNG, JPG, WEBP или SVG)');
      return;
    }

    setIsSavingGame(true);
    setError(null);
    setGameSuccessMsg(null);

    try {
      const slug = cleanName
        .toLowerCase()
        .replace(/[^a-z0-9а-яё]+/gi, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 20);
      const id = `custom_${slug || 'game'}_${Date.now().toString(36).slice(-4)}`;
      const shortName = customGameShort.trim() || cleanName;
      const newGame: CustomGame = {
        id,
        name: cleanName,
        short: shortName,
        accent: customGameColor || '#22d3ee',
        glow: hexToRgbaGlow(customGameColor || '#22d3ee', 0.4),
        iconUrl: customGameIcon.trim(),
        tag: customGameTag.trim() || 'Tournament',
      };

      await addCustomGame(newGame);

      // Сразу выбираем созданную игру для создания турнира
      setSelectedGame(newGame.id);
      setTitle(`${newGame.name} Cup #1`);
      setFormat(`${newGame.tag || 'Solo'}, 1 соревнование`);
      setMaxPlayers(100);
      setMinPlayers(50);
      setEntryFeeRub(100);
      setPrizePoolRub(2200);
      setWinningPlacesCount(3);
      setPrizesByPlace({ 1: 1000, 2: 700, 3: 500 });
      setDescription(
        `Соревнования по дисциплине ${newGame.name}. Оплата организационных услуг 100 ₽. Фиксированное вознаграждение победителям от организатора.`
      );

      // Сбрасываем поля формы новой игры
      setCustomGameName('');
      setCustomGameShort('');
      setCustomGameIcon('');
      setShowCustomGameForm(false);
      setGameSuccessMsg(`Игра «${newGame.name}» успешно добавлена!`);

      if (andCloseModal) {
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Не удалось сохранить свою игру');
    } finally {
      setIsSavingGame(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Введите название матча / турнира');
      return;
    }
    if (!startsAtLocal) {
      setError('Укажите дату и время начала матча');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const startsAtIso = new Date(startsAtLocal).toISOString();
      const newId = `${selectedGame}-${Date.now().toString(36)}`;
      const customGameObj = customGames.find((cg) => cg.id === selectedGame);

      const cleanPrizes: Record<number, number> = {};
      for (let i = 1; i <= winningPlacesCount; i++) {
        cleanPrizes[i] = Number(prizesByPlace[i]) || 0;
      }

      const success = await createTournament({
        id: newId,
        title: title.trim(),
        game: selectedGame,
        maxPlayers: Math.max(2, Number(maxPlayers) || 10),
        minPlayers: Math.max(0, Number(minPlayers) || 0),
        startsAt: startsAtIso,
        status,
        format: format.trim() || 'Регламент соревнований',
        description: description.trim(),
        entryFeeRub: Math.max(0, Number(entryFeeRub) || 0),
        prizePoolRub: Math.max(0, Number(prizePoolRub) || 0),
        winningPlacesCount,
        prizes: cleanPrizes,
        customGame: customGameObj,
      });

      if (!success) {
        throw new Error('Не удалось сохранить соревнование в базу данных Supabase. Проверьте соединение.');
      }

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Ошибка создания турнира. Попробуйте еще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-950 p-6 sm:p-7 shadow-2xl text-left my-8 max-h-[90vh] overflow-y-auto">
        {/* Кнопка закрытия */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition"
        >
          ✕
        </button>

        <h2 className="text-xl font-extrabold text-white">
          {showCustomGameForm ? '🎮 Добавление своей игры с иконкой' : 'Создание нового матча / турнира'}
        </h2>
        <p className="mt-1 text-xs text-zinc-400">
          {showCustomGameForm
            ? 'Загрузите свою иконку и укажите название дисциплины — игра появится на главной странице, в фильтрах и при создании турниров.'
            : 'Заполните параметры матча. Он мгновенно появится в сетке сайта и станет доступен для регистрации.'}
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {gameSuccessMsg && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 font-semibold">
            ✓ {gameSuccessMsg}
          </div>
        )}

        {/* Форма добавления своей игры с загрузкой иконки */}
        {showCustomGameForm && (
          <div className="mt-5 rounded-2xl border border-cyan-500/30 bg-cyan-950/15 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-cyan-300 flex items-center gap-2">
                <span>✨</span>
                <span>Новая игровая дисциплина</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomGameForm(false)}
                className="text-xs text-zinc-400 hover:text-white underline"
              >
                ← Вернуться к матчу
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-300 mb-1">
                  Полное название игры *
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Например: Apex Legends / Standoff 2"
                  value={customGameName}
                  onChange={(e) => setCustomGameName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-300 mb-1">
                  Короткое имя (на значке)
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Например: Apex / Standoff"
                  value={customGameShort}
                  onChange={(e) => setCustomGameShort(e.target.value)}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-300 mb-1">
                  Подпись / Режим (на главной)
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Например: Battle Royale / 5v5"
                  value={customGameTag}
                  onChange={(e) => setCustomGameTag(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-300 mb-1">
                  Фирменный цвет подсветки
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setCustomGameColor(c.hex)}
                      title={c.label}
                      className={`h-7 w-7 rounded-lg border transition ${
                        customGameColor === c.hex
                          ? 'scale-110 border-white ring-2 ring-white/50'
                          : 'border-white/20 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                  <input
                    type="color"
                    value={customGameColor}
                    onChange={(e) => setCustomGameColor(e.target.value)}
                    className="h-7 w-8 rounded cursor-pointer bg-transparent border-0"
                    title="Выбрать свой цвет"
                  />
                </div>
              </div>
            </div>

            {/* Загрузка иконки */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Иконка игры (загрузка файла) *
              </label>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl border border-dashed border-white/20 bg-black/40 p-4">
                {/* Превью иконки */}
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border p-1 overflow-hidden shadow-lg"
                  style={{
                    backgroundColor: `${customGameColor}18`,
                    borderColor: `${customGameColor}50`,
                  }}
                >
                  {customGameIcon ? (
                    <img
                      src={customGameIcon}
                      alt="Preview"
                      className="h-full w-full object-cover rounded-xl"
                    />
                  ) : (
                    <span className="text-2xl">🖼️</span>
                  )}
                </div>

                <div className="flex-1 space-y-2 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleIconFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 text-xs font-extrabold transition shadow-md shadow-cyan-500/20"
                    >
                      📁 Загрузить иконку с устройства
                    </button>
                    {customGameIcon && (
                      <button
                        type="button"
                        onClick={() => setCustomGameIcon('')}
                        className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20 transition"
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Поддерживаются PNG, JPG, WEBP, SVG. Иконка автоматически кадрируется под квадрат и сохраняется для всех пользователей.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowCustomGameForm(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white transition"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={isSavingGame}
                onClick={() => handleSaveCustomGame(true)}
                className="rounded-xl border border-cyan-500/40 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 px-4 py-2 text-xs font-bold transition"
              >
                {isSavingGame ? 'Сохранение...' : 'Сохранить только игру'}
              </button>
              <button
                type="button"
                disabled={isSavingGame}
                onClick={() => handleSaveCustomGame(false)}
                className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black px-5 py-2 text-xs font-extrabold shadow-lg shadow-emerald-500/20 transition"
              >
                {isSavingGame ? 'Сохранение...' : '✓ Сохранить игру и настроить турнир →'}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Выбор дисциплины */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Дисциплина / Игра:
              </label>
              {!showCustomGameForm && (
                <button
                  type="button"
                  onClick={() => setShowCustomGameForm(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-3 py-1 text-xs font-extrabold text-cyan-300 hover:bg-cyan-500 hover:text-black transition"
                >
                  <span>➕</span>
                  <span>Добавить свою игру с иконкой</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allGameOptions.map((g) => (
                <div
                  key={g.id}
                  onClick={() => handleGameChange(g.id)}
                  className={`group relative flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-bold cursor-pointer transition ${
                    selectedGame === g.id
                      ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 ring-1 ring-cyan-500/50'
                      : 'border-white/10 bg-white/5 text-zinc-300 hover:border-white/20'
                  }`}
                >
                  <GameIcon game={g.id} className="w-5 h-5 shrink-0 rounded" />
                  <span className="truncate flex-1">{g.name}</span>
                  {(g as any).isCustom && (
                    <button
                      type="button"
                      title="Удалить свою игру"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Удалить игру «${g.name}»?`)) {
                          deleteCustomGame(g.id);
                          if (selectedGame === g.id) {
                            handleGameChange('cs2');
                          }
                        }
                      }}
                      className="opacity-60 hover:opacity-100 text-red-400 hover:text-red-300 px-1 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Название */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Название матча / турнира
            </label>
            <input
              type="text"
              required
              className="input-field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: CS2 5v5 Night Cup #2"
            />
          </div>

          {/* Дата и время старта */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
                🕒 Дата и время начала матча
              </label>
              <input
                type="datetime-local"
                required
                className="input-field font-mono font-bold text-white bg-black/50 border-amber-500/40 focus:border-amber-400"
                value={startsAtLocal}
                onChange={(e) => setStartsAtLocal(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Статус матча
              </label>
              <select
                className="input-field bg-zinc-900"
                value={status}
                onChange={(e) => setStatus(e.target.value as TournamentStatus)}
              >
                <option value="recruiting">🟢 Набор игроков (recruiting)</option>
                <option value="live">🔴 Идет соревнование (live)</option>
                <option value="soon">⏳ Скоро (soon)</option>
                <option value="finished">🏁 Завершено (finished)</option>
              </select>
            </div>
          </div>

          {/* Формат, лимиты мест и взнос */}
          <div className="grid sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Формат
              </label>
              <input
                type="text"
                required
                className="input-field"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                placeholder="5v5, BO1"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Макс. мест
              </label>
              <input
                type="number"
                required
                min={2}
                max={500}
                className="input-field font-mono"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-red-300 mb-1">
                Мин. мест (старт)
              </label>
              <input
                type="number"
                min={0}
                max={500}
                className="input-field font-mono text-red-300"
                value={minPlayers}
                onChange={(e) => setMinPlayers(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
                Взнос с игрока (₽)
              </label>
              <input
                type="number"
                min={0}
                className="input-field font-mono text-cyan-300"
                value={entryFeeRub}
                onChange={(e) => setEntryFeeRub(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Призовой фонд и количество призовых мест */}
          <div className="rounded-xl border border-amber-500/25 bg-amber-950/10 p-3.5 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300 mb-1">
                  Общий призовой фонд (₽)
                </label>
                <input
                  type="number"
                  min={0}
                  className="input-field font-mono font-bold text-amber-300"
                  value={prizePoolRub}
                  onChange={(e) => setPrizePoolRub(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1">
                  Количество выигрышных мест
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleWinningPlacesCountChange(winningPlacesCount - 1)}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-extrabold text-zinc-300 hover:bg-white/15"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    className="input-field text-center font-mono font-bold"
                    value={winningPlacesCount}
                    onChange={(e) => handleWinningPlacesCountChange(Number(e.target.value))}
                  />
                  <button
                    type="button"
                    onClick={() => handleWinningPlacesCountChange(winningPlacesCount + 1)}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-extrabold text-zinc-300 hover:bg-white/15"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Array.from({ length: winningPlacesCount }, (_, idx) => idx + 1).map((place) => (
                <div key={place} className="rounded-lg border border-white/10 bg-black/40 p-2">
                  <label className="block text-[10px] font-bold text-zinc-300 mb-1">
                    {place === 1 ? '🥇 1 место (₽)' : place === 2 ? '🥈 2 место (₽)' : place === 3 ? '🥉 3 место (₽)' : `🏅 ${place} место (₽)`}
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full rounded-md border border-white/15 bg-black/60 px-2 py-1 text-xs font-mono font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
                    value={prizesByPlace[place] ?? 0}
                    onChange={(e) => handlePlacePrizeChange(place, Number(e.target.value))}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Описание */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Описание и регламент
            </label>
            <textarea
              rows={2}
              className="input-field text-xs resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Кнопки */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-white transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-2.5 text-xs font-extrabold shadow-lg shadow-cyan-500/20 transition"
            >
              {isSubmitting ? 'Создание...' : '✓ Создать соревнование'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
