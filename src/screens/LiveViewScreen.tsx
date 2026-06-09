import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { subscribeToMatch } from '../lib/firebase';

export default function LiveViewScreen() {
  const { 
    matches, teams, players, activeMatchId, navigate, goBack, 
    roomCode, isSpectatorMode, applySyncData, leaveRoom, connectionStatus 
  } = useStore();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const match = matches.find(m => m.id === activeMatchId);

  // Subscribe to real-time updates via Firebase
  useEffect(() => {
    if (!roomCode) return;
    
    console.log('[LiveView] Subscribing to room:', roomCode);
    
    const unsubscribe = subscribeToMatch(roomCode, (data) => {
      console.log('[LiveView] Received update:', data.timestamp);
      applySyncData(data);
      setLastUpdate(new Date());
    });
    
    return () => {
      console.log('[LiveView] Unsubscribing from room:', roomCode);
      unsubscribe();
    };
  }, [roomCode]);

  // Cleanup on back
  const handleBack = () => {
    if (isSpectatorMode) {
      leaveRoom();
    }
    goBack();
  };

  if (!match) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-bg-deep px-5">
        <p className="text-4xl mb-4">📺</p>
        <h2 className="text-xl font-bold text-white mb-2">No Live Match</h2>
        <p className="text-slate-400 text-center mb-6">
          {roomCode ? 'Waiting for match data...' : 'Ask the scorer to share the room code'}
        </p>
        {roomCode && (
          <div className="flex items-center gap-2 mb-4">
            <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm text-amber-400">Connecting to room {roomCode}...</span>
          </div>
        )}
        <button onClick={() => navigate('home')} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold btn-press">
          Go Home
        </button>
      </div>
    );
  }

  const currentInnings = match.innings[match.currentInnings - 1];
  const battingTeam = teams.find(t => t.id === currentInnings?.battingTeamId);
  const teamA = teams.find(t => t.id === match.teamAId);
  const teamB = teams.find(t => t.id === match.teamBId);

  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || 'Unknown';

  const striker = currentInnings?.batters.find(b => b.playerId === currentInnings.currentBatterId);
  const nonStriker = currentInnings?.batters.find(b => b.playerId === currentInnings.nonStrikerId);
  const currentBowler = currentInnings?.bowlers.find(b => b.playerId === currentInnings.currentBowlerId);

  const recentBalls = currentInnings?.ballEvents.slice(-12) || [];

  const getBallDisplay = (ball: typeof recentBalls[0]) => {
    if (ball.isWicket) return { text: 'W', color: 'bg-red-500' };
    if (ball.extras === 'wide') return { text: 'Wd', color: 'bg-amber-600' };
    if (ball.extras === 'noball') return { text: 'Nb', color: 'bg-amber-600' };
    if (ball.runs === 4) return { text: '4', color: 'bg-emerald-500' };
    if (ball.runs === 6) return { text: '6', color: 'bg-purple-500' };
    if (ball.runs === 0) return { text: '0', color: 'bg-slate-600' };
    return { text: String(ball.runs), color: 'bg-blue-500' };
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide bg-bg-deep">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-900/40 to-slate-900 px-5 pt-12 pb-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={handleBack} className="text-slate-400 btn-press">← Back</button>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full animate-pulse ${
              connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-red-500'
            }`} />
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
              {connectionStatus === 'connected' ? '● Live' : 'Connecting...'}
            </span>
          </div>
        </div>
        
        <p className="text-xs text-slate-400 text-center mb-1">
          {teamA?.name} vs {teamB?.name}
        </p>
        {roomCode && (
          <p className="text-xs text-emerald-400 text-center">
            Room: <span className="font-mono font-bold">{roomCode}</span>
          </p>
        )}
        {lastUpdate && (
          <p className="text-[10px] text-slate-600 text-center mt-1">
            Last update: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Match Status */}
      {match.status === 'completed' && (
        <div className="px-5 py-4 bg-emerald-900/20 border-b border-emerald-500/20">
          <p className="text-center text-emerald-400 font-bold">{match.result}</p>
        </div>
      )}

      {match.status === 'innings_break' && (
        <div className="px-5 py-4 bg-amber-900/20 border-b border-amber-500/20">
          <p className="text-center text-amber-400 font-bold">Innings Break</p>
        </div>
      )}

      {match.status === 'paused' && (
        <div className="px-5 py-4 bg-slate-800 border-b border-slate-700">
          <p className="text-center text-slate-400 font-bold">Match Paused</p>
        </div>
      )}

      {/* Score Display */}
      {currentInnings && (
        <div className="px-5 py-6">
          {/* Main Score */}
          <div className="text-center mb-6">
            <p className="text-sm text-emerald-400 font-medium mb-1">{battingTeam?.name}</p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-6xl font-black text-white">{currentInnings.totalRuns}</span>
              <span className="text-3xl text-slate-400">/{currentInnings.totalWickets}</span>
            </div>
            <p className="text-lg text-slate-400 mt-1">
              {currentInnings.totalOvers}.{currentInnings.totalBalls % 6} overs
            </p>
            <p className="text-sm text-slate-500">
              Run Rate: {currentInnings.currentRunRate}
            </p>
            {currentInnings.target && (
              <div className="mt-3 bg-amber-900/20 rounded-xl px-4 py-2 inline-block">
                <p className="text-sm text-amber-400">
                  Need <span className="font-bold">{currentInnings.target - currentInnings.totalRuns}</span> runs from{' '}
                  <span className="font-bold">{(match.totalOvers * 6) - currentInnings.totalBalls}</span> balls
                </p>
                <p className="text-xs text-amber-500">RRR: {currentInnings.requiredRunRate}</p>
              </div>
            )}
          </div>

          {/* Ball Timeline */}
          <div className="flex justify-center gap-1.5 mb-6 overflow-x-auto scrollbar-hide py-1">
            {recentBalls.map(ball => {
              const d = getBallDisplay(ball);
              return (
                <div key={ball.id} className={`w-9 h-9 rounded-full ${d.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 animate-scaleIn`}>
                  {d.text}
                </div>
              );
            })}
            {recentBalls.length === 0 && (
              <p className="text-xs text-slate-500">No balls bowled yet</p>
            )}
          </div>

          {/* Batters */}
          <div className="bg-surface rounded-xl p-4 mb-3">
            <div className="grid grid-cols-5 text-xs text-slate-500 font-medium mb-2">
              <span className="col-span-2">BATTER</span>
              <span className="text-center">R</span>
              <span className="text-center">B</span>
              <span className="text-center">SR</span>
            </div>
            {striker && (
              <div className="grid grid-cols-5 items-center py-2 bg-emerald-500/5 rounded-lg px-2 mb-1">
                <span className="col-span-2 font-semibold text-white truncate">
                  {getPlayerName(striker.playerId)} *
                </span>
                <span className="text-center font-bold text-white">{striker.runs}</span>
                <span className="text-center text-slate-400">{striker.balls}</span>
                <span className="text-center text-slate-400">
                  {striker.balls > 0 ? ((striker.runs / striker.balls) * 100).toFixed(0) : '0'}
                </span>
              </div>
            )}
            {nonStriker && (
              <div className="grid grid-cols-5 items-center py-2 px-2">
                <span className="col-span-2 text-slate-300 truncate">
                  {getPlayerName(nonStriker.playerId)}
                </span>
                <span className="text-center font-bold text-slate-300">{nonStriker.runs}</span>
                <span className="text-center text-slate-400">{nonStriker.balls}</span>
                <span className="text-center text-slate-400">
                  {nonStriker.balls > 0 ? ((nonStriker.runs / nonStriker.balls) * 100).toFixed(0) : '0'}
                </span>
              </div>
            )}
            {!striker && !nonStriker && (
              <p className="text-xs text-slate-500 text-center py-2">Waiting for batters...</p>
            )}
          </div>

          {/* Bowler */}
          {currentBowler && (
            <div className="bg-surface rounded-xl p-4 mb-3">
              <div className="grid grid-cols-6 text-xs text-slate-500 font-medium mb-2">
                <span className="col-span-2">BOWLER</span>
                <span className="text-center">O</span>
                <span className="text-center">R</span>
                <span className="text-center">W</span>
                <span className="text-center">EC</span>
              </div>
              <div className="grid grid-cols-6 items-center py-2">
                <span className="col-span-2 font-semibold text-white truncate">
                  {getPlayerName(currentBowler.playerId)}
                </span>
                <span className="text-center text-slate-300">{currentBowler.overs}.{currentBowler.balls}</span>
                <span className="text-center text-slate-300">{currentBowler.runs}</span>
                <span className="text-center font-bold text-white">{currentBowler.wickets}</span>
                <span className="text-center text-slate-400">
                  {(currentBowler.overs > 0 || currentBowler.balls > 0) 
                    ? (currentBowler.runs / (currentBowler.overs + currentBowler.balls / 6)).toFixed(1) 
                    : '0.0'}
                </span>
              </div>
            </div>
          )}

          {/* Both Innings Scores */}
          {match.innings[0] && (
            <div className="bg-surface rounded-xl p-4">
              <p className="text-xs text-slate-500 font-medium mb-2">MATCH SCORE</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">
                    {teams.find(t => t.id === match.innings[0]!.battingTeamId)?.name}
                  </span>
                  <span className="font-bold text-white">
                    {match.innings[0].totalRuns}/{match.innings[0].totalWickets}
                    <span className="text-slate-500 text-sm ml-1">
                      ({match.innings[0].totalOvers}.{match.innings[0].totalBalls % 6})
                    </span>
                  </span>
                </div>
                {match.innings[1] && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">
                      {teams.find(t => t.id === match.innings[1]!.battingTeamId)?.name}
                    </span>
                    <span className="font-bold text-white">
                      {match.innings[1].totalRuns}/{match.innings[1].totalWickets}
                      <span className="text-slate-500 text-sm ml-1">
                        ({match.innings[1].totalOvers}.{match.innings[1].totalBalls % 6})
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-5 pb-8 text-center">
        <p className="text-xs text-slate-600">
          ⚡ Real-time updates via Firebase
        </p>
      </div>
    </div>
  );
}
