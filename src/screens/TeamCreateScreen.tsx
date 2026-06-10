import { useState } from 'react';
import { useStore } from '../store';

export default function TeamCreateScreen() {
  const { addTeam, addPlayer, goBack, navigate } = useStore();
  const [teamName, setTeamName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [teamId, setTeamId] = useState<string | null>(null);
  const [, setAddedPlayers] = useState<string[]>([]);
  const players = useStore(s => s.players);

  const handleCreateTeam = () => {
    if (!teamName.trim()) return;
    const id = addTeam(teamName.trim());
    setTeamId(id);
  };

  const handleAddPlayer = () => {
    if (!playerName.trim() || !teamId) return;
    const pid = addPlayer(playerName.trim(), teamId);
    setAddedPlayers(prev => [...prev, pid]);
    setPlayerName('');
  };

  if (!teamId) {
    return (
      <div className="h-full bg-bg-deep">
        <div className="px-5 pt-12 pb-4 flex items-center gap-3">
          <button onClick={goBack} className="text-slate-400 text-lg btn-press">←</button>
          <h1 className="text-lg font-bold text-white">Create Team</h1>
        </div>
        <div className="px-5 space-y-4">
          <div>
            <label className="text-sm text-slate-400 block mb-2">Team Name</label>
            <input
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              placeholder="e.g. Srinagar Warriors"
              className="w-full bg-surface border border-slate-700 rounded-xl px-4 py-4 text-white text-lg focus:outline-none focus:border-emerald-500"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleCreateTeam()}
            />
          </div>
          <button
            onClick={handleCreateTeam}
            disabled={!teamName.trim()}
            className="w-full bg-emerald-600 disabled:bg-slate-700 text-white py-4 rounded-xl font-bold text-lg btn-press"
          >
            Create Team
          </button>
        </div>
      </div>
    );
  }

  const teamPlayers = players.filter(p => p.teamId === teamId);

  return (
    <div className="h-full bg-bg-deep overflow-y-auto scrollbar-hide">
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={goBack} className="text-slate-400 text-lg btn-press">←</button>
        <div>
          <h1 className="text-lg font-bold text-white">{teamName}</h1>
          <p className="text-xs text-emerald-400">Add Players</p>
        </div>
      </div>

      <div className="px-5 space-y-4 pb-8">
        {/* Add Player */}
        <div className="flex gap-2">
          <input
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            placeholder="Player name..."
            className="flex-1 bg-surface border border-slate-700 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-emerald-500"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleAddPlayer()}
          />
          <button
            onClick={handleAddPlayer}
            disabled={!playerName.trim()}
            className="bg-emerald-600 disabled:bg-slate-700 text-white px-5 rounded-xl font-bold btn-press"
          >
            +
          </button>
        </div>

        {/* Player List */}
        <div className="space-y-2">
          {teamPlayers.map((p, i) => (
            <div key={p.id} className="bg-surface rounded-xl p-3 flex items-center gap-3 animate-fadeIn">
              <div className="w-8 h-8 rounded-full bg-emerald-600/20 flex items-center justify-center text-sm font-bold text-emerald-400">
                {i + 1}
              </div>
              <span className="text-white font-medium">{p.name}</span>
            </div>
          ))}
        </div>

        {teamPlayers.length >= 2 && (
          <button
            onClick={() => navigate('home')}
            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg btn-press"
          >
            Done ({teamPlayers.length} players)
          </button>
        )}
      </div>
    </div>
  );
}
