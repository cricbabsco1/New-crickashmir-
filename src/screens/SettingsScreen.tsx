import { useStore } from '../store';

export default function SettingsScreen() {
  const teams = useStore(s => s.teams);
  const players = useStore(s => s.players);
  const matches = useStore(s => s.matches);

  const clearAll = () => {
    if (confirm('Are you sure you want to clear ALL data? This cannot be undone.')) {
      useStore.setState({ teams: [], players: [], matches: [], activeMatchId: null });
      localStorage.removeItem('kashmir-cric-storage');
    }
  };

  const clearMatches = () => {
    if (confirm('Clear all match history?')) {
      useStore.setState({ matches: [], activeMatchId: null });
    }
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-black text-white">Settings</h1>
      </div>

      <div className="px-4 pb-24 space-y-4">
        {/* App Info */}
        <div className="bg-surface rounded-2xl p-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">🏏</span>
          </div>
          <h2 className="text-lg font-bold text-white">KashmirCric</h2>
          <p className="text-sm text-slate-400">Cricket Scorer v1.0</p>
          <p className="text-xs text-slate-500 mt-1">Made for Kashmir Cricket ❤️</p>
        </div>

        {/* Data Summary */}
        <div className="bg-surface rounded-2xl p-4">
          <h3 className="text-sm font-bold text-white mb-3">Data Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-sm text-slate-400">Teams</span>
              <span className="text-sm font-bold text-white">{teams.length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-sm text-slate-400">Players</span>
              <span className="text-sm font-bold text-white">{players.length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-sm text-slate-400">Matches</span>
              <span className="text-sm font-bold text-white">{matches.length}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-400">Completed</span>
              <span className="text-sm font-bold text-white">{matches.filter(m => m.status === 'completed').length}</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-surface rounded-2xl p-4">
          <h3 className="text-sm font-bold text-white mb-3">Features</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-lg">📱</span>
              <div>
                <p className="text-sm text-white">Offline First</p>
                <p className="text-xs text-slate-400">Works without internet</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg">💾</span>
              <div>
                <p className="text-sm text-white">Auto Save</p>
                <p className="text-xs text-slate-400">Every ball saved automatically</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg">🎯</span>
              <div>
                <p className="text-sm text-white">Wagon Wheel</p>
                <p className="text-xs text-slate-400">Track shot directions for boundaries</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg">🏆</span>
              <div>
                <p className="text-sm text-white">Auto Awards</p>
                <p className="text-xs text-slate-400">MVP and match awards auto-generated</p>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-surface rounded-2xl p-4 border border-red-500/20">
          <h3 className="text-sm font-bold text-red-400 mb-3">Danger Zone</h3>
          <div className="space-y-2">
            <button onClick={clearMatches} className="w-full bg-red-500/10 text-red-400 py-3 rounded-xl text-sm font-medium btn-press">
              Clear Match History
            </button>
            <button onClick={clearAll} className="w-full bg-red-500/20 text-red-400 py-3 rounded-xl text-sm font-bold btn-press">
              Clear All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
