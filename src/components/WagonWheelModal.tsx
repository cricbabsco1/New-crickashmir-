import { useStore } from '../store';
import type { ShotZone } from '../types';

const zones: { id: ShotZone; label: string; angle: number; distance: number }[] = [
  { id: 'thirdman', label: 'Third Man', angle: -140, distance: 85 },
  { id: 'point', label: 'Point', angle: -100, distance: 80 },
  { id: 'cover', label: 'Cover', angle: -60, distance: 85 },
  { id: 'extracover', label: 'Extra Cover', angle: -35, distance: 85 },
  { id: 'longoff', label: 'Long Off', angle: -10, distance: 90 },
  { id: 'straight', label: 'Straight', angle: 0, distance: 80 },
  { id: 'longon', label: 'Long On', angle: 15, distance: 90 },
  { id: 'midwicket', label: 'Mid Wicket', angle: 45, distance: 85 },
  { id: 'squareleg', label: 'Square Leg', angle: 90, distance: 80 },
  { id: 'fineleg', label: 'Fine Leg', angle: 140, distance: 85 },
];

export default function WagonWheelModal() {
  const setShotZone = useStore(s => s.setShotZone);
  const dismissWagonWheel = useStore(s => s.dismissWagonWheel);
  const pendingBall = useStore(s => s.pendingBallForWagon);

  if (!pendingBall) return null;

  const isSix = pendingBall.runs === 6;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fadeIn">
      <div className="bg-surface rounded-2xl p-5 w-[90vw] max-w-sm animate-scaleIn">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-white">Shot Direction</h3>
            <p className={`text-xs font-bold ${isSix ? 'text-purple-400' : 'text-emerald-400'}`}>
              {isSix ? '🔥 SIX!' : '🏏 FOUR!'}
            </p>
          </div>
          <button onClick={dismissWagonWheel} className="text-slate-400 text-xs bg-slate-700 px-3 py-1.5 rounded-lg btn-press">
            Skip
          </button>
        </div>

        {/* Cricket Field */}
        <div className="relative w-full aspect-square bg-emerald-900/30 rounded-full border border-emerald-700/30 overflow-hidden">
          {/* Pitch in center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-16 bg-amber-800/60 rounded-sm" />

          {/* Zone buttons */}
          {zones.map(zone => {
            const rad = (zone.angle - 90) * (Math.PI / 180);
            const x = 50 + zone.distance * 0.45 * Math.cos(rad);
            const y = 50 + zone.distance * 0.45 * Math.sin(rad);
            return (
              <button
                key={zone.id}
                onClick={() => setShotZone(zone.id)}
                className="absolute btn-press"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${
                    isSix ? 'bg-purple-500/80 hover:bg-purple-400' : 'bg-emerald-500/80 hover:bg-emerald-400'
                  }`}>
                    ●
                  </div>
                  <span className="text-[7px] text-slate-300 mt-0.5 whitespace-nowrap">{zone.label}</span>
                </div>
              </button>
            );
          })}

          {/* Center label */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-4 h-4 rounded-full bg-white/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
