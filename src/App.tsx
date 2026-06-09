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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (screen === 'splash') navigate('home');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

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
