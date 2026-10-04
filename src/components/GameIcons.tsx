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
    src="/games/pubg-v2.png"
    alt="PUBG"
    className={`${className} object-cover rounded`}
    loading="lazy"
  />
);

export const PUBGMobileIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <img
    src="/games/pubg-mobile.webp"
    alt="PUBG MOBILE"
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

export const ApexIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <div className={`${className} flex items-center justify-center rounded bg-[#f43f5e]/15 border border-[#f43f5e]/30 p-0.5`}>
    <svg viewBox="0 0 24 24" className="w-full h-full fill-[#f43f5e]" aria-label="Apex Legends">
      <path d="M12 2L2 19.5h4.8L12 9.2l5.2 10.3H22L12 2zm0 10.5L9.6 17h4.8L12 12.5z" />
    </svg>
  </div>
);

export const MinecraftIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <div className={`${className} flex items-center justify-center rounded bg-[#10b981]/15 border border-[#10b981]/30 p-0.5`}>
    <svg viewBox="0 0 24 24" className="w-full h-full fill-[#10b981]" aria-label="Minecraft">
      <path d="M4 4h16v16H4V4zm3 3v4h2V7H7zm8 0v4h2V7h-2zm-5 6v4h4v-4h-4z" />
    </svg>
  </div>
);

import { GAMES } from '@/lib/games';

export const GameIcon: React.FC<{ game: GameId; className?: string; customIconUrl?: string }> = ({
  game,
  className = "w-5 h-5",
  customIconUrl,
}) => {
  const [loadFailed, setLoadFailed] = React.useState(false);
  const iconUrl = customIconUrl || GAMES[game]?.iconUrl;

  React.useEffect(() => {
    setLoadFailed(false);
  }, [iconUrl, game]);

  if (iconUrl && !loadFailed) {
    return (
      <img
        src={iconUrl}
        alt={GAMES[game]?.name || String(game)}
        className={`${className} object-cover rounded`}
        loading="lazy"
        onError={() => setLoadFailed(true)}
      />
    );
  }

  switch (game) {
    case 'cs2':
      return <CS2Icon className={className} />;
    case 'dota2':
      return <DotaIcon className={className} />;
    case 'pubg':
      return <PUBGIcon className={className} />;
    case 'pubg_mobile':
      return <PUBGMobileIcon className={className} />;
    case 'warzone':
      return <WarzoneIcon className={className} />;
    case 'fortnite':
      return <FortniteIcon className={className} />;
    case 'apex':
      return <ApexIcon className={className} />;
    case 'minecraft':
      return <MinecraftIcon className={className} />;
    default:
      return (
        <span
          className={`${className} inline-flex items-center justify-center rounded bg-cyan-500/20 text-cyan-300 font-bold text-xs`}
        >
          🎮
        </span>
      );
  }
};
