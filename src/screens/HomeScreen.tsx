import { useStore } from '../store';

export default function HomeScreen() {
  const navigate = useStore(s => s.navigate);
  const matches = useStore(s => s.matches);
  const teams = useStore(s => s.teams);
  const players = useStore(s => s.players);
  const setActive = (id: string) => useStore.setState({ activeMatchId: id });

  const recentMatches = [...matches].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
  const liveMatch = matches.find(m => m.status === 'live' || m.status === 'paused' || m.status === 'innings_break');

  const getTeamName = (id: string) => teams.find(t => t.id === id)?.name || 'Unknown';

  // Top performers
  const topRunScorers = [...players].sort((a, b) => b.totalRuns - a.totalRuns).slice(0, 3);
  const topWicketTakers = [...players].sort((a, b) => b.totalWickets - a.totalWickets).slice(0, 3);

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900/50 to-slate-900 px-5 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">KashmirCric</h1>
            <p className="text-sm text-emerald-400 mt-0.5">Cricket Scorer</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-lg">🏏</div>
        </div>
      </div>

      <div className="px-4 pb-24 space-y-5 mt-4">
        {/* Quick Start */}
        {/* Main Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              useStore.setState({ matchSetup: { step: 1, teamAId: null, teamBId: null, overs: 20, teamAPlayingXI: [], teamBPlayingXI: [] } });
              navigate('newMatch');
            }}
            className="bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-2xl p-4 text-left shadow-lg shadow-emerald-500/20 btn-press"
          >
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl mb-3">⚡</div>
            <p className="text-white font-bold">Start Match</p>
            <p className="text-emerald-100 text-xs mt-1">Score a new match</p>
          </button>

          <button
            onClick={() => navigate('joinMatch')}
            className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl p-4 text-left shadow-lg shadow-blue-500/20 btn-press"
          >
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl mb-3">📺</div>
            <p className="text-white font-bold">Join Match</p>
            <p className="text-blue-100 text-xs mt-1">Watch live score</p>
          </button>
        </div>

        {/* Continue Live Match */}
        {liveMatch && (
          <div className="animate-fadeIn">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">🔴 Live Match</h3>
            <button
              onClick={() => {
                setActive(liveMatch.id);
                navigate('scoring');
              }}
              className="w-full bg-surface rounded-2xl p-4 border border-emerald-500/30 btn-press"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">{getTeamName(liveMatch.teamAId)} vs {getTeamName(liveMatch.teamBId)}</p>
                  {liveMatch.innings[liveMatch.currentInnings - 1] && (
                    <p className="text-emerald-400 text-sm mt-1">
                      {liveMatch.innings[liveMatch.currentInnings - 1]!.totalRuns}/
                      {liveMatch.innings[liveMatch.currentInnings - 1]!.totalWickets}
                      {' '}({liveMatch.innings[liveMatch.currentInnings - 1]!.totalOvers}.
                      {liveMatch.innings[liveMatch.currentInnings - 1]!.totalBalls % 6})
                    </p>
                  )}
                </div>
                <div className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-sm animate-pulse-glow">
                  Continue →
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-white">{matches.length}</p>
            <p className="text-xs text-slate-400 mt-1">Matches</p>
          </div>
          <div className="bg-surface rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-white">{teams.length}</p>
            <p className="text-xs text-slate-400 mt-1">Teams</p>
          </div>
          <div className="bg-surface rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-white">{players.length}</p>
            <p className="text-xs text-slate-400 mt-1">Players</p>
          </div>
        </div>

        {/* Watch Live Match */}
        {liveMatch && !liveMatch.status.includes('completed') && (
          <button
            onClick={() => {
              setActive(liveMatch.id);
              useStore.setState({ isSpectatorMode: true });
              navigate('liveView');
            }}
            className="w-full bg-surface border border-red-500/30 rounded-2xl p-4 flex items-center gap-3 btn-press"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <span className="text-xl">📺</span>
            </div>
            <div className="text-left flex-1">
              <p className="text-white font-semibold text-sm">Watch Live Score</p>
              <p className="text-slate-400 text-xs">View only mode - auto updates</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-400">LIVE</span>
            </div>
          </button>
        )}

        {/* Recent Matches */}
        {recentMatches.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Matches</h3>
              <button onClick={() => navigate('matches')} className="text-xs text-emerald-400">View All</button>
            </div>
            <div className="space-y-2">
              {recentMatches.map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    useStore.setState({ selectedMatchId: m.id, activeMatchId: m.id });
                    navigate(m.status === 'completed' ? 'matchDetail' : 'scoring');
                  }}
                  className="w-full bg-surface rounded-xl p-4 text-left btn-press"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white text-sm">
                        {getTeamName(m.teamAId)} vs {getTeamName(m.teamBId)}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {m.totalOvers} overs • {new Date(m.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                      m.status === 'completed' ? 'bg-slate-700 text-slate-300' :
                      m.status === 'live' ? 'bg-red-500/20 text-red-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {m.status === 'completed' ? 'Done' : m.status === 'live' ? 'Live' : m.status.replace('_', ' ')}
                    </span>
                  </div>
                  {m.result && <p className="text-xs text-emerald-400 mt-2">{m.result}</p>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Teams */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Teams</h3>
            <button onClick={() => navigate('teamCreate')} className="text-xs text-emerald-400">+ Add Team</button>
          </div>
          {teams.length === 0 ? (
            <div className="bg-surface rounded-xl p-6 text-center">
              <p className="text-3xl mb-2">🏏</p>
              <p className="text-slate-400 text-sm">No teams yet. Create your first team!</p>
              <button onClick={() => navigate('teamCreate')} className="mt-3 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium btn-press">
                Create Team
              </button>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {teams.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    useStore.setState({ selectedTeamId: t.id });
                    navigate('teamDetail');
                  }}
                  className="flex-shrink-0 bg-surface rounded-xl p-4 min-w-[140px] btn-press"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-600/30 flex items-center justify-center text-xl mb-2">
                    {t.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="font-semibold text-white text-sm truncate">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.playerIds.length} players</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Top Performers */}
        {topRunScorers.length > 0 && topRunScorers[0].totalRuns > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Top Performers</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface rounded-xl p-3">
                <p className="text-xs text-amber-400 font-bold mb-2">🏆 Top Runs</p>
                {topRunScorers.filter(p => p.totalRuns > 0).map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between py-1">
                    <span className="text-xs text-slate-300 truncate flex-1">{i + 1}. {p.name}</span>
                    <span className="text-xs font-bold text-white ml-2">{p.totalRuns}</span>
                  </div>
                ))}
              </div>
              <div className="bg-surface rounded-xl p-3">
                <p className="text-xs text-purple-400 font-bold mb-2">🎯 Top Wickets</p>
                {topWicketTakers.filter(p => p.totalWickets > 0).map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between py-1">
                    <span className="text-xs text-slate-300 truncate flex-1">{i + 1}. {p.name}</span>
                    <span className="text-xs font-bold text-white ml-2">{p.totalWickets}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
