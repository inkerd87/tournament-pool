import React from 'react';
import { GameId } from '@/lib/types';

export const CS2Icon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    {/* Stylized CS2 Crosshair / Target Shield */}
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2" />
    <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="1.5" />
    <path d="M12 1v4M12 19v4M1 12h4M19 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const DotaIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    {/* Authentic Dota 2 Ancient & River Logo */}
    <rect x="2" y="2" width="20" height="20" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
    <path d="M4 18.5L7.5 15L15 7.5L18.5 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M4 8.5L8.5 4H4V8.5Z" />
    <path d="M20 15.5L15.5 20H20V15.5Z" />
  </svg>
);

export const PUBGIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    {/* Stylized PUBG Helmet / Crate */}
    <path d="M12 2C7.5 2 3.8 5.4 3.5 10L3 16C3 18.2 4.8 20 7 20H17C19.2 20 21 18.2 21 16L20.5 10C20.2 5.4 16.5 2 12 2Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <rect x="6" y="10" width="12" height="4" rx="1" fill="currentColor" opacity="0.8" />
    <circle cx="12" cy="7" r="1.5" />
  </svg>
);

export const ValorantIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    {/* Authentic Valorant V Slashes */}
    <path d="M14.5 4L22 19H17.5L12.5 9L14.5 4Z" />
    <path d="M9.5 4L2 19H6.5L11.5 9L9.5 4Z" opacity="0.7" />
  </svg>
);

export const GameIcon: React.FC<{ game: GameId; className?: string }> = ({ game, className }) => {
  switch (game) {
    case 'cs2':
      return <CS2Icon className={className} />;
    case 'dota2':
      return <DotaIcon className={className} />;
    case 'pubg':
      return <PUBGIcon className={className} />;
    case 'valorant':
      return <ValorantIcon className={className} />;
  }
};
