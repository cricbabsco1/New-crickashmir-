import { useStore } from '../store';
import type { Screen } from '../types';

const tabs: { id: Screen; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'matches', label: 'Matches', icon: '🏏' },
  { id: 'newMatch', label: 'Score', icon: '⚡' },
  { id: 'stats', label: 'Stats', icon: '📊' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function BottomNav() {
  const screen = useStore(s => s.screen);
  const navigate = useStore(s => s.navigate);

  return (
    <nav className="glass border-t border-slate-800 px-1 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16">
        {tabs.map(tab => {
          const active = screen === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all btn-press ${
                active ? 'text-primary scale-105' : 'text-slate-500'
              } ${tab.id === 'newMatch' ? '' : ''}`}
            >
              {tab.id === 'newMatch' ? (
                <div className={`w-12 h-12 -mt-6 rounded-full flex items-center justify-center text-xl shadow-lg ${
                  active ? 'bg-primary text-white animate-pulse-glow' : 'bg-emerald-700 text-white'
                }`}>
                  {tab.icon}
                </div>
              ) : (
                <span className="text-xl">{tab.icon}</span>
              )}
              <span className={`text-[10px] font-medium ${active ? 'text-primary' : 'text-slate-500'}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
