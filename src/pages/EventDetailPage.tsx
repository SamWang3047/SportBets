import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { betsApi, eventsApi } from '../services/api';
import type { Event, Market } from '../types';

type SelectedOdds = {
  marketId: number;
  selectionId: string;
  selectionName: string;
  odds: number;
};

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

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedOdds, setSelectedOdds] = useState<SelectedOdds | null>(null);
  const [stake, setStake] = useState('100');
  const [loading, setLoading] = useState(true);
  const [placingBet, setPlacingBet] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadEventData = async () => {
      if (!eventId) return;

      setLoading(true);
      setError('');

      try {
        const id = Number.parseInt(eventId, 10);
        const [eventData, marketsData] = await Promise.all([
          eventsApi.getEvent(id),
          eventsApi.getEventMarkets(id),
        ]);

        if (!mounted) return;
        setEvent(eventData);
        setMarkets(marketsData);
      } catch {
        if (mounted) setError('Failed to load event data.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadEventData();

    return () => {
      mounted = false;
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
    <AppShell activePage="Live">
      <div className="workspace-page">
        <button className="back-link" type="button" onClick={() => navigate('/')}>
          Back to Dashboard
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
