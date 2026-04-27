import { HorseRace, FootballMatch, Event, Horse, Team } from './types';

// Sample data for generating events
const HORSE_NAMES = [
  'Thunder Strike', 'Silver Bullet', 'Midnight Runner', 'Golden Gale',
  'Storm Chaser', 'Wind Dancer', 'Fire Storm', 'Lightning Bolt',
  'Shadowfax', 'Seabiscuit Jr.', 'Secretariat II', 'Man o\' War Legacy'
];

const JOCKEY_NAMES = [
  'John Smith', 'Mike Johnson', 'David Williams', 'Robert Brown',
  'James Davis', 'William Miller', 'Richard Wilson', 'Joseph Taylor'
];

const VENUES = [
  'Ascot', 'Churchill Downs', 'Del Mar', 'Saratoga',
  'Epsom Downs', 'Flemington', 'Longchamp', 'Santa Anita'
];

const FOOTBALL_TEAMS = [
  'Manchester United', 'Liverpool', 'Chelsea', 'Arsenal',
  'Manchester City', 'Tottenham', 'Real Madrid', 'Barcelona',
  'Bayern Munich', 'PSG', 'Juventus', 'AC Milan'
];

// Utility functions
const randomFrom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number): number => Math.random() * (max - min) + min;

// Generate a random horse
function generateHorse(id: string): Horse {
  const baseOdds = randomFloat(1.5, 10);
  return {
    id,
    name: randomFrom(HORSE_NAMES),
    jockey: randomFrom(JOCKEY_NAMES),
    odds: baseOdds,
    currentOdds: baseOdds,
    finished: false,
    progress: 0
  };
}

// Generate a horse race
export function generateHorseRace(): HorseRace {
  const id = `race-${Date.now()}-${randomInt(1000, 9999)}`;
  const horses = Array.from({ length: 6 }, (_, i) => generateHorse(`${id}-horse-${i}`));

  // Sort by odds to determine favorite
  horses.sort((a, b) => a.odds - b.odds);

  return {
    id,
    type: 'horse_race',
    name: `${randomInt(1, 12)}:00 ${randomFrom(['Sprint', 'Stakes', 'Cup', 'Handicap', 'Maiden'])}`,
    venue: randomFrom(VENUES),
    startTime: new Date(Date.now() + randomInt(30000, 300000)), // 30s to 5min from now
    status: 'upcoming',
    horses,
    duration: 120, // 2 minutes
    elapsed: 0
  };
}

// Generate a football match
export function generateFootballMatch(): FootballMatch {
  const id = `match-${Date.now()}-${randomInt(1000, 9999)}`;
  const homeTeam = randomFrom(FOOTBALL_TEAMS);
  let awayTeam = randomFrom(FOOTBALL_TEAMS);
  while (awayTeam === homeTeam) {
    awayTeam = randomFrom(FOOTBALL_TEAMS);
  }

  const homeOdds = randomFloat(1.8, 3.5);
  const awayOdds = randomFloat(1.8, 3.5);
  const drawOdds = randomFloat(2.5, 4.0);

  return {
    id,
    type: 'football_match',
    name: `${homeTeam} vs ${awayTeam}`,
    venue: randomFrom(['Old Trafford', 'Anfield', 'Stamford Bridge', 'Emirates', 'Etihad', 'Santiago Bernabéu', 'Camp Nou']),
    startTime: new Date(Date.now() + randomInt(60000, 600000)), // 1min to 10min from now
    status: 'upcoming',
    homeTeam: {
      id: `${id}-home`,
      name: homeTeam,
      odds: homeOdds,
      currentOdds: homeOdds,
      score: 0
    },
    awayTeam: {
      id: `${id}-away`,
      name: awayTeam,
      odds: awayOdds,
      currentOdds: awayOdds,
      score: 0
    },
    duration: 540, // 9 minutes (simulated 90 min match)
    elapsed: 0
  };
}

// Simulate horse race progress
export function simulateHorseRaceStep(race: HorseRace): HorseRace {
  if (race.status !== 'live') return race;

  const updated = { ...race, elapsed: race.elapsed + 1 };

  // Update each horse's progress
  updated.horses = race.horses.map((horse, index) => {
    if (horse.finished) return horse;

    // Random progress based on odds (lower odds = faster)
    const speedFactor = 1 / (horse.odds * 0.3);
    const progressIncrement = randomFloat(0.5, 2.5) * speedFactor;
    const newProgress = Math.min(100, horse.progress + progressIncrement);

    // Check if finished
    const finished = newProgress >= 100;

    // Update odds based on progress
    const oddsMultiplier = 1 + (newProgress / 100) * 0.5;
    const newOdds = horse.odds * oddsMultiplier;

    return {
      ...horse,
      progress: newProgress,
      finished,
      currentOdds: newOdds
    };
  });

  // Check if race is complete
  const finishedHorses = updated.horses.filter(h => h.finished);
  if (finishedHorses.length === updated.horses.length) {
    updated.status = 'settled';
    updated.winner = updated.horses[0].id; // First horse to finish
    updated.horses = updated.horses.map((h, i) => ({
      ...h,
      position: i + 1
    }));
  }

  return updated;
}

// Simulate football match progress
export function simulateFootballMatchStep(match: FootballMatch): FootballMatch {
  if (match.status !== 'live') return match;

  const updated = { ...match, elapsed: match.elapsed + 1 };

  // Simulate minute of play (each step = 1 simulated minute)
  const simulatedMinute = Math.floor(updated.elapsed / 60);

  // Random chance of goal (higher in later minutes)
  const goalChance = 0.02 + (simulatedMinute / 90) * 0.03;

  if (Math.random() < goalChance) {
    // Determine which team scores
    const homeStrength = 1 / match.homeTeam.odds;
    const awayStrength = 1 / match.awayTeam.odds;
    const totalStrength = homeStrength + awayStrength;
    const homeScores = Math.random() < (homeStrength / totalStrength);

    if (homeScores) {
      updated.homeTeam = { ...match.homeTeam, score: match.homeTeam.score + 1 };
    } else {
      updated.awayTeam = { ...match.awayTeam, score: match.awayTeam.score + 1 };
    }

    // Update odds after goal
    const homeScore = updated.homeTeam.score;
    const awayScore = updated.awayTeam.score;
    const scoreDiff = homeScore - awayScore;

    updated.homeTeam.currentOdds = match.homeTeam.odds * (1 - scoreDiff * 0.2);
    updated.awayTeam.currentOdds = match.awayTeam.odds * (1 + scoreDiff * 0.2);
  }

  // Check if match is complete
  if (updated.elapsed >= updated.duration) {
    updated.status = 'settled';

    if (updated.homeTeam.score > updated.awayTeam.score) {
      updated.winner = 'home';
    } else if (updated.awayTeam.score > updated.homeTeam.score) {
      updated.winner = 'away';
    } else {
      updated.winner = 'draw';
    }
  }

  return updated;
}

// Simulation engine class
export class SimulationEngine {
  private events: Map<string, Event> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  // Add an event to the simulation
  addEvent(event: Event): void {
    this.events.set(event.id, event);
  }

  // Get an event by ID
  getEvent(id: string): Event | undefined {
    return this.events.get(id);
  }

  // Get all events
  getAllEvents(): Event[] {
    return Array.from(this.events.values());
  }

  // Get events by type
  getEventsByType(type: 'horse_race' | 'football_match'): Event[] {
    return this.getAllEvents().filter(e => e.type === type);
  }

  // Start simulating an event
  startEvent(id: string): boolean {
    const event = this.events.get(id);
    if (!event || event.status !== 'upcoming') return false;

    event.status = 'live';
    event.startTime = new Date();

    const interval = setInterval(() => {
      const currentEvent = this.events.get(id);
      if (!currentEvent) {
        this.stopEvent(id);
        return;
      }

      let updated: Event;
      if (currentEvent.type === 'horse_race') {
        updated = simulateHorseRaceStep(currentEvent);
      } else {
        updated = simulateFootballMatchStep(currentEvent);
      }

      this.events.set(id, updated);

      // Stop if settled
      if (updated.status === 'settled') {
        this.stopEvent(id);
      }
    }, 1000); // Update every second

    this.intervals.set(id, interval);
    return true;
  }

  // Stop simulating an event
  stopEvent(id: string): void {
    const interval = this.intervals.get(id);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(id);
    }
  }

  // Remove an event
  removeEvent(id: string): void {
    this.stopEvent(id);
    this.events.delete(id);
  }

  // Clear all events
  clearAll(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    this.events.clear();
  }

  // Auto-start events when their start time arrives
  startDueEvents(): void {
    const now = Date.now();
    this.getAllEvents().forEach(event => {
      if (event.status === 'upcoming' && event.startTime.getTime() <= now) {
        this.startEvent(event.id);
      }
    });
  }
}

// Singleton instance
export const simulationEngine = new SimulationEngine();
