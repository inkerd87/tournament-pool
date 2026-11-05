import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Tournament, Registration, TournamentMatchAccess, CustomGame } from '@/lib/types';
import {
  getStoredTournaments,
  saveTournaments,
  saveTournamentsToServer,
  getStoredRegistrations,
  saveRegistrations,
  saveRegistrationsToServer,
  getStoredMatches,
  saveMatches,
  saveMatchesToServer,
  getDeletedTournamentIds,
  markTournamentAsDeleted,
  unmarkTournamentAsDeleted,
  deduplicateTournaments,
  fetchServerStorageBundle,
} from '@/lib/storage';
import {
  getStoredCustomGames,
  saveStoredCustomGames,
  saveCustomGamesToServer,
  getStoredGameOverrides,
  saveStoredGameOverrides,
  saveGameOverridesToServer,
  getAllGamesList,
  updateGameConfig,
  resetGameConfig,
  FullGameInfo,
  GameOverride,
  GameConfig,
} from '@/lib/games';
import { supabase } from '@/lib/supabase';

const SYSTEM_CUSTOM_GAMES_ROW_ID = '__nb_custom_games__';
const DB_ALLOWED_GAMES = new Set(['cs2', 'dota2', 'pubg', 'warzone', 'fortnite']);

export function parseTournamentFromRow(row: any): Tournament | null {
  if (!row || !row.id || row.id === SYSTEM_CUSTOM_GAMES_ROW_ID) return null;

  let cleanDesc = (row.description || '').trim();
  let meta: any = {};
  const metaMatch = cleanDesc.match(/<!--nb_meta:([\s\S]*?)-->/);
  if (metaMatch) {
    try {
      meta = JSON.parse(metaMatch[1]);
      cleanDesc = cleanDesc.replace(/<!--nb_meta:[\s\S]*?-->/g, '').trim();
    } catch (e) {
      console.warn('Failed to parse metadata for tournament', row.id, e);
    }
  }

  const game = meta.game || row.game;
  const isCsOrDota = game === 'cs2' || game === 'dota2';
  const minPlayers = meta.minPlayers ?? (isCsOrDota ? 10 : game === 'minecraft' ? 24 : 50);

  return {
    id: row.id,
    title: row.title,
    game: game,
    maxPlayers: Number(row.max_players) || 100,
    minPlayers: Number(minPlayers) || 10,
    registeredCount: Number(row.registered_count) || 0,
    startsAt: row.starts_at,
    status: row.status,
    format: row.format,
    description: cleanDesc,
    entryFeeRub: meta.entryFeeRub !== undefined ? Number(meta.entryFeeRub) : 100,
    prizePoolRub: meta.prizePoolRub !== undefined ? Number(meta.prizePoolRub) : 3000,
    winningPlacesCount: meta.winningPlacesCount !== undefined ? Number(meta.winningPlacesCount) : 3,
    prizes: meta.prizes || undefined,
    winnerPerPlayerRub: meta.winnerPerPlayerRub !== undefined ? Number(meta.winnerPerPlayerRub) : undefined,
    isPremium: meta.isPremium !== undefined ? Boolean(meta.isPremium) : false,
    customIconUrl: meta.customIconUrl,
    wallpaperUrl: meta.wallpaperUrl,
    customGame: meta.customGame,
    winner: meta.winner,
    streamUrl: meta.streamUrl,
  };
}

interface TournamentContextType {
  tournaments: Tournament[];
  registrations: Registration[];
  matches: Record<string, TournamentMatchAccess>;
  customGames: CustomGame[];
  allGames: FullGameInfo[];
  gameOverrides: Record<string, GameOverride>;
  updateGameConfig: (gameId: string, updates: Partial<GameConfig>) => Promise<boolean>;
  resetGameConfig: (gameId: string) => Promise<boolean>;
  addCustomGame: (game: CustomGame) => Promise<boolean>;
  deleteCustomGame: (gameId: string) => Promise<boolean>;
  registerForTournament: (tournamentId: string, nickname: string, gameAccount: string, email: string, phone: string) => Promise<boolean> | boolean;
  deleteRegistration: (registrationId: string) => Promise<void>;
  clearTournamentRegistrations: (tournamentId?: string) => Promise<void>;
  updateMatch: (tournamentId: string, roomId: string, password: string, joinUrl?: string, streamUrl?: string) => Promise<boolean> | Promise<void> | void;
  updateTournamentStartsAt: (tournamentId: string, startsAt: string) => Promise<boolean>;
  updateTournament: (tournamentId: string, updates: Partial<Tournament>) => Promise<boolean>;
  createTournament: (tournament: Omit<Tournament, 'registeredCount'>) => Promise<boolean>;
  deleteTournament: (tournamentId: string) => Promise<boolean>;
  getUserRegistrations: (email: string) => Registration[];
  isUserRegistered: (tournamentId: string, email: string) => boolean;
  refreshData: () => Promise<void>;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

let isSupabaseQuotaBlocked = false;

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>(() => getStoredTournaments());
  const [registrations, setRegistrations] = useState<Registration[]>(() => getStoredRegistrations());
  const [matches, setMatches] = useState<Record<string, TournamentMatchAccess>>(() => getStoredMatches());
  const [customGames, setCustomGames] = useState<CustomGame[]>(() => getStoredCustomGames());
  const [allGames, setAllGames] = useState<FullGameInfo[]>(() => getAllGamesList());
  const [gameOverrides, setGameOverrides] = useState<Record<string, GameOverride>>(() => getStoredGameOverrides());

  const realtimeChannelRef = React.useRef<any>(null);

  const notifyAllClients = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('nb_tournaments_sync_channel');
        bc.postMessage({ type: 'sync', timestamp: Date.now() });
        bc.close();
      }
    } catch {}

    try {
      localStorage.setItem('nb_last_sync_time', String(Date.now()));
    } catch {}

    try {
      if (realtimeChannelRef.current) {
        realtimeChannelRef.current.send({
          type: 'broadcast',
          event: 'tournaments_updated',
          payload: { timestamp: Date.now() },
        });
      }
    } catch {}
  }, []);

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

  const isFetchingRef = React.useRef(false);

  // Authoritative fetch from Supabase PostgreSQL (Single source of truth) with local cache fallback
  const refreshData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      // 0. Instant hydration from LocalStorage if initial state was empty
      try {
        const localTourneys = getStoredTournaments();
        if (localTourneys && localTourneys.length > 0) {
          setTournaments(prev => (prev.length === 0 ? localTourneys : prev));
        }
        const localCustom = getStoredCustomGames();
        if (localCustom && localCustom.length > 0) {
          setCustomGames(prev => (prev.length === 0 ? localCustom : prev));
        }
        const localOverrides = getStoredGameOverrides();
        if (localOverrides && Object.keys(localOverrides).length > 0) {
          setGameOverrides(prev => (Object.keys(prev).length === 0 ? localOverrides : prev));
        }
        const localMatches = getStoredMatches();
        if (localMatches && Object.keys(localMatches).length > 0) {
          setMatches(prev => (Object.keys(prev).length === 0 ? localMatches : prev));
        }
        const localRegs = getStoredRegistrations();
        if (localRegs && localRegs.length > 0) {
          setRegistrations(prev => (prev.length === 0 ? localRegs : prev));
        }
      } catch (e) {
        console.warn('Local hydration notice:', e);
      }

      // 1. Supabase PostgreSQL authoritative synchronization
      if (!isSupabaseQuotaBlocked) {
        const createTimeout = (ms = 5000) =>
          new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase fetch timeout')), ms));

        try {
          const [tourneysResult, matchesResult, regsResult] = await Promise.allSettled([
            Promise.race([
              supabase.from('tournaments').select('*').order('starts_at', { ascending: true }),
              createTimeout(5000),
            ]),
            Promise.race([
              supabase.from('matches').select('*'),
              createTimeout(5000),
            ]),
            Promise.race([
              supabase.from('registrations').select('*'),
              createTimeout(5000),
            ]),
          ]);

          // Check for quota block on any response
          for (const res of [tourneysResult, matchesResult, regsResult]) {
            if (res.status === 'fulfilled' && (res.value as any)?.error) {
              const err = (res.value as any).error;
              const errMsg = String(err.message || err.details || '');
              const errCode = String(err.code || err.status || '');
              if (errCode === '402' || errCode === 'PGRST402' || errMsg.includes('quota') || errMsg.includes('exceed')) {
                isSupabaseQuotaBlocked = true;
                console.warn('Supabase quota exceeded (HTTP 402). Disabling Supabase polling.');
                return;
              }
            }
          }

          // A. Process Tournaments & System Custom Games Row
          if (tourneysResult.status === 'fulfilled') {
            const tRes: any = tourneysResult.value;
            if (tRes && !tRes.error && Array.isArray(tRes.data) && tRes.data.length > 0) {
              // Parse custom games registry from __nb_custom_games__
              const customRow = tRes.data.find((r: any) => r.id === SYSTEM_CUSTOM_GAMES_ROW_ID);
              if (customRow && customRow.description) {
                try {
                  const parsed = JSON.parse(customRow.description);
                  if (parsed.customGames && Array.isArray(parsed.customGames)) {
                    setCustomGames(parsed.customGames);
                    saveStoredCustomGames(parsed.customGames);
                  }
                  if (parsed.gameOverrides && typeof parsed.gameOverrides === 'object') {
                    setGameOverrides(parsed.gameOverrides);
                    saveStoredGameOverrides(parsed.gameOverrides);
                  }
                  setAllGames(getAllGamesList());
                } catch (e) {
                  console.warn('Error parsing __nb_custom_games__ from Supabase:', e);
                }
              }

              // Parse actual tournaments
              const parsedTourneys: Tournament[] = tRes.data
                .map(parseTournamentFromRow)
                .filter((t: Tournament | null): t is Tournament => t !== null);

              if (parsedTourneys.length > 0) {
                const cleanTourneys = deduplicateTournaments(parsedTourneys);
                setTournaments(cleanTourneys);
                saveTournaments(cleanTourneys);
              }
            }
          }

          // B. Process Matches
          if (matchesResult.status === 'fulfilled') {
            const mRes: any = matchesResult.value;
            if (mRes && !mRes.error && Array.isArray(mRes.data)) {
              const matchMap: Record<string, TournamentMatchAccess> = {};
              mRes.data.forEach((m: any) => {
                if (m.tournament_id) {
                  matchMap[m.tournament_id] = {
                    tournamentId: m.tournament_id,
                    roomId: m.room_id || '',
                    password: m.password || '',
                    joinUrl: m.join_url || undefined,
                    streamUrl: m.stream_url || undefined,
                    updatedAt: m.updated_at || new Date().toISOString(),
                  };
                }
              });
              setMatches(matchMap);
              saveMatches(matchMap);
            }
          }

          // C. Process Registrations
          if (regsResult.status === 'fulfilled') {
            const rRes: any = regsResult.value;
            if (rRes && !rRes.error && Array.isArray(rRes.data)) {
              const dbRegs: Registration[] = rRes.data.map((r: any) => ({
                id: r.id,
                tournamentId: r.tournament_id,
                nickname: r.nickname,
                gameAccount: r.game_account,
                email: r.email,
                phone: r.phone || '',
                paidAt: r.paid_at,
              }));

              setRegistrations(dbRegs);
              saveRegistrations(dbRegs);
            }
          }
        } catch (syncErr) {
          console.warn('Supabase sync notice:', syncErr);
        }
      }

      // 2. Fallback check for server bundle if present
      try {
        const bundle = await fetchServerStorageBundle();
        if (bundle && bundle.ok) {
          if (Array.isArray(bundle.deleted_tournaments) && bundle.deleted_tournaments.length > 0) {
            try {
              const curDel = getDeletedTournamentIds();
              let changed = false;
              bundle.deleted_tournaments.forEach((id: string) => {
                if (!curDel.has(id)) {
                  curDel.add(id);
                  changed = true;
                }
              });
              if (changed) {
                localStorage.setItem('nb_deleted_tournaments_v1', JSON.stringify(Array.from(curDel)));
              }
            } catch {}
          }
        }
      } catch {}
    } catch (e) {
      console.warn('Refresh notice (using cache):', e);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // Initial fetch, real-time subscription, and automatic live synchronization
  useEffect(() => {
    refreshData();

    // 1. Быстрый опрос раз в 20 секунд на активной вкладке как подстраховка к WebSocket
    const pollInterval = setInterval(() => {
      if (!document.hidden) {
        refreshData();
      }
    }, 20000);

    const handleFocus = () => {
      if (!document.hidden) {
        refreshData();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    // 2. Межвкладочная синхронизация через BroadcastChannel и storage event
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('nb_tournaments_sync_channel');
        bc.onmessage = () => {
          refreshData();
        };
      }
    } catch {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'nb_tournaments_v21' || e.key === 'nb_last_sync_time') {
        refreshData();
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. Supabase Realtime WebSocket с поддержкой broadcast и postgres_changes
    let channel: any = null;
    try {
      channel = supabase
        .channel('realtime-tournaments-feed')
        .on(
          'broadcast',
          { event: 'tournaments_updated' },
          () => {
            refreshData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tournaments' },
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
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'registrations' },
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
      realtimeChannelRef.current = channel;
    } catch (e) {
      console.warn('Realtime setup error:', e);
    }

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('storage', handleStorage);
      if (bc) {
        try {
          bc.close();
        } catch {}
      }
      realtimeChannelRef.current = null;
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {}
      }
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
    setRegistrations(prev => {
      const next = [...prev, newReg];
      saveRegistrationsToServer(next);
      return next;
    });

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
    saveRegistrationsToServer(remainingRegs);

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
    saveRegistrationsToServer(remainingRegs);

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

  const updateMatch = async (tournamentId: string, roomId: string, password: string, joinUrl?: string, streamUrl?: string): Promise<boolean> => {
    const matchObj: TournamentMatchAccess = {
      tournamentId,
      roomId,
      password,
      joinUrl,
      streamUrl,
      updatedAt: new Date().toISOString(),
    };

    setMatches(prev => {
      const updated = {
        ...prev,
        [tournamentId]: matchObj,
      };
      saveMatchesToServer(updated);
      return updated;
    });
    notifyAllClients();

    // Detached background sync to Supabase (never blocks UI or fails user)
    (async () => {
      if (isSupabaseQuotaBlocked) return;
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Supabase match timeout')), 5000)
        );
        const upsertPromise = supabase.from('matches').upsert({
          tournament_id: tournamentId,
          room_id: roomId,
          password: password,
          join_url: joinUrl,
          stream_url: streamUrl,
          updated_at: matchObj.updatedAt,
        });
        await Promise.race([upsertPromise, timeoutPromise]);
        notifyAllClients();
      } catch (e) {
        console.warn('Could not sync match to Supabase (saved locally & server):', e);
      }
    })();

    return true;
  };

  const updateTournamentStartsAt = async (tournamentId: string, startsAt: string): Promise<boolean> => {
    return updateTournament(tournamentId, { startsAt });
  };

  const updateTournament = async (tournamentId: string, updates: Partial<Tournament>): Promise<boolean> => {
    let nextTournaments: Tournament[] = [];
    setTournaments(prev => {
      const updated = prev.map(t => (t.id === tournamentId ? { ...t, ...updates } : t));
      saveTournamentsToServer(updated);
      nextTournaments = updated;
      return updated;
    });
    notifyAllClients();

    // Detached background sync to Supabase (never blocks UI or fails user)
    (async () => {
      if (isSupabaseQuotaBlocked) return;
      try {
        const dbPayload: Record<string, any> = {};
        if (updates.startsAt !== undefined) dbPayload.starts_at = updates.startsAt;
        if (updates.title !== undefined) dbPayload.title = updates.title;
        if (updates.status !== undefined) dbPayload.status = updates.status;
        if (updates.format !== undefined) dbPayload.format = updates.format;
        if (updates.maxPlayers !== undefined) dbPayload.max_players = updates.maxPlayers;
        if (updates.registeredCount !== undefined) dbPayload.registered_count = updates.registeredCount;
        if (updates.game !== undefined) {
          dbPayload.game = DB_ALLOWED_GAMES.has(updates.game) ? updates.game : 'pubg';
        }

        const existingT = nextTournaments.find(t => t.id === tournamentId) || updates;
        const desc = updates.description !== undefined ? updates.description : (existingT as any)?.description || '';
        const resolvedGameId = updates.game !== undefined ? updates.game : (existingT as any)?.game;
        const customGameObj = customGames.find(cg => cg.id === resolvedGameId) || (existingT as any)?.customGame;
        const meta = {
          game: resolvedGameId,
          entryFeeRub: updates.entryFeeRub !== undefined ? updates.entryFeeRub : (existingT as any)?.entryFeeRub,
          prizePoolRub: updates.prizePoolRub !== undefined ? updates.prizePoolRub : (existingT as any)?.prizePoolRub,
          winningPlacesCount: updates.winningPlacesCount !== undefined ? updates.winningPlacesCount : (existingT as any)?.winningPlacesCount,
          prizes: updates.prizes !== undefined ? updates.prizes : (existingT as any)?.prizes,
          minPlayers: updates.minPlayers !== undefined ? updates.minPlayers : (existingT as any)?.minPlayers,
          isPremium: updates.isPremium !== undefined ? updates.isPremium : (existingT as any)?.isPremium,
          winnerPerPlayerRub: updates.winnerPerPlayerRub !== undefined ? updates.winnerPerPlayerRub : (existingT as any)?.winnerPerPlayerRub,
          streamUrl: updates.streamUrl !== undefined ? updates.streamUrl : (existingT as any)?.streamUrl,
          winner: updates.winner !== undefined ? updates.winner : (existingT as any)?.winner,
          customIconUrl: updates.customIconUrl !== undefined ? updates.customIconUrl : (existingT as any)?.customIconUrl,
          wallpaperUrl: updates.wallpaperUrl !== undefined ? updates.wallpaperUrl : (existingT as any)?.wallpaperUrl,
          customGame: customGameObj,
        };
        const cleanDesc = desc.replace(/\n?<!--nb_meta:[\s\S]*?-->/g, '').trim();
        dbPayload.description = `${cleanDesc}\n<!--nb_meta:${JSON.stringify(meta)}-->`;

        if (Object.keys(dbPayload).length > 0) {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Supabase update timeout')), 5000)
          );
          const updatePromise = supabase
            .from('tournaments')
            .update(dbPayload)
            .eq('id', tournamentId)
            .select();
          const res: any = await Promise.race([updatePromise, timeoutPromise]);
          if (!res?.data || res.data.length === 0) {
            const fullT = nextTournaments.find(t => t.id === tournamentId);
            if (fullT) {
              const dbGame = DB_ALLOWED_GAMES.has(fullT.game) ? fullT.game : 'pubg';
              const upsertPromise = supabase.from('tournaments').upsert(
                {
                  id: fullT.id,
                  title: dbPayload.title || fullT.title,
                  game: dbPayload.game || dbGame,
                  max_players: dbPayload.max_players || fullT.maxPlayers,
                  registered_count: dbPayload.registered_count || fullT.registeredCount || 0,
                  starts_at: dbPayload.starts_at || fullT.startsAt,
                  status: dbPayload.status || fullT.status,
                  format: dbPayload.format || fullT.format,
                  description: dbPayload.description || fullT.description || '',
                },
                { onConflict: 'id' }
              );
              await Promise.race([upsertPromise, timeoutPromise]);
            }
          }
          notifyAllClients();
        }
      } catch (e) {
        console.warn('Could not sync tournament update to Supabase (saved locally):', e);
      }
    })();

    return true;
  };

  const syncGamesRegistryToSupabase = async (
    nextGames: CustomGame[],
    nextOverrides?: Record<string, GameOverride>
  ): Promise<boolean> => {
    (async () => {
      if (isSupabaseQuotaBlocked) return;
      try {
        const overridesToSave = nextOverrides ?? getStoredGameOverrides();
        const payload = {
          customGames: nextGames,
          gameOverrides: overridesToSave,
        };
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Supabase games timeout')), 5000)
        );
        const upsertPromise = supabase.from('tournaments').upsert(
          {
            id: SYSTEM_CUSTOM_GAMES_ROW_ID,
            title: 'System Games & Overrides Registry',
            game: 'pubg',
            max_players: 1,
            registered_count: 0,
            starts_at: '2099-01-01T00:00:00.000Z',
            status: 'soon',
            format: 'SYSTEM',
            description: JSON.stringify(payload),
          },
          { onConflict: 'id' }
        );
        await Promise.race([upsertPromise, timeoutPromise]);
        notifyAllClients();
      } catch (e) {
        console.warn('Failed to sync games registry to Supabase (preserved locally & server):', e);
      }
    })();
    return true;
  };

  const handleUpdateGameConfig = async (
    gameId: string,
    updates: Partial<GameConfig>
  ): Promise<boolean> => {
    updateGameConfig(gameId, updates);
    const all = getAllGamesList();
    setAllGames(all);
    const overrides = getStoredGameOverrides();
    setGameOverrides(overrides);
    const cGames = getStoredCustomGames();
    setCustomGames(cGames);
    saveGameOverridesToServer(overrides);
    saveCustomGamesToServer(cGames);

    if (updates.standardFee !== undefined || updates.premiumFee !== undefined) {
      setTournaments(prev => {
        const next = prev.map(t => {
          if (t.game !== gameId) return t;
          const isPrem = Boolean(
            t.isPremium ||
            t.id.toLowerCase().includes('premium') ||
            t.title.toLowerCase().includes('premium')
          );
          if (isPrem && updates.premiumFee !== undefined) {
            const premFee = Number(updates.premiumFee);
            return {
              ...t,
              entryFeeRub: premFee,
            };
          } else if (!isPrem && updates.standardFee !== undefined) {
            const stdFee = Number(updates.standardFee);
            return {
              ...t,
              entryFeeRub: stdFee,
            };
          }
          return t;
        });
        saveTournamentsToServer(next);
        return next;
      });
    }

    notifyAllClients();
    syncGamesRegistryToSupabase(cGames, overrides);
    return true;
  };

  const handleResetGameConfig = async (gameId: string): Promise<boolean> => {
    resetGameConfig(gameId);
    setAllGames(getAllGamesList());
    const overrides = getStoredGameOverrides();
    setGameOverrides(overrides);
    const cGames = getStoredCustomGames();
    setCustomGames(cGames);
    saveGameOverridesToServer(overrides);
    saveCustomGamesToServer(cGames);
    notifyAllClients();
    syncGamesRegistryToSupabase(cGames, overrides);
    return true;
  };

  const addCustomGame = async (newGame: CustomGame): Promise<boolean> => {
    const nextGames = [...customGames.filter(g => g.id !== newGame.id), newGame];
    saveCustomGamesToServer(nextGames);
    setCustomGames(nextGames);
    setAllGames(getAllGamesList());
    notifyAllClients();
    syncGamesRegistryToSupabase(nextGames);
    return true;
  };

  const deleteCustomGame = async (gameId: string): Promise<boolean> => {
    const nextGames = customGames.filter(g => g.id !== gameId);
    saveCustomGamesToServer(nextGames);
    setCustomGames(nextGames);
    setAllGames(getAllGamesList());
    notifyAllClients();
    syncGamesRegistryToSupabase(nextGames);
    return true;
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
      customIconUrl: tournamentData.customIconUrl,
      wallpaperUrl: tournamentData.wallpaperUrl,
      customGame: customGameObj,
    };
    const cleanDesc = (tournamentData.description || '').replace(/\n?<!--nb_meta:[\s\S]*?-->/g, '').trim();
    const fullDescription = `${cleanDesc}\n<!--nb_meta:${JSON.stringify(meta)}-->`;

    const newTournament: Tournament = {
      ...tournamentData,
      id: newId,
      description: cleanDesc,
      registeredCount: 0,
      customGame: customGameObj,
    };

    setTournaments(prev => {
      const updated = deduplicateTournaments([newTournament, ...prev.filter(t => t.id !== newId)]);
      saveTournamentsToServer(updated);
      return updated;
    });
    notifyAllClients();

    (async () => {
      if (isSupabaseQuotaBlocked) return;
      try {
        const dbGame = DB_ALLOWED_GAMES.has(newTournament.game) ? newTournament.game : 'pubg';
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Supabase insert timeout')), 5000)
        );
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
        await Promise.race([insertPromise, timeoutPromise]);
        notifyAllClients();
      } catch (e) {
        console.warn('Could not sync tournament creation to Supabase, preserved locally:', e);
      }
    })();

    return true;
  };

  const deleteTournament = async (tournamentId: string): Promise<boolean> => {
    markTournamentAsDeleted(tournamentId);

    setTournaments(prev => {
      const updated = prev.filter(t => t.id !== tournamentId);
      saveTournamentsToServer(updated);
      return updated;
    });

    setRegistrations(prev => {
      const updated = prev.filter(r => r.tournamentId !== tournamentId);
      saveRegistrationsToServer(updated);
      return updated;
    });
    notifyAllClients();

    (async () => {
      if (isSupabaseQuotaBlocked) return;
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Supabase delete timeout')), 5000)
        );
        const deletePromise = Promise.all([
          supabase.from('tournaments').delete().eq('id', tournamentId),
          supabase.from('matches').delete().eq('tournament_id', tournamentId),
          supabase.from('registrations').delete().eq('tournament_id', tournamentId),
        ]);
        await Promise.race([deletePromise, timeoutPromise]);
        notifyAllClients();
      } catch (e) {
        console.warn('Could not sync tournament deletion to Supabase (deleted locally):', e);
      }
    })();

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
        allGames,
        gameOverrides,
        updateGameConfig: handleUpdateGameConfig,
        resetGameConfig: handleResetGameConfig,
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
