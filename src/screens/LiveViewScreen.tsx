import React, { useState } from 'react';
import { useStore } from '../store';
import { checkRoomExists } from '../services/firebase';

export default function JoinMatchScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useStore((s: any) => s.navigate);
  const fullStore = useStore();

  const handleJoin = async () => {
    if (!code.trim()) {
      alert('Please enter a valid match code');
      return;
    }

    const cleanCode = code.trim().toUpperCase();

    try {
      setLoading(true);
      const liveMatchData = await checkRoomExists(cleanCode);

      if (liveMatchData) {
        // Backup to localStorage so LiveViewScreen can read it without store dependencies
        localStorage.setItem('viewer_room_code', cleanCode);

        // Safe dynamic execution to keep store updated without crashing
        const dict = fullStore as Record<string, unknown>;
        try {
          if (typeof dict['setRoomCode'] === 'function') (dict['setRoomCode'] as any)(cleanCode);
          if (typeof dict['setCurrentRoom'] === 'function') (dict['setCurrentRoom'] as any)(cleanCode);
        } catch (e) {
          console.log("Store properties missing, using localStorage backup instead.");
        }
        
        navigate('liveView');
      } else {
        alert('❌ Match room code not found. Check with the scorer.');
      }
    } catch (err) {
      alert('Network error connecting to live sync server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white p-4 justify-center items-center">
      <div className="w-full max-w-md bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-wide text-emerald-400">Join Live Match</h2>
          <p className="text-slate-400 text-sm mt-1">Enter the 6-character room code to view live scorecard</p>
        </div>

        <input
          type="text"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. LU3G2J"
          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-center text-xl font-bold uppercase tracking-widest focus:border-emerald-400 outline-none text-white"
        />

        <button
          onClick={handleJoin}
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 transition-all text-slate-900 font-bold p-4 rounded-xl text-lg disabled:opacity-50"
        >
          {loading ? 'Connecting Live...' : 'View Live Score'}
        </button>

        <button
          onClick={() => navigate('home')}
          className="w-full bg-transparent text-slate-400 font-semibold p-2 text-sm text-center"
        >
          ← Go Back Home
        </button>
      </div>
    </div>
  );
}
