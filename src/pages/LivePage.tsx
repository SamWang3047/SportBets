import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { eventsApi } from '../services/api';
import type { Event, RaceRunner, RaceSimulationState } from '../types';

type LiveRace = {
  event: Event;
  runners: RaceRunner[];
  simulation: RaceSimulationState;
};

const HORSE_COLORS = ['#4f5cff', '#f97316', '#0ea5e9', '#16a34a', '#dc2626', '#8b5cf6', '#ca8a04', '#0f766e'];

function parseSimulationState(value?: string): RaceSimulationState {
  if (!value) return {};

  try {
    return JSON.parse(value) as RaceSimulationState;
  } catch {
    return {};
  }
}

function formatStartTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatCountdown(race: LiveRace, now: number) {
  const estimatedEndTime = race.simulation.estimatedEndTime;
  if (!estimatedEndTime || race.event.status !== 'live') return '--';

  const seconds = Math.max(0, Math.ceil((estimatedEndTime - now) / 1000));
  return `${seconds}s`;
}

function getRunnerPosition(race: LiveRace, runner: RaceRunner) {
  const rankingPosition = race.simulation.ranking?.find((rank) => rank.horseId === runner.horseId)?.position;
  const finalPosition = race.simulation.finalPositions?.find((rank) => rank.horseId === runner.horseId)?.position;

  return rankingPosition || finalPosition || runner.finalPosition || 0;
}

function getTopRunners(race: LiveRace) {
  return [...race.runners]
    .map((runner) => ({
      ...runner,
      livePosition: getRunnerPosition(race, runner),
    }))
    .sort((a, b) => {
      if (!a.livePosition && !b.livePosition) return a.stallNumber - b.stallNumber;
      if (!a.livePosition) return 1;
      if (!b.livePosition) return -1;
      return a.livePosition - b.livePosition;
    })
    .slice(0, 3);
}

function getStatusCopy(race: LiveRace, now: number) {
  if (race.event.status === 'live') {
    return `Countdown ${formatCountdown(race, now)}`;
  }

  if (race.event.status === 'finished') {
    return 'Finished';
  }

  return `Scheduled ${formatStartTime(race.event.startTime)}`;
}

function isDevRaceSimulation(race: LiveRace) {
  return race.runners.length > 0 && ['scheduled', 'running', 'finished'].includes(race.simulation.phase || '');
}

function LiveRaceCard({ race, now }: { race: LiveRace; now: number }) {
  const navigate = useNavigate();
  const topRunners = getTopRunners(race);
  const progress = Math.round(race.simulation.progress || (race.event.status === 'finished' ? 100 : 0));

  return (
    <article className={`panel live-race-card ${race.event.status}`}>
      <button className="live-race-card-main" type="button" onClick={() => navigate(`/events/${race.event.id}`)}>
        <div className="live-race-card-head">
          <span className={`status-chip ${race.event.status}`}>{race.event.status}</span>
          <span>{getStatusCopy(race, now)}</span>
        </div>

        <h2>{race.event.name}</h2>

        <div className="live-race-progress" aria-label={`${progress}% complete`}>
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="live-race-top-three" aria-label="Top three runners">
          {topRunners.length === 0 ? (
            <span className="live-race-empty">No runners available</span>
          ) : (
            topRunners.map((runner) => (
              <div className="live-race-runner" key={runner.id}>
                <span className="horse-number" style={{ '--horse-color': HORSE_COLORS[(runner.stallNumber - 1) % HORSE_COLORS.length] } as CSSProperties}>
                  {runner.stallNumber}
                </span>
                <strong>{runner.horseName}</strong>
                <em>{runner.livePosition ? `#${runner.livePosition}` : 'Pending'}</em>
              </div>
            ))
          )}
        </div>
      </button>
    </article>
  );
}

function LiveSection({ title, description, races, now }: { title: string; description: string; races: LiveRace[]; now: number }) {
  return (
    <section className="live-race-section">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span>{races.length}</span>
      </div>

      {races.length === 0 ? (
        <div className="panel empty-state-panel">
          <h2>No races</h2>
          <p>Races will appear here when they match this state.</p>
        </div>
      ) : (
        <div className="live-race-grid">
          {races.map((race) => (
            <LiveRaceCard key={race.event.id} race={race} now={now} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function LivePage() {
  const [races, setRaces] = useState<LiveRace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadRaces = async () => {
      try {
        const events = await eventsApi.getEvents({ limit: 100 });
        const nextRaces = await Promise.all(
          events.map(async (event) => {
            const runners = await eventsApi.getEventRunners(event.id).catch(() => []);
            return {
              event,
              runners,
              simulation: parseSimulationState(event.simulationState),
            };
          })
        );

        if (!mounted) return;
        setRaces(nextRaces.filter(isDevRaceSimulation));
        setError('');
      } catch {
        if (mounted) setError('Failed to load live races.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadRaces();
    const refresh = window.setInterval(loadRaces, 2500);

    return () => {
      mounted = false;
      window.clearInterval(refresh);
    };
  }, []);

  const { scheduled, running, finished } = useMemo(() => {
    const scheduledRaces = races
      .filter((race) => race.event.status === 'scheduled')
      .sort((a, b) => new Date(a.event.startTime).getTime() - new Date(b.event.startTime).getTime());
    const runningRaces = races.filter((race) => race.event.status === 'live');
    const finishedRaces = races
      .filter((race) => race.event.status === 'finished')
      .sort((a, b) => {
        const aTime = new Date(a.event.endTime || a.event.updatedAt).getTime();
        const bTime = new Date(b.event.endTime || b.event.updatedAt).getTime();
        return bTime - aTime;
      })
      .slice(0, 10);

    return {
      scheduled: scheduledRaces,
      running: runningRaces,
      finished: finishedRaces,
    };
  }, [races]);

  return (
    <AppShell activePage="Live">
      <div className="workspace-page live-page">
        <div className="page-title-row">
          <div>
            <h1>Live Races</h1>
            <p>Watch scheduled, running, and recently finished horse race simulations.</p>
          </div>
          <div className="live-summary">
            <span>{running.length} running</span>
            <span>{scheduled.length} scheduled</span>
            <span>{finished.length} finished</span>
          </div>
        </div>

        {error && (
          <div className="message-banner error" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="dashboard-loading" role="status" aria-label="Loading live races">
            <span />
            <span />
            <span />
          </div>
        ) : (
          <>
            <LiveSection title="Running" description="30-second simulations currently in progress." races={running} now={now} />
            <LiveSection title="Scheduled" description="Races created by developers and waiting to be run." races={scheduled} now={now} />
            <LiveSection title="Recently Finished" description="Latest completed simulations with final top three." races={finished} now={now} />
          </>
        )}
      </div>
    </AppShell>
  );
}
