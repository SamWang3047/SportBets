import { describe, expect, it } from 'vitest';
import { formatRaceClock, getRaceProgress, sortControlRoomRunners } from '../src/pages/liveRaceControl.logic';
import type { Event, RaceRunner, RaceSimulationState } from '../src/types';

function runner(id: number, stallNumber: number, finalPosition: number | null = null): RaceRunner {
  return {
    id,
    raceId: 20,
    horseId: id * 10,
    jockeyId: id * 100,
    stallNumber,
    startingOdds: 3 + id,
    finalPosition,
    horseName: `Horse ${id}`,
    jockeyName: `Jockey ${id}`,
  };
}

function event(status: Event['status'], startTime = '2026-05-05T10:00:00.000Z'): Event {
  return {
    id: 20,
    sportId: 2,
    name: 'Dev Horse Racing',
    status,
    startTime,
    createdAt: startTime,
    updatedAt: startTime,
  };
}

describe('Live race control logic', () => {
  it('orders runners by live simulation ranking before pending runners', () => {
    const runners = [runner(1, 1), runner(2, 2), runner(3, 3)];
    const simulation: RaceSimulationState = {
      ranking: [
        { horseId: 20, position: 2, distance: 460 },
        { horseId: 10, position: 1, distance: 520 },
      ],
    };

    const ordered = sortControlRoomRunners(runners, simulation);

    expect(ordered.map((nextRunner) => nextRunner.horseId)).toEqual([10, 20, 30]);
    expect(ordered.map((nextRunner) => nextRunner.livePosition)).toEqual([1, 2, 0]);
    expect(ordered[0].liveDistance).toBe(520);
  });

  it('uses final positions after settlement', () => {
    const runners = [runner(1, 1), runner(2, 2), runner(3, 3)];
    const simulation: RaceSimulationState = {
      finalPositions: [
        { horseId: 30, position: 1 },
        { horseId: 10, position: 2 },
        { horseId: 20, position: 3 },
      ],
    };

    expect(sortControlRoomRunners(runners, simulation).map((nextRunner) => nextRunner.horseId)).toEqual([30, 10, 20]);
  });

  it('falls back to stored runner final positions and stall order', () => {
    const runners = [runner(1, 3, 2), runner(2, 1, 1), runner(3, 2, null)];

    expect(sortControlRoomRunners(runners, {}).map((nextRunner) => nextRunner.horseId)).toEqual([20, 10, 30]);
  });

  it('clamps race progress and treats finished events as complete', () => {
    expect(getRaceProgress(event('live'), { progress: 42.5 })).toBe(43);
    expect(getRaceProgress(event('live'), { progress: 120 })).toBe(100);
    expect(getRaceProgress(event('finished'), {})).toBe(100);
  });

  it('formats live countdown, scheduled start, and finished status', () => {
    const now = Date.parse('2026-05-05T09:59:30.000Z');

    expect(formatRaceClock(event('scheduled'), {}, now)).toBe('Starts in 30s');
    expect(formatRaceClock(event('live'), { estimatedEndTime: now + 65000 }, now)).toBe('65s remaining');
    expect(formatRaceClock(event('finished'), {}, now)).toBe('Finished');
  });
});
