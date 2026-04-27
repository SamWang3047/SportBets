import { events, markets, odds, footballTeams, horses, jockeys, raceRunners } from '../db/schema';
import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import { eventStatusEnum } from '../db/schema';
import { updateEventStatus, updateEventSimulationState, updateOdds, closeMarket, settleMarket } from './event.service';
import { settleEventBets } from './bet.service';

// Simulation state interfaces
export interface HorseRaceSimulationState {
  elapsed: number;
  duration: number;
  horses: Array<{
    id: number;
    name: string;
    progress: number;
    finished: boolean;
    position?: number;
  }>;
}

export interface FootballMatchSimulationState {
  elapsed: number;
  duration: number;
  homeScore: number;
  awayScore: number;
  homeTeamId: number;
  awayTeamId: number;
  events: Array<{
    minute: number;
    type: 'goal' | 'yellow_card' | 'red_card';
    team: 'home' | 'away';
    player?: string;
  }>;
}

// Active simulations
const activeSimulations = new Map<number, NodeJS.Timeout>();

export async function startHorseRaceSimulation(eventId: number) {
  const event = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event[0]) {
    throw new Error('Event not found');
  }

  // Get race runners
  const runners = await db
    .select()
    .from(raceRunners)
    .where(eq(raceRunners.raceId, eventId));

  if (runners.length === 0) {
    throw new Error('No runners found for this race');
  }

  // Get horse details
  const horseIds = runners.map((r) => r.horseId);
  const horsesData = await db
    .select()
    .from(horses)
    .where(eq(horses.id, horseIds[0])); // This is a simplified query

  // Initialize simulation state
  const simulationState: HorseRaceSimulationState = {
    elapsed: 0,
    duration: 120, // 2 minutes
    horses: runners.map((runner) => ({
      id: runner.horseId,
      name: `Horse ${runner.stallNumber}`,
      progress: 0,
      finished: false,
    })),
  };

  await updateEventStatus(eventId, 'live');
  await updateEventSimulationState(eventId, simulationState);

  // Start simulation loop
  const interval = setInterval(async () => {
    const currentState = await simulateHorseRaceStep(eventId, simulationState);

    if (currentState.horses.every((h) => h.finished)) {
      // Race finished
      clearInterval(interval);
      activeSimulations.delete(eventId);

      const winner = currentState.horses.find((h) => h.position === 1);
      if (winner) {
        await finishHorseRace(eventId, winner.id);
      }
    }
  }, 1000);

  activeSimulations.set(eventId, interval);
}

async function simulateHorseRaceStep(eventId: number, state: HorseRaceSimulationState): Promise<HorseRaceSimulationState> {
  state.elapsed += 1;

  // Update each horse's progress
  state.horses = state.horses.map((horse) => {
    if (horse.finished) return horse;

    // Random progress based on horse attributes (simplified)
    const speedFactor = 0.5 + Math.random() * 1.5;
    const progressIncrement = speedFactor * (100 / state.duration);
    const newProgress = Math.min(100, horse.progress + progressIncrement);

    const finished = newProgress >= 100;

    return {
      ...horse,
      progress: newProgress,
      finished,
    };
  });

  // Update positions for finished horses
  const finishedHorses = state.horses.filter((h) => h.finished);
  finishedHorses.sort((a, b) => b.progress - a.progress);
  finishedHorses.forEach((horse, index) => {
    horse.position = index + 1;
  });

  // Update odds based on progress
  await updateRaceOdds(eventId, state);

  // Save state
  await updateEventSimulationState(eventId, state);

  return state;
}

async function updateRaceOdds(eventId: number, state: HorseRaceSimulationState) {
  const [market] = await db
    .select()
    .from(markets)
    .where(and(eq(markets.eventId, eventId), eq(markets.marketType, 'race_winner')));

  if (!market) return;

  const oddsUpdates = state.horses.map((horse) => {
    const progressFactor = 1 + (horse.progress / 100) * 0.5;
    const baseOdds = 2.0; // Simplified
    return {
      selectionId: horse.id.toString(),
      decimalOdds: baseOdds * progressFactor,
    };
  });

  await updateOdds(market.id, oddsUpdates);
}

async function finishHorseRace(eventId: number, winnerId: number) {
  await updateEventStatus(eventId, 'finished');

  // Close and settle market
  const [market] = await db
    .select()
    .from(markets)
    .where(and(eq(markets.eventId, eventId), eq(markets.marketType, 'race_winner')));

  if (market) {
    await closeMarket(market.id);
    await settleMarket(market.id, winnerId.toString());
    await settleEventBets(eventId, winnerId.toString());
  }
}

export async function startFootballMatchSimulation(eventId: number) {
  const event = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event[0]) {
    throw new Error('Event not found');
  }

  // Initialize simulation state
  const simulationState: FootballMatchSimulationState = {
    elapsed: 0,
    duration: 540, // 9 minutes (simulated 90 min)
    homeScore: 0,
    awayScore: 0,
    homeTeamId: 0,
    awayTeamId: 0,
    events: [],
  };

  await updateEventStatus(eventId, 'live');
  await updateEventSimulationState(eventId, simulationState);

  // Start simulation loop
  const interval = setInterval(async () => {
    const currentState = await simulateFootballMatchStep(eventId, simulationState);

    if (currentState.elapsed >= currentState.duration) {
      // Match finished
      clearInterval(interval);
      activeSimulations.delete(eventId);

      await finishFootballMatch(eventId, currentState);
    }
  }, 1000);

  activeSimulations.set(eventId, interval);
}

async function simulateFootballMatchStep(eventId: number, state: FootballMatchSimulationState): Promise<FootballMatchSimulationState> {
  state.elapsed += 1;
  const simulatedMinute = Math.floor(state.elapsed / 60);

  // Random chance of goal
  const goalChance = 0.02 + (simulatedMinute / 90) * 0.03;

  if (Math.random() < goalChance) {
    const homeScores = Math.random() < 0.5;

    if (homeScores) {
      state.homeScore += 1;
      state.events.push({
        minute: simulatedMinute,
        type: 'goal',
        team: 'home',
      });
    } else {
      state.awayScore += 1;
      state.events.push({
        minute: simulatedMinute,
        type: 'goal',
        team: 'away',
      });
    }

    // Update odds after goal
    await updateMatchOdds(eventId, state);
  }

  // Save state
  await updateEventSimulationState(eventId, state);

  return state;
}

async function updateMatchOdds(eventId: number, state: FootballMatchSimulationState) {
  const [market] = await db
    .select()
    .from(markets)
    .where(and(eq(markets.eventId, eventId), eq(markets.marketType, 'match_winner')));

  if (!market) return;

  const scoreDiff = state.homeScore - state.awayScore;

  const oddsUpdates = [
    {
      selectionId: 'home',
      decimalOdds: 2.0 * (1 - scoreDiff * 0.2),
    },
    {
      selectionId: 'draw',
      decimalOdds: 3.0,
    },
    {
      selectionId: 'away',
      decimalOdds: 2.0 * (1 + scoreDiff * 0.2),
    },
  ];

  await updateOdds(market.id, oddsUpdates);
}

async function finishFootballMatch(eventId: number, state: FootballMatchSimulationState) {
  await updateEventStatus(eventId, 'finished');

  // Determine winner
  let winningSelectionId: string;
  if (state.homeScore > state.awayScore) {
    winningSelectionId = 'home';
  } else if (state.awayScore > state.homeScore) {
    winningSelectionId = 'away';
  } else {
    winningSelectionId = 'draw';
  }

  // Close and settle market
  const [market] = await db
    .select()
    .from(markets)
    .where(and(eq(markets.eventId, eventId), eq(markets.marketType, 'match_winner')));

  if (market) {
    await closeMarket(market.id);
    await settleMarket(market.id, winningSelectionId);
    await settleEventBets(eventId, winningSelectionId);
  }
}

export function stopSimulation(eventId: number) {
  const interval = activeSimulations.get(eventId);
  if (interval) {
    clearInterval(interval);
    activeSimulations.delete(eventId);
  }
}

export function stopAllSimulations() {
  activeSimulations.forEach((interval) => clearInterval(interval));
  activeSimulations.clear();
}
