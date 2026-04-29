export interface User {
  id: number;
  email: string;
  displayName: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Sport {
  id: number;
  code: string;
  name: string;
}

export interface Event {
  id: number;
  sportId: number;
  name: string;
  status: 'scheduled' | 'live' | 'finished' | 'cancelled';
  startTime: string;
  endTime?: string;
  simulationState?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Market {
  id: number;
  eventId: number;
  marketType: string;
  name: string;
  status: string;
  odds: Odd[];
}

export interface Odd {
  id: number;
  marketId: number;
  selectionId: string;
  selectionName: string;
  decimalOdds: number;
  isActive: boolean;
}

export interface RaceRunner {
  id: number;
  raceId: number;
  horseId: number;
  jockeyId: number;
  stallNumber: number;
  startingOdds: number;
  finalPosition: number | null;
  horseName: string;
  jockeyName: string;
}

export interface RaceSimulationRanking {
  horseId: number;
  position: number;
  distance: number;
}

export interface RaceSimulationState {
  phase?: 'scheduled' | 'running' | 'finished';
  progress?: number;
  simulationId?: string;
  startTime?: number;
  estimatedEndTime?: number;
  ranking?: RaceSimulationRanking[];
  winner?: string;
  finalPositions?: Array<{
    horseId: number;
    position: number;
  }>;
}

export interface Bet {
  id: number;
  eventId: number;
  marketId: number;
  selectionId: string;
  stake: number;
  oddsAtPlacement: number;
  potentialPayout: number;
  status: 'pending' | 'won' | 'lost' | 'void';
  placedAt: string;
  settledAt?: string;
}

export interface Wallet {
  id: number;
  balance: number;
  currency: string;
}

export interface Transaction {
  id: number;
  type: string;
  amount: number;
  balanceAfter: number;
  referenceId?: string;
  description?: string;
  createdAt: string;
}
