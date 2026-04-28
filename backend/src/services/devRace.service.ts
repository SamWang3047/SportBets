import { events, sports, markets, odds, horses, jockeys, raceRunners, bets } from '../db/schema';
import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import { settleEventBets } from './bet.service';
import { updateEventStatus, updateEventSimulationState } from './event.service';

// Sample data for generating demo races
const HORSE_NAMES = [
  'Thunder Bolt', 'Silver Streak', 'Golden Gallop', 'Midnight Runner',
  'Storm Chaser', 'Wind Dancer', 'Fire Cracker', 'Ocean Wave',
  'Mountain King', 'Desert Rose', 'Northern Star', 'Southern Belle',
];

const JOCKEY_NAMES = [
  'John Smith', 'Mike Johnson', 'David Williams', 'James Brown',
  'Robert Davis', 'Michael Miller', 'William Wilson', 'Richard Moore',
];

interface GeneratedRace {
  eventId: number;
  marketId: number;
  runners: Array<{
    id: number;
    horseId: number;
    jockeyId: number;
    stallNumber: number;
    horseName: string;
    jockeyName: string;
    startingOdds: number;
  }>;
  odds: Array<{
    id: number;
    selectionId: string;
    selectionName: string;
    decimalOdds: number;
  }>;
}

/**
 * Generate a random horse racing event with 6 horses, 6 jockeys, 6 race runners,
 * one race_winner market, and odds for each horse.
 */
export async function generateDevRace(): Promise<GeneratedRace> {
  // Get or create horse racing sport
  const [horseRacingSport] = await db
    .select()
    .from(sports)
    .where(eq(sports.code, 'horse_racing'))
    .limit(1);

  if (!horseRacingSport) {
    throw new Error('Horse racing sport not found. Please run seed script first.');
  }

  // Generate 6 horses
  const horseIds: number[] = [];
  for (let i = 0; i < 6; i++) {
    const [horse] = await db
      .insert(horses)
      .values({
        name: HORSE_NAMES[i],
        age: Math.floor(Math.random() * 5) + 3, // 3-7 years old
        speed: Math.floor(Math.random() * 30) + 60, // 60-90
        stamina: Math.floor(Math.random() * 30) + 60, // 60-90
        acceleration: Math.floor(Math.random() * 30) + 60, // 60-90
        consistency: Math.floor(Math.random() * 30) + 60, // 60-90
        preferredDistance: 1200,
      })
      .returning();
    horseIds.push(horse.id);
  }

  // Generate 6 jockeys
  const jockeyIds: number[] = [];
  for (let i = 0; i < 6; i++) {
    const [jockey] = await db
      .insert(jockeys)
      .values({
        name: JOCKEY_NAMES[i],
        experience: Math.floor(Math.random() * 50) + 50, // 50-100
        skillRating: Math.floor(Math.random() * 30) + 60, // 60-90
        aggression: Math.floor(Math.random() * 50) + 50, // 50-100
      })
      .returning();
    jockeyIds.push(jockey.id);
  }

  // Create event
  const startTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
  const [event] = await db
    .insert(events)
    .values({
      sportId: horseRacingSport.id,
      name: 'Dev Horse Racing - ' + new Date().toLocaleTimeString(),
      status: 'scheduled',
      startTime,
      simulationState: JSON.stringify({ phase: 'scheduled', progress: 0 }),
    })
    .returning();

  // Create race_winner market
  const [market] = await db
    .insert(markets)
    .values({
      eventId: event.id,
      marketType: 'race_winner',
      name: 'Race Winner',
      status: 'open',
    })
    .returning();

  // Generate odds based on horse attributes (simplified)
  const oddsValues = horseIds.map((horseId, index) => {
    // Generate odds between 1.5 and 10.0, with some randomness
    const baseOdds = 1.5 + (index * 1.5) + (Math.random() * 0.5);
    return {
      marketId: market.id,
      selectionId: horseId.toString(),
      selectionName: HORSE_NAMES[index],
      decimalOdds: baseOdds.toFixed(2),
      isActive: true,
    };
  });

  const insertedOdds = await db.insert(odds).values(oddsValues).returning();

  // Create race runners
  const runners: GeneratedRace['runners'] = [];
  for (let i = 0; i < 6; i++) {
    const [runner] = await db
      .insert(raceRunners)
      .values({
        raceId: event.id,
        horseId: horseIds[i],
        jockeyId: jockeyIds[i],
        stallNumber: i + 1,
        startingOdds: oddsValues[i].decimalOdds,
      })
      .returning();

    runners.push({
      id: runner.id,
      horseId: runner.horseId,
      jockeyId: runner.jockeyId,
      stallNumber: runner.stallNumber,
      horseName: HORSE_NAMES[i],
      jockeyName: JOCKEY_NAMES[i],
      startingOdds: parseFloat(runner.startingOdds),
    });
  }

  return {
    eventId: event.id,
    marketId: market.id,
    runners,
    odds: insertedOdds.map((odd) => ({
      id: odd.id,
      selectionId: odd.selectionId,
      selectionName: odd.selectionName,
      decimalOdds: parseFloat(odd.decimalOdds),
    })),
  };
}

/**
 * Get race runners for an event
 */
export async function getRaceRunners(eventId: number) {
  const runners = await db
    .select()
    .from(raceRunners)
    .where(eq(raceRunners.raceId, eventId));

  return runners;
}

/**
 * Get race runners with horse and jockey details
 */
export async function getRaceRunnersWithDetails(eventId: number) {
  const runners = await db
    .select({
      id: raceRunners.id,
      raceId: raceRunners.raceId,
      horseId: raceRunners.horseId,
      jockeyId: raceRunners.jockeyId,
      stallNumber: raceRunners.stallNumber,
      startingOdds: raceRunners.startingOdds,
      finalPosition: raceRunners.finalPosition,
      horseName: horses.name,
      horseSpeed: horses.speed,
      horseStamina: horses.stamina,
      horseAcceleration: horses.acceleration,
      horseConsistency: horses.consistency,
      jockeyName: jockeys.name,
      jockeyExperience: jockeys.experience,
      jockeySkillRating: jockeys.skillRating,
    })
    .from(raceRunners)
    .innerJoin(horses, eq(raceRunners.horseId, horses.id))
    .innerJoin(jockeys, eq(raceRunners.jockeyId, jockeys.id))
    .where(eq(raceRunners.raceId, eventId));

  return runners;
}

// Store active simulations
const activeSimulations = new Map<number, {
  simulationId: string;
  startTime: number;
  progress: number;
  ranking: Array<{ horseId: number; position: number; distance: number }>;
}>();

/**
 * Instantly settle a race and resolve all pending bets
 */
export async function settleDevRace(eventId: number) {
  // Get race runners
  const runners = await getRaceRunners(eventId);

  if (runners.length === 0) {
    throw new Error('No runners found for this event');
  }

  // Generate random final positions (1-based)
  const shuffledRunners = [...runners].sort(() => Math.random() - 0.5);
  const finalPositions = new Map<number, number>();

  for (let i = 0; i < shuffledRunners.length; i++) {
    finalPositions.set(shuffledRunners[i].horseId, i + 1);
  }

  // Update race runners with final positions
  await Promise.all(
    shuffledRunners.map((runner, index) =>
      db
        .update(raceRunners)
        .set({ finalPosition: index + 1 })
        .where(eq(raceRunners.id, runner.id))
    )
  );

  // Get the winning horse (position 1)
  const winner = shuffledRunners[0];
  const winningHorseId = winner.horseId.toString();

  // Update event status to finished
  await updateEventStatus(eventId, 'finished');

  // Settle all pending bets for this event
  const settledBets = await settleEventBets(eventId, winningHorseId);

  // Update simulation state
  await updateEventSimulationState(eventId, {
    phase: 'finished',
    progress: 100,
    winner: winningHorseId,
    finalPositions: Array.from(finalPositions.entries()).map(([horseId, position]) => ({
      horseId,
      position,
    })),
  });

  return {
    winningHorseId,
    finalPositions: Array.from(finalPositions.entries()),
    settledBets: settledBets.length,
  };
}

/**
 * Start a 30-second demo simulation of a race
 */
export async function runDevRace(eventId: number) {
  // Get race runners with details
  const runners = await getRaceRunnersWithDetails(eventId);

  if (runners.length === 0) {
    throw new Error('No runners found for this event');
  }

  // Update event status to live
  await updateEventStatus(eventId, 'live');

  // Generate simulation ID
  const simulationId = `sim_${eventId}_${Date.now()}`;

  // Initialize simulation state
  const initialRanking = runners.map((runner) => ({
    horseId: runner.horseId,
    position: 0,
    distance: 0,
  }));

  await updateEventSimulationState(eventId, {
    phase: 'running',
    progress: 0,
    simulationId,
    startTime: Date.now(),
    estimatedEndTime: Date.now() + 30000, // 30 seconds from now
    ranking: initialRanking,
  });

  // Store simulation in memory
  activeSimulations.set(eventId, {
    simulationId,
    startTime: Date.now(),
    progress: 0,
    ranking: initialRanking,
  });

  // Start the simulation timer
  const simulationInterval = setInterval(async () => {
    const sim = activeSimulations.get(eventId);
    if (!sim) {
      clearInterval(simulationInterval);
      return;
    }

    const elapsed = Date.now() - sim.startTime;
    const progress = Math.min((elapsed / 30000) * 100, 100);

    // Update ranking based on horse attributes and randomness
    const updatedRanking = runners.map((runner) => {
      const horseFactor = (runner.horseSpeed + runner.horseStamina + runner.horseAcceleration) / 3;
      const jockeyFactor = (runner.jockeyExperience + runner.jockeySkillRating) / 2;
      const baseFactor = (horseFactor + jockeyFactor) / 2;
      const randomness = Math.random() * 20;
      const distance = (baseFactor + randomness) * (progress / 100) * 10;

      return {
        horseId: runner.horseId,
        position: 0, // Will be calculated after sorting
        distance,
      };
    });

    // Sort by distance and assign positions
    updatedRanking.sort((a, b) => b.distance - a.distance);
    updatedRanking.forEach((item, index) => {
      item.position = index + 1;
    });

    // Update simulation state
    sim.progress = progress;
    sim.ranking = updatedRanking;

    await updateEventSimulationState(eventId, {
      phase: 'running',
      progress,
      simulationId,
      startTime: sim.startTime,
      estimatedEndTime: sim.startTime + 30000,
      ranking: updatedRanking,
    });

    // Check if simulation is complete
    if (progress >= 100) {
      clearInterval(simulationInterval);
      activeSimulations.delete(eventId);

      // Auto-settle the race
      try {
        await settleDevRace(eventId);
      } catch (error) {
        console.error('Error auto-settling race:', error);
      }
    }
  }, 1000); // Update every second

  return {
    simulationId,
    estimatedDuration: 30,
  };
}

/**
 * Get the current simulation state of a race
 */
export async function getRaceSimulationState(eventId: number) {
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event || !event.simulationState) {
    return null;
  }

  try {
    return JSON.parse(event.simulationState);
  } catch {
    return null;
  }
}
