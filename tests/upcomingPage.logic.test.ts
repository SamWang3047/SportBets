import { describe, expect, it } from 'vitest';
import { formatStartsIn, getFavoriteOdds, sortUpcomingRaces } from '../src/pages/upcomingPage.logic';
import type { Event, Market, RaceRunner } from '../src/types';

function race(id: number, startTime: string) {
  return {
    event: {
      id,
      sportId: 2,
      name: `Race ${id}`,
      status: 'scheduled',
      startTime,
      createdAt: startTime,
      updatedAt: startTime,
    } satisfies Event,
    markets: [] as Market[],
    runners: [] as RaceRunner[],
  };
}

describe('Upcoming page logic', () => {
  it('sorts scheduled races by start time ascending', () => {
    const races = [
      race(3, '2026-04-29T11:15:00.000Z'),
      race(1, '2026-04-29T09:15:00.000Z'),
      race(2, '2026-04-29T10:15:00.000Z'),
    ];

    expect(sortUpcomingRaces(races).map((nextRace) => nextRace.event.id)).toEqual([1, 2, 3]);
  });

  it('returns the three active odds with the lowest prices and market names', () => {
    const markets: Market[] = [
      {
        id: 9,
        eventId: 1,
        marketType: 'race_winner',
        name: 'Race Winner',
        status: 'open',
        odds: [
          { id: 1, marketId: 9, selectionId: 'horse-1', selectionName: 'Long Shot', decimalOdds: 9.5, isActive: true },
          { id: 2, marketId: 9, selectionId: 'horse-2', selectionName: 'Favorite', decimalOdds: 2.1, isActive: true },
          { id: 3, marketId: 9, selectionId: 'horse-3', selectionName: 'Inactive', decimalOdds: 1.5, isActive: false },
          { id: 4, marketId: 9, selectionId: 'horse-4', selectionName: 'Second Pick', decimalOdds: 3.3, isActive: true },
          { id: 5, marketId: 9, selectionId: 'horse-5', selectionName: 'Third Pick', decimalOdds: 4.4, isActive: true },
        ],
      },
    ];

    const [first, second, third] = getFavoriteOdds({ ...race(1, '2026-04-29T09:15:00.000Z'), markets });

    expect([first.selectionName, second.selectionName, third.selectionName]).toEqual(['Favorite', 'Second Pick', 'Third Pick']);
    expect(first.marketName).toBe('Race Winner');
  });

  it('formats upcoming countdown copy from a fixed clock', () => {
    const now = Date.parse('2026-04-29T09:00:00.000Z');

    expect(formatStartsIn('2026-04-29T09:00:45.000Z', now)).toBe('Starts in 45s');
    expect(formatStartsIn('2026-04-29T10:05:00.000Z', now)).toBe('Starts in 1h 05m');
    expect(formatStartsIn('2026-04-29T08:59:00.000Z', now)).toBe('Scheduled time passed');
  });
});
