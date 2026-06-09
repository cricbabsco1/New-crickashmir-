import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import type { ExtrasType, WicketType } from '../types';
import WagonWheelModal from '../components/WagonWheelModal';

type SubScreen = 'main' | 'selectOpeners' | 'selectBowlerInit' | 'selectNewBatter' | 'selectNewBowler' | 'inningsBreak' | 'paused' | 'completed';

export default function ScoringScreen() {
  const {
    matches, activeMatchId, teams, players, navigate,
    scoreBall, undoLastBall, selectOpener, selectBowler,
    changeBatter, changeBowler: changeBowlerAction, swapStrike,
    pauseMatch, resumeMatch, endInnings, showWagonWheel,
    generateAwards, broadcastUpdate, roomCode,
  } = useStore();

  const match = matches.find(m => m.id === activeMatchId);

  const [showWicket, setShowWicket] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [scoreTab, setScoreTab] = useState<'scoring' | 'scorecard' | 'commentary'>('scoring');
  const [pendingExtra, setPendingExtra] = useState<ExtrasType | null>(null);
  const [pendingWicket, setPendingWicket] = useState<WicketType | null>(null);
  const [wicketDismissedId, setWicketDismissedId] = useState<string | null>(null);
  const [wicketFielderId, setWicketFielderId] = useState<string | null>(null);
  const [previousBowlerId, setPreviousBowlerId] = useState<string | null>(null);
  const [subScreen, setSubScreen] = useState<SubScreen>('main');
  const [lastBallCount, setLastBallCount] = useState(0);

  // Determine what sub-screen to show based on match state
  const currentInningsData = match ? match.innings[match.currentInnings - 1] : null;

  useEffect(() => {
    if (!match || !currentInningsData) return;

    // Match completed
    if (match.status === 'completed') {
      setSubScreen('completed');
      return;
    }

    // Match paused
    if (match.status === 'paused') {
      setSubScreen('paused');
      return;
    }

    // Innings break
    if (match.status === 'innings_break') {
      setSubScreen('inningsBreak');
      return;
    }

    // Need opening batters
    if (!currentInningsData.currentBatterId || !currentInningsData.nonStrikerId) {
      setSubScreen('selectOpeners');
      return;
    }

    // Need initial bowler
    if (!currentInningsData.currentBowlerId) {
      setSubScreen('selectBowlerInit');
      return;
    }

    // Check if we need new batter (after a wicket)
    const lastBall = currentInningsData.ballEvents[currentInningsData.ballEvents.length - 1];
    const battingXI = currentInningsData.battingTeamId === match.teamAId ? match.teamAPlayingXI : match.teamBPlayingXI;
    if (
      lastBall?.isWicket &&
      lastBall.wicketType !== 'retiredhurt' &&
      currentInningsData.totalWickets < (battingXI.length - 1) &&
      subScreen !== 'selectNewBatter'
    ) {
      // Check if the dismissed batter is still one of the active batters
      const activeBatters = currentInningsData.batters.filter(b => !b.isOut);
      const needNew = activeBatters.length < 2;
      if (needNew) {
        setSubScreen('selectNewBatter');
        return;
      }
    }

    // Check if end of over → need new bowler
    const ballsInOver = currentInningsData.totalBalls % 6;
    const totalBalls = currentInningsData.ballEvents.length;
    if (ballsInOver === 0 && totalBalls > 0 && totalBalls !== lastBallCount && subScreen === 'main') {
      setPreviousBowlerId(currentInningsData.currentBowlerId);
      setLastBallCount(totalBalls);
      setSubScreen('selectNewBowler');
      return;
    }

    // Default: main scoring screen
    if (subScreen !== 'main' && subScreen !== 'selectNewBowler' && subScreen !== 'selectNewBatter') {
      setSubScreen('main');
    }
  }, [
    match?.status,
    currentInningsData?.currentBatterId,
    currentInningsData?.nonStrikerId,
    currentInningsData?.currentBowlerId,
    currentInningsData?.totalWickets,
    currentInningsData?.totalBalls,
    currentInningsData?.ballEvents?.length,
  ]);

  // Broadcast to firebase when scoring
  useEffect(() => {
    if (match && roomCode && currentInningsData) {
      broadcastUpdate();
    }
  }, [
    currentInningsData?.totalRuns,
    currentInningsData?.totalWickets,
    currentInningsData?.totalBalls,
    match?.status,
  ]);

  const vibrate = useCallback((pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  if (!match) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-deep">
        <div className="text-center">
          <p className="text-white text-lg mb-4">No active match</p>
          <button onClick={() => navigate('home')} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold btn-press">Go Home</button>
        </div>
      </div>
    );
  }

  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || 'Unknown';

  // ─── SUB SCREEN: Select Openers ───
  if (subScreen === 'selectOpeners' && currentInningsData) {
    const battingXI = currentInningsData.battingTeamId === match.teamAId ? match.teamAPlayingXI : match.teamBPlayingXI;
    const battingTeam = teams.find(t => t.id === currentInningsData.battingTeamId);
    const selected = [currentInningsData.currentBatterId, currentInningsData.nonStrikerId].filter(Boolean);

    return (
      <div className="h-full bg-bg-deep overflow-y-auto scrollbar-hide">
        <div className="px-5 pt-12 pb-4">
          <h1 className="text-lg font-bold text-white">Select Opening Batters</h1>
          <p className="text-sm text-emerald-400">{battingTeam?.name} batting</p>
          <p className="text-xs text-slate-500 mt-1">
            {selected.length === 0 ? 'Select striker' : selected.length === 1 ? 'Select non-striker' : 'Both selected'}
          </p>
        </div>
        <div className="px-5 space-y-2 pb-8">
          {battingXI.map(pid => {
            const p = players.find(pl => pl.id === pid);
            if (!p) return null;
            const isSelected = selected.includes(pid);
            return (
              <button
                key={pid}
                onClick={() => {
                  if (isSelected) return;
                  if (!currentInningsData.currentBatterId) selectOpener(pid, 'strike');
                  else if (!currentInningsData.nonStrikerId) selectOpener(pid, 'nonstrike');
                }}
                disabled={isSelected}
                className={`w-full rounded-xl p-4 text-left btn-press flex items-center justify-between ${
                  isSelected ? 'bg-emerald-600/20 border-2 border-emerald-500' : 'bg-surface border border-slate-700'
                }`}
              >
                <span className={`font-medium ${isSelected ? 'text-emerald-400' : 'text-white'}`}>{p.name}</span>
                {pid === currentInningsData.currentBatterId && <span className="text-emerald-400 text-xs">🏏 Strike</span>}
                {pid === currentInningsData.nonStrikerId && <span className="text-blue-400 text-xs">Non-strike</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── SUB SCREEN: Select Initial Bowler ───
  if (subScreen === 'selectBowlerInit' && currentInningsData) {
    const bowlingXI = currentInningsData.bowlingTeamId === match.teamAId ? match.teamAPlayingXI : match.teamBPlayingXI;
    const bowlingTeam = teams.find(t => t.id === currentInningsData.bowlingTeamId);

    return (
      <div className="h-full bg-bg-deep overflow-y-auto scrollbar-hide">
        <div className="px-5 pt-12 pb-4">
          <h1 className="text-lg font-bold text-white">Select Opening Bowler</h1>
          <p className="text-sm text-emerald-400">{bowlingTeam?.name} bowling</p>
        </div>
        <div className="px-5 space-y-2 pb-8">
          {bowlingXI.map(pid => {
            const p = players.find(pl => pl.id === pid);
            if (!p) return null;
            return (
              <button
                key={pid}
                onClick={() => {
                  selectBowler(pid);
                  setSubScreen('main');
                }}
                className="w-full bg-surface border border-slate-700 rounded-xl p-4 text-left btn-press flex items-center justify-between"
              >
                <span className="text-white font-medium">{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── SUB SCREEN: Innings Break ───
  if (subScreen === 'inningsBreak') {
    const firstInnings = match.innings[0]!;
    const battingTeam = teams.find(t => t.id === firstInnings.battingTeamId);
    const target = firstInnings.totalRuns + 1;

    return (
      <div className="h-full bg-bg-deep flex flex-col items-center justify-center px-5">
        <div className="bg-surface rounded-2xl p-6 w-full max-w-sm text-center animate-scaleIn">
          <p className="text-4xl mb-4">🏏</p>
          <h2 className="text-xl font-bold text-white mb-2">Innings Break</h2>
          <p className="text-slate-400 mb-1">{battingTeam?.name} scored</p>
          <p className="text-3xl font-black text-emerald-400 mb-4">
            {firstInnings.totalRuns}/{firstInnings.totalWickets}
          </p>
          <p className="text-slate-400 text-sm mb-6">Target: <span className="text-amber-400 font-bold">{target}</span></p>
          <button
            onClick={() => { endInnings(); setSubScreen('selectOpeners'); }}
            className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-lg btn-press"
          >
            Start 2nd Innings
          </button>
        </div>
      </div>
    );
  }

  // ─── SUB SCREEN: Completed ───
  if (subScreen === 'completed') {
    if (match.awards.length === 0) generateAwards();
    navigate('matchSummary');
    return null;
  }

  // ─── SUB SCREEN: Paused ───
  if (subScreen === 'paused') {
    return (
      <div className="h-full bg-bg-deep flex flex-col items-center justify-center px-5">
        <div className="bg-surface rounded-2xl p-6 w-full max-w-sm text-center animate-scaleIn">
          <p className="text-4xl mb-4">⏸️</p>
          <h2 className="text-xl font-bold text-white mb-2">Match Paused</h2>
          <p className="text-slate-400 mb-6">Rain stop / Break</p>
          <button onClick={() => { resumeMatch(); setSubScreen('main'); }} className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold btn-press mb-3">
            Resume Match
          </button>
          <button onClick={() => navigate('home')} className="w-full bg-slate-700 text-white py-3 rounded-xl font-medium btn-press">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (!currentInningsData) return null;

  const innings = currentInningsData;
  const battingTeam = teams.find(t => t.id === innings.battingTeamId);
  const bowlingTeam = teams.find(t => t.id === innings.bowlingTeamId);
  const striker = players.find(p => p.id === innings.currentBatterId);
  const nonStriker = players.find(p => p.id === innings.nonStrikerId);
  const bowler = players.find(p => p.id === innings.currentBowlerId);
  const strikerStats = innings.batters.find(b => b.playerId === innings.currentBatterId);
  const nonStrikerStats = innings.batters.find(b => b.playerId === innings.nonStrikerId);
  const bowlerStats = innings.bowlers.find(b => b.playerId === innings.currentBowlerId);

  const battingXI = innings.battingTeamId === match.teamAId ? match.teamAPlayingXI : match.teamBPlayingXI;
  const bowlingXI = innings.bowlingTeamId === match.teamAId ? match.teamAPlayingXI : match.teamBPlayingXI;
  const usedBatterIds = innings.batters.filter(b => b.isOut).map(b => b.playerId);
  const currentBatterIds = [innings.currentBatterId, innings.nonStrikerId].filter(Boolean);
  const availableBatters = battingXI.filter(id => !usedBatterIds.includes(id) && !currentBatterIds.includes(id));

  // ─── SUB SCREEN: Select New Batter ───
  if (subScreen === 'selectNewBatter') {
    return (
      <div className="h-full bg-bg-deep overflow-y-auto scrollbar-hide">
        <div className="px-5 pt-12 pb-4">
          <h1 className="text-lg font-bold text-white">Select New Batter</h1>
          <p className="text-sm text-red-400">Wicket fallen • {innings.totalWickets} down</p>
        </div>
        <div className="px-5 space-y-2 pb-8">
          {availableBatters.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">No batters available</p>
              <button onClick={() => setSubScreen('main')} className="mt-4 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold btn-press">
                Continue
              </button>
            </div>
          ) : availableBatters.map(pid => {
            const p = players.find(pl => pl.id === pid);
            if (!p) return null;
            return (
              <button
                key={pid}
                onClick={() => {
                  changeBatter(pid);
                  setSubScreen('main');
                }}
                className="w-full bg-surface border border-slate-700 rounded-xl p-4 text-left btn-press"
              >
                <span className="text-white font-medium">{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── SUB SCREEN: Select New Bowler (after over) ───
  if (subScreen === 'selectNewBowler') {
    const excludeId = previousBowlerId || innings.currentBowlerId;

    return (
      <div className="h-full bg-bg-deep overflow-y-auto scrollbar-hide">
        <div className="px-5 pt-12 pb-4">
          <h1 className="text-lg font-bold text-white">Select New Bowler</h1>
          <p className="text-sm text-emerald-400">Over {innings.totalOvers} completed</p>
        </div>
        <div className="px-5 space-y-2 pb-8">
          {bowlingXI.map(pid => {
            const p = players.find(pl => pl.id === pid);
            if (!p) return null;
            const bs = innings.bowlers.find(b => b.playerId === pid);
            const wasLast = pid === excludeId;
            return (
              <button
                key={pid}
                onClick={() => {
                  if (!wasLast) {
                    changeBowlerAction(pid);
                    setPreviousBowlerId(null);
                    setSubScreen('main');
                  }
                }}
                disabled={wasLast}
                className={`w-full rounded-xl p-4 text-left btn-press flex items-center justify-between ${
                  wasLast ? 'bg-slate-800/50 opacity-40' : 'bg-surface border border-slate-700'
                }`}
              >
                <div>
                  <span className="text-white font-medium">{p.name}</span>
                  {wasLast && <span className="text-xs text-red-400 ml-2">(bowled last over)</span>}
                </div>
                {bs && <span className="text-xs text-slate-400">{bs.overs}.{bs.balls}-{bs.runs}-{bs.wickets}</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── MAIN SCORING SCREEN ───

  const recentBalls = innings.ballEvents.slice(-12);

  const getBallDisplay = (ball: typeof recentBalls[0]) => {
    if (ball.isWicket) return { text: 'W', color: 'bg-red-500' };
    if (ball.extras === 'wide') return { text: 'Wd', color: 'bg-amber-600' };
    if (ball.extras === 'noball') return { text: 'Nb', color: 'bg-amber-600' };
    if (ball.runs === 4) return { text: '4', color: 'bg-emerald-500' };
    if (ball.runs === 6) return { text: '6', color: 'bg-purple-500' };
    if (ball.runs === 0) return { text: '0', color: 'bg-slate-600' };
    return { text: String(ball.runs), color: 'bg-blue-500' };
  };

  const handleScore = (runs: number) => {
    const extra = pendingExtra;
    const wicket = pendingWicket;

    if (runs === 4) vibrate([50, 30, 50]);
    else if (runs === 6) vibrate([50, 30, 50, 30, 50]);
    else if (wicket) vibrate([100, 50, 100]);
    else vibrate(30);

    if (wicket) {
      const dismissed = wicketDismissedId || innings.currentBatterId!;
      scoreBall(runs, extra, extra === 'wide' ? 1 : extra === 'noball' ? 1 : 0, true, wicket, dismissed, wicketFielderId);
      setShowWicket(false);
      setPendingWicket(null);
      setWicketDismissedId(null);
      setWicketFielderId(null);
      setPendingExtra(null);
      return;
    }

    if (extra === 'wide') {
      scoreBall(runs, 'wide', 1, false, null, null, null);
    } else if (extra === 'noball') {
      scoreBall(runs, 'noball', 1, false, null, null, null);
    } else if (extra === 'bye') {
      scoreBall(runs, 'bye', 0, false, null, null, null);
    } else if (extra === 'legbye') {
      scoreBall(runs, 'legbye', 0, false, null, null, null);
    } else {
      scoreBall(runs, null, 0, false, null, null, null);
    }

    setPendingExtra(null);
  };

  return (
    <div className="h-full flex flex-col bg-bg-deep">
      {/* Wagon Wheel Modal */}
      {showWagonWheel && <WagonWheelModal />}

      {/* Score Header */}
      <div className="bg-gradient-to-r from-emerald-900/60 to-slate-900 px-4 pt-10 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate('home')} className="text-slate-400 text-sm btn-press">← Back</button>
          <div className="flex items-center gap-2">
            {roomCode && (
              <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                📡 {roomCode}
              </span>
            )}
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
              {match.currentInnings === 1 ? '1st' : '2nd'} INN
            </span>
            <button onClick={() => setShowMenu(!showMenu)} className="text-slate-400 btn-press text-xl">⋮</button>
          </div>
        </div>

        {/* Menu */}
        {showMenu && (
          <div className="absolute right-4 top-20 bg-surface border border-slate-700 rounded-xl p-2 z-50 shadow-xl animate-scaleIn" style={{ zIndex: 100 }}>
            <button onClick={() => { swapStrike(); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-white rounded-lg hover:bg-slate-700">↔ Swap Strike</button>
            <button onClick={() => { setPreviousBowlerId(innings.currentBowlerId); setSubScreen('selectNewBowler'); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-white rounded-lg hover:bg-slate-700">🎯 Change Bowler</button>
            <button onClick={() => { navigate('shareScore'); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-emerald-400 rounded-lg hover:bg-slate-700">📤 Share Score</button>
            <button onClick={() => { pauseMatch(); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-white rounded-lg hover:bg-slate-700">⏸ Pause Match</button>
            <button onClick={() => { undoLastBall(); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-amber-400 rounded-lg hover:bg-slate-700">↩ Undo Last Ball</button>
            {match.currentInnings === 1 && (
              <button onClick={() => { endInnings(); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-red-400 rounded-lg hover:bg-slate-700">🔄 End Innings</button>
            )}
          </div>
        )}

        {/* Score */}
        <div className="text-center">
          <p className="text-xs text-emerald-400 font-medium">{battingTeam?.name}</p>
          <div className="flex items-baseline justify-center gap-1 mt-1">
            <span className="text-4xl font-black text-white">{innings.totalRuns}</span>
            <span className="text-xl text-slate-400">/{innings.totalWickets}</span>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            {innings.totalOvers}.{innings.totalBalls % 6} overs · CRR {innings.currentRunRate}
          </p>
          {innings.target && (
            <p className="text-xs text-amber-400 mt-1">
              Need {Math.max(0, innings.target - innings.totalRuns)} from {Math.max(0, (match.totalOvers * 6) - innings.totalBalls)} balls · RRR {innings.requiredRunRate}
            </p>
          )}
          {match.currentInnings === 2 && match.innings[0] && (
            <p className="text-xs text-slate-500 mt-0.5">
              Target: {match.innings[0].totalRuns + 1}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 flex-shrink-0">
        {(['scoring', 'scorecard', 'commentary'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setScoreTab(tab)}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider ${
              scoreTab === tab ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0">
        {scoreTab === 'scoring' && (
          <div className="px-3 py-3 space-y-3">
            {/* Batters Info */}
            <div className="bg-surface rounded-xl p-3">
              <div className="grid grid-cols-5 text-[10px] text-slate-500 font-medium mb-1.5 px-1">
                <span className="col-span-2">BATTER</span>
                <span className="text-center">R</span>
                <span className="text-center">B</span>
                <span className="text-center">SR</span>
              </div>
              {striker && strikerStats && (
                <div className="grid grid-cols-5 items-center py-1.5 px-1 bg-emerald-500/5 rounded-lg">
                  <span className="col-span-2 text-sm font-semibold text-white truncate">{striker.name} *</span>
                  <span className="text-center text-sm font-bold text-white">{strikerStats.runs}</span>
                  <span className="text-center text-xs text-slate-400">{strikerStats.balls}</span>
                  <span className="text-center text-xs text-slate-400">{strikerStats.balls > 0 ? ((strikerStats.runs / strikerStats.balls) * 100).toFixed(0) : '0'}</span>
                </div>
              )}
              {nonStriker && nonStrikerStats && (
                <div className="grid grid-cols-5 items-center py-1.5 px-1">
                  <span className="col-span-2 text-sm text-slate-300 truncate">{nonStriker.name}</span>
                  <span className="text-center text-sm font-bold text-slate-300">{nonStrikerStats.runs}</span>
                  <span className="text-center text-xs text-slate-400">{nonStrikerStats.balls}</span>
                  <span className="text-center text-xs text-slate-400">{nonStrikerStats.balls > 0 ? ((nonStrikerStats.runs / nonStrikerStats.balls) * 100).toFixed(0) : '0'}</span>
                </div>
              )}
            </div>

            {/* Bowler Info */}
            <div className="bg-surface rounded-xl p-3">
              <div className="grid grid-cols-6 text-[10px] text-slate-500 font-medium mb-1.5 px-1">
                <span className="col-span-2">BOWLER</span>
                <span className="text-center">O</span>
                <span className="text-center">R</span>
                <span className="text-center">W</span>
                <span className="text-center">EC</span>
              </div>
              {bowler && bowlerStats && (
                <div className="grid grid-cols-6 items-center py-1.5 px-1">
                  <span className="col-span-2 text-sm font-semibold text-white truncate">{bowler.name}</span>
                  <span className="text-center text-sm text-slate-300">{bowlerStats.overs}.{bowlerStats.balls}</span>
                  <span className="text-center text-sm text-slate-300">{bowlerStats.runs}</span>
                  <span className="text-center text-sm font-bold text-white">{bowlerStats.wickets}</span>
                  <span className="text-center text-xs text-slate-400">
                    {(bowlerStats.overs > 0 || bowlerStats.balls > 0) ? (bowlerStats.runs / (bowlerStats.overs + bowlerStats.balls / 6)).toFixed(1) : '0.0'}
                  </span>
                </div>
              )}
            </div>

            {/* Ball Timeline */}
            {recentBalls.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-1">
                {recentBalls.map(ball => {
                  const d = getBallDisplay(ball);
                  return (
                    <div key={ball.id} className={`w-8 h-8 rounded-full ${d.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {d.text}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {scoreTab === 'scorecard' && (
          <div className="px-3 py-3 space-y-4">
            <div className="bg-surface rounded-xl p-3">
              <p className="text-xs font-bold text-emerald-400 mb-2">{battingTeam?.name} - Batting</p>
              <div className="grid grid-cols-6 text-[9px] text-slate-500 font-medium mb-1 px-1">
                <span className="col-span-2">BATTER</span><span className="text-center">R</span><span className="text-center">B</span><span className="text-center">4s</span><span className="text-center">6s</span>
              </div>
              {innings.batters.map(b => {
                const p = players.find(pl => pl.id === b.playerId);
                return (
                  <div key={b.playerId} className="grid grid-cols-6 items-center py-1 px-1 border-b border-slate-800 last:border-0">
                    <span className="col-span-2 text-xs text-white truncate">{p?.name}{b.playerId === innings.currentBatterId ? ' *' : ''}</span>
                    <span className="text-center text-xs font-bold text-white">{b.runs}</span>
                    <span className="text-center text-xs text-slate-400">{b.balls}</span>
                    <span className="text-center text-xs text-slate-400">{b.fours}</span>
                    <span className="text-center text-xs text-slate-400">{b.sixes}</span>
                  </div>
                );
              })}
              <div className="mt-2 text-xs text-slate-400 px-1">Extras: {innings.extras.total} (wd {innings.extras.wide}, nb {innings.extras.noball}, b {innings.extras.bye}, lb {innings.extras.legbye})</div>
            </div>
            <div className="bg-surface rounded-xl p-3">
              <p className="text-xs font-bold text-blue-400 mb-2">{bowlingTeam?.name} - Bowling</p>
              <div className="grid grid-cols-6 text-[9px] text-slate-500 font-medium mb-1 px-1">
                <span className="col-span-2">BOWLER</span><span className="text-center">O</span><span className="text-center">R</span><span className="text-center">W</span><span className="text-center">EC</span>
              </div>
              {innings.bowlers.map(b => {
                const eco = (b.overs > 0 || b.balls > 0) ? (b.runs / (b.overs + b.balls / 6)).toFixed(1) : '0.0';
                return (
                  <div key={b.playerId} className="grid grid-cols-6 items-center py-1 px-1 border-b border-slate-800 last:border-0">
                    <span className="col-span-2 text-xs text-white truncate">{getPlayerName(b.playerId)}</span>
                    <span className="text-center text-xs text-slate-300">{b.overs}.{b.balls}</span>
                    <span className="text-center text-xs text-slate-300">{b.runs}</span>
                    <span className="text-center text-xs font-bold text-white">{b.wickets}</span>
                    <span className="text-center text-xs text-slate-400">{eco}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {scoreTab === 'commentary' && (
          <div className="px-3 py-3 space-y-1">
            {[...innings.ballEvents].reverse().slice(0, 30).map(ball => {
              const d = getBallDisplay(ball);
              return (
                <div key={ball.id} className="flex items-start gap-3 py-2 border-b border-slate-800/50">
                  <div className={`w-7 h-7 rounded-full ${d.color} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5`}>{d.text}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white">
                      <span className="text-slate-400">{getPlayerName(ball.bowlerId)}</span> to <span className="font-medium">{getPlayerName(ball.batsmanId)}</span>
                      {ball.extras === 'wide' && ' — WIDE'}
                      {ball.extras === 'noball' && ' — NO BALL'}
                      {ball.isWicket && <span className="text-red-400 font-bold"> — WICKET!</span>}
                      {ball.isBoundary && ball.runs === 4 && <span className="text-emerald-400 font-bold"> — FOUR!</span>}
                      {ball.isBoundary && ball.runs === 6 && <span className="text-purple-400 font-bold"> — SIX!</span>}
                      {!ball.isWicket && !ball.isBoundary && !ball.extras && `, ${ball.runs} run${ball.runs !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Scoring Panel */}
      {scoreTab === 'scoring' && (
        <div className="bg-surface border-t border-slate-800 px-3 py-3 pb-[env(safe-area-inset-bottom)] flex-shrink-0">
          {pendingExtra && (
            <div className="flex items-center justify-between mb-2 bg-amber-500/10 rounded-lg px-3 py-1.5">
              <span className="text-xs font-bold text-amber-400 uppercase">{pendingExtra} + runs:</span>
              <button onClick={() => setPendingExtra(null)} className="text-xs text-slate-400">✕ Cancel</button>
            </div>
          )}

          {showWicket && (
            <div className="mb-3 animate-fadeIn">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-red-400">Select Wicket Type</span>
                <button onClick={() => { setShowWicket(false); setPendingWicket(null); }} className="text-xs text-slate-400">✕</button>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(['bowled', 'caught', 'lbw', 'runout', 'stumped', 'hitwicket', 'retiredhurt'] as WicketType[]).map(wt => (
                  <button
                    key={wt}
                    onClick={() => { setPendingWicket(wt); setShowWicket(false); }}
                    className={`py-2 rounded-lg text-[10px] font-bold btn-press ${
                      pendingWicket === wt ? 'bg-red-500 text-white' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {wt === 'hitwicket' ? 'Hit Wkt' : wt === 'retiredhurt' ? 'Retired' : wt.charAt(0).toUpperCase() + wt.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Run buttons */}
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {[0, 1, 2, 3, 4, 5, 6].map(r => (
              <button
                key={r}
                onClick={() => handleScore(r)}
                className={`py-4 rounded-xl font-black text-xl btn-press ${
                  r === 4 ? 'bg-emerald-600 text-white' :
                  r === 6 ? 'bg-purple-600 text-white' :
                  r === 0 ? 'bg-slate-700 text-slate-300' :
                  'bg-slate-700 text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Quick Extras */}
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            <button
              onClick={() => scoreBall(0, 'wide', 1, false, null, null, null)}
              className="py-2.5 rounded-xl text-xs font-bold btn-press bg-amber-600/20 text-amber-400 border border-amber-600/30"
            >Wide (1)</button>
            <button
              onClick={() => setPendingExtra(pendingExtra === 'noball' ? null : 'noball')}
              className={`py-2.5 rounded-xl text-xs font-bold btn-press ${pendingExtra === 'noball' ? 'bg-amber-600 text-white' : 'bg-amber-600/20 text-amber-400 border border-amber-600/30'}`}
            >No Ball + Runs</button>
          </div>

          {/* Extra modifiers */}
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            {(['wide', 'noball', 'bye', 'legbye'] as ExtrasType[]).map(e => (
              <button
                key={e}
                onClick={() => setPendingExtra(pendingExtra === e ? null : e)}
                className={`py-2 rounded-xl text-[10px] font-bold btn-press ${pendingExtra === e ? 'bg-amber-600 text-white' : 'bg-surface-light text-slate-400 border border-slate-700'}`}
              >
                {e === 'wide' ? 'Wd+' : e === 'noball' ? 'Nb+' : e === 'bye' ? 'Bye' : 'LBye'}
              </button>
            ))}
          </div>

          {/* Wicket & Undo */}
          <div className="grid grid-cols-3 gap-1.5">
            <button onClick={() => setShowWicket(!showWicket)} className="py-2.5 rounded-xl text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 btn-press">
              🔴 Wicket
            </button>
            <button onClick={undoLastBall} className="py-2.5 rounded-xl text-xs font-bold bg-slate-700 text-slate-300 btn-press">
              ↩ Undo
            </button>
            <button onClick={swapStrike} className="py-2.5 rounded-xl text-xs font-bold bg-slate-700 text-slate-300 btn-press">
              ↔ Swap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
