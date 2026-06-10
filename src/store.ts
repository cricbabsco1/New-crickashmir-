import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Team, Player, Match, Screen, InningsData, BallEvent, BatterInnings, BowlerInnings, ExtrasType, WicketType, ShotZone, MatchAward } from './types';
import { broadcastMatchUpdate, subscribeToMatch, generateRoomCode as genRoomCode, checkRoomExists, type SyncData } from './lib/firebase';

function uid(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

function createEmptyInnings(battingTeamId: string, bowlingTeamId: string, target: number | null): InningsData {
  return {
    battingTeamId, bowlingTeamId,
    totalRuns: 0, totalWickets: 0, totalOvers: 0, totalBalls: 0,
    extras: { wide: 0, noball: 0, bye: 0, legbye: 0, total: 0 },
    currentRunRate: 0, requiredRunRate: null, target,
    batters: [], bowlers: [],
    currentBatterId: null, nonStrikerId: null, currentBowlerId: null,
    ballEvents: [], isCompleted: false, fallOfWickets: [],
  };
}

// Deep clone helper
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// BroadcastChannel for real-time sync across tabs/windows on same device
let broadcastChannel: BroadcastChannel | null = null;
try {
  broadcastChannel = new BroadcastChannel('kashmir-cric-sync');
} catch (e) {
  console.log('BroadcastChannel not supported');
}

interface AppState {
  screen: Screen;
  prevScreens: Screen[];
  teams: Team[];
  players: Player[];
  matches: Match[];
  activeMatchId: string | null;
  selectedTeamId: string | null;
  selectedMatchId: string | null;
  selectedPlayerId: string | null;
  matchSetup: {
    step: number;
    teamAId: string | null;
    teamBId: string | null;
    overs: number;
    teamAPlayingXI: string[];
    teamBPlayingXI: string[];
  };
  showWagonWheel: boolean;
  pendingBallForWagon: BallEvent | null;
  isSpectatorMode: boolean;
  roomCode: string | null;
  syncEnabled: boolean;
  lastSyncTime: number;
  unsubscribe: (() => void) | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';

  navigate: (screen: Screen) => void;
  goBack: () => void;

  addTeam: (name: string) => string;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  deleteTeam: (id: string) => void;

  addPlayer: (name: string, teamId: string) => string;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  deletePlayer: (id: string) => void;

  setMatchSetup: (updates: Partial<AppState['matchSetup']>) => void;
  createMatch: () => string;
  setToss: (teamId: string, decision: 'bat' | 'bowl') => void;
  startMatch: () => void;

  initInnings: () => void;
  selectOpener: (batterId: string, position: 'strike' | 'nonstrike') => void;
  selectBowler: (bowlerId: string) => void;

  scoreBall: (runs: number, extras: ExtrasType | null, extrasRuns: number, isWicket: boolean, wicketType: WicketType | null, dismissedPlayerId: string | null, fielderId: string | null) => void;
  setShotZone: (zone: ShotZone) => void;
  undoLastBall: () => void;

  changeBatter: (newBatterId: string) => void;
  changeBowler: (newBowlerId: string) => void;
  swapStrike: () => void;

  pauseMatch: () => void;
  resumeMatch: () => void;
  endInnings: () => void;
  completeMatch: (result: string) => void;

  setMvp: (playerId: string) => void;
  generateAwards: () => void;

  dismissWagonWheel: () => void;
  
  // Sync functions
  broadcastUpdate: () => void;
  joinRoom: (roomCode: string) => Promise<boolean>;
  leaveRoom: () => void;
  createRoom: () => string;
  applySyncData: (data: SyncData) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      screen: 'splash' as Screen,
      prevScreens: [],
      teams: [],
      players: [],
      matches: [],
      activeMatchId: null,
      selectedTeamId: null,
      selectedMatchId: null,
      selectedPlayerId: null,
      matchSetup: { step: 1, teamAId: null, teamBId: null, overs: 20, teamAPlayingXI: [], teamBPlayingXI: [] },
      showWagonWheel: false,
      pendingBallForWagon: null,
      isSpectatorMode: false,
      roomCode: null,
      syncEnabled: false,
      lastSyncTime: 0,
      unsubscribe: null,
      connectionStatus: 'disconnected',

      navigate: (screen) => set(s => ({ screen, prevScreens: [...s.prevScreens, s.screen] })),
      goBack: () => set(s => {
        const prev = [...s.prevScreens];
        const last = prev.pop() || 'home';
        return { screen: last as Screen, prevScreens: prev };
      }),

      addTeam: (name) => {
        const id = uid();
        set(s => ({ teams: [...s.teams, { id, name, playerIds: [], createdAt: Date.now() }] }));
        return id;
      },
      updateTeam: (id, updates) => set(s => ({ teams: s.teams.map(t => t.id === id ? { ...t, ...updates } : t) })),
      deleteTeam: (id) => set(s => ({
        teams: s.teams.filter(t => t.id !== id),
        players: s.players.filter(p => p.teamId !== id),
      })),

      addPlayer: (name, teamId) => {
        const id = uid();
        const player: Player = {
          id, name, teamId, battingStyle: 'right', bowlingStyle: '',
          matches: 0, totalRuns: 0, totalWickets: 0, totalBallsFaced: 0,
          totalBallsBowled: 0, totalRunsConceded: 0, catches: 0,
        };
        set(s => ({
          players: [...s.players, player],
          teams: s.teams.map(t => t.id === teamId ? { ...t, playerIds: [...t.playerIds, id] } : t),
        }));
        return id;
      },
      updatePlayer: (id, updates) => set(s => ({ players: s.players.map(p => p.id === id ? { ...p, ...updates } : p) })),
      deletePlayer: (id) => set(s => ({
        players: s.players.filter(p => p.id !== id),
        teams: s.teams.map(t => ({ ...t, playerIds: t.playerIds.filter(pid => pid !== id) })),
      })),

      setMatchSetup: (updates) => set(s => ({ matchSetup: { ...s.matchSetup, ...updates } })),

      createMatch: () => {
        const s = get();
        const id = uid();
        const roomCode = genRoomCode();
        const match: Match = {
          id,
          teamAId: s.matchSetup.teamAId!,
          teamBId: s.matchSetup.teamBId!,
          teamAPlayingXI: s.matchSetup.teamAPlayingXI,
          teamBPlayingXI: s.matchSetup.teamBPlayingXI,
          totalOvers: s.matchSetup.overs,
          tossWonBy: null, tossDecision: null,
          status: 'toss',
          currentInnings: 0,
          innings: [null, null],
          result: null, mvpId: null, awards: [],
          createdAt: Date.now(), updatedAt: Date.now(),
        };
        set(ss => ({ matches: [...ss.matches, match], activeMatchId: id, roomCode, syncEnabled: true }));
        
        // Immediately broadcast to Firebase so others can join
        const teamIds = [match.teamAId, match.teamBId];
        const teams = s.teams.filter(t => teamIds.includes(t.id));
        const playerIds = [...match.teamAPlayingXI, ...match.teamBPlayingXI];
        const players = s.players.filter(p => playerIds.includes(p.id));
        
        broadcastMatchUpdate(roomCode, {
          match,
          teams,
          players,
          timestamp: Date.now(),
        });
        
        return id;
      },

      setToss: (teamId, decision) => set(s => ({
        matches: s.matches.map(m => m.id === s.activeMatchId ? { ...m, tossWonBy: teamId, tossDecision: decision } : m),
      })),

      startMatch: () => {
        const s = get();
        const match = s.matches.find(m => m.id === s.activeMatchId);
        if (!match) return;
        
        const battingTeamId = match.tossDecision === 'bat' ? match.tossWonBy! : (match.tossWonBy === match.teamAId ? match.teamBId : match.teamAId);
        const bowlingTeamId = battingTeamId === match.teamAId ? match.teamBId : match.teamAId;
        const innings = createEmptyInnings(battingTeamId, bowlingTeamId, null);
        
        set(ss => ({
          matches: ss.matches.map(m => m.id === ss.activeMatchId ? {
            ...m, status: 'live' as const, currentInnings: 1, innings: [innings, null],
          } : m),
        }));
        
        get().broadcastUpdate();
      },

      initInnings: () => {},

      selectOpener: (batterId, position) => {
        const s = get();
        const match = s.matches.find(m => m.id === s.activeMatchId);
        if (!match || match.currentInnings === 0) return;
        
        const inningsIdx = match.currentInnings - 1;
        const oldInnings = match.innings[inningsIdx];
        if (!oldInnings) return;
        
        const innings = deepClone(oldInnings);
        
        const existingBatter = innings.batters.find(b => b.playerId === batterId);
        if (!existingBatter) {
          innings.batters = [...innings.batters, {
            playerId: batterId, runs: 0, balls: 0, fours: 0, sixes: 0,
            isOut: false, dismissal: '', isOnStrike: position === 'strike',
          }];
        }
        
        if (position === 'strike') {
          innings.currentBatterId = batterId;
        } else {
          innings.nonStrikerId = batterId;
        }
        
        const newInnings: [InningsData | null, InningsData | null] = [...match.innings] as [InningsData | null, InningsData | null];
        newInnings[inningsIdx] = innings;
        
        set(ss => ({
          matches: ss.matches.map(m => m.id === ss.activeMatchId ? { ...m, innings: newInnings } : m)
        }));
        
        get().broadcastUpdate();
      },

      selectBowler: (bowlerId) => {
        const s = get();
        const match = s.matches.find(m => m.id === s.activeMatchId);
        if (!match || match.currentInnings === 0) return;
        
        const inningsIdx = match.currentInnings - 1;
        const oldInnings = match.innings[inningsIdx];
        if (!oldInnings) return;
        
        const innings = deepClone(oldInnings);
        
        const existingBowler = innings.bowlers.find(b => b.playerId === bowlerId);
        if (!existingBowler) {
          innings.bowlers = [...innings.bowlers, {
            playerId: bowlerId, overs: 0, balls: 0, maidens: 0,
            runs: 0, wickets: 0, wides: 0, noballs: 0,
          }];
        }
        
        innings.currentBowlerId = bowlerId;
        
        const newInnings: [InningsData | null, InningsData | null] = [...match.innings] as [InningsData | null, InningsData | null];
        newInnings[inningsIdx] = innings;
        
        set(ss => ({
          matches: ss.matches.map(m => m.id === ss.activeMatchId ? { ...m, innings: newInnings } : m)
        }));
        
        get().broadcastUpdate();
      },

      scoreBall: (runs, extras, extrasRuns, isWicket, wicketType, dismissedPlayerId, fielderId) => {
        const s = get();
        const match = s.matches.find(m => m.id === s.activeMatchId);
        if (!match) return;
        
        const inningsIdx = match.currentInnings - 1;
        const oldInnings = match.innings[inningsIdx];
        if (!oldInnings) return;
        
        const innings = deepClone(oldInnings);

        const isLegalDelivery = extras !== 'wide' && extras !== 'noball';
        const batterIdx = innings.batters.findIndex(b => b.playerId === innings.currentBatterId);
        const bowlerIdx = innings.bowlers.findIndex(b => b.playerId === innings.currentBowlerId);
        
        if (batterIdx === -1 || bowlerIdx === -1) return;
        
        const batter = innings.batters[batterIdx];
        const bowler = innings.bowlers[bowlerIdx];

        const ballEvent: BallEvent = {
          id: uid(), matchId: match.id, innings: match.currentInnings,
          over: innings.totalOvers, ballInOver: innings.totalBalls % 6,
          batsmanId: innings.currentBatterId!, bowlerId: innings.currentBowlerId!,
          runs, extras, extrasRuns: extrasRuns,
          isWicket, wicketType, dismissedPlayerId, fielderId,
          shotZone: '', timestamp: Date.now(),
          isBoundary: (runs === 4 || runs === 6) && !extras,
        };

        innings.ballEvents = [...innings.ballEvents, ballEvent];

        // Update runs
        const totalBallRuns = runs + extrasRuns;
        innings.totalRuns += totalBallRuns;

        // Update extras
        if (extras === 'wide') { 
          innings.extras.wide += extrasRuns + runs; 
          innings.extras.total += extrasRuns + runs; 
          bowler.wides += 1; 
          bowler.runs += extrasRuns + runs; 
        }
        if (extras === 'noball') { 
          innings.extras.noball += 1; 
          innings.extras.total += 1; 
          bowler.noballs += 1; 
          bowler.runs += 1 + runs; 
        }
        if (extras === 'bye') { 
          innings.extras.bye += runs; 
          innings.extras.total += runs; 
        }
        if (extras === 'legbye') { 
          innings.extras.legbye += runs; 
          innings.extras.total += runs; 
        }

        // Batter stats
        if (extras !== 'wide') {
          if (isLegalDelivery) batter.balls += 1;
          if (extras !== 'bye' && extras !== 'legbye' && extras !== 'noball') {
            batter.runs += runs;
            if (runs === 4) batter.fours += 1;
            if (runs === 6) batter.sixes += 1;
          }
          if (extras === 'noball') {
            batter.balls += 1;
            batter.runs += runs;
            if (runs === 4) batter.fours += 1;
            if (runs === 6) batter.sixes += 1;
          }
        }

        // Bowler stats
        if (isLegalDelivery) {
          bowler.balls += 1;
          if (bowler.balls === 6) { bowler.overs += 1; bowler.balls = 0; }
          if (!extras) bowler.runs += runs;
        }

        // Wicket
        if (isWicket && wicketType !== 'retiredhurt') {
          if (wicketType !== 'runout') {
            bowler.wickets += 1;
          }
          const dismissed = dismissedPlayerId || innings.currentBatterId!;
          const dismissedBatterIdx = innings.batters.findIndex(b => b.playerId === dismissed);
          if (dismissedBatterIdx !== -1) {
            innings.batters[dismissedBatterIdx].isOut = true;
            innings.batters[dismissedBatterIdx].dismissal = wicketType || 'unknown';
          }
          innings.totalWickets += 1;
          innings.fallOfWickets = [...innings.fallOfWickets, {
            wicket: innings.totalWickets,
            runs: innings.totalRuns,
            overs: `${innings.totalOvers}.${innings.totalBalls % 6}`,
            playerId: dismissed,
          }];
        }

        // Legal delivery count
        if (isLegalDelivery) {
          const newBallCount = (innings.totalBalls % 6) + 1;
          if (newBallCount === 6) {
            innings.totalOvers += 1;
            innings.totalBalls = innings.totalOvers * 6;
          } else {
            innings.totalBalls += 1;
          }
        }

        // Run rate
        const oversCompleted = innings.totalOvers + (innings.totalBalls % 6) / 6;
        innings.currentRunRate = oversCompleted > 0 ? +(innings.totalRuns / oversCompleted).toFixed(2) : 0;
        if (innings.target) {
          const remaining = innings.target - innings.totalRuns;
          const oversLeft = match.totalOvers - oversCompleted;
          innings.requiredRunRate = oversLeft > 0 ? +(remaining / oversLeft).toFixed(2) : 999;
        }

        // Strike rotation
        const totalRunsForStrike = extras === 'wide' ? runs : runs;
        const shouldSwap = totalRunsForStrike % 2 === 1;
        const isEndOfOver = isLegalDelivery && innings.totalBalls % 6 === 0;

        if (!isWicket || wicketType === 'retiredhurt') {
          if (shouldSwap) {
            const temp = innings.currentBatterId;
            innings.currentBatterId = innings.nonStrikerId;
            innings.nonStrikerId = temp;
          }
        }

        if (isEndOfOver && !isWicket) {
          const temp = innings.currentBatterId;
          innings.currentBatterId = innings.nonStrikerId;
          innings.nonStrikerId = temp;
        }

        // Check innings completion
        const allOut = innings.totalWickets >= (match.teamAPlayingXI.length - 1);
        const oversCompleteCheck = innings.totalOvers >= match.totalOvers && innings.totalBalls % 6 === 0;
        const targetChased = innings.target !== null && innings.totalRuns >= innings.target;

        if (allOut || oversCompleteCheck || targetChased) {
          innings.isCompleted = true;
        }

        // Update batters array
        innings.batters[batterIdx] = batter;
        innings.bowlers[bowlerIdx] = bowler;

        const newInnings = [...match.innings] as [InningsData | null, InningsData | null];
        newInnings[inningsIdx] = innings;

        let newStatus = match.status;
        let result = match.result;

        if (innings.isCompleted) {
          if (match.currentInnings === 1) {
            newStatus = 'innings_break';
          } else {
            newStatus = 'completed';
            const first = newInnings[0]!;
            const second = newInnings[1]!;
            const teamA = s.teams.find(t => t.id === match.teamAId)!;
            const teamB = s.teams.find(t => t.id === match.teamBId)!;
            const battingTeamName = second.battingTeamId === match.teamAId ? teamA.name : teamB.name;
            const bowlingTeamName = second.bowlingTeamId === match.teamAId ? teamA.name : teamB.name;
            if (second.totalRuns >= first.totalRuns) {
              const wicketsLeft = (match.teamAPlayingXI.length - 1) - second.totalWickets;
              result = `${battingTeamName} won by ${wicketsLeft} wickets`;
            } else {
              const runDiff = first.totalRuns - second.totalRuns;
              result = `${bowlingTeamName} won by ${runDiff} runs`;
            }
            if (first.totalRuns === second.totalRuns) result = 'Match Tied';
          }
        }

        // Show wagon wheel for boundaries
        const showWagon = (runs === 4 || runs === 6) && !extras;

        set({
          matches: s.matches.map(m => m.id === s.activeMatchId ? {
            ...m, innings: newInnings, status: newStatus, result, updatedAt: Date.now(),
          } : m),
          showWagonWheel: showWagon,
          pendingBallForWagon: showWagon ? ballEvent : null,
        });
        
        get().broadcastUpdate();
      },

      setShotZone: (zone) => {
        const s = get();
        if (!s.pendingBallForWagon) return;
        
        const match = s.matches.find(m => m.id === s.activeMatchId);
        if (!match) return;
        
        const inningsIdx = match.currentInnings - 1;
        const oldInnings = match.innings[inningsIdx];
        if (!oldInnings) return;
        
        const innings = deepClone(oldInnings);
        const ballIdx = innings.ballEvents.findIndex(b => b.id === s.pendingBallForWagon!.id);
        if (ballIdx !== -1) {
          innings.ballEvents[ballIdx].shotZone = zone;
        }
        
        const newInnings = [...match.innings] as [InningsData | null, InningsData | null];
        newInnings[inningsIdx] = innings;
        
        set({
          matches: s.matches.map(m => m.id === s.activeMatchId ? { ...m, innings: newInnings } : m),
          showWagonWheel: false, 
          pendingBallForWagon: null,
        });
      },

      undoLastBall: () => {
        const s = get();
        const match = s.matches.find(m => m.id === s.activeMatchId);
        if (!match) return;
        
        const inningsIdx = match.currentInnings - 1;
        const oldInnings = match.innings[inningsIdx];
        if (!oldInnings || oldInnings.ballEvents.length === 0) return;
        
        const innings = deepClone(oldInnings);
        const lastBall = innings.ballEvents.pop()!;

        const isLegal = lastBall.extras !== 'wide' && lastBall.extras !== 'noball';
        innings.totalRuns -= (lastBall.runs + lastBall.extrasRuns);

        if (lastBall.extras === 'wide') { 
          innings.extras.wide -= (lastBall.extrasRuns + lastBall.runs); 
          innings.extras.total -= (lastBall.extrasRuns + lastBall.runs); 
        }
        if (lastBall.extras === 'noball') { 
          innings.extras.noball -= 1; 
          innings.extras.total -= 1; 
        }
        if (lastBall.extras === 'bye') { 
          innings.extras.bye -= lastBall.runs; 
          innings.extras.total -= lastBall.runs; 
        }
        if (lastBall.extras === 'legbye') { 
          innings.extras.legbye -= lastBall.runs; 
          innings.extras.total -= lastBall.runs; 
        }

        if (isLegal) {
          if (innings.totalBalls % 6 === 0 && innings.totalOvers > 0) {
            innings.totalOvers -= 1;
            innings.totalBalls = innings.totalOvers * 6 + 5;
          } else {
            innings.totalBalls -= 1;
          }
        }

        // Restore batter
        const batterIdx = innings.batters.findIndex(b => b.playerId === lastBall.batsmanId);
        if (batterIdx !== -1 && lastBall.extras !== 'wide') {
          if (isLegal) innings.batters[batterIdx].balls -= 1;
          if (!lastBall.extras || lastBall.extras === 'noball') {
            innings.batters[batterIdx].runs -= lastBall.runs;
            if (lastBall.runs === 4) innings.batters[batterIdx].fours -= 1;
            if (lastBall.runs === 6) innings.batters[batterIdx].sixes -= 1;
          }
        }

        // Restore bowler
        const bowlerIdx = innings.bowlers.findIndex(b => b.playerId === lastBall.bowlerId);
        if (bowlerIdx !== -1) {
          const bowler = innings.bowlers[bowlerIdx];
          if (isLegal) {
            if (bowler.balls === 0 && bowler.overs > 0) { 
              bowler.overs -= 1; 
              bowler.balls = 5; 
            } else {
              bowler.balls -= 1;
            }
          }
          if (lastBall.extras === 'wide') { 
            bowler.wides -= 1; 
            bowler.runs -= (lastBall.extrasRuns + lastBall.runs); 
          }
          if (lastBall.extras === 'noball') { 
            bowler.noballs -= 1; 
            bowler.runs -= (1 + lastBall.runs); 
          }
          if (!lastBall.extras) bowler.runs -= lastBall.runs;
        }

        if (lastBall.isWicket && lastBall.wicketType !== 'retiredhurt') {
          innings.totalWickets -= 1;
          if (lastBall.wicketType !== 'runout' && bowlerIdx !== -1) {
            innings.bowlers[bowlerIdx].wickets -= 1;
          }
          const dismissed = lastBall.dismissedPlayerId || lastBall.batsmanId;
          const dBatterIdx = innings.batters.findIndex(b => b.playerId === dismissed);
          if (dBatterIdx !== -1) { 
            innings.batters[dBatterIdx].isOut = false; 
            innings.batters[dBatterIdx].dismissal = ''; 
          }
          innings.fallOfWickets.pop();
        }

        innings.isCompleted = false;
        innings.currentBatterId = lastBall.batsmanId;
        
        // Restore strike position
        const nonStriker = innings.batters.find(b => !b.isOut && b.playerId !== lastBall.batsmanId);
        if (nonStriker) innings.nonStrikerId = nonStriker.playerId;
        innings.currentBowlerId = lastBall.bowlerId;

        const oversCompleted = innings.totalOvers + (innings.totalBalls % 6) / 6;
        innings.currentRunRate = oversCompleted > 0 ? +(innings.totalRuns / oversCompleted).toFixed(2) : 0;

        const newInnings = [...match.innings] as [InningsData | null, InningsData | null];
        newInnings[inningsIdx] = innings;
        
        set({
          matches: s.matches.map(m => m.id === s.activeMatchId ? {
            ...m, innings: newInnings, status: 'live' as const, result: null, updatedAt: Date.now(),
          } : m),
        });
        
        get().broadcastUpdate();
      },

      changeBatter: (newBatterId) => {
        const s = get();
        const match = s.matches.find(m => m.id === s.activeMatchId);
        if (!match) return;
        
        const inningsIdx = match.currentInnings - 1;
        const oldInnings = match.innings[inningsIdx];
        if (!oldInnings) return;
        
        const innings = deepClone(oldInnings);
        
        const existing = innings.batters.find(b => b.playerId === newBatterId);
        if (!existing) {
          innings.batters = [...innings.batters, {
            playerId: newBatterId, runs: 0, balls: 0, fours: 0, sixes: 0,
            isOut: false, dismissal: '', isOnStrike: true,
          }];
        }
        
        // Determine who got out
        const lastBall = innings.ballEvents[innings.ballEvents.length - 1];
        if (lastBall && lastBall.isWicket) {
          const dismissed = lastBall.dismissedPlayerId || lastBall.batsmanId;
          if (dismissed === innings.currentBatterId) {
            innings.currentBatterId = newBatterId;
          } else if (dismissed === innings.nonStrikerId) {
            innings.nonStrikerId = newBatterId;
          } else {
            innings.currentBatterId = newBatterId;
          }
        } else {
          innings.currentBatterId = newBatterId;
        }
        
        const newInnings = [...match.innings] as [InningsData | null, InningsData | null];
        newInnings[inningsIdx] = innings;
        
        set({
          matches: s.matches.map(m => m.id === s.activeMatchId ? { ...m, innings: newInnings } : m)
        });
        
        get().broadcastUpdate();
      },

      changeBowler: (newBowlerId) => {
        const s = get();
        const match = s.matches.find(m => m.id === s.activeMatchId);
        if (!match) return;
        
        const inningsIdx = match.currentInnings - 1;
        const oldInnings = match.innings[inningsIdx];
        if (!oldInnings) return;
        
        const innings = deepClone(oldInnings);
        
        const existing = innings.bowlers.find(b => b.playerId === newBowlerId);
        if (!existing) {
          innings.bowlers = [...innings.bowlers, {
            playerId: newBowlerId, overs: 0, balls: 0, maidens: 0,
            runs: 0, wickets: 0, wides: 0, noballs: 0,
          }];
        }
        innings.currentBowlerId = newBowlerId;
        
        const newInnings = [...match.innings] as [InningsData | null, InningsData | null];
        newInnings[inningsIdx] = innings;
        
        set({
          matches: s.matches.map(m => m.id === s.activeMatchId ? { ...m, innings: newInnings } : m)
        });
        
        get().broadcastUpdate();
      },

      swapStrike: () => {
        const s = get();
        const match = s.matches.find(m => m.id === s.activeMatchId);
        if (!match) return;
        
        const inningsIdx = match.currentInnings - 1;
        const oldInnings = match.innings[inningsIdx];
        if (!oldInnings) return;
        
        const innings = deepClone(oldInnings);
        const temp = innings.currentBatterId;
        innings.currentBatterId = innings.nonStrikerId;
        innings.nonStrikerId = temp;
        
        const newInnings = [...match.innings] as [InningsData | null, InningsData | null];
        newInnings[inningsIdx] = innings;
        
        set({
          matches: s.matches.map(m => m.id === s.activeMatchId ? { ...m, innings: newInnings } : m)
        });
      },

      pauseMatch: () => {
        set(s => ({
          matches: s.matches.map(m => m.id === s.activeMatchId ? { ...m, status: 'paused' as const } : m),
        }));
        get().broadcastUpdate();
      },

      resumeMatch: () => {
        set(s => ({
          matches: s.matches.map(m => m.id === s.activeMatchId ? { ...m, status: 'live' as const } : m),
        }));
        get().broadcastUpdate();
      },

      endInnings: () => {
        const s = get();
        const match = s.matches.find(m => m.id === s.activeMatchId);
        if (!match) return;
        
        const firstInnings = deepClone(match.innings[0]!);
        firstInnings.isCompleted = true;
        const target = firstInnings.totalRuns + 1;
        const secondInnings = createEmptyInnings(firstInnings.bowlingTeamId, firstInnings.battingTeamId, target);
        const newInnings: [InningsData | null, InningsData | null] = [firstInnings, secondInnings];
        
        set({
          matches: s.matches.map(m => m.id === s.activeMatchId ? {
            ...m, innings: newInnings, currentInnings: 2, status: 'live' as const,
          } : m),
        });
        
        get().broadcastUpdate();
      },

      completeMatch: (result) => {
        set(s => ({
          matches: s.matches.map(m => m.id === s.activeMatchId ? { ...m, status: 'completed' as const, result } : m),
        }));
        get().broadcastUpdate();
      },

      setMvp: (playerId) => set(s => ({
        matches: s.matches.map(m => m.id === s.activeMatchId ? { ...m, mvpId: playerId } : m),
      })),

      generateAwards: () => {
        const s = get();
        const match = s.matches.find(m => m.id === s.activeMatchId);
        if (!match) return;
        
        const allBatters: BatterInnings[] = [];
        const allBowlers: BowlerInnings[] = [];
        const catchMap: Record<string, number> = {};
        
        match.innings.forEach(inn => {
          if (!inn) return;
          allBatters.push(...inn.batters);
          allBowlers.push(...inn.bowlers);
          inn.ballEvents.forEach(be => {
            if (be.isWicket && be.wicketType === 'caught' && be.fielderId) {
              catchMap[be.fielderId] = (catchMap[be.fielderId] || 0) + 1;
            }
          });
        });

        const awards: MatchAward[] = [];

        // Highest Runs
        const topBat = [...allBatters].sort((a, b) => b.runs - a.runs)[0];
        if (topBat) awards.push({ type: 'highestRuns', playerId: topBat.playerId, value: `${topBat.runs} (${topBat.balls})` });

        // Best Bowler
        const topBowl = [...allBowlers].filter(b => b.wickets > 0).sort((a, b) => b.wickets - a.wickets || a.runs - b.runs)[0];
        if (topBowl) awards.push({ type: 'bestBowler', playerId: topBowl.playerId, value: `${topBowl.wickets}/${topBowl.runs}` });

        // Best SR
        const topSR = [...allBatters].filter(b => b.balls >= 6).sort((a, b) => (b.runs / b.balls) - (a.runs / a.balls))[0];
        if (topSR) awards.push({ type: 'bestStrikeRate', playerId: topSR.playerId, value: `SR ${((topSR.runs / topSR.balls) * 100).toFixed(1)}` });

        // Best Economy
        const topEco = [...allBowlers].filter(b => (b.overs * 6 + b.balls) >= 6).sort((a, b) => {
          const ecoA = a.runs / ((a.overs * 6 + a.balls) / 6);
          const ecoB = b.runs / ((b.overs * 6 + b.balls) / 6);
          return ecoA - ecoB;
        })[0];
        if (topEco) {
          const eco = topEco.runs / ((topEco.overs * 6 + topEco.balls) / 6);
          awards.push({ type: 'bestEconomy', playerId: topEco.playerId, value: `Eco ${eco.toFixed(2)}` });
        }

        // Best Fielder
        const topFielder = Object.entries(catchMap).sort(([, a], [, b]) => b - a)[0];
        if (topFielder) awards.push({ type: 'bestFielder', playerId: topFielder[0], value: `${topFielder[1]} catches` });

        // MVP
        let mvpScore: { id: string; score: number }[] = [];
        allBatters.forEach(b => {
          const sr = b.balls > 0 ? (b.runs / b.balls) * 100 : 0;
          const score = b.runs * 1 + b.fours * 1.5 + b.sixes * 2 + (sr > 150 ? 10 : sr > 120 ? 5 : 0);
          const existing = mvpScore.find(m => m.id === b.playerId);
          if (existing) existing.score += score;
          else mvpScore.push({ id: b.playerId, score });
        });
        allBowlers.forEach(b => {
          const totalBalls = b.overs * 6 + b.balls;
          const eco = totalBalls > 0 ? (b.runs / (totalBalls / 6)) : 0;
          const score = b.wickets * 20 + b.maidens * 5 + (eco < 6 ? 10 : eco < 8 ? 5 : 0);
          const existing = mvpScore.find(m => m.id === b.playerId);
          if (existing) existing.score += score;
          else mvpScore.push({ id: b.playerId, score });
        });
        Object.entries(catchMap).forEach(([id, c]) => {
          const existing = mvpScore.find(m => m.id === id);
          if (existing) existing.score += c * 10;
          else mvpScore.push({ id, score: c * 10 });
        });

        const mvp = mvpScore.sort((a, b) => b.score - a.score)[0];
        if (mvp) awards.push({ type: 'mvp', playerId: mvp.id, value: 'MVP' });

        set({
          matches: s.matches.map(m => m.id === s.activeMatchId ? { ...m, awards, mvpId: mvp?.id || null } : m),
        });
      },

      dismissWagonWheel: () => set({ showWagonWheel: false, pendingBallForWagon: null }),
      
      // Real-time sync functions using Firebase
      broadcastUpdate: () => {
        const s = get();
        const match = s.matches.find(m => m.id === s.activeMatchId);
        if (!match || !s.roomCode) return;
        
        // Only broadcast if not in spectator mode
        if (s.isSpectatorMode) return;
        
        // Get relevant teams and players for this match
        const teamIds = [match.teamAId, match.teamBId];
        const teams = s.teams.filter(t => teamIds.includes(t.id));
        const playerIds = [...match.teamAPlayingXI, ...match.teamBPlayingXI];
        const players = s.players.filter(p => playerIds.includes(p.id));
        
        const syncData: SyncData = {
          match,
          teams,
          players,
          timestamp: Date.now(),
        };
        
        // Broadcast to Firebase (cross-device)
        broadcastMatchUpdate(s.roomCode, syncData);
        
        // Also broadcast to local tabs
        if (broadcastChannel) {
          broadcastChannel.postMessage({
            type: 'MATCH_UPDATE',
            ...syncData,
            roomCode: s.roomCode,
          });
        }
        
        set({ lastSyncTime: Date.now() });
      },
      
      joinRoom: async (roomCode: string) => {
        const s = get();
        
        // Clean up existing subscription
        if (s.unsubscribe) {
          s.unsubscribe();
        }
        
        set({ connectionStatus: 'connecting' });
        
        // Check if room exists first
        const existingData = await checkRoomExists(roomCode.toUpperCase());
        if (!existingData) {
          set({ connectionStatus: 'disconnected' });
          return false;
        }
        
        // Apply initial data
        get().applySyncData(existingData);
        
        // Subscribe to room updates
        const unsubscribe = subscribeToMatch(roomCode.toUpperCase(), (data) => {
          get().applySyncData(data);
        });
        
        set({
          roomCode: roomCode.toUpperCase(),
          isSpectatorMode: true,
          syncEnabled: true,
          unsubscribe,
          connectionStatus: 'connected',
        });
        
        return true;
      },
      
      leaveRoom: () => {
        const s = get();
        if (s.unsubscribe) {
          s.unsubscribe();
        }
        set({
          isSpectatorMode: false,
          syncEnabled: false,
          unsubscribe: null,
          connectionStatus: 'disconnected',
        });
      },
      
      createRoom: () => {
        const code = genRoomCode();
        set({ roomCode: code, syncEnabled: true, isSpectatorMode: false });
        return code;
      },
      
      applySyncData: (data: SyncData) => {
        const s = get();
        
        // Only apply if we're in spectator mode
        if (!s.isSpectatorMode && s.activeMatchId !== data.match.id) return;
        
        // Merge teams (add new ones, update existing)
        const newTeams = [...s.teams];
        data.teams.forEach(t => {
          const idx = newTeams.findIndex(nt => nt.id === t.id);
          if (idx >= 0) newTeams[idx] = t;
          else newTeams.push(t);
        });
        
        // Merge players
        const newPlayers = [...s.players];
        data.players.forEach(p => {
          const idx = newPlayers.findIndex(np => np.id === p.id);
          if (idx >= 0) newPlayers[idx] = p;
          else newPlayers.push(p);
        });
        
        // Update or add match
        const newMatches = [...s.matches];
        const matchIdx = newMatches.findIndex(m => m.id === data.match.id);
        if (matchIdx >= 0) newMatches[matchIdx] = data.match;
        else newMatches.push(data.match);
        
        set({
          teams: newTeams,
          players: newPlayers,
          matches: newMatches,
          activeMatchId: data.match.id,
          lastSyncTime: data.timestamp,
        });
      },
    }),
    {
      name: 'kashmir-cric-storage',
      partialize: (state) => ({
        teams: state.teams,
        players: state.players,
        matches: state.matches,
        activeMatchId: state.activeMatchId,
        roomCode: state.roomCode,
      }),
    }
  )
);

// Listen for broadcasts from other tabs on same device
if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    const { type, match, teams, players, timestamp } = event.data;
    if (type === 'MATCH_UPDATE' && match) {
      const state = useStore.getState();
      if (state.isSpectatorMode) {
        useStore.getState().applySyncData({ match, teams, players, timestamp });
      }
    }
  };
}
