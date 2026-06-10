import { useState } from 'react';
import { useStore } from '../store';
import { checkRoomExists, subscribeToMatch } from '../lib/firebase';

export default function JoinMatchScreen() {
  const { navigate, goBack, applySyncData } = useStore();
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (roomCode.length < 4) {
      setError('Please enter a valid 6-character room code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const code = roomCode.toUpperCase().trim();
    
    try {
      console.log('[Join] Checking room:', code);
      
      // First check if room exists
      const existingData = await checkRoomExists(code);
      
      if (existingData) {
        console.log('[Join] Room found, applying data');
        
        // Apply the data
        applySyncData(existingData);
        
        // Set up subscription and spectator mode
        useStore.setState({
          roomCode: code,
          isSpectatorMode: true,
          syncEnabled: true,
          activeMatchId: existingData.match.id,
          connectionStatus: 'connected',
        });
        
        // Subscribe to updates
        subscribeToMatch(code, (data) => {
          console.log('[Join] Received update');
          useStore.getState().applySyncData(data);
        });
        
        navigate('liveView');
      } else {
        console.log('[Join] Room not found');
        setError(`Room "${code}" not found. Make sure the scorer has started the match and shared the correct code.`);
      }
    } catch (e) {
      console.error('[Join] Error:', e);
      setError('Connection error. Please check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-bg-deep overflow-y-auto scrollbar-hide">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={goBack} className="text-slate-400 text-lg btn-press">←</button>
        <h1 className="text-lg font-bold text-white">Join Live Match</h1>
      </div>

      <div className="px-5 pb-8">
        {/* Illustration */}
        <div className="text-center py-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📺</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Watch Live Score</h2>
          <p className="text-slate-400 text-sm">Enter the 6-digit room code from the scorer</p>
        </div>

        {/* Room Code Input */}
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 block mb-2">Room Code</label>
            <input
              value={roomCode}
              onChange={e => {
                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                setRoomCode(val);
                setError('');
              }}
              placeholder="ABC123"
              maxLength={6}
              className="w-full bg-surface border border-slate-700 rounded-xl px-4 py-4 text-white text-3xl text-center tracking-[0.4em] font-mono uppercase focus:outline-none focus:border-emerald-500"
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck="false"
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
            />
            <p className="text-xs text-slate-500 text-center mt-2">
              {roomCode.length}/6 characters
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleJoin}
            disabled={roomCode.length < 6 || loading}
            className="w-full bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-400 text-white py-4 rounded-xl font-bold text-lg btn-press flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                📡 Join Match
              </>
            )}
          </button>
        </div>

        {/* How it works */}
        <div className="mt-8 bg-surface rounded-xl p-4">
          <h3 className="text-sm font-bold text-white mb-3">📱 How to get the code:</h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">1</div>
              <p className="text-xs text-slate-400">The scorer taps <span className="text-emerald-400">Menu → Share Score</span> during the match</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">2</div>
              <p className="text-xs text-slate-400">They share the 6-digit code (shown at the top)</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">3</div>
              <p className="text-xs text-slate-400">Enter that code here and tap Join!</p>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <p className="text-xs text-amber-400">
            <span className="font-bold">💡 Tip:</span> Make sure the scorer has started scoring at least one ball before you join. The room is created when they begin scoring.
          </p>
        </div>

        {/* Firebase indicator */}
        <p className="text-xs text-slate-600 text-center mt-6">
          ⚡ Powered by Firebase Real-time Database
        </p>
      </div>
    </div>
  );
}
