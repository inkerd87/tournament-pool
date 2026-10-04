import type { CustomGame, GameId } from "./types";

export interface GameConfig {
  id?: string;
  name: string;
  short: string;
  accent: string;
  glow: string;
  iconUrl?: string;
  wallpaperUrl?: string;
  tag?: string;
  isCustom?: boolean;
}

export interface GameOverride {
  id: string;
  name?: string;
  short?: string;
  accent?: string;
  glow?: string;
  iconUrl?: string;
  wallpaperUrl?: string;
  tag?: string;
}

export interface FullGameInfo extends GameConfig {
  id: string;
  defaultName: string;
  defaultShort: string;
  defaultAccent: string;
  defaultTag?: string;
  defaultIconUrl?: string;
  defaultWallpaperUrl?: string;
  hasCustomIcon: boolean;
  hasCustomWallpaper: boolean;
  isModified: boolean;
}

const CUSTOM_GAMES_STORAGE_KEY = "nb_custom_games_v1";
const GAME_OVERRIDES_STORAGE_KEY = "nb_game_overrides_v1";

export const DEFAULT_GAME_WALLPAPERS: Record<string, string> = {
  cs2: '/games/wallpapers/cs2.jpg',
  dota2: '/games/wallpapers/dota2.jpg',
  pubg: '/games/wallpapers/pubg.jpg',
  pubg_mobile: '/games/wallpapers/pubg_mobile.jpg',
  apex: '/games/wallpapers/apex.jpg',
  minecraft: '/games/wallpapers/minecraft.jpg',
  warzone: '/games/wallpapers/warzone.jpg',
  fortnite: '/games/wallpapers/fortnite.jpg',
};

export const DEFAULT_GAME_ICONS: Record<string, string> = {
  cs2: '/games/cs2.webp',
  dota2: '/games/dota2.svg',
  pubg: '/games/pubg-v2.png',
  pubg_mobile: '/games/pubg-mobile.webp',
  warzone: '/games/warzone.jpg',
  fortnite: '/games/fortnite.webp',
  apex: '', // Default SVG
  minecraft: '', // Default SVG
};

export const BUILTIN_GAMES: Record<string, GameConfig> = {
  cs2: {
    id: "cs2",
    name: "Counter-Strike 2",
    short: "CS2",
    accent: "#f97316",
    glow: "rgba(249, 115, 22, 0.35)",
    tag: "5v5 BO1",
    wallpaperUrl: DEFAULT_GAME_WALLPAPERS.cs2,
    iconUrl: DEFAULT_GAME_ICONS.cs2,
  },
  dota2: {
    id: "dota2",
    name: "Dota 2",
    short: "Dota 2",
    accent: "#ef4444",
    glow: "rgba(239, 68, 68, 0.35)",
    tag: "5v5 MOBA",
    wallpaperUrl: DEFAULT_GAME_WALLPAPERS.dota2,
    iconUrl: DEFAULT_GAME_ICONS.dota2,
  },
  pubg: {
    id: "pubg",
    name: "PUBG: BATTLEGROUNDS",
    short: "PUBG",
    accent: "#facc15",
    glow: "rgba(250, 204, 21, 0.3)",
    tag: "Battle Royale",
    wallpaperUrl: DEFAULT_GAME_WALLPAPERS.pubg,
    iconUrl: DEFAULT_GAME_ICONS.pubg,
  },
  pubg_mobile: {
    id: "pubg_mobile",
    name: "PUBG MOBILE",
    short: "PUBG Mobile",
    accent: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.35)",
    tag: "Mobile BR",
    wallpaperUrl: DEFAULT_GAME_WALLPAPERS.pubg_mobile,
    iconUrl: DEFAULT_GAME_ICONS.pubg_mobile,
  },
  warzone: {
    id: "warzone",
    name: "Call of Duty: Warzone",
    short: "Warzone",
    accent: "#22c55e",
    glow: "rgba(34, 197, 94, 0.35)",
    tag: "Resurgence",
    wallpaperUrl: DEFAULT_GAME_WALLPAPERS.warzone,
    iconUrl: DEFAULT_GAME_ICONS.warzone,
  },
  fortnite: {
    id: "fortnite",
    name: "Fortnite",
    short: "Fortnite",
    accent: "#a855f7",
    glow: "rgba(168, 85, 247, 0.35)",
    tag: "Zero Build",
    wallpaperUrl: DEFAULT_GAME_WALLPAPERS.fortnite,
    iconUrl: DEFAULT_GAME_ICONS.fortnite,
  },
  apex: {
    id: "apex",
    name: "Apex Legends",
    short: "Apex",
    accent: "#f43f5e",
    glow: "rgba(244, 63, 94, 0.35)",
    tag: "Battle Royale",
    wallpaperUrl: DEFAULT_GAME_WALLPAPERS.apex,
  },
  minecraft: {
    id: "minecraft",
    name: "Minecraft",
    short: "Minecraft",
    accent: "#10b981",
    glow: "rgba(168, 85, 247, 0.35)",
    tag: "Hunger Games",
    wallpaperUrl: DEFAULT_GAME_WALLPAPERS.minecraft,
  },
};

// Target dictionary used by proxy
const gamesTarget: Record<string, GameConfig> = {};
export const GAME_WALLPAPERS: Record<string, string> = { ...DEFAULT_GAME_WALLPAPERS };

export function hexToRgbaGlow(hex: string, alpha = 0.35): string {
  const clean = hex.replace("#", "").trim();
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16) || 34;
    const g = parseInt(clean.slice(2, 4), 16) || 211;
    const b = parseInt(clean.slice(4, 6), 16) || 238;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgba(34, 211, 238, ${alpha})`;
}

/**
 * Чтение переопределений параметров игр (иконки, названия, обои)
 */
export function getStoredGameOverrides(): Record<string, GameOverride> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(GAME_OVERRIDES_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, GameOverride>;
  } catch (e) {
    console.warn("Failed to parse stored game overrides:", e);
    return {};
  }
}

/**
 * Сохранение переопределений параметров игр
 */
export function saveStoredGameOverrides(overrides: Record<string, GameOverride>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GAME_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
  } catch (e) {
    console.warn("Failed to save game overrides to storage:", e);
  }
  syncAllGamesRegistry();
  window.dispatchEvent(new CustomEvent("nb_games_updated"));
}

/**
 * Получение сохранённых кастомных игр из LocalStorage
 */
export function getStoredCustomGames(): CustomGame[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_GAMES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const builtinKeys = new Set(Object.keys(BUILTIN_GAMES));
      const filtered = parsed.filter((cg: CustomGame) => {
        if (!cg || !cg.id) return false;
        const normId = cg.id.toLowerCase().trim();
        const normName = (cg.name || '').toLowerCase().trim();
        if (builtinKeys.has(normId)) return false;
        if (normId.startsWith('custom_apex') || normId.startsWith('custom_mine')) return false;
        if (normName === 'minecraft' || normName.includes('apex legends')) return false;
        return true;
      });
      if (filtered.length !== parsed.length) {
        localStorage.setItem(CUSTOM_GAMES_STORAGE_KEY, JSON.stringify(filtered));
      }
      return filtered;
    }
  } catch (e) {
    console.warn("Failed to parse stored custom games:", e);
  }
  return [];
}

/**
 * Сохранение списка кастомных игр
 */
export function saveStoredCustomGames(customGames: CustomGame[]): void {
  const builtinKeys = new Set(Object.keys(BUILTIN_GAMES));
  const filtered = customGames.filter((cg) => {
    if (!cg || !cg.id) return false;
    const normId = cg.id.toLowerCase().trim();
    const normName = (cg.name || '').toLowerCase().trim();
    if (builtinKeys.has(normId)) return false;
    if (normId.startsWith('custom_apex') || normId.startsWith('custom_mine')) return false;
    if (normName === 'minecraft' || normName.includes('apex legends')) return false;
    return true;
  });

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CUSTOM_GAMES_STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn("Failed to save custom games to localStorage:", e);
    }
  }

  syncAllGamesRegistry(filtered);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("nb_custom_games_updated", { detail: filtered }));
    window.dispatchEvent(new CustomEvent("nb_games_updated"));
  }
}

/**
 * Синхронизирует целевой реестр игр gamesTarget и обоев GAME_WALLPAPERS
 * объединяя BUILTIN_GAMES, GAME_OVERRIDES и customGames
 */
export function syncAllGamesRegistry(
  explicitCustomGames?: CustomGame[],
  explicitOverrides?: Record<string, GameOverride>
): void {
  const customGames = explicitCustomGames ?? getStoredCustomGames();
  const overrides = explicitOverrides ?? getStoredGameOverrides();

  // Очищаем текущий target
  for (const k of Object.keys(gamesTarget)) {
    delete gamesTarget[k];
  }

  // 1. Инициализируем стандартными играми с учётом переопределений
  for (const [id, base] of Object.entries(BUILTIN_GAMES)) {
    const ov = overrides[id];
    const accent = ov?.accent || base.accent;
    const glow = ov?.glow || (ov?.accent ? hexToRgbaGlow(ov.accent) : base.glow);
    const wallpaperUrl = ov?.wallpaperUrl || base.wallpaperUrl || DEFAULT_GAME_WALLPAPERS[id];
    const iconUrl = ov?.iconUrl !== undefined ? ov.iconUrl : base.iconUrl;

    gamesTarget[id] = {
      ...base,
      name: ov?.name || base.name,
      short: ov?.short || base.short,
      tag: ov?.tag || base.tag,
      accent,
      glow,
      iconUrl,
      wallpaperUrl,
      isCustom: false,
    };

    if (wallpaperUrl) {
      GAME_WALLPAPERS[id] = wallpaperUrl;
    }
  }

  // 2. Добавляем кастомные игры
  for (const cg of customGames) {
    if (!cg || !cg.id) continue;
    const id = cg.id;
    const ov = overrides[id];
    const accent = ov?.accent || cg.accent || "#22d3ee";
    const glow = ov?.glow || (ov?.accent ? hexToRgbaGlow(ov.accent) : cg.glow || hexToRgbaGlow(accent));
    const iconUrl = ov?.iconUrl !== undefined ? ov.iconUrl : cg.iconUrl;
    const wallpaperUrl = ov?.wallpaperUrl || cg.wallpaperUrl || iconUrl;

    gamesTarget[id] = {
      name: ov?.name || cg.name,
      short: ov?.short || cg.short || cg.name,
      accent,
      glow,
      iconUrl,
      wallpaperUrl,
      tag: ov?.tag || cg.tag || "Tournament",
      isCustom: true,
    };

    if (wallpaperUrl) {
      GAME_WALLPAPERS[id] = wallpaperUrl;
    }
  }
}

// Первоначальная гидратация при загрузке модуля
syncAllGamesRegistry();

/**
 * Прокси доступа к играм: гарантирует возврат корректного GameConfig
 */
export const GAMES: Record<GameId, GameConfig> = new Proxy(gamesTarget, {
  get(target, prop: string) {
    if (prop in target) {
      return target[prop];
    }
    const cleanProp = String(prop);
    const builtin = BUILTIN_GAMES[cleanProp];
    if (builtin) return builtin;

    return {
      name: cleanProp.toUpperCase(),
      short: cleanProp.toUpperCase(),
      accent: "#22d3ee",
      glow: "rgba(34, 211, 238, 0.35)",
      tag: "Tournament",
      isCustom: true,
    };
  },
});

/**
 * Получение полного списка всех игр для отображения в админке со статусом кастомизации
 */
export function getAllGamesList(): FullGameInfo[] {
  syncAllGamesRegistry();
  const overrides = getStoredGameOverrides();
  const customGames = getStoredCustomGames();
  const result: FullGameInfo[] = [];

  // 1. Стандартные игры
  for (const [id, base] of Object.entries(BUILTIN_GAMES)) {
    const active = gamesTarget[id] || base;
    const ov = overrides[id];
    const isModified = Boolean(
      ov && (ov.name || ov.short || ov.tag || ov.accent || ov.iconUrl || ov.wallpaperUrl)
    );

    result.push({
      id,
      name: active.name,
      short: active.short,
      accent: active.accent,
      glow: active.glow,
      iconUrl: active.iconUrl,
      wallpaperUrl: active.wallpaperUrl,
      tag: active.tag,
      isCustom: false,
      defaultName: base.name,
      defaultShort: base.short,
      defaultAccent: base.accent,
      defaultTag: base.tag,
      defaultIconUrl: DEFAULT_GAME_ICONS[id] || undefined,
      defaultWallpaperUrl: DEFAULT_GAME_WALLPAPERS[id] || undefined,
      hasCustomIcon: Boolean(ov?.iconUrl),
      hasCustomWallpaper: Boolean(ov?.wallpaperUrl && ov.wallpaperUrl !== DEFAULT_GAME_WALLPAPERS[id]),
      isModified,
    });
  }

  // 2. Созданные кастомные игры
  for (const cg of customGames) {
    const id = cg.id;
    const active = gamesTarget[id] || {
      name: cg.name,
      short: cg.short || cg.name,
      accent: cg.accent || "#22d3ee",
      glow: cg.glow || hexToRgbaGlow(cg.accent || "#22d3ee"),
      iconUrl: cg.iconUrl,
      wallpaperUrl: cg.wallpaperUrl || cg.iconUrl,
      tag: cg.tag || "Tournament",
    };
    const ov = overrides[id];

    result.push({
      id,
      name: active.name,
      short: active.short,
      accent: active.accent,
      glow: active.glow,
      iconUrl: active.iconUrl,
      wallpaperUrl: active.wallpaperUrl,
      tag: active.tag,
      isCustom: true,
      defaultName: cg.name,
      defaultShort: cg.short || cg.name,
      defaultAccent: cg.accent || "#22d3ee",
      defaultTag: cg.tag || "Tournament",
      defaultIconUrl: cg.iconUrl,
      defaultWallpaperUrl: cg.wallpaperUrl || cg.iconUrl,
      hasCustomIcon: Boolean(active.iconUrl),
      hasCustomWallpaper: Boolean(active.wallpaperUrl),
      isModified: Boolean(ov),
    });
  }

  return result;
}

/**
 * Обновление параметров ЛЮБОЙ игры (встроенной или кастомной):
 * иконка, название, короткое имя, цвет, тег, фоновый баннер
 */
export function updateGameConfig(
  gameId: string,
  updates: {
    name?: string;
    short?: string;
    accent?: string;
    tag?: string;
    iconUrl?: string;
    wallpaperUrl?: string;
  }
): void {
  const cleanId = gameId.trim().toLowerCase();
  const overrides = getStoredGameOverrides();
  const currentOv = overrides[cleanId] || { id: cleanId };

  const newOv: GameOverride = {
    ...currentOv,
    id: cleanId,
  };

  if (updates.name !== undefined) newOv.name = updates.name.trim();
  if (updates.short !== undefined) newOv.short = updates.short.trim();
  if (updates.tag !== undefined) newOv.tag = updates.tag.trim();
  if (updates.accent !== undefined) {
    newOv.accent = updates.accent.trim();
    newOv.glow = hexToRgbaGlow(updates.accent.trim());
  }
  if (updates.iconUrl !== undefined) newOv.iconUrl = updates.iconUrl.trim();
  if (updates.wallpaperUrl !== undefined) newOv.wallpaperUrl = updates.wallpaperUrl.trim();

  overrides[cleanId] = newOv;
  saveStoredGameOverrides(overrides);

  // Если это кастомная игра, также синхронизируем в customGames
  const customGames = getStoredCustomGames();
  const cgIndex = customGames.findIndex((g) => g.id === cleanId);
  if (cgIndex !== -1) {
    customGames[cgIndex] = {
      ...customGames[cgIndex],
      name: newOv.name || customGames[cgIndex].name,
      short: newOv.short || customGames[cgIndex].short,
      accent: newOv.accent || customGames[cgIndex].accent,
      glow: newOv.glow || customGames[cgIndex].glow,
      tag: newOv.tag !== undefined ? newOv.tag : customGames[cgIndex].tag,
      iconUrl: newOv.iconUrl || customGames[cgIndex].iconUrl,
      wallpaperUrl: newOv.wallpaperUrl || customGames[cgIndex].wallpaperUrl,
    };
    saveStoredCustomGames(customGames);
  }
}

/**
 * Сброс параметров встроенной игры к заводским значениям
 */
export function resetGameConfig(gameId: string): void {
  const cleanId = gameId.trim().toLowerCase();
  const overrides = getStoredGameOverrides();
  if (cleanId in overrides) {
    delete overrides[cleanId];
    saveStoredGameOverrides(overrides);
  }
}

/**
 * Сжимает и кадрирует загруженную иконку игры (PNG/JPG/WEBP/SVG) в компактный Data URL (160x160)
 */
export function compressGameIconFile(file: File, maxSize = 160): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Не удалось прочитать файл иконки"));
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      if (file.type === "image/svg+xml" && dataUrl.length < 35000) {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.onerror = () => reject(new Error("Некорректный формат изображения"));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        // Center-crop square
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.clearRect(0, 0, maxSize, maxSize);
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, maxSize, maxSize);
        let compressed = canvas.toDataURL("image/webp", 0.88);
        if (!compressed.startsWith("data:image/webp")) {
          compressed = canvas.toDataURL("image/png");
        }
        resolve(compressed);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Сжимает загруженный баннер / фоновые обои игры (до ширины 1280px при соотношении 16:9)
 */
export function compressGameWallpaperFile(file: File, maxWidth = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Не удалось прочитать файл обоев"));
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const img = new Image();
      img.onerror = () => reject(new Error("Некорректный формат изображения"));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        let compressed = canvas.toDataURL("image/webp", 0.82);
        if (!compressed.startsWith("data:image/webp")) {
          compressed = canvas.toDataURL("image/jpeg", 0.85);
        }
        resolve(compressed);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
