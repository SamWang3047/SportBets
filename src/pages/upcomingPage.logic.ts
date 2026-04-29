import type { Event, Market, Odd, RaceRunner } from '../types';

export type UpcomingRace = {
  event: Event;
  markets: Market[];
  runners: RaceRunner[];
};

export type FavoriteOdd = Odd & {
  marketName: string;
};

export function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds.toString().padStart(2, '0')}s`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes.toString().padStart(2, '0')}m`;
}

export function formatStartsIn(value: string, now: number) {
  const startTime = new Date(value).getTime();
  if (Number.isNaN(startTime)) return 'Scheduled';

  const seconds = Math.ceil((startTime - now) / 1000);
  if (seconds <= 0) return 'Scheduled time passed';

  return `Starts in ${formatDuration(seconds)}`;
}

export function getFavoriteOdds(race: UpcomingRace): FavoriteOdd[] {
  return race.markets
    .flatMap((market) =>
      market.odds.map((odd) => ({
        ...odd,
        marketId: market.id,
        marketName: market.name,
      }))
    )
    .filter((odd) => odd.isActive)
    .sort((a, b) => a.decimalOdds - b.decimalOdds)
    .slice(0, 3);
}

export function sortUpcomingRaces(races: UpcomingRace[]) {
  return [...races].sort((a, b) => new Date(a.event.startTime).getTime() - new Date(b.event.startTime).getTime());
}
