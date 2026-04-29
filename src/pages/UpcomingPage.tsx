import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { eventsApi } from '../services/api';
import { formatStartsIn, getFavoriteOdds, sortUpcomingRaces, type FavoriteOdd, type UpcomingRace } from './upcomingPage.logic';

const HORSE_COLORS = ['#4f5cff', '#f97316', '#0ea5e9', '#16a34a', '#dc2626', '#8b5cf6', '#ca8a04', '#0f766e'];

function formatStartDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getOddRunner(race: UpcomingRace, odd: FavoriteOdd) {
  return race.runners.find((runner) => runner.horseId.toString() === odd.selectionId);
}

function UpcomingRaceCard({ race, now }: { race: UpcomingRace; now: number }) {
  const navigate = useNavigate();
  const favoriteOdds = getFavoriteOdds(race);

  const openRace = () => {
    navigate(`/events/${race.event.id}`, { state: { sourcePage: 'Upcoming' } });
  };

  const openQuickBet = (odd: FavoriteOdd) => {
    navigate(`/events/${race.event.id}`, {
      state: {
        sourcePage: 'Upcoming',
        selectedOdds: {
          marketId: odd.marketId,
          selectionId: odd.selectionId,
          selectionName: odd.selectionName,
          odds: odd.decimalOdds,
        },
      },
    });
  };

  return (
    <article className="panel upcoming-race-card">
      <div className="upcoming-race-time">
        <span>{formatStartsIn(race.event.startTime, now)}</span>
        <strong>{formatStartDate(race.event.startTime)}</strong>
      </div>

      <div className="upcoming-race-main">
        <div className="upcoming-race-heading">
          <div>
            <span className="status-chip scheduled">scheduled</span>
            <h2>{race.event.name}</h2>
          </div>
          <button className="secondary-action" type="button" onClick={openRace}>
            View Race
          </button>
        </div>

        <div className="upcoming-race-meta">
          <span>{race.runners.length ? `${race.runners.length} runners` : 'No field assigned'}</span>
          <span>{race.markets.length ? `${race.markets.length} markets` : 'No markets open'}</span>
        </div>

        <div className="upcoming-odds-preview" aria-label={`${race.event.name} top odds`}>
          {favoriteOdds.length === 0 ? (
            <div className="upcoming-empty-preview">No odds available for this race.</div>
          ) : (
            favoriteOdds.map((odd) => {
              const runner = getOddRunner(race, odd);
              const stallNumber = runner?.stallNumber;
              return (
                <button type="button" key={odd.id} onClick={() => openQuickBet(odd)}>
                  <span
                    className="horse-number"
                    style={
                      {
                        '--horse-color': HORSE_COLORS[((stallNumber || 1) - 1) % HORSE_COLORS.length],
                      } as CSSProperties
                    }
                  >
                    {stallNumber || '-'}
                  </span>
                  <span>
                    <strong>{runner?.horseName || odd.selectionName}</strong>
                    <em>{odd.marketName}</em>
                  </span>
                  <b>{odd.decimalOdds.toFixed(2)}</b>
                </button>
              );
            })
          )}
        </div>
      </div>
    </article>
  );
}

export default function UpcomingPage() {
  const [races, setRaces] = useState<UpcomingRace[]>([]);
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
        const events = await eventsApi.getEvents({ status: 'scheduled', limit: 100 });
        const nextRaces = await Promise.all(
          events.map(async (event) => {
            const [markets, runners] = await Promise.all([
              eventsApi.getEventMarkets(event.id).catch(() => []),
              eventsApi.getEventRunners(event.id).catch(() => []),
            ]);

            return { event, markets, runners };
          })
        );

        if (!mounted) return;
        setRaces(nextRaces);
        setError('');
      } catch {
        if (mounted) setError('Failed to load upcoming races.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadRaces();
    const refresh = window.setInterval(loadRaces, 10000);

    return () => {
      mounted = false;
      window.clearInterval(refresh);
    };
  }, []);

  const scheduledRaces = useMemo(() => sortUpcomingRaces(races), [races]);

  const nextRace = scheduledRaces[0];

  return (
    <AppShell activePage="Upcoming">
      <div className="workspace-page upcoming-page">
        <div className="page-title-row">
          <div>
            <h1>Upcoming Races</h1>
            <p>Scheduled horse races ordered by start time, with runner fields and top market prices.</p>
          </div>
          <div className="live-summary">
            <span>{scheduledRaces.length} scheduled</span>
            <span>{nextRace ? formatStartsIn(nextRace.event.startTime, now) : 'No next race'}</span>
          </div>
        </div>

        {error && (
          <div className="message-banner error" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="dashboard-loading" role="status" aria-label="Loading upcoming races">
            <span />
            <span />
            <span />
          </div>
        ) : scheduledRaces.length === 0 ? (
          <section className="panel empty-state-panel">
            <h2>No scheduled races</h2>
            <p>Scheduled horse races will appear here when they are created.</p>
          </section>
        ) : (
          <section className="upcoming-race-list" aria-label="Scheduled races">
            {scheduledRaces.map((race) => (
              <UpcomingRaceCard key={race.event.id} race={race} now={now} />
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}
