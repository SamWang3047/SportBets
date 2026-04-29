import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { betsApi, eventsApi } from '../services/api';
import type { Event, Market, RaceRunner, RaceSimulationState } from '../types';

type SelectedOdds = {
  marketId: number;
  selectionId: string;
  selectionName: string;
  odds: number;
};

type EventDetailRouteState = {
  sourcePage?: 'Upcoming' | 'Live' | 'Dashboard';
  selectedOdds?: SelectedOdds;
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

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string } } }).response;
    return response?.data?.error || fallback;
  }

  return fallback;
}

function getRunnerPosition(runner: RaceRunner, simulation: RaceSimulationState) {
  const rankingPosition = simulation.ranking?.find((rank) => rank.horseId === runner.horseId)?.position;
  const finalPosition = simulation.finalPositions?.find((rank) => rank.horseId === runner.horseId)?.position;

  return rankingPosition || finalPosition || runner.finalPosition || 0;
}

function RaceFieldPanel({ event, runners }: { event: Event; runners: RaceRunner[] }) {
  const simulation = parseSimulationState(event.simulationState);
  const sortedRunners = [...runners]
    .map((runner) => ({
      ...runner,
      livePosition: getRunnerPosition(runner, simulation),
    }))
    .sort((a, b) => {
      if (!a.livePosition && !b.livePosition) return a.stallNumber - b.stallNumber;
      if (!a.livePosition) return 1;
      if (!b.livePosition) return -1;
      return a.livePosition - b.livePosition;
    });

  return (
    <section className="panel race-field-panel">
      <div className="panel-heading-row">
        <h2>Race Field</h2>
        <span>{runners.length} runners</span>
      </div>

      {sortedRunners.length === 0 ? (
        <p>No runners have been assigned to this race.</p>
      ) : (
        <div className="race-runner-list">
          {sortedRunners.map((runner) => (
            <div className="race-runner-row" key={runner.id}>
              <span className="horse-number" style={{ '--horse-color': HORSE_COLORS[(runner.stallNumber - 1) % HORSE_COLORS.length] } as CSSProperties}>
                {runner.stallNumber}
              </span>
              <span>{runner.livePosition ? `#${runner.livePosition}` : 'Pending'}</span>
              <strong>{runner.horseName}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as EventDetailRouteState | null;
  const sourcePage = routeState?.sourcePage;
  const routeSelectedOdds = routeState?.selectedOdds;
  const [event, setEvent] = useState<Event | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [runners, setRunners] = useState<RaceRunner[]>([]);
  const [selectedOdds, setSelectedOdds] = useState<SelectedOdds | null>(() => routeSelectedOdds || null);
  const [stake, setStake] = useState('100');
  const [loading, setLoading] = useState(true);
  const [placingBet, setPlacingBet] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadEventData = async (showLoading = false) => {
      if (!eventId) return;

      if (showLoading) setLoading(true);
      setError('');

      try {
        const id = Number.parseInt(eventId, 10);
        const [eventData, marketsData, runnersData] = await Promise.all([
          eventsApi.getEvent(id),
          eventsApi.getEventMarkets(id),
          eventsApi.getEventRunners(id).catch(() => []),
        ]);

        if (!mounted) return;
        setEvent(eventData);
        setMarkets(marketsData);
        setRunners(runnersData);
      } catch {
        if (mounted) setError('Failed to load event data.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadEventData(true);
    const refresh = window.setInterval(() => loadEventData(), 2500);

    return () => {
      mounted = false;
      window.clearInterval(refresh);
    };
  }, [eventId]);

  const featuredOdds = useMemo(() => markets.flatMap((market) => market.odds.slice(0, 3)).slice(0, 3), [markets]);
  const stakeNumber = Number.parseFloat(stake) || 0;
  const potentialPayout = selectedOdds ? stakeNumber * selectedOdds.odds : 0;

  const handleSelectOdds = (marketId: number, selectionId: string, selectionName: string, odds: number) => {
    setSelectedOdds({ marketId, selectionId, selectionName, odds });
    setSuccess('');
    setError('');
  };

  const handlePlaceBet = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedOdds || !stake || !event) return;

    setPlacingBet(true);
    setError('');
    setSuccess('');

    try {
      await betsApi.placeBet({
        eventId: event.id,
        marketId: selectedOdds.marketId,
        selectionId: selectedOdds.selectionId,
        stake: stakeNumber,
      });

      setSuccess('Bet placed successfully.');
      setSelectedOdds(null);
      setStake('100');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to place bet.'));
    } finally {
      setPlacingBet(false);
    }
  };

  return (
    <AppShell activePage={sourcePage || 'Live'}>
      <div className="workspace-page">
        <button className="back-link" type="button" onClick={() => navigate(sourcePage === 'Upcoming' ? '/upcoming' : '/')}>
          Back to {sourcePage || 'Dashboard'}
        </button>

        {loading ? (
          <div className="dashboard-loading" role="status" aria-label="Loading event">
            <span />
            <span />
          </div>
        ) : !event ? (
          <section className="panel empty-state-panel">
            <h1>Event not found</h1>
            <p>The selected event is unavailable or has been removed.</p>
          </section>
        ) : (
          <>
            <section className="panel event-hero-panel">
              <div>
                <span className={`status-chip ${event.status}`}>{event.status}</span>
                <h1>{event.name}</h1>
                <p>{formatDateTime(event.startTime)}</p>
              </div>
              <div className="hero-odds-strip">
                {featuredOdds.length > 0 ? (
                  featuredOdds.map((odd) => (
                    <button
                      key={odd.id}
                      type="button"
                      onClick={() => handleSelectOdds(odd.marketId, odd.selectionId, odd.selectionName, odd.decimalOdds)}
                      disabled={event.status !== 'scheduled' || !odd.isActive}
                    >
                      <span>{odd.selectionName}</span>
                      <strong>{odd.decimalOdds.toFixed(2)}</strong>
                    </button>
                  ))
                ) : (
                  <span>No markets are open yet.</span>
                )}
              </div>
            </section>

            {(error || success) && (
              <div className={`message-banner ${success ? 'success' : 'error'}`} role="status">
                {success || error}
              </div>
            )}

            <div className="event-detail-grid">
              <section className="market-stack" aria-label="Betting markets">
                <RaceFieldPanel event={event} runners={runners} />
                <div className="section-heading">
                  <h2>Betting Markets</h2>
                  <span>{markets.length} open</span>
                </div>
                {markets.length === 0 ? (
                  <div className="panel empty-state-panel">
                    <h2>No markets available</h2>
                    <p>Check back when the event markets are opened.</p>
                  </div>
                ) : (
                  markets.map((market) => (
                    <article key={market.id} className="panel market-panel">
                      <div className="market-panel-heading">
                        <div>
                          <h3>{market.name}</h3>
                          <span>{market.status}</span>
                        </div>
                        <span>{market.marketType}</span>
                      </div>
                      <div className="market-odds-grid">
                        {market.odds.map((odd) => (
                          <button
                            key={odd.id}
                            type="button"
                            onClick={() => handleSelectOdds(market.id, odd.selectionId, odd.selectionName, odd.decimalOdds)}
                            disabled={event.status !== 'scheduled' || !odd.isActive}
                            className={
                              selectedOdds?.marketId === market.id && selectedOdds?.selectionId === odd.selectionId
                                ? 'is-selected'
                                : ''
                            }
                          >
                            <span>{odd.selectionName}</span>
                            <strong>{odd.decimalOdds.toFixed(2)}</strong>
                          </button>
                        ))}
                      </div>
                    </article>
                  ))
                )}
              </section>

              <aside className="panel quick-bet-panel">
                <h2>Quick Bet</h2>
                {selectedOdds ? (
                  <form onSubmit={handlePlaceBet}>
                    <div className="quick-selection">
                      <span>Selection</span>
                      <strong>{selectedOdds.selectionName}</strong>
                      <em>{selectedOdds.odds.toFixed(2)}</em>
                    </div>

                    <label htmlFor="event-stake">Stake</label>
                    <input
                      id="event-stake"
                      type="number"
                      value={stake}
                      onChange={(e) => setStake(e.target.value)}
                      min="1"
                      step="0.01"
                      required
                    />

                    <div className="quick-payout">
                      <span>Potential Payout</span>
                      <strong>${potentialPayout.toFixed(2)}</strong>
                    </div>

                    <button className="primary-action" type="submit" disabled={placingBet || event.status !== 'scheduled'}>
                      {placingBet ? 'Placing Bet...' : 'Place Bet'}
                    </button>
                    <button className="secondary-action" type="button" onClick={() => setSelectedOdds(null)}>
                      Clear Selection
                    </button>
                  </form>
                ) : (
                  <p>Select a market price to build your bet slip.</p>
                )}
              </aside>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
