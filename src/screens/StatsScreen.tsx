import { useState } from 'react';
import { useStore } from '../store';

export default function StatsScreen() {
  const players = useStore(s => s.players);
  const teams = useStore(s => s.teams);
  const [tab, setTab] = useState<'runs' | 'wickets' | 'sr'>('runs');

  const getTeamName = (teamId: string) => teams.find(t => t.id === teamId)?.name || '';

  const byRuns = [...players].filter(p => p.totalRuns > 0).sort((a, b) => b.totalRuns - a.totalRuns);
  const byWickets = [...players].filter(p => p.totalWickets > 0).sort((a, b) => b.totalWickets - a.totalWickets);
  const bySR = [...players].filter(p => p.totalBallsFaced > 10).sort((a, b) => {
    const srA = (a.totalRuns / a.totalBallsFaced) * 100;
    const srB = (b.totalRuns / b.totalBallsFaced) * 100;
    return srB - srA;
  });

  const currentList = tab === 'runs' ? byRuns : tab === 'wickets' ? byWickets : bySR;

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-black text-white">Player Stats</h1>
        <p className="text-sm text-slate-400 mt-1">Leaderboard</p>
      </div>

      {/* Tabs */}
      <div className="px-4 flex gap-2 mb-4">
        {(['runs', 'wickets', 'sr'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-bold btn-press ${
              tab === t ? 'bg-emerald-600 text-white' : 'bg-surface text-slate-400'
            }`}
          >
            {t === 'runs' ? '🏏 Runs' : t === 'wickets' ? '🎯 Wickets' : '⚡ Strike Rate'}
          </button>
        ))}
      </div>

      <div className="px-4 pb-24 space-y-2">
        {currentList.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-slate-400">No stats yet. Play some matches!</p>
          </div>
        ) : currentList.map((p, i) => (
          <div key={p.id} className="bg-surface rounded-xl p-4 flex items-center gap-3 animate-fadeIn">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
              i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-slate-400 text-white' : i === 2 ? 'bg-amber-700 text-white' : 'bg-slate-700 text-slate-400'
            }`}>
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm truncate">{p.name}</p>
              <p className="text-xs text-slate-500">{getTeamName(p.teamId)}</p>
            </div>
            <div className="text-right">
              {tab === 'runs' && (
                <>
                  <p className="font-black text-white text-lg">{p.totalRuns}</p>
                  <p className="text-[10px] text-slate-400">{p.matches} matches</p>
                </>
              )}
              {tab === 'wickets' && (
                <>
                  <p className="font-black text-white text-lg">{p.totalWickets}</p>
                  <p className="text-[10px] text-slate-400">{p.matches} matches</p>
                </>
              )}
              {tab === 'sr' && (
                <>
                  <p className="font-black text-white text-lg">{((p.totalRuns / p.totalBallsFaced) * 100).toFixed(1)}</p>
                  <p className="text-[10px] text-slate-400">{p.totalRuns} runs / {p.totalBallsFaced} balls</p>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
