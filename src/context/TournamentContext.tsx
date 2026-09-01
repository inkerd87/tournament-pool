import React, { createContext, useContext, useState, useEffect } from 'react';
import { Tournament, Registration, TournamentMatchAccess } from '@/lib/types';
import {
  getStoredTournaments,
  saveTournaments,
  getStoredRegistrations,
  saveRegistrations,
  getStoredMatches,
  saveMatches,
} from '@/lib/storage';

interface TournamentContextType {
  tournaments: Tournament[];
  registrations: Registration[];
  matches: Record<string, TournamentMatchAccess>;
  registerForTournament: (tournamentId: string, nickname: string, gameAccount: string, email: string) => boolean;
  updateMatch: (tournamentId: string, roomId: string, password: string, joinUrl?: string) => void;
  getUserRegistrations: (email: string) => Registration[];
  isUserRegistered: (tournamentId: string, email: string) => boolean;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>(() => getStoredTournaments());
  const [registrations, setRegistrations] = useState<Registration[]>(() => getStoredRegistrations());
  const [matches, setMatches] = useState<Record<string, TournamentMatchAccess>>(() => getStoredMatches());

  useEffect(() => {
    saveTournaments(tournaments);
  }, [tournaments]);

  useEffect(() => {
    saveRegistrations(registrations);
  }, [registrations]);

  useEffect(() => {
    saveMatches(matches);
  }, [matches]);

  const registerForTournament = (tournamentId: string, nickname: string, gameAccount: string, email: string) => {
    if (registrations.some(r => r.tournamentId === tournamentId && r.email.toLowerCase() === email.toLowerCase())) {
      return false;
    }

    const newReg: Registration = {
      id: 'reg_' + Math.random().toString(36).substring(2, 9),
      tournamentId,
      nickname,
      gameAccount,
      email,
      paidAt: new Date().toISOString(),
    };

    setRegistrations(prev => [...prev, newReg]);

    setTournaments(prev =>
      prev.map(t => {
        if (t.id === tournamentId) {
          const updatedCount = t.registeredCount + 1;
          return {
            ...t,
            registeredCount: updatedCount,
            status: updatedCount >= t.maxPlayers ? 'full' : t.status,
          };
        }
        return t;
      })
    );

    return true;
  };

  const updateMatch = (tournamentId: string, roomId: string, password: string, joinUrl?: string) => {
    setMatches(prev => ({
      ...prev,
      [tournamentId]: {
        tournamentId,
        roomId,
        password,
        joinUrl,
        updatedAt: new Date().toISOString(),
      }
    }));
  };

  const getUserRegistrations = (email: string) => {
    return registrations.filter(r => r.email.toLowerCase() === email.toLowerCase());
  };

  const isUserRegistered = (tournamentId: string, email: string) => {
    return registrations.some(r => r.tournamentId === tournamentId && r.email.toLowerCase() === email.toLowerCase());
  };

  return (
    <TournamentContext.Provider
      value={{
        tournaments,
        registrations,
        matches,
        registerForTournament,
        updateMatch,
        getUserRegistrations,
        isUserRegistered,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournaments = () => {
  const context = useContext(TournamentContext);
  if (!context) throw new Error('useTournaments must be used within a TournamentProvider');
  return context;
};
