export function isScheduledDevRace(simulationState: string | null) {
  if (!simulationState) return false;

  try {
    const parsed = JSON.parse(simulationState) as { phase?: string };
    return parsed.phase === 'scheduled';
  } catch {
    return false;
  }
}

export function isOverdueRunningDevRace(simulationState: string | null, now = Date.now()) {
  if (!simulationState) return false;

  try {
    const parsed = JSON.parse(simulationState) as { phase?: string; estimatedEndTime?: number };
    return parsed.phase === 'running' && typeof parsed.estimatedEndTime === 'number' && parsed.estimatedEndTime <= now;
  } catch {
    return false;
  }
}
