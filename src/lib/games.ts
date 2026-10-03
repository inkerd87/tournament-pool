import type { CustomGame, GameId } from "./types";

export interface GameConfig {
  name: string;
  short: string;
  accent: string;
  glow: string;
  iconUrl?: string;
  tag?: string;
  isCustom?: boolean;
}

const CUSTOM_GAMES_STORAGE_KEY = "nb_custom_games_v1";

export const BUILTIN_GAMES: Record<string, GameConfig> = {
  cs2: {
    name: "Counter-Strike 2",
    short: "CS2",
    accent: "#f97316",
    glow: "rgba(249, 115, 22, 0.35)",
    tag: "5v5 BO1",
  },
  dota2: {
    name: "Dota 2",
    short: "Dota 2",
    accent: "#ef4444",
    glow: "rgba(239, 68, 68, 0.35)",
    tag: "5v5 MOBA",
  },
  pubg: {
    name: "PUBG: BATTLEGROUNDS",
    short: "PUBG",
    accent: "#facc15",
    glow: "rgba(250, 204, 21, 0.3)",
    tag: "Battle Royale",
  },
  pubg_mobile: {
    name: "PUBG MOBILE",
    short: "PUBG Mobile",
    accent: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.35)",
    tag: "Mobile BR",
  },
  warzone: {
    name: "Call of Duty: Warzone",
    short: "Warzone",
    accent: "#22c55e",
    glow: "rgba(34, 197, 94, 0.35)",
    tag: "Resurgence",
  },
  fortnite: {
    name: "Fortnite",
    short: "Fortnite",
    accent: "#a855f7",
    glow: "rgba(168, 85, 247, 0.35)",
    tag: "Zero Build",
  },
  apex: {
    name: "Apex Legends",
    short: "Apex",
    accent: "#f43f5e",
    glow: "rgba(244, 63, 94, 0.35)",
    tag: "Battle Royale",
  },
  minecraft: {
    name: "Minecraft",
    short: "Minecraft",
    accent: "#10b981",
    glow: "rgba(16, 185, 129, 0.35)",
    tag: "Hunger Games",
  },
};

const gamesTarget: Record<string, GameConfig> = { ...BUILTIN_GAMES };

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

export function getStoredCustomGames(): CustomGame[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_GAMES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.warn("Failed to parse stored custom games:", e);
  }
  return [];
}

export function syncCustomGamesRegistry(customGames: CustomGame[]): void {
  // Remove old custom games from gamesTarget
  for (const key of Object.keys(gamesTarget)) {
    if (!(key in BUILTIN_GAMES)) {
      delete gamesTarget[key];
    }
  }
  // Add current custom games
  for (const cg of customGames) {
    if (!cg || !cg.id) continue;
    gamesTarget[cg.id] = {
      name: cg.name,
      short: cg.short || cg.name,
      accent: cg.accent || "#22d3ee",
      glow: cg.glow || hexToRgbaGlow(cg.accent || "#22d3ee"),
      iconUrl: cg.iconUrl,
      tag: cg.tag || "Tournament",
      isCustom: true,
    };
  }
}

export function saveStoredCustomGames(customGames: CustomGame[]): void {
  syncCustomGamesRegistry(customGames);
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CUSTOM_GAMES_STORAGE_KEY, JSON.stringify(customGames));
  } catch (e) {
    console.warn("Failed to save custom games to localStorage:", e);
  }
}

// Hydrate on startup
syncCustomGamesRegistry(getStoredCustomGames());

export const GAMES: Record<GameId, GameConfig> = new Proxy(gamesTarget, {
  get(target, prop: string) {
    if (prop in target) {
      return target[prop];
    }
    return {
      name: String(prop),
      short: String(prop),
      accent: "#22d3ee",
      glow: "rgba(34, 211, 238, 0.35)",
      tag: "Tournament",
      isCustom: true,
    };
  },
});

/**
 * Сжимает и кадрирует загруженную иконку игры (PNG/JPG/WEBP/SVG) в компактный Data URL (до 140x140)
 */
export function compressGameIconFile(file: File, maxSize = 140): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Не удалось прочитать файл изображения"));
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      if (file.type === "image/svg+xml" && dataUrl.length < 25000) {
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
        // Export as compact webp (or png fallback)
        let compressed = canvas.toDataURL("image/webp", 0.85);
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
