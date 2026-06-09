import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { subscribeToMatch, SyncData } from '../services/firebase';

export default function LiveViewScreen() {
  const navigate = useStore(s => s.navigate);
  const store = useStore() as any;
  
  // Pull room string identifiers safely from your active store instance
  const roomCode = store.roomCode || store.currentRoomCode || "";
  
  // Local screen state holding live values downloaded from Firebase
  const [liveData, setLiveData] = useState<SyncData | null>(store.matchData || null);

  useEffect(() => {
    if (!roomCode) return;

    console.log(`[LiveView] Listening live to cloud room database path: ${roomCode}`);
    
    // Subscribe to background WebSocket ticks streaming from Singapore
    const unsubscribe = subscribeToMatch(roomCode, (updatedFirebasePayload) => {
      setLiveData(updatedFirebasePayload);
    });

    // Clean up websocket listeners automatically when navigating away
    return () => unsubscribe();
  }, [roomCode]);

  const handleLeave = () => {
    if (store.setRoomCode) store.setRoomCode(null);
    navigate('home');
  };

  if (!liveData || !liveData.match) {
    return (
      <div className="flex flex-col h-full bg-bg-deep text-white justify-center items-center p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
        <p className="text-text-muted">Connecting to Live Scorer Feed...</p>
      </div>
    );
  }

  const { match, teams } = liveData;

  return (
    <div className="flex flex-col h-full bg-bg-deep text-white">
      {/* Header Banner */}
      <header className="flex justify-between items-center p-4 bg-bg-card border-b border-border-main">
        <button onClick={handleLeave} className="text-text-muted font-bold">← Leave</button>
        <div className="flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold tracking-wider text-sm text-emerald-400">LIVE FEED</span>
        </div>
        <div className="bg-bg-deep px-3 py-1 rounded-md text-xs font-mono font-bold tracking-wider border border-border-main text-primary">
          CODE: {roomCode}
        </div>
      </header>

      {/* Score Display Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-bg-card p-6 rounded-2xl border border-border-main text-center space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
            {match.type || 'T20 Match'} • {match.overs || 20} Overs
          </p>
          
          <h1 className="text-5xl font-black text-white my-4">
            {match.runs || 0} / {match.wickets || 0}
          </h1>

          <p className="text-lg font-medium text-primary">
            Overs: {match.currentOver || 0}.{match.currentBall || 0}
          </p>
        </div>

        {/* Informational Read-Only Banner to clarify view state */}
        <div className="bg-blue-950/40 border border-blue-800/60 p-4 rounded-xl text-center text-sm text-blue-400 font-medium">
          🔒 You are currently viewing this match stream. Clicks and inputs are restricted on this screen.
        </div>
      </div>
    </div>
  );
}
