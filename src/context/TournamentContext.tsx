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
      const createTimeout = (ms = 2500) =>
        new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase fetch timeout')), ms));

      // 1. Fetch registrations with 2.5s timeout
      let currentRegs: Registration[] = [];
      try {
        const regsPromise = supabase.from('registrations').select('*');
        const { data: dbRegs, error: rErr } = (await Promise.race([regsPromise, createTimeout()])) as any;
        if (!rErr && dbRegs) {
          currentRegs = dbRegs.map((r: any) => ({
            id: r.id,
            tournamentId: r.tournament_id,
            nickname: r.nickname,
            gameAccount: r.game_account,
            email: r.email,
            paidAt: r.paid_at,
          }));
          setRegistrations(currentRegs);
        }
      } catch (e) {
        console.warn('Registrations fetch notice (using cache):', e);
      }

      // 2. Fetch tournaments with 2.5s timeout
      try {
        const tourneysPromise = supabase.from('tournaments').select('*').order('starts_at', { ascending: true });
        const { data: dbTournaments, error: tErr } = (await Promise.race([tourneysPromise, createTimeout()])) as any;

        if (!tErr && dbTournaments && dbTournaments.length > 0) {
          const mapped: Tournament[] = dbTournaments
            .filter(t => t.game !== ('valorant' as any) && t.id !== 'valorant-skirmish-001')
            .map(t => {
              const isCsOrDota = t.game === 'cs2' || t.game === 'dota2';
              const isSoon = t.game === 'warzone' || t.game === 'fortnite';
              const isPubgPremium = t.id === 'pubg-premium-001' || t.is_premium || (t.game === 'pubg' && t.title?.toLowerCase().includes('premium'));
              
              let entryFeeRub = 100;
              let prizePoolRub = 2200;
              let maxPlayers = t.max_players || 100;
              let prizes = { 1: 1000, 2: 700, 3: 500 };

              if (isCsOrDota) {
                entryFeeRub = 1500;
                prizePoolRub = 12000;
                maxPlayers = 10;
                prizes = { 1: 12000, 2: 0, 3: 0 };
              } else if (isPubgPremium) {
                entryFeeRub = 1000;
                prizePoolRub = 28000;
                maxPlayers = 100;
                prizes = { 1: 15000, 2: 8000, 3: 5000 };
              }

              const status = isSoon ? 'soon' : (t.status as any);

              return {
                id: t.id,
                title: isCsOrDota
                  ? (t.game === 'cs2' ? 'CS2 5v5 Cash Clash #1' : 'Dota 2 5v5 Battle Cup')
                  : (isPubgPremium ? 'PUBG Solo Premium Showdown' : t.title),
                game: t.game,
                maxPlayers,
                registeredCount: currentRegs.filter(r => r.tournamentId === t.id).length || t.registered_count || 0,
                startsAt: t.starts_at,
                status,
                format: isCsOrDota
                  ? (t.game === 'cs2' ? '5v5, BO1 — Призовой фонд 12 000 ₽' : '5v5, Captains Mode — Призовой фонд 12 000 ₽')
                  : (isPubgPremium ? 'Solo, 1 катка (Премиум фонд 28 000 ₽)' : t.format),
                description: isCsOrDota
                  ? 'Командный матч 5 на 5 (2 команды по 5 игроков). Взнос 1 500 ₽ с игрока. Награда за 1 место: 12 000 ₽ (по 2 400 ₽ на каждого игрока команды)! Проигравшие получают 0 ₽.'
                  : (isPubgPremium
                      ? 'Премиум одиночный матч на 100 игроков: 1 катка — топ-3 выживших делят наградной фонд 28 000 ₽ (1 место: 15 000 ₽, 2 место: 8 000 ₽, 3 место: 5 000 ₽). Орг. сбор 1 000 ₽.'
                      : t.description),
                entryFeeRub,
                prizePoolRub,
                prizes,
                winnerPerPlayerRub: isCsOrDota ? 2400 : undefined,
                isPremium: isPubgPremium,
              };
            });

          const defaultExtra: Tournament[] = [
            {
              id: "pubg-premium-001",
              title: "PUBG Solo Premium Showdown",
              game: "pubg",
              maxPlayers: 100,
              registeredCount: currentRegs.filter(r => r.tournamentId === "pubg-premium-001").length,
              startsAt: "2026-09-07T21:00:00+03:00",
              status: "recruiting",
              format: "Solo, 1 катка (Премиум фонд 28 000 ₽)",
              description: "Премиум одиночный матч на 100 игроков: 1 катка — топ-3 выживших делят наградной фонд 28 000 ₽ (1 место: 15 000 ₽, 2 место: 8 000 ₽, 3 место: 5 000 ₽). Орг. сбор 1 000 ₽.",
              entryFeeRub: 1000,
              prizePoolRub: 28000,
              prizes: { 1: 15000, 2: 8000, 3: 5000 },
              isPremium: true,
            },
            {
              id: "warzone-solo-001",
              title: "Warzone Battle Royale",
              game: "warzone",
              maxPlayers: 100,
              registeredCount: currentRegs.filter(r => r.tournamentId === "warzone-solo-001").length,
              startsAt: "2026-09-10T19:00:00+03:00",
              status: "soon",
              format: "Solo Resurgence, 1 катка",
              description: "Турнир по Call of Duty: Warzone откроется скоро. Регистрация и призовой фонд станут доступны в ближайшее время.",
              entryFeeRub: 100,
            },
            {
              id: "fortnite-solo-001",
              title: "Fortnite Zero Build Cup",
              game: "fortnite",
              maxPlayers: 100,
              registeredCount: currentRegs.filter(r => r.tournamentId === "fortnite-solo-001").length,
              startsAt: "2026-09-11T19:00:00+03:00",
              status: "soon",
              format: "Solo Zero Build, 1 катка",
              description: "Турнир по Fortnite откроется скоро. Регистрация и призовой фонд станут доступны в ближайшее время.",
              entryFeeRub: 100,
            },
          ];

          defaultExtra.forEach(extra => {
            if (!mapped.some(t => t.id === extra.id)) {
              mapped.push(extra);
            }
          });

          setTournaments(mapped);
        }
      } catch (e) {
        console.warn('Tournaments fetch notice (using cache):', e);
      }

      // 3. Fetch matches with 2.5s timeout
      try {
        const matchesPromise = supabase.from('matches').select('*');
        const { data: dbMatches, error: mErr } = (await Promise.race([matchesPromise, createTimeout()])) as any;

        if (!mErr && dbMatches) {
          const matchMap: Record<string, TournamentMatchAccess> = {};
          dbMatches.forEach((m: any) => {
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
        console.warn('Matches fetch notice (using cache):', e);
      }
    } catch (e) {
      console.warn('Supabase fetch notice (using cache):', e);
    }
  }, []);

  // Initial fetch, real-time subscription, and automatic live synchronization
  useEffect(() => {
    refreshData();

    // 1. Supabase Realtime WebSocket subscription
    const channel = supabase
      .channel('realtime-tournaments-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tournaments' },
        () => {
          refreshData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'registrations' },
        () => {
          refreshData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => {
          refreshData();
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Supabase Realtime connected');
        } else if (status === 'CHANNEL_ERROR' && err) {
          const errMsg = String((err as any)?.message || err);
          if (!errMsg.includes('heartbeat timeout')) {
            console.warn('Realtime channel notice:', err);
          }
        }
      });

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

      // Non-blocking background sync to Supabase
      supabase.from('registrations').insert(regPayload).then(() => {}).catch(() => {});
      supabase
        .from('tournaments')
        .update({
          registered_count: newCount,
          status: newStatus,
        })
        .eq('id', tournamentId)
        .then(() => {})
        .catch(() => {});
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
      supabase.from('matches').upsert({
        tournament_id: tournamentId,
        room_id: roomId,
        password: password,
        join_url: joinUrl,
        updated_at: matchObj.updatedAt,
      }).then(() => {}).catch(() => {});
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
