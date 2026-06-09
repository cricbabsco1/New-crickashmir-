import React, { useState } from 'react';
import { useStore } from '../store';
import { checkRoomExists } from '../services/firebase';

export default function JoinMatchScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useStore(s => s.navigate);
  
  // Custom Zustand action triggers (Fallback fallback if your store names differ)
  const store = useStore() as any;

  const handleJoin = async () => {
    if (!code.trim()) {
      alert('Please enter a valid match code');
      return;
    }

    setLoading(false);
    const cleanCode = code.trim().toUpperCase();

    try {
      setLoading(true);
      const liveMatchData = await checkRoomExists(cleanCode);

      if (liveMatchData) {
        // 1. Save the room identity information into your global state manager
        if (store.setRoomCode) store.setRoomCode(cleanCode);
        if (store.setMatchData) store.setMatchData(liveMatchData);
        
        // 2. Direct the user straight to the safe streaming screen!
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
    <div className="flex flex-col h-full bg-bg-deep text-white p-4 justify-center items-center">
      <div className="w-full max-w-md bg-bg-card p-6 rounded-2xl border border-border-main space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-wide text-primary">Join Live Match</h2>
          <p className="text-text-muted text-sm mt-1">Enter the 6-character room code to view live scorecard</p>
        </div>

        <input
          type="text"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. LU3G2J"
          className="w-full bg-bg-deep border border-border-main rounded-xl p-4 text-center text-xl font-bold uppercase tracking-widest focus:border-primary outline-none text-white"
        />

        <button
          onClick={handleJoin}
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-dark transition-all text-black font-bold p-4 rounded-xl text-lg disabled:opacity-50"
        >
          {loading ? 'Connecting Live...' : 'View Live Score'}
        </button>

        <button
          onClick={() => navigate('home')}
          className="w-full bg-transparent text-text-muted font-semibold p-2 text-sm text-center"
        >
          ← Go Back Home
        </button>
      </div>
    </div>
  );
}
