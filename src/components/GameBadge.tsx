import React from 'react';
import { GameId } from '@/lib/types';
import { GAMES } from '@/lib/games';

export const GameBadge: React.FC<{ game: GameId }> = ({ game }) => {
  const info = GAMES[game];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wider"
      style={{
        backgroundColor: `${info.accent}18`,
        color: info.accent,
        border: `1px solid ${info.accent}40`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: info.accent }}
      />
      {info.short}
    </span>
  );
};
