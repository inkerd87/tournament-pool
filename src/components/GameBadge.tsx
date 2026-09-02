import React from 'react';
import { GameId } from '@/lib/types';
import { GAMES } from '@/lib/games';
import { GameIcon } from '@/components/GameIcons';

export const GameBadge: React.FC<{ game: GameId }> = ({ game }) => {
  const info = GAMES[game];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider"
      style={{
        backgroundColor: `${info.accent}18`,
        color: info.accent,
        border: `1px solid ${info.accent}40`,
      }}
    >
      <GameIcon game={game} className="w-3.5 h-3.5 shrink-0" />
      {info.short}
    </span>
  );
};
