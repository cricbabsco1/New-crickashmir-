import { useState, useEffect } from 'react';
import { useStore } from '../store';

export default function ShareScoreScreen() {
  const { matches, teams, activeMatchId, roomCode, goBack, createRoom, broadcastUpdate } = useStore();
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  
  // Ensure we have a room code
  const currentRoomCode = roomCode || createRoom();

  const match = matches.find(m => m.id === activeMatchId);
  const teamA = teams.find(t => t.id === match?.teamAId);
  const teamB = teams.find(t => t.id === match?.teamBId);

  // Broadcast update when screen opens to ensure Firebase has latest data
  useEffect(() => {
    if (currentRoomCode && match) {
      broadcastUpdate();
    }
  }, [currentRoomCode]);

  if (!match) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-deep">
        <p className="text-white">No active match</p>
      </div>
    );
  }

  const currentInnings = match.innings[match.currentInnings - 1];

  const generateShareText = () => {
    let text = `🏏 LIVE CRICKET SCORE 🏏\n\n`;
    text += `${teamA?.name || 'Team A'} vs ${teamB?.name || 'Team B'}\n`;
    text += `${match.totalOvers} overs match\n\n`;

    if (currentInnings) {
      const battingTeam = teams.find(t => t.id === currentInnings.battingTeamId);
      text += `📊 ${battingTeam?.name}: ${currentInnings.totalRuns}/${currentInnings.totalWickets}\n`;
      text += `Overs: ${currentInnings.totalOvers}.${currentInnings.totalBalls % 6}\n`;
      text += `Run Rate: ${currentInnings.currentRunRate}\n`;

      if (currentInnings.target) {
        const need = currentInnings.target - currentInnings.totalRuns;
        const ballsLeft = (match.totalOvers * 6) - currentInnings.totalBalls;
        text += `\n🎯 Need ${need} runs from ${ballsLeft} balls\n`;
      }
    }

    if (match.innings[0]) {
      const firstTeam = teams.find(t => t.id === match.innings[0]!.battingTeamId);
      text += `\n${firstTeam?.name}: ${match.innings[0].totalRuns}/${match.innings[0].totalWickets}`;
    }
    if (match.innings[1]) {
      const secondTeam = teams.find(t => t.id === match.innings[1]!.battingTeamId);
      text += `\n${secondTeam?.name}: ${match.innings[1].totalRuns}/${match.innings[1].totalWickets}`;
    }

    if (match.result) {
      text += `\n\n🏆 ${match.result}`;
    }

    text += `\n\n📱 Watch Live: Join with code ${currentRoomCode}`;
    text += `\n🏏 KashmirCric App`;

    return text;
  };

  const copyToClipboard = async () => {
    const text = generateShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyCodeOnly = async () => {
    try {
      await navigator.clipboard.writeText(currentRoomCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (e) {
      const textarea = document.createElement('textarea');
      textarea.value = currentRoomCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide bg-bg-deep">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={goBack} className="text-slate-400 text-lg btn-press">←</button>
        <h1 className="text-lg font-bold text-white">Share Live Score</h1>
      </div>

      <div className="px-5 pb-8 space-y-4">
        {/* Room Code - Main Feature */}
        <div className="bg-gradient-to-br from-emerald-900/40 to-surface rounded-2xl p-6 border border-emerald-500/30 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📡</span>
          </div>
          <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-3">Live Match Code</p>
          <button 
            onClick={copyCodeOnly}
            className="text-4xl font-black text-white tracking-[0.3em] bg-emerald-600/20 px-6 py-3 rounded-xl btn-press hover:bg-emerald-600/30 transition-colors"
          >
            {currentRoomCode}
          </button>
          <p className="text-sm text-slate-400 mt-4">
            {codeCopied ? '✅ Code copied!' : '👆 Tap to copy code'}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Share this code with anyone to let them watch live
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-surface rounded-xl p-4">
          <h3 className="text-sm font-bold text-white mb-3">📱 How to watch:</h3>
          <ol className="text-xs text-slate-400 space-y-2">
            <li className="flex gap-2">
              <span className="text-emerald-400 font-bold">1.</span>
              Open KashmirCric app on their phone
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-400 font-bold">2.</span>
              Tap "Join Match" on home screen
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-400 font-bold">3.</span>
              Enter code: <span className="font-mono font-bold text-emerald-400">{currentRoomCode}</span>
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-400 font-bold">4.</span>
              Score updates automatically in real-time! ⚡
            </li>
          </ol>
        </div>

        {/* Current Score Preview */}
        <div className="bg-surface rounded-2xl p-4">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">Current Score</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-white">{teamA?.name}</span>
              {match.innings[0] && match.innings[0].battingTeamId === match.teamAId && (
                <span className="font-bold text-white">{match.innings[0].totalRuns}/{match.innings[0].totalWickets}</span>
              )}
              {match.innings[1] && match.innings[1].battingTeamId === match.teamAId && (
                <span className="font-bold text-white">{match.innings[1].totalRuns}/{match.innings[1].totalWickets}</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-white">{teamB?.name}</span>
              {match.innings[0] && match.innings[0].battingTeamId === match.teamBId && (
                <span className="font-bold text-white">{match.innings[0].totalRuns}/{match.innings[0].totalWickets}</span>
              )}
              {match.innings[1] && match.innings[1].battingTeamId === match.teamBId && (
                <span className="font-bold text-white">{match.innings[1].totalRuns}/{match.innings[1].totalWickets}</span>
              )}
            </div>
          </div>
          {match.result && (
            <p className="text-sm text-emerald-400 text-center mt-3 pt-3 border-t border-slate-700">{match.result}</p>
          )}
        </div>

        {/* Share Options */}
        <div className="space-y-3">
          <button
            onClick={shareViaWhatsApp}
            className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg btn-press flex items-center justify-center gap-3"
          >
            <span className="text-xl">💬</span>
            Share on WhatsApp
          </button>

          <button
            onClick={copyToClipboard}
            className={`w-full py-4 rounded-xl font-bold text-lg btn-press flex items-center justify-center gap-3 ${
              copied ? 'bg-emerald-600 text-white' : 'bg-surface text-white border border-slate-700'
            }`}
          >
            <span className="text-xl">{copied ? '✓' : '📋'}</span>
            {copied ? 'Copied!' : 'Copy Full Score Text'}
          </button>
        </div>

        {/* Firebase indicator */}
        <p className="text-xs text-slate-600 text-center">
          ⚡ Real-time sync powered by Firebase
        </p>
      </div>
    </div>
  );
}
