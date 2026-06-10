import { useStore } from '../store';

export default function MatchesScreen() {
  const matches = useStore(s => s.matches);
  const teams = useStore(s => s.teams);
  const navigate = useStore(s => s.navigate);

  const getTeamName = (id: string) => teams.find(t => t.id === id)?.name || 'Unknown';
  const sorted = [...matches].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-black text-white">Match History</h1>
        <p className="text-sm text-slate-400 mt-1">{matches.length} matches played</p>
      </div>

      <div className="px-4 pb-24 space-y-3">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-5xl mb-4">🏏</p>
            <p className="text-slate-400">No matches yet</p>
            <button onClick={() => navigate('newMatch')} className="mt-4 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium btn-press">
              Start First Match
            </button>
          </div>
        ) : sorted.map(m => (
          <button
            key={m.id}
            onClick={() => {
              useStore.setState({ selectedMatchId: m.id, activeMatchId: m.id });
              if (m.status === 'completed') navigate('matchDetail');
              else navigate('scoring');
            }}
            className="w-full bg-surface rounded-2xl p-4 text-left btn-press animate-fadeIn"
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                m.status === 'completed' ? 'bg-slate-700 text-slate-300' :
                m.status === 'live' ? 'bg-red-500/20 text-red-400 animate-pulse' :
                'bg-amber-500/20 text-amber-400'
              }`}>
                {m.status.replace('_', ' ')}
              </span>
              <span className="text-xs text-slate-500">{new Date(m.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">{getTeamName(m.teamAId)}</span>
                {m.innings[0] && (
                  <span className="font-bold text-white">
                    {m.innings[0].battingTeamId === m.teamAId
                      ? `${m.innings[0].totalRuns}/${m.innings[0].totalWickets}`
                      : m.innings[1] ? `${m.innings[1].totalRuns}/${m.innings[1].totalWickets}` : '-'}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">{getTeamName(m.teamBId)}</span>
                {m.innings[0] && (
                  <span className="font-bold text-white">
                    {m.innings[0].battingTeamId === m.teamBId
                      ? `${m.innings[0].totalRuns}/${m.innings[0].totalWickets}`
                      : m.innings[1] ? `${m.innings[1].totalRuns}/${m.innings[1].totalWickets}` : '-'}
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-2">{m.totalOvers} overs</p>
            {m.result && <p className="text-xs text-emerald-400 mt-1 font-medium">{m.result}</p>}
          </button>
        ))}
      </div>
    </div>
  );
}
