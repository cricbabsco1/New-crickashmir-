export interface Player {
  id: string;
  name: string;
  teamId: string;
  battingStyle?: 'right' | 'left';
  bowlingStyle?: 'right-arm-fast' | 'right-arm-medium' | 'left-arm-fast' | 'left-arm-medium' | 'right-arm-spin' | 'left-arm-spin' | '';
  matches: number;
  totalRuns: number;
  totalWickets: number;
  totalBallsFaced: number;
  totalBallsBowled: number;
  totalRunsConceded: number;
  catches: number;
}

export interface Team {
  id: string;
  name: string;
  captainId?: string;
  playerIds: string[];
  createdAt: number;
}

export type ExtrasType = 'wide' | 'noball' | 'bye' | 'legbye';
export type WicketType = 'bowled' | 'caught' | 'lbw' | 'runout' | 'stumped' | 'hitwicket' | 'retiredhurt';
export type ShotZone = 'thirdman' | 'point' | 'cover' | 'extracover' | 'longoff' | 'longon' | 'squareleg' | 'midwicket' | 'fineleg' | 'straight' | '';

export interface BallEvent {
  id: string;
  matchId: string;
  innings: number;
  over: number;
  ballInOver: number;
  batsmanId: string;
  bowlerId: string;
  runs: number;
  extras: ExtrasType | null;
  extrasRuns: number;
  isWicket: boolean;
  wicketType: WicketType | null;
  dismissedPlayerId: string | null;
  fielderId: string | null;
  shotZone: ShotZone;
  timestamp: number;
  isBoundary: boolean;
}

export interface BatterInnings {
  playerId: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissal: string;
  isOnStrike: boolean;
}

export interface BowlerInnings {
  playerId: string;
  overs: number;
  balls: number;
  maidens: number;
  runs: number;
  wickets: number;
  wides: number;
  noballs: number;
}

export interface InningsData {
  battingTeamId: string;
  bowlingTeamId: string;
  totalRuns: number;
  totalWickets: number;
  totalOvers: number;
  totalBalls: number;
  extras: { wide: number; noball: number; bye: number; legbye: number; total: number };
  currentRunRate: number;
  requiredRunRate: number | null;
  target: number | null;
  batters: BatterInnings[];
  bowlers: BowlerInnings[];
  currentBatterId: string | null;
  nonStrikerId: string | null;
  currentBowlerId: string | null;
  ballEvents: BallEvent[];
  isCompleted: boolean;
  fallOfWickets: { wicket: number; runs: number; overs: string; playerId: string }[];
}

export type MatchStatus = 'setup' | 'toss' | 'live' | 'innings_break' | 'paused' | 'completed';

export interface Match {
  id: string;
  teamAId: string;
  teamBId: string;
  teamAPlayingXI: string[];
  teamBPlayingXI: string[];
  totalOvers: number;
  tossWonBy: string | null;
  tossDecision: 'bat' | 'bowl' | null;
  status: MatchStatus;
  currentInnings: number;
  innings: [InningsData | null, InningsData | null];
  result: string | null;
  mvpId: string | null;
  awards: MatchAward[];
  createdAt: number;
  updatedAt: number;
}

export interface MatchAward {
  type: 'mvp' | 'highestRuns' | 'bestBowler' | 'bestStrikeRate' | 'bestEconomy' | 'bestFielder';
  playerId: string;
  value: string;
}

export type Screen = 'splash' | 'home' | 'matches' | 'newMatch' | 'scoring' | 'stats' | 'settings' | 'teamCreate' | 'teamDetail' | 'matchDetail' | 'matchSummary' | 'playerDetail' | 'selectPlayers' | 'liveView' | 'shareScore' | 'joinMatch';
