import { useState } from 'react';
import { useStore } from '../store';

export default function MatchSummaryScreen() {
  const { matches, teams, players, activeMatchId, navigate, generateAwards, setMvp } = useStore();
  const [showMvpPicker, setShowMvpPicker] = useState(false);

  const match = matches.find(m => m.id === activeMatchId);
  if (!match) return <div className="h-full flex items-center justify-center text-white">No match</div>;

  const teamA = teams.find(t => t.id === match.teamAId);
  const teamB = teams.find(t => t.id === match.teamBId);
  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || 'Unknown';

  if (match.awards.length === 0) {
    generateAwards();
  }

  const allPlayerIds = [...match.teamAPlayingXI, ...match.teamBPlayingXI];

  const awardIcons: Record<string, string> = {
    mvp: '🏆',
    highestRuns: '🏏',
    bestBowler: '🎯',
    bestStrikeRate: '⚡',
    bestEconomy: '🎱',
    bestFielder: '🧤',
  };

  const awardLabels: Record<string, string> = {
    mvp: 'Man of the Match',
    highestRuns: 'Highest Score',
    bestBowler: 'Best Bowler',
    bestStrikeRate: 'Best Strike Rate',
    bestEconomy: 'Best Economy',
    bestFielder: 'Best Fielder',
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide bg-bg-deep">
      {/* Hero */}
      <div className="bg-gradient-to-b from-emerald-900/60 via-emerald-900/20 to-transparent px-5 pt-12 pb-8 text-center">
        <div className="animate-scaleIn">
          <p className="text-5xl mb-3">🏆</p>
          <h1 className="text-2xl font-black text-white mb-2">Match Complete!</h1>
          {match.result && (
            <p className="text-emerald-400 font-bold text-lg">{match.result}</p>
          )}
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className={`rounded-2xl p-4 ${match.result?.includes(teamA?.name || '---') ? 'bg-emerald-600/20 border border-emerald-500/30' : 'bg-surface'}`}>
            <p className="text-xs text-slate-400 mb-1">{teamA?.name}</p>
            {match.innings[0] && (
              <p className="text-2xl font-black text-white">
                {match.innings[0].battingTeamId === match.teamAId
                  ? `${match.innings[0].totalRuns}/${match.innings[0].totalWickets}`
                  : match.innings[1] ? `${match.innings[1].totalRuns}/${match.innings[1].totalWickets}` : '-'}
              </p>
            )}
          </div>
          <div className={`rounded-2xl p-4 ${match.result?.includes(teamB?.name || '---') ? 'bg-emerald-600/20 border border-emerald-500/30' : 'bg-surface'}`}>
            <p className="text-xs text-slate-400 mb-1">{teamB?.name}</p>
            {match.innings[0] && (
              <p className="text-2xl font-black text-white">
                {match.innings[0].battingTeamId === match.teamBId
                  ? `${match.innings[0].totalRuns}/${match.innings[0].totalWickets}`
                  : match.innings[1] ? `${match.innings[1].totalRuns}/${match.innings[1].totalWickets}` : '-'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-12 space-y-4">
        {/* MVP Card */}
        {match.mvpId && (
          <div className="bg-gradient-to-r from-amber-900/30 to-amber-800/10 rounded-2xl p-5 border border-amber-500/20 text-center animate-fadeIn">
            <p className="text-3xl mb-2">🏆</p>
            <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">Man of the Match</p>
            <p className="text-xl font-black text-white mt-1">{getPlayerName(match.mvpId)}</p>
            <button
              onClick={() => setShowMvpPicker(true)}
              className="text-xs text-slate-400 mt-2 underline"
            >
              Change MVP
            </button>
          </div>
        )}

        {/* MVP Picker */}
        {showMvpPicker && (
          <div className="bg-surface rounded-2xl p-4 animate-slideUp">
            <p className="text-sm font-bold text-white mb-3">Select MVP</p>
            <div className="max-h-60 overflow-y-auto scrollbar-hide space-y-1">
              {allPlayerIds.map(pid => {
                const p = players.find(pl => pl.id === pid);
                return (
                  <button
                    key={pid}
                    onClick={() => { setMvp(pid); setShowMvpPicker(false); }}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-white hover:bg-slate-700 btn-press"
                  >
                    {p?.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Awards */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Awards</h3>
          {match.awards.filter(a => a.type !== 'mvp').map((award, i) => (
            <div
              key={i}
              className="bg-surface rounded-xl p-4 flex items-center gap-3 animate-fadeIn"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="text-2xl">{awardIcons[award.type] || '🎖️'}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{awardLabels[award.type] || award.type}</p>
                <p className="text-sm font-bold text-white truncate">{getPlayerName(award.playerId)}</p>
              </div>
              <span className="text-sm font-bold text-emerald-400">{award.value}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-4">
          <button
            onClick={() => {
              useStore.setState({ selectedMatchId: match.id });
              navigate('matchDetail');
            }}
            className="w-full bg-surface text-white py-3.5 rounded-xl font-medium btn-press"
          >
            📊 View Full Scorecard
          </button>
          <button
            onClick={() => navigate('home')}
            className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold btn-press"
          >
            🏠 Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
