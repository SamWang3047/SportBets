import { describe, expect, it } from 'vitest';
import { isOverdueRunningDevRace, isScheduledDevRace } from '../backend/src/services/devRaceScheduler.logic';

describe('Dev race scheduler logic', () => {
  it('only treats scheduled simulation state as auto-startable', () => {
    expect(isScheduledDevRace(JSON.stringify({ phase: 'scheduled', progress: 0 }))).toBe(true);
    expect(isScheduledDevRace(JSON.stringify({ phase: 'running', progress: 20 }))).toBe(false);
    expect(isScheduledDevRace(null)).toBe(false);
    expect(isScheduledDevRace('not json')).toBe(false);
  });

  it('detects running simulations whose estimated end time has passed', () => {
    const now = Date.parse('2026-04-29T09:30:00.000Z');

    expect(isOverdueRunningDevRace(JSON.stringify({ phase: 'running', estimatedEndTime: now - 1 }), now)).toBe(true);
    expect(isOverdueRunningDevRace(JSON.stringify({ phase: 'running', estimatedEndTime: now + 1 }), now)).toBe(false);
    expect(isOverdueRunningDevRace(JSON.stringify({ phase: 'finished', estimatedEndTime: now - 1 }), now)).toBe(false);
    expect(isOverdueRunningDevRace(JSON.stringify({ phase: 'running' }), now)).toBe(false);
    expect(isOverdueRunningDevRace('not json', now)).toBe(false);
  });
});
