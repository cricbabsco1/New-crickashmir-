import { useEffect } from 'react';
import { useStore } from './store';
import SplashScreen from './screens/SplashScreen';
import HomeScreen from './screens/HomeScreen';
import MatchesScreen from './screens/MatchesScreen';
import NewMatchScreen from './screens/NewMatchScreen';
import ScoringScreen from './screens/ScoringScreen';
import StatsScreen from './screens/StatsScreen';
import SettingsScreen from './screens/SettingsScreen';
import TeamCreateScreen from './screens/TeamCreateScreen';
import TeamDetailScreen from './screens/TeamDetailScreen';
import MatchDetailScreen from './screens/MatchDetailScreen';
import MatchSummaryScreen from './screens/MatchSummaryScreen';
import LiveViewScreen from './screens/LiveViewScreen';
import ShareScoreScreen from './screens/ShareScoreScreen';
import JoinMatchScreen from './screens/JoinMatchScreen';
import BottomNav from './components/BottomNav';

export default function App() {
  const screen = useStore(s => s.screen);
  const navigate = useStore(s => s.navigate);
  // Get active room string tracking from your Zustand store if it exists
  const currentRoomCode = useStore(s => (s as any).roomCode || (s as any).currentRoom || null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (screen === 'splash') navigate('home');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Structural Navigation Routing Guard: 
  // If a user is currently on the 'scoring' panel layout view, but they loaded into it 
  // from a shared room cloud code connection, force reroute them onto the safe LiveViewScreen instead.
  useEffect(() => {
    if (screen === 'scoring' && currentRoomCode) {
      console.log('[App Security Guard] Redirecting viewer away from scoring panel onto LiveView.');
      navigate('liveView');
    }
  }, [screen, currentRoomCode, navigate]);

  // Determine when to display the global bottom navigation dashboard tabs
  const showNav = !['splash', 'scoring', 'newMatch', 'teamCreate', 'matchSummary', 'liveView', 'shareScore', 'joinMatch'].includes(screen);

  return (
    <div className="flex flex-col h-full bg-bg-deep">
      <div className="flex-1 overflow-hidden">
        {screen === 'splash' && <SplashScreen />}
        {screen === 'home' && <HomeScreen />}
        {screen === 'matches' && <MatchesScreen />}
        {screen === 'newMatch' && <NewMatchScreen />}
        {screen === 'scoring' && <ScoringScreen />}
        {screen === 'stats' && <StatsScreen />}
        {screen === 'settings' && <SettingsScreen />}
        {screen === 'teamCreate' && <TeamCreateScreen />}
        {screen === 'teamDetail' && <TeamDetailScreen />}
        {screen === 'matchDetail' && <MatchDetailScreen />}
        {screen === 'matchSummary' && <MatchSummaryScreen />}
        {screen === 'liveView' && <LiveViewScreen />}
        {screen === 'shareScore' && <ShareScoreScreen />}
        {screen === 'joinMatch' && <JoinMatchScreen />}
      </div>
      {showNav && <BottomNav />}
    </div>
  );
}
