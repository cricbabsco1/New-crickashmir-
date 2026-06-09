import { useState } from 'react';
import { useStore } from '../store';

export default function TeamDetailScreen() {
  const { teams, players, selectedTeamId, goBack, addPlayer, deletePlayer, deleteTeam, navigate } = useStore();
  const [playerName, setPlayerName] = useState('');

  const team = teams.find(t => t.id === selectedTeamId);
  if (!team) return <div className="h-full flex items-center justify-center text-white">Team not found</div>;

  const teamPlayers = players.filter(p => p.teamId === team.id);

  const handleAddPlayer = () => {
    if (!playerName.trim()) return;
    addPlayer(playerName.trim(), team.id);
    setPlayerName('');
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide bg-bg-deep">
      <div className="bg-gradient-to-b from-emerald-900/40 to-transparent px-5 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={goBack} className="text-slate-400 text-lg btn-press">←</button>
          <h1 className="text-lg font-bold text-white">{team.name}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-emerald-600/30 flex items-center justify-center text-3xl font-bold text-emerald-400">
            {team.name.charAt(0)}
          </div>
          <div>
            <p className="text-xl font-bold text-white">{team.name}</p>
            <p className="text-sm text-slate-400">{teamPlayers.length} players</p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-24 space-y-4">
        {/* Add Player */}
        <div className="flex gap-2">
          <input
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            placeholder="Add player..."
            className="flex-1 bg-surface border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
            onKeyDown={e => e.key === 'Enter' && handleAddPlayer()}
          />
          <button onClick={handleAddPlayer} className="bg-emerald-600 text-white px-5 rounded-xl font-bold btn-press">+</button>
        </div>

        {/* Players */}
        <div className="space-y-2">
          {teamPlayers.map((p, i) => (
            <div key={p.id} className="bg-surface rounded-xl p-4 flex items-center gap-3 animate-fadeIn">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{p.name}</p>
                <p className="text-xs text-slate-500">
                  {p.matches > 0 ? `${p.matches}M · ${p.totalRuns}R · ${p.totalWickets}W` : 'No matches yet'}
                </p>
              </div>
              <button
                onClick={() => { if (confirm(`Remove ${p.name}?`)) deletePlayer(p.id); }}
                className="text-red-400 text-xs btn-press px-2 py-1"
              >✕</button>
            </div>
          ))}
        </div>

        {/* Delete Team */}
        <button
          onClick={() => {
            if (confirm(`Delete team "${team.name}" and all its players?`)) {
              deleteTeam(team.id);
              navigate('home');
            }
          }}
          className="w-full bg-red-500/10 text-red-400 py-3 rounded-xl text-sm font-medium btn-press mt-8"
        >
          Delete Team
        </button>
      </div>
    </div>
  );
}
