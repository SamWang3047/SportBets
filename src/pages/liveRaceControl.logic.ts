import type { Event, RaceRunner, RaceSimulationState } from '../types';

export type ControlRoomRunner = RaceRunner & {
  livePosition: number;
  liveDistance: number;
};

function getRunnerPosition(runner: RaceRunner, simulation: RaceSimulationState) {
  const rankingPosition = simulation.ranking?.find((rank) => rank.horseId === runner.horseId)?.position;
  const finalPosition = simulation.finalPositions?.find((rank) => rank.horseId === runner.horseId)?.position;

  return rankingPosition || finalPosition || runner.finalPosition || 0;
}

export function sortControlRoomRunners(runners: RaceRunner[], simulation: RaceSimulationState): ControlRoomRunner[] {
  return runners
    .map((runner) => {
      const ranking = simulation.ranking?.find((rank) => rank.horseId === runner.horseId);
      return {
        ...runner,
        livePosition: getRunnerPosition(runner, simulation),
        liveDistance: ranking?.distance || 0,
      };
    })
    .sort((a, b) => {
      if (!a.livePosition && !b.livePosition) return a.stallNumber - b.stallNumber;
      if (!a.livePosition) return 1;
      if (!b.livePosition) return -1;
      return a.livePosition - b.livePosition;
    });
}

export function getRaceProgress(event: Event, simulation: RaceSimulationState) {
  if (event.status === 'finished') return 100;
  const progress = Math.round(simulation.progress || 0);
  return Math.min(100, Math.max(0, progress));
}

export function formatRaceClock(event: Event, simulation: RaceSimulationState, now: number) {
  if (event.status === 'finished') return 'Finished';

  if (event.status === 'live') {
    const estimatedEndTime = simulation.estimatedEndTime;
    if (!estimatedEndTime) return 'Running';

    const seconds = Math.max(0, Math.ceil((estimatedEndTime - now) / 1000));
    return `${seconds}s remaining`;
  }

  const startTime = new Date(event.startTime).getTime();
  if (Number.isNaN(startTime)) return 'Scheduled';

  const seconds = Math.ceil((startTime - now) / 1000);
  if (seconds <= 0) return 'Ready to run';
  if (seconds < 60) return `Starts in ${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `Starts in ${minutes}m ${remainingSeconds.toString().padStart(2, '0')}s`;
}

export function parseSimulationState(value?: string): RaceSimulationState {
  if (!value) return {};

  try {
    return JSON.parse(value) as RaceSimulationState;
  } catch {
    return {};
  }
}
