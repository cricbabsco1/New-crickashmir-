import { useState } from 'react';
import { useStore } from '../store';

export default function NewMatchScreen() {
  const { matchSetup, setMatchSetup, teams, players, navigate, goBack, createMatch, setToss, startMatch, addTeam, addPlayer } = useStore();
  const [customOvers, setCustomOvers] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [tossTeam, setTossTeam] = useState<string | null>(null);
  const [tossDecision, setTossDecisionLocal] = useState<'bat' | 'bowl' | null>(null);

  const step = matchSetup.step;
  const teamA = teams.find(t => t.id === matchSetup.teamAId);
  const teamB = teams.find(t => t.id === matchSetup.teamBId);

  const handleCreateTeam = () => {
    if (!newTeamName.trim()) return;
    addTeam(newTeamName.trim());
    setNewTeamName('');
  };

  const addPlayerToTeam = (teamId: string) => {
    if (!newPlayerName.trim()) return;
    addPlayer(newPlayerName.trim(), teamId);
    setNewPlayerName('');
  };

  const getTeamPlayers = (teamId: string) => players.filter(p => p.teamId === teamId);

  const renderStep = () => {
    switch (step) {
      case 1: // Select Team A
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Select Team A</h2>
            <div className="space-y-2">
              {teams.map(t => (
                <button
                  key={t.id}
                  onClick={() => setMatchSetup({ teamAId: t.id, step: 2 })}
                  className={`w-full bg-surface rounded-xl p-4 text-left btn-press flex items-center gap-3 ${
                    matchSetup.teamAId === t.id ? 'border-2 border-emerald-500' : 'border border-slate-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-600/30 flex items-center justify-center font-bold text-emerald-400">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.playerIds.length} players</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                placeholder="New team name..."
                className="flex-1 bg-surface border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                onKeyDown={e => e.key === 'Enter' && handleCreateTeam()}
              />
              <button onClick={handleCreateTeam} className="bg-emerald-600 text-white px-4 rounded-xl font-medium btn-press">+</button>
            </div>
          </div>
        );

      case 2: // Select Team B
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Select Team B</h2>
            <div className="space-y-2">
              {teams.filter(t => t.id !== matchSetup.teamAId).map(t => (
                <button
                  key={t.id}
                  onClick={() => setMatchSetup({ teamBId: t.id, step: 3 })}
                  className={`w-full bg-surface rounded-xl p-4 text-left btn-press flex items-center gap-3 ${
                    matchSetup.teamBId === t.id ? 'border-2 border-emerald-500' : 'border border-slate-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-600/30 flex items-center justify-center font-bold text-blue-400">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.playerIds.length} players</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                placeholder="New team name..."
                className="flex-1 bg-surface border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                onKeyDown={e => e.key === 'Enter' && handleCreateTeam()}
              />
              <button onClick={handleCreateTeam} className="bg-emerald-600 text-white px-4 rounded-xl font-medium btn-press">+</button>
            </div>
          </div>
        );

      case 3: // Overs
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Select Overs</h2>
            <div className="grid grid-cols-2 gap-3">
              {[5, 10, 15, 20].map(o => (
                <button
                  key={o}
                  onClick={() => setMatchSetup({ overs: o, step: 4 })}
                  className={`py-6 rounded-xl font-bold text-2xl btn-press ${
                    matchSetup.overs === o ? 'bg-emerald-600 text-white' : 'bg-surface text-slate-300 border border-slate-700'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={customOvers}
                onChange={e => setCustomOvers(e.target.value)}
                placeholder="Custom overs"
                className="flex-1 bg-surface border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => { if (Number(customOvers) > 0) setMatchSetup({ overs: Number(customOvers), step: 4 }); }}
                className="bg-emerald-600 text-white px-4 rounded-xl font-medium btn-press"
              >Go</button>
            </div>
          </div>
        );

      case 4: // Playing XI - Team A
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">{teamA?.name} - Playing XI</h2>
            <p className="text-sm text-slate-400">Selected: {matchSetup.teamAPlayingXI.length} players</p>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto scrollbar-hide">
              {getTeamPlayers(matchSetup.teamAId!).map(p => {
                const selected = matchSetup.teamAPlayingXI.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      const xi = selected
                        ? matchSetup.teamAPlayingXI.filter(id => id !== p.id)
                        : [...matchSetup.teamAPlayingXI, p.id];
                      setMatchSetup({ teamAPlayingXI: xi });
                    }}
                    className={`w-full rounded-xl p-3 text-left btn-press flex items-center gap-3 ${
                      selected ? 'bg-emerald-600/20 border border-emerald-500' : 'bg-surface border border-slate-700'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs ${
                      selected ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {selected ? '✓' : ''}
                    </div>
                    <span className="text-white text-sm font-medium">{p.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input
                value={newPlayerName}
                onChange={e => setNewPlayerName(e.target.value)}
                placeholder="Add player..."
                className="flex-1 bg-surface border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                onKeyDown={e => e.key === 'Enter' && addPlayerToTeam(matchSetup.teamAId!)}
              />
              <button onClick={() => addPlayerToTeam(matchSetup.teamAId!)} className="bg-emerald-600 text-white px-4 rounded-xl font-medium btn-press">+</button>
            </div>
            <button
              onClick={() => {
                if (matchSetup.teamAPlayingXI.length >= 2) setMatchSetup({ step: 5 });
              }}
              disabled={matchSetup.teamAPlayingXI.length < 2}
              className="w-full bg-emerald-600 disabled:bg-slate-700 text-white py-3.5 rounded-xl font-bold btn-press"
            >
              Next ({matchSetup.teamAPlayingXI.length} selected)
            </button>
          </div>
        );

      case 5: // Playing XI - Team B
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">{teamB?.name} - Playing XI</h2>
            <p className="text-sm text-slate-400">Selected: {matchSetup.teamBPlayingXI.length} players</p>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto scrollbar-hide">
              {getTeamPlayers(matchSetup.teamBId!).map(p => {
                const selected = matchSetup.teamBPlayingXI.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      const xi = selected
                        ? matchSetup.teamBPlayingXI.filter(id => id !== p.id)
                        : [...matchSetup.teamBPlayingXI, p.id];
                      setMatchSetup({ teamBPlayingXI: xi });
                    }}
                    className={`w-full rounded-xl p-3 text-left btn-press flex items-center gap-3 ${
                      selected ? 'bg-emerald-600/20 border border-emerald-500' : 'bg-surface border border-slate-700'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs ${
                      selected ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {selected ? '✓' : ''}
                    </div>
                    <span className="text-white text-sm font-medium">{p.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input
                value={newPlayerName}
                onChange={e => setNewPlayerName(e.target.value)}
                placeholder="Add player..."
                className="flex-1 bg-surface border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                onKeyDown={e => e.key === 'Enter' && addPlayerToTeam(matchSetup.teamBId!)}
              />
              <button onClick={() => addPlayerToTeam(matchSetup.teamBId!)} className="bg-emerald-600 text-white px-4 rounded-xl font-medium btn-press">+</button>
            </div>
            <button
              onClick={() => {
                if (matchSetup.teamBPlayingXI.length >= 2) setMatchSetup({ step: 6 });
              }}
              disabled={matchSetup.teamBPlayingXI.length < 2}
              className="w-full bg-emerald-600 disabled:bg-slate-700 text-white py-3.5 rounded-xl font-bold btn-press"
            >
              Next ({matchSetup.teamBPlayingXI.length} selected)
            </button>
          </div>
        );

      case 6: // Toss
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white">Toss</h2>

            <div>
              <p className="text-sm text-slate-400 mb-3">Who won the toss?</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTossTeam(matchSetup.teamAId!)}
                  className={`py-4 rounded-xl font-bold btn-press ${
                    tossTeam === matchSetup.teamAId ? 'bg-emerald-600 text-white' : 'bg-surface text-slate-300 border border-slate-700'
                  }`}
                >
                  {teamA?.name}
                </button>
                <button
                  onClick={() => setTossTeam(matchSetup.teamBId!)}
                  className={`py-4 rounded-xl font-bold btn-press ${
                    tossTeam === matchSetup.teamBId ? 'bg-emerald-600 text-white' : 'bg-surface text-slate-300 border border-slate-700'
                  }`}
                >
                  {teamB?.name}
                </button>
              </div>
            </div>

            {tossTeam && (
              <div className="animate-fadeIn">
                <p className="text-sm text-slate-400 mb-3">Chose to?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTossDecisionLocal('bat')}
                    className={`py-4 rounded-xl font-bold btn-press ${
                      tossDecision === 'bat' ? 'bg-amber-600 text-white' : 'bg-surface text-slate-300 border border-slate-700'
                    }`}
                  >
                    🏏 Bat
                  </button>
                  <button
                    onClick={() => setTossDecisionLocal('bowl')}
                    className={`py-4 rounded-xl font-bold btn-press ${
                      tossDecision === 'bowl' ? 'bg-blue-600 text-white' : 'bg-surface text-slate-300 border border-slate-700'
                    }`}
                  >
                    🎯 Bowl
                  </button>
                </div>
              </div>
            )}

            {tossTeam && tossDecision && (
              <button
                onClick={() => {
                  const matchId = createMatch();
                  useStore.setState({ activeMatchId: matchId });
                  setToss(tossTeam, tossDecision);
                  startMatch();
                  navigate('scoring');
                }}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-4 rounded-xl font-black text-lg btn-press shadow-lg shadow-emerald-500/20 animate-fadeIn"
              >
                🏏 Start Match
              </button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const stepLabels = ['Team A', 'Team B', 'Overs', 'XI-A', 'XI-B', 'Toss'];

  return (
    <div className="h-full overflow-y-auto scrollbar-hide bg-bg-deep">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => {
          if (step > 1) setMatchSetup({ step: step - 1 });
          else goBack();
        }} className="text-slate-400 text-lg btn-press">←</button>
        <div>
          <h1 className="text-lg font-bold text-white">New Match</h1>
          <p className="text-xs text-slate-400">Step {step} of 6</p>
        </div>
      </div>

      {/* Progress */}
      <div className="px-5 mb-6">
        <div className="flex gap-1">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex-1">
              <div className={`h-1 rounded-full ${i + 1 <= step ? 'bg-emerald-500' : 'bg-slate-700'}`} />
              <p className={`text-[9px] mt-1 text-center ${i + 1 <= step ? 'text-emerald-400' : 'text-slate-600'}`}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 pb-8 animate-fadeIn">
        {renderStep()}
      </div>
    </div>
  );
}
