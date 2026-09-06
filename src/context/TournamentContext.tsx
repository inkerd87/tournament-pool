import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Tournament, Registration, TournamentMatchAccess } from '@/lib/types';
import {
  getStoredTournaments,
  saveTournaments,
  getStoredRegistrations,
  saveRegistrations,
  getStoredMatches,
  saveMatches,
} from '@/lib/storage';
import { supabase } from '@/lib/supabase';

interface TournamentContextType {
  tournaments: Tournament[];
  registrations: Registration[];
  matches: Record<string, TournamentMatchAccess>;
  registerForTournament: (tournamentId: string, nickname: string, gameAccount: string, email: string, phone?: string) => Promise<boolean> | boolean;
  updateMatch: (tournamentId: string, roomId: string, password: string, joinUrl?: string) => Promise<void> | void;
  getUserRegistrations: (email: string) => Registration[];
  isUserRegistered: (tournamentId: string, email: string) => boolean;
  refreshData: () => Promise<void>;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>(() => getStoredTournaments());
  const [registrations, setRegistrations] = useState<Registration[]>(() => getStoredRegistrations());
  const [matches, setMatches] = useState<Record<string, TournamentMatchAccess>>(() => getStoredMatches());

  // Save to local storage as fallback cache
  useEffect(() => {
    saveTournaments(tournaments);
  }, [tournaments]);

  useEffect(() => {
    saveRegistrations(registrations);
  }, [registrations]);

  useEffect(() => {
    saveMatches(matches);
  }, [matches]);

  // Fetch from Supabase PostgreSQL
  const refreshData = useCallback(async () => {
    try {
      // 1. Fetch registrations first so we can accurately count registered players
      const { data: dbRegs, error: rErr } = await supabase
        .from('registrations')
        .select('*');

      let currentRegs: Registration[] = [];
      if (!rErr && dbRegs) {
        currentRegs = dbRegs.map(r => ({
          id: r.id,
          tournamentId: r.tournament_id,
          nickname: r.nickname,
          gameAccount: r.game_account,
          email: r.email,
          paidAt: r.paid_at,
        }));
        setRegistrations(currentRegs);
      }

      // 2. Fetch tournaments
      const { data: dbTournaments, error: tErr } = await supabase
        .from('tournaments')
        .select('*')
        .order('starts_at', { ascending: true });

      if (!tErr && dbTournaments && dbTournaments.length > 0) {
        const mapped: Tournament[] = dbTournaments
          .filter(t => t.game !== ('valorant' as any) && t.id !== 'valorant-skirmish-001')
          .map(t => ({
            id: t.id,
            title: t.title,
            game: t.game,
            maxPlayers: t.max_players,
            registeredCount: currentRegs.filter(r => r.tournamentId === t.id).length || t.registered_count || 0,
            startsAt: t.starts_at,
            status: t.status,
            format: t.format,
            description: t.description,
          }));

        const defaultExtra: Tournament[] = [
          {
            id: "warzone-solo-001",
            title: "Warzone Resurgence Showdown",
            game: "warzone",
            maxPlayers: 100,
            registeredCount: currentRegs.filter(r => r.tournamentId === "warzone-solo-001").length,
            startsAt: "2026-09-08T18:00:00+03:00",
            status: "recruiting",
            format: "Solo Resurgence, 1 катка",
            description: "Быстрая королевская битва в Warzone: 1 катка на выживание — топ-3 получают призовые выплаты сразу.",
          },
          {
            id: "fortnite-solo-001",
            title: "Fortnite Zero Build Cup",
            game: "fortnite",
            maxPlayers: 100,
            registeredCount: currentRegs.filter(r => r.tournamentId === "fortnite-solo-001").length,
            startsAt: "2026-09-09T18:00:00+03:00",
            status: "recruiting",
            format: "Solo Zero Build, 1 катка",
            description: "Одиночная битва без построек (Zero Build): 1 катка — топ-3 выживших сразу получают призовые выплаты.",
          },
        ];

        defaultExtra.forEach(extra => {
          if (!mapped.some(t => t.id === extra.id)) {
            mapped.push(extra);
          }
        });

        setTournaments(mapped);
      }

      // 3. Fetch matches
      const { data: dbMatches, error: mErr } = await supabase
        .from('matches')
        .select('*');

      if (!mErr && dbMatches) {
        const matchMap: Record<string, TournamentMatchAccess> = {};
        dbMatches.forEach(m => {
          matchMap[m.tournament_id] = {
            tournamentId: m.tournament_id,
            roomId: m.room_id,
            password: m.password,
            joinUrl: m.join_url,
            updatedAt: m.updated_at,
          };
        });
        setMatches(matchMap);
      }
    } catch (e) {
      console.warn('Supabase fetch notice (using cache):', e);
    }
  }, []);

  // Initial fetch and real-time subscription
  useEffect(() => {
    refreshData();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments' }, () => {
        refreshData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () => {
        refreshData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        refreshData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshData]);

  const registerForTournament = async (
    tournamentId: string,
    nickname: string,
    gameAccount: string,
    email: string,
    phone?: string
  ) => {
    if (registrations.some(r => r.tournamentId === tournamentId && r.email.toLowerCase() === email.toLowerCase())) {
      return false;
    }

    const newReg: Registration = {
      id: 'reg_' + Math.random().toString(36).substring(2, 9),
      tournamentId,
      nickname,
      gameAccount,
      email,
      phone,
      paidAt: new Date().toISOString(),
    };

    // Optimistic UI update
    setRegistrations(prev => [...prev, newReg]);

    const targetTournament = tournaments.find(t => t.id === tournamentId);
    const newCount = (targetTournament ? targetTournament.registeredCount : 0) + 1;
    const newStatus = targetTournament && newCount >= targetTournament.maxPlayers ? 'full' : (targetTournament?.status || 'recruiting');

    setTournaments(prev =>
      prev.map(t => {
        if (t.id === tournamentId) {
          return {
            ...t,
            registeredCount: newCount,
            status: newStatus as any,
          };
        }
        return t;
      })
    );

    // Save to PostgreSQL via Supabase
    try {
      const regPayload: Record<string, any> = {
        id: newReg.id,
        tournament_id: tournamentId,
        nickname,
        game_account: gameAccount,
        email,
        paid_at: newReg.paidAt,
      };
      if (phone) regPayload.phone = phone;

      await supabase.from('registrations').insert(regPayload);

      await supabase
        .from('tournaments')
        .update({
          registered_count: newCount,
          status: newStatus,
        })
        .eq('id', tournamentId);
    } catch (e) {
      console.warn('Could not sync registration to Supabase, saved locally:', e);
    }

    return true;
  };

  const updateMatch = async (tournamentId: string, roomId: string, password: string, joinUrl?: string) => {
    const matchObj: TournamentMatchAccess = {
      tournamentId,
      roomId,
      password,
      joinUrl,
      updatedAt: new Date().toISOString(),
    };

    setMatches(prev => ({
      ...prev,
      [tournamentId]: matchObj,
    }));

    try {
      await supabase.from('matches').upsert({
        tournament_id: tournamentId,
        room_id: roomId,
        password: password,
        join_url: joinUrl,
        updated_at: matchObj.updatedAt,
      });
    } catch (e) {
      console.warn('Could not sync match to Supabase:', e);
    }
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
        refreshData,
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
