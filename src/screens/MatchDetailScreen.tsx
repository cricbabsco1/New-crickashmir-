import { useState } from 'react';
import { useStore } from '../store';

export default function MatchDetailScreen() {
  const { matches, teams, players, selectedMatchId, goBack } = useStore();
  const [activeInnings, setActiveInnings] = useState(0);

  const match = matches.find(m => m.id === selectedMatchId);
  if (!match) return <div className="h-full flex items-center justify-center text-white">Match not found</div>;

  const teamA = teams.find(t => t.id === match.teamAId);
  const teamB = teams.find(t => t.id === match.teamBId);
  const innings = match.innings[activeInnings];

  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || 'Unknown';

  return (
    <div className="h-full overflow-y-auto scrollbar-hide bg-bg-deep">
      <div className="bg-gradient-to-b from-emerald-900/40 to-transparent px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={goBack} className="text-slate-400 text-lg btn-press">←</button>
          <h1 className="text-lg font-bold text-white">Match Details</h1>
        </div>

        {/* Score Summary */}
        <div className="bg-surface rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/30 flex items-center justify-center text-sm font-bold text-emerald-400">
                {teamA?.name.charAt(0)}
              </div>
              <span className="font-semibold text-white">{teamA?.name}</span>
            </div>
            {match.innings[0] && (
              <span className="font-black text-white text-lg">
                {match.innings[0].battingTeamId === match.teamAId
                  ? `${match.innings[0].totalRuns}/${match.innings[0].totalWickets}`
                  : match.innings[1] ? `${match.innings[1].totalRuns}/${match.innings[1].totalWickets}` : '-'}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600/30 flex items-center justify-center text-sm font-bold text-blue-400">
                {teamB?.name.charAt(0)}
              </div>
              <span className="font-semibold text-white">{teamB?.name}</span>
            </div>
            {match.innings[0] && (
              <span className="font-black text-white text-lg">
                {match.innings[0].battingTeamId === match.teamBId
                  ? `${match.innings[0].totalRuns}/${match.innings[0].totalWickets}`
                  : match.innings[1] ? `${match.innings[1].totalRuns}/${match.innings[1].totalWickets}` : '-'}
              </span>
            )}
          </div>
          {match.result && (
            <p className="text-sm text-emerald-400 font-medium text-center pt-2 border-t border-slate-700">{match.result}</p>
          )}
        </div>
      </div>

      <div className="px-4 pb-24 space-y-4">
        {/* Innings Tabs */}
        <div className="flex gap-2">
          {match.innings.map((inn, i) => inn && (
            <button
              key={i}
              onClick={() => setActiveInnings(i)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold btn-press ${
                activeInnings === i ? 'bg-emerald-600 text-white' : 'bg-surface text-slate-400'
              }`}
            >
              {i === 0 ? '1st' : '2nd'} Innings
            </button>
          ))}
        </div>

        {innings && (
          <>
            {/* Batting */}
            <div className="bg-surface rounded-xl p-3">
              <p className="text-xs font-bold text-emerald-400 mb-2">
                {teams.find(t => t.id === innings.battingTeamId)?.name} - Batting
              </p>
              <div className="grid grid-cols-7 text-[9px] text-slate-500 font-medium mb-1 px-1">
                <span className="col-span-2">BATTER</span>
                <span className="text-center">R</span>
                <span className="text-center">B</span>
                <span className="text-center">4s</span>
                <span className="text-center">6s</span>
                <span className="text-center">SR</span>
              </div>
              {innings.batters.map(b => (
                <div key={b.playerId} className="grid grid-cols-7 items-center py-1.5 px-1 border-b border-slate-800 last:border-0">
                  <div className="col-span-2">
                    <p className="text-xs text-white truncate">{getPlayerName(b.playerId)}</p>
                    {b.isOut && <p className="text-[9px] text-slate-500">{b.dismissal}</p>}
                    {!b.isOut && <p className="text-[9px] text-emerald-500">not out</p>}
                  </div>
                  <span className="text-center text-xs font-bold text-white">{b.runs}</span>
                  <span className="text-center text-xs text-slate-400">{b.balls}</span>
                  <span className="text-center text-xs text-slate-400">{b.fours}</span>
                  <span className="text-center text-xs text-slate-400">{b.sixes}</span>
                  <span className="text-center text-[10px] text-slate-400">
                    {b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(0) : '-'}
                  </span>
                </div>
              ))}
              <div className="flex justify-between mt-2 pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-400">
                  Extras: {innings.extras.total} (wd {innings.extras.wide}, nb {innings.extras.noball}, b {innings.extras.bye}, lb {innings.extras.legbye})
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs font-bold text-white">
                  Total: {innings.totalRuns}/{innings.totalWickets} ({innings.totalOvers}.{innings.totalBalls % 6} ov)
                </span>
              </div>
            </div>

            {/* Bowling */}
            <div className="bg-surface rounded-xl p-3">
              <p className="text-xs font-bold text-blue-400 mb-2">
                {teams.find(t => t.id === innings.bowlingTeamId)?.name} - Bowling
              </p>
              <div className="grid grid-cols-6 text-[9px] text-slate-500 font-medium mb-1 px-1">
                <span className="col-span-2">BOWLER</span>
                <span className="text-center">O</span>
                <span className="text-center">R</span>
                <span className="text-center">W</span>
                <span className="text-center">EC</span>
              </div>
              {innings.bowlers.map(b => {
                const totalBalls = b.overs * 6 + b.balls;
                const eco = totalBalls > 0 ? (b.runs / (totalBalls / 6)).toFixed(1) : '0.0';
                return (
                  <div key={b.playerId} className="grid grid-cols-6 items-center py-1.5 px-1 border-b border-slate-800 last:border-0">
                    <span className="col-span-2 text-xs text-white truncate">{getPlayerName(b.playerId)}</span>
                    <span className="text-center text-xs text-slate-300">{b.overs}.{b.balls}</span>
                    <span className="text-center text-xs text-slate-300">{b.runs}</span>
                    <span className="text-center text-xs font-bold text-white">{b.wickets}</span>
                    <span className="text-center text-xs text-slate-400">{eco}</span>
                  </div>
                );
              })}
            </div>

            {/* Fall of Wickets */}
            {innings.fallOfWickets.length > 0 && (
              <div className="bg-surface rounded-xl p-3">
                <p className="text-xs font-bold text-red-400 mb-2">Fall of Wickets</p>
                <div className="flex flex-wrap gap-2">
                  {innings.fallOfWickets.map((fow, i) => (
                    <div key={i} className="bg-slate-800 rounded-lg px-2 py-1">
                      <span className="text-xs text-white font-bold">{fow.runs}/{fow.wicket}</span>
                      <span className="text-[10px] text-slate-400 ml-1">({fow.overs})</span>
                      <p className="text-[9px] text-slate-500">{getPlayerName(fow.playerId)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wagon Wheel Analysis */}
            {innings.ballEvents.some(b => b.shotZone) && (
              <div className="bg-surface rounded-xl p-3">
                <p className="text-xs font-bold text-purple-400 mb-2">🎯 Shot Distribution</p>
                <div className="grid grid-cols-5 gap-2">
                  {['thirdman', 'point', 'cover', 'longoff', 'straight', 'longon', 'midwicket', 'squareleg', 'fineleg', 'extracover'].map(zone => {
                    const count = innings.ballEvents.filter(b => b.shotZone === zone).length;
                    const runs = innings.ballEvents.filter(b => b.shotZone === zone).reduce((s, b) => s + b.runs, 0);
                    if (count === 0) return null;
                    return (
                      <div key={zone} className="bg-slate-800 rounded-lg p-2 text-center">
                        <p className="text-[9px] text-slate-400 capitalize">{zone.replace(/([A-Z])/g, ' $1')}</p>
                        <p className="text-xs font-bold text-white">{runs}r</p>
                        <p className="text-[9px] text-slate-500">{count} shots</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Awards */}
        {match.awards.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">🏆 Match Awards</h3>
            {match.awards.map((award, i) => (
              <div key={i} className="bg-gradient-to-r from-amber-900/20 to-surface rounded-xl p-4 flex items-center gap-3 border border-amber-500/10">
                <div className="text-2xl">
                  {award.type === 'mvp' ? '🏆' : award.type === 'highestRuns' ? '🏏' : award.type === 'bestBowler' ? '🎯' : award.type === 'bestStrikeRate' ? '⚡' : award.type === 'bestEconomy' ? '🎱' : '🧤'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-amber-400 font-medium">
                    {award.type === 'mvp' ? 'Man of the Match' : award.type === 'highestRuns' ? 'Highest Score' : award.type === 'bestBowler' ? 'Best Bowler' : award.type === 'bestStrikeRate' ? 'Best Strike Rate' : award.type === 'bestEconomy' ? 'Best Economy' : 'Best Fielder'}
                  </p>
                  <p className="text-sm font-bold text-white truncate">{getPlayerName(award.playerId)}</p>
                </div>
                <span className="text-sm font-bold text-amber-400">{award.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
