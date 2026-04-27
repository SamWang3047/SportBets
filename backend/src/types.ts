export interface Horse {
  id: string;
  name: string;
  jockey: string;
  odds: number;
  currentOdds: number;
  position?: number;
  finished: boolean;
  progress: number; // 0-100% race completion
}

export interface HorseRace {
  id: string;
  type: 'horse_race';
  name: string;
  venue: string;
  startTime: Date;
  status: 'upcoming' | 'live' | 'settled';
  horses: Horse[];
  winner?: string;
  duration: number; // seconds
  elapsed: number; // seconds
}

export interface Team {
  id: string;
  name: string;
  odds: number;
  currentOdds: number;
  score: number;
}

export interface FootballMatch {
  id: string;
  type: 'football_match';
  name: string;
  venue: string;
  startTime: Date;
  status: 'upcoming' | 'live' | 'settled';
  homeTeam: Team;
  awayTeam: Team;
  winner?: 'home' | 'away' | 'draw';
  duration: number; // seconds
  elapsed: number; // seconds
}

export type Event = HorseRace | FootballMatch;

export interface Bet {
  id: string;
  userId: string;
  eventId: string;
  eventType: 'horse_race' | 'football_match';
  selection: string; // horseId or 'home'/'away'/'draw'
  amount: number;
  odds: number;
  potentialWin: number;
  status: 'pending' | 'won' | 'lost';
  settledAt?: Date;
}

export interface Wallet {
  userId: string;
  balance: number;
  initialBalance: number;
}
