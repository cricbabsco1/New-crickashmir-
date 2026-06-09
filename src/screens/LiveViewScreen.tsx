import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { subscribeToMatch, SyncData } from '../services/firebase';

export default function LiveViewScreen() {
  const navigate = useStore((s: any) => s.navigate);
  const store = useStore() as any;
  
  // Safe generic pull for standard room key variables
  const roomCode = store.roomCode || store.currentRoomCode || store.currentRoom || "LIVE";
  
  const [liveData, setLiveData] = useState<SyncData | null>(null);

  useEffect(() => {
    if (!roomCode || roomCode === "LIVE") return;

    console.log(`[LiveView] Listening live to cloud room database path: ${roomCode}`);
    
    const unsubscribe = subscribeToMatch(roomCode, (updatedFirebasePayload) => {
      setLiveData(updatedFirebasePayload);
    });

    return () => unsubscribe();
  }, [roomCode]);

  const handleLeave = () => {
    if (typeof store.setRoomCode === 'function') store.setRoomCode(null);
    if (typeof store.setCurrentRoom === 'function') store.setCurrentRoom(null);
    navigate('home');
  };

  if (!liveData || !liveData.match) {
    return (
      <div className="flex flex-col h-full bg-slate-900 text-white justify-center items-center p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-400 mb-4"></div>
        <p className="text-slate-400">Connecting to Live Scorer Feed...</p>
        <button onClick={handleLeave} className="mt-6 text-sm text-slate-500 underline">Cancel & Go Home</button>
      </div>
    );
  }

  const { match } = liveData;

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Header Banner */}
      <header className="flex justify-between items-center p-4 bg-slate-800 border-b border-slate-700">
        <button onClick={handleLeave} className="text-slate-400 font-bold">← Leave</button>
        <div className="flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold tracking-wider text-sm text-emerald-400">LIVE FEED</span>
        </div>
        <div className="bg-slate-900 px-3 py-1 rounded-md text-xs font-mono font-bold tracking-wider border border-slate-700 text-emerald-400">
          CODE: {roomCode}
        </div>
      </header>

      {/* Score Display Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Live Stream Update
          </p>
          
          <h1 className="text-5xl font-black text-white my-4">
            {match.runs ?? 0} / {match.wickets ?? 0}
          </h1>

          <p className="text-lg font-medium text-emerald-400">
            Overs: {match.currentOver ?? 0}.{match.currentBall ?? 0}
          </p>
        </div>

        {/* Informational Read-Only Banner to clarify view state */}
        <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl text-center text-sm text-slate-400 font-medium">
          🔒 You are currently viewing this match stream. Clicks and inputs are restricted on this screen.
        </div>
      </div>
    </div>
  );
}
