import React from 'react';
import { GameId } from '@/lib/types';

export const CS2Icon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <img
    src="/games/cs2.webp"
    alt="Counter-Strike 2"
    className={`${className} object-cover rounded`}
    loading="lazy"
  />
);

export const DotaIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <img
    src="/games/dota2.svg"
    alt="Dota 2"
    className={`${className} object-contain rounded`}
    loading="lazy"
  />
);

export const PUBGIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <img
    src="/games/pubg.png"
    alt="PUBG Mobile"
    className={`${className} object-cover rounded`}
    loading="lazy"
  />
);

export const WarzoneIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <img
    src="/games/warzone.jpg"
    alt="Call of Duty: Warzone"
    className={`${className} object-cover rounded`}
    loading="lazy"
  />
);

export const FortniteIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <img
    src="/games/fortnite.webp"
    alt="Fortnite"
    className={`${className} object-cover rounded`}
    loading="lazy"
  />
);

export const GameIcon: React.FC<{ game: GameId; className?: string }> = ({ game, className = "w-5 h-5" }) => {
  switch (game) {
    case 'cs2':
      return <CS2Icon className={className} />;
    case 'dota2':
      return <DotaIcon className={className} />;
    case 'pubg':
      return <PUBGIcon className={className} />;
    case 'warzone':
      return <WarzoneIcon className={className} />;
    case 'fortnite':
      return <FortniteIcon className={className} />;
  }
};
