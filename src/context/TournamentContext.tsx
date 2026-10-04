import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Tournament, Registration, TournamentMatchAccess, CustomGame } from '@/lib/types';
import {
  getStoredTournaments,
  saveTournaments,
  getStoredRegistrations,
  saveRegistrations,
  getStoredMatches,
  saveMatches,
  getDeletedTournamentIds,
  markTournamentAsDeleted,
  unmarkTournamentAsDeleted,
} from '@/lib/storage';
import { getStoredCustomGames, saveStoredCustomGames } from '@/lib/games';
import { supabase } from '@/lib/supabase';

const SYSTEM_CUSTOM_GAMES_ROW_ID = '__nb_custom_games__';
const DB_ALLOWED_GAMES = new Set(['cs2', 'dota2', 'pubg', 'warzone', 'fortnite']);

interface TournamentContextType {
  tournaments: Tournament[];
  registrations: Registration[];
  matches: Record<string, TournamentMatchAccess>;
  customGames: CustomGame[];
  addCustomGame: (game: CustomGame) => Promise<boolean>;
  deleteCustomGame: (gameId: string) => Promise<boolean>;
  registerForTournament: (tournamentId: string, nickname: string, gameAccount: string, email: string, phone: string) => Promise<boolean> | boolean;
  deleteRegistration: (registrationId: string) => Promise<void>;
  clearTournamentRegistrations: (tournamentId?: string) => Promise<void>;
  updateMatch: (tournamentId: string, roomId: string, password: string, joinUrl?: string) => Promise<void> | void;
  updateTournamentStartsAt: (tournamentId: string, startsAt: string) => Promise<boolean>;
  updateTournament: (tournamentId: string, updates: Partial<Tournament>) => Promise<boolean>;
  createTournament: (tournament: Omit<Tournament, 'registeredCount'>) => Promise<boolean>;
  deleteTournament: (tournamentId: string) => Promise<boolean>;
  getUserRegistrations: (email: string) => Registration[];
  isUserRegistered: (tournamentId: string, email: string) => boolean;
  refreshData: () => Promise<void>;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>(() => getStoredTournaments());
  const [registrations, setRegistrations] = useState<Registration[]>(() => getStoredRegistrations());
  const [matches, setMatches] = useState<Record<string, TournamentMatchAccess>>(() => getStoredMatches());
  const [customGames, setCustomGames] = useState<CustomGame[]>(() => getStoredCustomGames());

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

  useEffect(() => {
    saveStoredCustomGames(customGames);
  }, [customGames]);

  // Fetch from Supabase PostgreSQL
  const refreshData = useCallback(async () => {
    try {
      const createTimeout = (ms = 10000) =>
        new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase fetch timeout')), ms));

      // 1. Fetch registrations with 10s timeout
      let currentRegs: Registration[] = [];
      try {
        const regsPromise = supabase.from('registrations').select('*');
        const { data: dbRegs, error: rErr } = (await Promise.race([regsPromise, createTimeout(10000)])) as any;
        if (!rErr && dbRegs) {
          currentRegs = dbRegs.map((r: any) => ({
            id: r.id,
            tournamentId: r.tournament_id,
            nickname: r.nickname,
            gameAccount: r.game_account,
            email: r.email,
            phone: r.phone || '',
            paidAt: r.paid_at,
          }));

          setRegistrations(prev => {
            // Merge db registrations with any recent local registrations that haven't synced yet
            const merged = [...currentRegs];
            const now = Date.now();
            prev.forEach(localReg => {
              const isRecent = localReg.paidAt
                ? (now - new Date(localReg.paidAt).getTime() < 24 * 60 * 60 * 1000)
                : false;
              const existsInDb = merged.some(
                r => r.id === localReg.id ||
                     (r.tournamentId === localReg.tournamentId && r.email.toLowerCase() === localReg.email.toLowerCase())
              );
              if (!existsInDb && (isRecent || localReg.id.startsWith('reg_'))) {
                merged.push(localReg);
              }
            });
            saveRegistrations(merged);
            return merged;
          });
        }
      } catch (e) {
        console.warn('Registrations fetch notice (using cache):', e);
      }

      // 2. Fetch tournaments with 10s timeout
      try {
        const tourneysPromise = supabase.from('tournaments').select('*').order('starts_at', { ascending: true });
        const { data: dbTournaments, error: tErr } = (await Promise.race([tourneysPromise, createTimeout(10000)])) as any;

        if (!tErr && dbTournaments && dbTournaments.length > 0) {
          // Extract system custom games registry row if present
          const sysGamesRow = dbTournaments.find((t: any) => t.id === SYSTEM_CUSTOM_GAMES_ROW_ID);
          const discoveredCustomGamesMap = new Map<string, CustomGame>();
          if (sysGamesRow && sysGamesRow.description) {
            try {
              const parsedGames = JSON.parse(sysGamesRow.description);
              if (Array.isArray(parsedGames)) {
                parsedGames.forEach((cg: CustomGame) => {
                  if (cg && cg.id) discoveredCustomGamesMap.set(cg.id, cg);
                });
              }
            } catch (e) {
              console.warn('Failed to parse system custom games row:', e);
            }
          }

          const deletedTourneyIds = getDeletedTournamentIds();
          const mapped: Tournament[] = dbTournaments
            .filter(
              (t: any) =>
                t.id !== SYSTEM_CUSTOM_GAMES_ROW_ID &&
                t.game !== ('valorant' as any) &&
                t.id !== 'valorant-skirmish-001' &&
                !deletedTourneyIds.has(t.id) &&
                !t.id.startsWith('custom_apex') &&
                !t.id.startsWith('custom_mine')
            )
            .map((t: any) => {
              let cleanDesc = t.description || '';
              let meta: any = null;
              const metaMatch = cleanDesc.match(/<!--nb_meta:(.*?)-->/);
              if (metaMatch) {
                try {
                  meta = JSON.parse(metaMatch[1]);
                  cleanDesc = cleanDesc.replace(/\n?<!--nb_meta:.*?-->/gs, '').trim();
                } catch (e) {
                  console.warn('Failed to parse metadata from tournament description:', e);
                }
              }

              if (meta?.customGame && meta.customGame.id) {
                discoveredCustomGamesMap.set(meta.customGame.id, meta.customGame);
              }

              const resolvedGame =
                meta?.game
                  ? meta.game
                  : t.id.startsWith('pubg-mobile') ||
                    t.game === 'pubg_mobile' ||
                    (t.game === 'pubg' && t.title?.toLowerCase().includes('mobile'))
                  ? 'pubg_mobile'
                  : t.game;

              const isCsOrDota = resolvedGame === 'cs2' || resolvedGame === 'dota2';
              const isPubgPremium =
                t.id === 'pubg-premium-001' ||
                t.id === 'pubg-mobile-premium-001' ||
                t.is_premium ||
                Boolean(meta?.isPremium) ||
                ((resolvedGame === 'pubg' || resolvedGame === 'pubg_mobile') && t.title?.toLowerCase().includes('premium'));

              let entryFeeRub = isCsOrDota ? 1500 : (isPubgPremium ? 1000 : 100);
              let prizePoolRub = isCsOrDota ? 12000 : (isPubgPremium ? 28000 : 2200);
              let maxPlayers = t.max_players || (isCsOrDota ? 10 : 100);
              let minPlayers: number | undefined = isCsOrDota ? 10 : 50;
              let winningPlacesCount: number = isCsOrDota ? 1 : 3;
              let prizes: Record<number, number> = isCsOrDota
                ? { 1: 12000 }
                : (isPubgPremium ? { 1: 15000, 2: 8000, 3: 5000 } : { 1: 1000, 2: 700, 3: 500 });
              let winnerPerPlayerRub: number | undefined = isCsOrDota ? 2400 : undefined;

              if (meta) {
                if (typeof meta.entryFeeRub === 'number') entryFeeRub = meta.entryFeeRub;
                if (typeof meta.prizePoolRub === 'number') prizePoolRub = meta.prizePoolRub;
                if (meta.prizes && typeof meta.prizes === 'object') prizes = meta.prizes;
                if (typeof meta.minPlayers === 'number') minPlayers = meta.minPlayers;
                if (typeof meta.winningPlacesCount === 'number' && meta.winningPlacesCount >= 1) {
                  winningPlacesCount = meta.winningPlacesCount;
                } else if (meta.prizes && typeof meta.prizes === 'object') {
                  const activePlaces = Object.keys(meta.prizes)
                    .map(Number)
                    .filter(k => !isNaN(k) && Number(meta.prizes[k]) > 0);
                  if (activePlaces.length > 0) {
                    winningPlacesCount = Math.max(...activePlaces);
                  }
                }
                if (meta.winnerPerPlayerRub !== undefined) {
                  winnerPerPlayerRub = meta.winnerPerPlayerRub || undefined;
                } else if (winningPlacesCount > 1) {
                  winnerPerPlayerRub = undefined;
                }
              }

              const status = t.status || 'recruiting';

              return {
                id: t.id,
                title: t.title || (isCsOrDota
                  ? (resolvedGame === 'cs2' ? 'CS2 5v5 Cup #1' : 'Dota 2 5v5 Battle Cup')
                  : (isPubgPremium ? 'PUBG Solo Premium Showdown' : t.id)),
                game: resolvedGame,
                maxPlayers,
                minPlayers,
                registeredCount: currentRegs.filter(r => r.tournamentId === t.id).length,
                startsAt: t.starts_at || new Date().toISOString(),
                status,
                format: t.format || (isCsOrDota
                  ? (resolvedGame === 'cs2' ? '5v5, BO1 — Регламент соревнований' : '5v5, Captains Mode — Регламент соревнований')
                  : (isPubgPremium ? 'Solo, 1 соревнование' : 'Solo, 1 соревнование')),
                description: cleanDesc,
                entryFeeRub,
                prizePoolRub,
                winningPlacesCount,
                prizes,
                winnerPerPlayerRub,
                isPremium: isPubgPremium,
                customGame: meta?.customGame,
              };
            });

          if (sysGamesRow || discoveredCustomGamesMap.size > 0) {
            const nextCustomGames = Array.from(discoveredCustomGamesMap.values());
            saveStoredCustomGames(nextCustomGames);
            setCustomGames(nextCustomGames);
          }

          setTournaments(prev => {
            const deleted = getDeletedTournamentIds();
            const merged = mapped.filter(m => !deleted.has(m.id));
            // Only add local tournaments that are not yet in Supabase mapped results and not deleted
            prev.forEach(p => {
              if (p.id === SYSTEM_CUSTOM_GAMES_ROW_ID) return;
              if (deleted.has(p.id)) return;
              if (p.id.startsWith('custom_apex') || p.id.startsWith('custom_mine')) return;
              const exists = merged.some(m => m.id === p.id);
              if (!exists) {
                merged.push(p);
              }
            });
            saveTournaments(merged);
            return merged;
          });
        }
      } catch (e) {
        console.warn('Tournaments fetch notice (using cache):', e);
      }

      // 3. Fetch matches with 10s timeout
      try {
        const matchesPromise = supabase.from('matches').select('*');
        const { data: dbMatches, error: mErr } = (await Promise.race([matchesPromise, createTimeout(10000)])) as any;

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
          saveMatches(matchMap);
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
    phone: string
  ) => {
    const cleanPhone = (phone || '').trim();
    if (!cleanPhone) {
      console.warn('Phone is strictly required for tournament registration');
      return false;
    }

    if (registrations.some(r => r.tournamentId === tournamentId && r.email.toLowerCase() === email.toLowerCase())) {
      return false;
    }

    const newReg: Registration = {
      id: 'reg_' + Math.random().toString(36).substring(2, 9),
      tournamentId,
      nickname,
      gameAccount,
      email,
      phone: cleanPhone,
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

    // Save to PostgreSQL via Supabase with fallback if phone column doesn't exist yet
    try {
      const regPayload: Record<string, any> = {
        id: newReg.id,
        tournament_id: tournamentId,
        nickname,
        game_account: gameAccount,
        email,
        phone: cleanPhone,
        paid_at: newReg.paidAt,
      };

      const syncRegistration = async () => {
        try {
          const { error: insErr } = await supabase.from('registrations').insert(regPayload);
          if (insErr) {
            console.warn('First insert attempt with phone failed:', insErr);
            // If phone column does not exist in schema (PGRST204 or error text), retry without phone
            if (insErr.message?.toLowerCase().includes('phone') || (insErr as any).code === 'PGRST204') {
              const { phone: _, ...fallbackPayload } = regPayload;
              const { error: retryErr } = await supabase.from('registrations').insert(fallbackPayload);
              if (retryErr) {
                console.error('Fallback registration insert without phone failed:', retryErr);
              } else {
                console.log('✅ Registered successfully in Supabase (fallback without phone)');
              }
            }
          } else {
            console.log('✅ Registered successfully in Supabase with phone');
          }

          await supabase
            .from('tournaments')
            .update({
              registered_count: newCount,
              status: newStatus,
            })
            .eq('id', tournamentId);
        } catch (syncErr) {
          console.warn('Supabase sync notice:', syncErr);
        }
      };

      syncRegistration();
    } catch (e) {
      console.warn('Could not sync registration to Supabase, saved locally:', e);
    }

    return true;
  };

  const deleteRegistration = async (registrationId: string) => {
    const regToDelete = registrations.find(r => r.id === registrationId);
    if (!regToDelete) return;

    const tId = regToDelete.tournamentId;
    const remainingRegs = registrations.filter(r => r.id !== registrationId);
    setRegistrations(remainingRegs);
    saveRegistrations(remainingRegs);

    const remainingCount = remainingRegs.filter(r => r.tournamentId === tId).length;
    const targetTournament = tournaments.find(t => t.id === tId);
    const newStatus = targetTournament && targetTournament.status !== 'soon'
      ? (remainingCount >= targetTournament.maxPlayers ? 'full' : 'recruiting')
      : targetTournament?.status || 'recruiting';

    setTournaments(prev =>
      prev.map(t => {
        if (t.id === tId) {
          return {
            ...t,
            registeredCount: remainingCount,
            status: newStatus as any,
          };
        }
        return t;
      })
    );

    try {
      await supabase.from('registrations').delete().eq('id', registrationId);
      await supabase
        .from('tournaments')
        .update({
          registered_count: remainingCount,
          status: newStatus,
        })
        .eq('id', tId);
    } catch (e) {
      console.warn('Could not sync deletion to Supabase:', e);
    }
  };

  const clearTournamentRegistrations = async (tournamentId?: string) => {
    let remainingRegs: Registration[];
    if (tournamentId) {
      remainingRegs = registrations.filter(r => r.tournamentId !== tournamentId);
    } else {
      remainingRegs = [];
    }

    setRegistrations(remainingRegs);
    saveRegistrations(remainingRegs);

    setTournaments(prev =>
      prev.map(t => {
        if (!tournamentId || t.id === tournamentId) {
          const newStatus = t.status === 'soon' ? 'soon' : 'recruiting';
          return {
            ...t,
            registeredCount: 0,
            status: newStatus as any,
          };
        }
        return t;
      })
    );

    try {
      if (tournamentId) {
        await supabase.from('registrations').delete().eq('tournament_id', tournamentId);
        await supabase
          .from('tournaments')
          .update({
            registered_count: 0,
            status: 'recruiting',
          })
          .eq('id', tournamentId);
      } else {
        await supabase.from('registrations').delete().neq('id', 'keep_none');
        await supabase
          .from('tournaments')
          .update({
            registered_count: 0,
            status: 'recruiting',
          });
      }
    } catch (e) {
      console.warn('Could not clear registrations from Supabase:', e);
    }
  };

  const updateMatch = async (tournamentId: string, roomId: string, password: string, joinUrl?: string) => {
    const matchObj: TournamentMatchAccess = {
      tournamentId,
      roomId,
      password,
      joinUrl,
      updatedAt: new Date().toISOString(),
    };

    setMatches(prev => {
      const updated = {
        ...prev,
        [tournamentId]: matchObj,
      };
      saveMatches(updated);
      return updated;
    });

    try {
      const { error } = await supabase.from('matches').upsert({
        tournament_id: tournamentId,
        room_id: roomId,
        password: password,
        join_url: joinUrl,
        updated_at: matchObj.updatedAt,
      });
      if (error) {
        console.error('Could not sync match to Supabase:', error);
      }
    } catch (e) {
      console.warn('Could not sync match to Supabase:', e);
    }
  };

  const updateTournamentStartsAt = async (tournamentId: string, startsAt: string): Promise<boolean> => {
    setTournaments(prev => {
      const updated = prev.map(t => (t.id === tournamentId ? { ...t, startsAt } : t));
      saveTournaments(updated);
      return updated;
    });

    try {
      const updatePromise = supabase
        .from('tournaments')
        .update({ starts_at: startsAt })
        .eq('id', tournamentId);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Supabase update timeout')), 3000)
      );

      await Promise.race([updatePromise, timeoutPromise]);
    } catch (e) {
      console.warn('Could not sync tournament starts_at to Supabase (saved locally):', e);
    }
    return true;
  };

  const updateTournament = async (tournamentId: string, updates: Partial<Tournament>): Promise<boolean> => {
    setTournaments(prev => {
      const updated = prev.map(t => (t.id === tournamentId ? { ...t, ...updates } : t));
      saveTournaments(updated);
      return updated;
    });

    try {
      const dbPayload: Record<string, any> = {};
      if (updates.startsAt !== undefined) dbPayload.starts_at = updates.startsAt;
      if (updates.title !== undefined) dbPayload.title = updates.title;
      if (updates.status !== undefined) dbPayload.status = updates.status;
      if (updates.format !== undefined) dbPayload.format = updates.format;
      if (updates.maxPlayers !== undefined) dbPayload.max_players = updates.maxPlayers;

      if (
        updates.description !== undefined ||
        updates.entryFeeRub !== undefined ||
        updates.prizePoolRub !== undefined ||
        updates.winningPlacesCount !== undefined ||
        updates.prizes !== undefined ||
        updates.minPlayers !== undefined ||
        updates.isPremium !== undefined ||
        updates.winnerPerPlayerRub !== undefined ||
        updates.game !== undefined
      ) {
        const existingT = tournaments.find(t => t.id === tournamentId);
        const desc = updates.description !== undefined ? updates.description : (existingT?.description || '');
        const resolvedGameId = updates.game !== undefined ? updates.game : existingT?.game;
        const customGameObj = customGames.find(cg => cg.id === resolvedGameId) || existingT?.customGame;
        const meta = {
          game: resolvedGameId,
          entryFeeRub: updates.entryFeeRub !== undefined ? updates.entryFeeRub : existingT?.entryFeeRub,
          prizePoolRub: updates.prizePoolRub !== undefined ? updates.prizePoolRub : existingT?.prizePoolRub,
          winningPlacesCount: updates.winningPlacesCount !== undefined ? updates.winningPlacesCount : existingT?.winningPlacesCount,
          prizes: updates.prizes !== undefined ? updates.prizes : existingT?.prizes,
          minPlayers: updates.minPlayers !== undefined ? updates.minPlayers : existingT?.minPlayers,
          isPremium: updates.isPremium !== undefined ? updates.isPremium : existingT?.isPremium,
          winnerPerPlayerRub: updates.winnerPerPlayerRub !== undefined ? updates.winnerPerPlayerRub : existingT?.winnerPerPlayerRub,
          customGame: customGameObj,
        };
        const cleanDesc = desc.replace(/\n?<!--nb_meta:.*?-->/gs, '').trim();
        dbPayload.description = `${cleanDesc}\n<!--nb_meta:${JSON.stringify(meta)}-->`;
      }

      if (Object.keys(dbPayload).length > 0) {
        const updatePromise = supabase
          .from('tournaments')
          .update(dbPayload)
          .eq('id', tournamentId);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Supabase update timeout')), 3000)
        );
        await Promise.race([updatePromise, timeoutPromise]);
      }
    } catch (e) {
      console.warn('Could not sync tournament update to Supabase (saved locally):', e);
    }
    return true;
  };

  const syncCustomGamesToSupabase = async (nextGames: CustomGame[]): Promise<boolean> => {
    try {
      const { error } = await supabase.from('tournaments').upsert(
        {
          id: SYSTEM_CUSTOM_GAMES_ROW_ID,
          title: 'System Custom Games Registry',
          game: 'pubg',
          max_players: 1,
          registered_count: 0,
          starts_at: '2099-01-01T00:00:00.000Z',
          status: 'soon',
          format: 'SYSTEM',
          description: JSON.stringify(nextGames),
        },
        { onConflict: 'id' }
      );
      if (error) {
        console.error('Could not sync custom games registry to Supabase:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Failed to sync custom games to Supabase:', e);
      return false;
    }
  };

  const addCustomGame = async (newGame: CustomGame): Promise<boolean> => {
    const nextGames = [...customGames.filter(g => g.id !== newGame.id), newGame];
    saveStoredCustomGames(nextGames);
    setCustomGames(nextGames);
    const ok = await syncCustomGamesToSupabase(nextGames);
    await refreshData();
    return ok;
  };

  const deleteCustomGame = async (gameId: string): Promise<boolean> => {
    const nextGames = customGames.filter(g => g.id !== gameId);
    saveStoredCustomGames(nextGames);
    setCustomGames(nextGames);
    const ok = await syncCustomGamesToSupabase(nextGames);
    await refreshData();
    return ok;
  };

  const createTournament = async (tournamentData: Omit<Tournament, 'registeredCount'>): Promise<boolean> => {
    const newId = tournamentData.id || `${tournamentData.game}-${Date.now().toString(36)}`;
    unmarkTournamentAsDeleted(newId);

    const customGameObj =
      tournamentData.customGame || customGames.find(cg => cg.id === tournamentData.game);

    const meta = {
      game: tournamentData.game,
      entryFeeRub: tournamentData.entryFeeRub,
      prizePoolRub: tournamentData.prizePoolRub,
      winningPlacesCount: tournamentData.winningPlacesCount,
      prizes: tournamentData.prizes,
      minPlayers: tournamentData.minPlayers,
      isPremium: tournamentData.isPremium,
      winnerPerPlayerRub: tournamentData.winnerPerPlayerRub,
      customGame: customGameObj,
    };
    const cleanDesc = (tournamentData.description || '').replace(/\n?<!--nb_meta:.*?-->/gs, '').trim();
    const fullDescription = `${cleanDesc}\n<!--nb_meta:${JSON.stringify(meta)}-->`;

    const newTournament: Tournament = {
      ...tournamentData,
      id: newId,
      description: cleanDesc,
      registeredCount: 0,
      customGame: customGameObj,
    };

    setTournaments(prev => {
      const updated = [newTournament, ...prev.filter(t => t.id !== newId)];
      saveTournaments(updated);
      return updated;
    });

    try {
      const dbGame = DB_ALLOWED_GAMES.has(newTournament.game) ? newTournament.game : 'pubg';
      const insertPromise = supabase.from('tournaments').insert({
        id: newTournament.id,
        title: newTournament.title,
        game: dbGame,
        max_players: newTournament.maxPlayers,
        registered_count: 0,
        starts_at: newTournament.startsAt,
        status: newTournament.status,
        format: newTournament.format,
        description: fullDescription,
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Supabase insert timeout')), 3000)
      );

      await Promise.race([insertPromise, timeoutPromise]);
    } catch (e) {
      console.warn('Could not sync tournament creation to Supabase, preserved locally:', e);
    }

    return true;
  };

  const deleteTournament = async (tournamentId: string): Promise<boolean> => {
    markTournamentAsDeleted(tournamentId);

    setTournaments(prev => {
      const updated = prev.filter(t => t.id !== tournamentId);
      saveTournaments(updated);
      return updated;
    });

    setRegistrations(prev => {
      const updated = prev.filter(r => r.tournamentId !== tournamentId);
      saveRegistrations(updated);
      return updated;
    });

    try {
      const deletePromise = Promise.all([
        supabase.from('tournaments').delete().eq('id', tournamentId),
        supabase.from('matches').delete().eq('tournament_id', tournamentId),
        supabase.from('registrations').delete().eq('tournament_id', tournamentId),
      ]);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Supabase delete timeout')), 3000)
      );
      await Promise.race([deletePromise, timeoutPromise]);
    } catch (e) {
      console.warn('Could not sync tournament deletion to Supabase (deleted locally):', e);
    }

    return true;
  };

  const getUserRegistrations = (email: string) => {
    if (!email) return [];
    return registrations.filter(r => (r?.email || '').toLowerCase() === email.toLowerCase());
  };

  const isUserRegistered = (tournamentId: string, email: string) => {
    if (!email) return false;
    return registrations.some(r => r.tournamentId === tournamentId && (r?.email || '').toLowerCase() === email.toLowerCase());
  };

  const computedTournaments = React.useMemo(() => {
    return tournaments.map(t => {
      const regCount = registrations.filter(r => r.tournamentId === t.id).length;
      let status = t.status;
      if (t.status === 'recruiting' || t.status === 'full') {
        status = regCount >= t.maxPlayers ? 'full' : 'recruiting';
      }
      return {
        ...t,
        registeredCount: regCount,
        status: status as any,
      };
    });
  }, [tournaments, registrations]);

  return (
    <TournamentContext.Provider
      value={{
        tournaments: computedTournaments,
        registrations,
        matches,
        customGames,
        addCustomGame,
        deleteCustomGame,
        registerForTournament,
        deleteRegistration,
        clearTournamentRegistrations,
        updateMatch,
        updateTournamentStartsAt,
        updateTournament,
        createTournament,
        deleteTournament,
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
