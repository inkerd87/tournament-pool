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

  // Fetch from LocalStorage, high-speed Server storage bundle, and Supabase PostgreSQL
  const refreshData = useCallback(async () => {
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

      // 1. High-speed server bundle synchronization (< 15 ms, 1 request for all entities)
      try {
        const bundle = await fetchServerStorageBundle();
        if (bundle && bundle.ok) {
          // A. Deleted tournaments
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

          // B. Tournaments
          if (Array.isArray(bundle.tournaments) && bundle.tournaments.length > 0) {
            const serverTourneys = deduplicateTournaments(bundle.tournaments);
            setTournaments(prev => {
              const map = new Map<string, Tournament>();
              serverTourneys.forEach(t => map.set(t.id, t));
              const deleted = getDeletedTournamentIds();
              prev.forEach(p => {
                if (deleted.has(p.id)) return;
                if (!map.has(p.id)) {
                  map.set(p.id, p);
                }
              });
              const merged = deduplicateTournaments(Array.from(map.values()));
              localStorage.setItem('nb_tournaments_v20', JSON.stringify(merged));
              return merged;
            });
          }

          // C. Custom Games
          if (Array.isArray(bundle.custom_games)) {
            setCustomGames(bundle.custom_games);
            try {
              localStorage.setItem('nb_custom_games_v1', JSON.stringify(bundle.custom_games));
            } catch {}
          }

          // D. Game Overrides
          if (bundle.game_overrides && typeof bundle.game_overrides === 'object') {
            setGameOverrides(bundle.game_overrides);
            try {
              localStorage.setItem('nb_game_overrides_v1', JSON.stringify(bundle.game_overrides));
            } catch {}
          }

          if (bundle.custom_games || bundle.game_overrides) {
            setAllGames(getAllGamesList());
          }

          // E. Matches
          if (bundle.matches && typeof bundle.matches === 'object') {
            setMatches(bundle.matches);
            try {
              localStorage.setItem('nb_matches', JSON.stringify(bundle.matches));
            } catch {}
          }

          // F. Registrations
          if (Array.isArray(bundle.registrations)) {
            setRegistrations(prev => {
              const map = new Map<string, Registration>();
              bundle.registrations.forEach((r: Registration) => map.set(r.id, r));
              prev.forEach(r => {
                if (!map.has(r.id)) map.set(r.id, r);
              });
              const merged = Array.from(map.values());
              localStorage.setItem('nb_registrations_v4', JSON.stringify(merged));
              return merged;
            });
          }
        }
      } catch (e) {
        console.warn('Server bundle sync notice:', e);
      }

      // 2. Supabase registrations synchronization (guarded by circuit breaker against quota/stalls)
      // Supabase is ONLY queried for payment registrations. All tournaments, games, and matches
      // are authoritatively stored on high-speed server storage to avoid dual-master conflicts.
      if (!isSupabaseQuotaBlocked) {
        const createTimeout = (ms = 1200) =>
          new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase fetch timeout')), ms));

        try {
          const regsRes: any = await Promise.race([
            supabase.from('registrations').select('*'),
            createTimeout(1200),
          ]);

          if (regsRes?.error) {
            const errMsg = String(regsRes.error.message || regsRes.error.details || '');
            const errCode = String(regsRes.error.code || regsRes.error.status || '');
            if (errCode === '402' || errCode === 'PGRST402' || errMsg.includes('quota') || errMsg.includes('exceed')) {
              isSupabaseQuotaBlocked = true;
              console.warn('Supabase quota exceeded (HTTP 402). Disabling Supabase polling.');
            }
          } else if (regsRes?.data && Array.isArray(regsRes.data)) {
            const dbRegs: Registration[] = regsRes.data.map((r: any) => ({
              id: r.id,
              tournamentId: r.tournament_id,
              nickname: r.nickname,
              gameAccount: r.game_account,
              email: r.email,
              phone: r.phone || '',
              paidAt: r.paid_at,
            }));

            setRegistrations(prev => {
              const map = new Map<string, Registration>();
              dbRegs.forEach(r => map.set(r.id, r));
              prev.forEach(r => {
                if (!map.has(r.id)) map.set(r.id, r);
              });
              const merged = Array.from(map.values());
              saveRegistrations(merged);
              return merged;
            });
          }
        } catch (e) {
          // Silent fallback to local & server storage bundle
        }
      }
    } catch (e) {
      console.warn('Refresh notice (using cache):', e);
    }
  }, []);

  // Initial fetch, real-time subscription, and automatic live synchronization
  useEffect(() => {
    refreshData();

    // 1. Быстрый опрос турниров (каждые 5 сек на активной вкладке)
    const pollInterval = setInterval(() => {
      if (!document.hidden) {
        refreshData();
      }
    }, 5000);

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
      if (e.key === 'nb_tournaments_v20' || e.key === 'nb_last_sync_time') {
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
          setTimeout(() => reject(new Error('Supabase match timeout')), 1200)
        );
        const upsertPromise = supabase.from('matches').upsert({
          tournament_id: tournamentId,
          room_id: roomId,
          password: password,
          join_url: joinUrl,
          updated_at: matchObj.updatedAt,
        });
        await Promise.race([upsertPromise, timeoutPromise]);
      } catch (e) {
        console.warn('Could not sync match to Supabase (saved locally & server):', e);
      }
    })();

    return true;
  };

  const updateTournamentStartsAt = async (tournamentId: string, startsAt: string): Promise<boolean> => {
    let nextTournaments: Tournament[] = [];
    setTournaments(prev => {
      const updated = prev.map(t => (t.id === tournamentId ? { ...t, startsAt } : t));
      saveTournamentsToServer(updated);
      nextTournaments = updated;
      return updated;
    });
    notifyAllClients();

    // Detached background sync to Supabase
    (async () => {
      if (isSupabaseQuotaBlocked) return;
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Supabase update timeout')), 1200)
        );
        const updatePromise = supabase
          .from('tournaments')
          .update({ starts_at: startsAt })
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
                title: fullT.title,
                game: dbGame,
                max_players: fullT.maxPlayers,
                registered_count: fullT.registeredCount || 0,
                starts_at: startsAt,
                status: fullT.status,
                format: fullT.format,
                description: fullT.description || '',
              },
              { onConflict: 'id' }
            );
            await Promise.race([upsertPromise, timeoutPromise]);
          }
        }
      } catch (e) {
        console.warn('Could not sync tournament starts_at to Supabase (saved locally):', e);
      }
    })();

    return true;
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
            setTimeout(() => reject(new Error('Supabase update timeout')), 1200)
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
          setTimeout(() => reject(new Error('Supabase games timeout')), 1200)
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
          setTimeout(() => reject(new Error('Supabase insert timeout')), 1200)
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
          setTimeout(() => reject(new Error('Supabase delete timeout')), 1200)
        );
        const deletePromise = Promise.all([
          supabase.from('tournaments').delete().eq('id', tournamentId),
          supabase.from('matches').delete().eq('tournament_id', tournamentId),
          supabase.from('registrations').delete().eq('tournament_id', tournamentId),
        ]);
        await Promise.race([deletePromise, timeoutPromise]);
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
