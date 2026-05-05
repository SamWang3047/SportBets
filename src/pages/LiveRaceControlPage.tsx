import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { betsApi, devApi, eventsApi } from '../services/api';
import type { Event, Market, Odd, RaceRunner, RaceSimulationState } from '../types';
import { formatRaceClock, getRaceProgress, parseSimulationState, sortControlRoomRunners } from './liveRaceControl.logic';

type SelectedOdds = {
  marketId: number;
  selectionId: string;
  selectionName: string;
  odds: number;
};

type LoadingAction = 'deposit' | 'generate' | 'load' | 'run' | 'settle' | 'bet' | null;

const HORSE_COLORS = ['#4f5cff', '#f97316', '#0ea5e9', '#16a34a', '#dc2626', '#8b5cf6', '#ca8a04', '#0f766e'];

function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string } } }).response;
    return response?.data?.error || fallback;
  }

  return fallback;
}

function formatStart(value?: string) {
  if (!value) return 'No race loaded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getWinnerName(runners: RaceRunner[], winnerId?: string) {
  if (!winnerId) return 'Pending';
  return runners.find((runner) => runner.horseId.toString() === winnerId)?.horseName || `Horse #${winnerId}`;
}

export default function LiveRaceControlPage() {
  const navigate = useNavigate();
  const [eventId, setEventId] = useState<number | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [runners, setRunners] = useState<RaceRunner[]>([]);
  const [raceIdInput, setRaceIdInput] = useState('');
  const [depositAmount, setDepositAmount] = useState('1000');
  const [stake, setStake] = useState('100');
  const [selectedOdds, setSelectedOdds] = useState<SelectedOdds | null>(null);
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
  const [loadingRace, setLoadingRace] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [now, setNow] = useState(() => Date.now());

  const simulation = useMemo<RaceSimulationState>(() => parseSimulationState(event?.simulationState), [event?.simulationState]);
  const orderedRunners = useMemo(() => sortControlRoomRunners(runners, simulation), [runners, simulation]);
  const progress = event ? getRaceProgress(event, simulation) : 0;
  const winnerName = getWinnerName(runners, simulation.winner);
  const firstMarket = markets[0];
  const activeOdds = markets.flatMap((market) =>
    market.odds.map((odd) => ({
      ...odd,
      marketName: market.name,
    }))
  );
  const stakeNumber = Number.parseFloat(stake) || 0;
  const potentialPayout = selectedOdds ? selectedOdds.odds * stakeNumber : 0;
  const busy = loadingAction !== null;

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  const showMessage = (nextMessage: string, type: 'success' | 'error' = 'success') => {
    setMessage(nextMessage);
    setMessageType(type);
  };

  const loadRace = useCallback(async (nextEventId: number, showLoading = false) => {
    if (showLoading) setLoadingRace(true);

    try {
      const [eventData, marketsData, runnersData] = await Promise.all([
        eventsApi.getEvent(nextEventId),
        eventsApi.getEventMarkets(nextEventId),
        eventsApi.getEventRunners(nextEventId).catch(() => devApi.getRaceRunners(nextEventId).catch(() => [])),
      ]);

      setEvent(eventData);
      setMarkets(marketsData);
      setRunners(runnersData);
      setEventId(nextEventId);
      setRaceIdInput(nextEventId.toString());
      return true;
    } catch (error: unknown) {
      showMessage(getApiErrorMessage(error, 'Failed to load race.'), 'error');
      return false;
    } finally {
      setLoadingRace(false);
    }
  }, []);

  useEffect(() => {
    if (!eventId) return;

    const refresh = window.setInterval(() => {
      void loadRace(eventId);
    }, event?.status === 'live' ? 1000 : 2500);

    return () => window.clearInterval(refresh);
  }, [event?.status, eventId, loadRace]);

  const handleDeposit = async (submitEvent: FormEvent) => {
    submitEvent.preventDefault();
    const amount = Number.parseFloat(depositAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showMessage('Enter a deposit amount greater than 0.', 'error');
      return;
    }

    setLoadingAction('deposit');
    try {
      const result = await devApi.depositToWallet(amount);
      window.dispatchEvent(new Event('wallet:updated'));
      showMessage(`Deposited $${result.transaction.amount.toFixed(2)}. Balance is now $${result.transaction.balanceAfter.toFixed(2)}.`);
    } catch (error: unknown) {
      showMessage(getApiErrorMessage(error, 'Failed to deposit credits.'), 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGenerateRace = async () => {
    setLoadingAction('generate');
    setSelectedOdds(null);

    try {
      const result = await devApi.generateRace();
      const loaded = await loadRace(result.eventId, true);
      if (loaded) {
        showMessage(`Generated race #${result.eventId} with ${result.runners.length} runners.`);
      }
    } catch (error: unknown) {
      showMessage(getApiErrorMessage(error, 'Failed to generate race.'), 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleLoadRace = async (submitEvent: FormEvent) => {
    submitEvent.preventDefault();
    const nextEventId = Number.parseInt(raceIdInput, 10);
    if (!Number.isFinite(nextEventId) || nextEventId <= 0) {
      showMessage('Enter a valid race ID.', 'error');
      return;
    }

    setLoadingAction('load');
    setSelectedOdds(null);
    const loaded = await loadRace(nextEventId, true);
    if (loaded) {
      showMessage(`Loaded race #${nextEventId}.`);
    }
    setLoadingAction(null);
  };

  const handleRunRace = async () => {
    if (!eventId) return;

    setLoadingAction('run');
    try {
      const result = await devApi.runRace(eventId);
      await loadRace(eventId);
      showMessage(`Race simulation started. ${result.estimatedDuration}s run is now polling.`);
    } catch (error: unknown) {
      showMessage(getApiErrorMessage(error, 'Failed to start race simulation.'), 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSettleRace = async () => {
    if (!eventId) return;

    setLoadingAction('settle');
    try {
      const result = await devApi.settleRace(eventId);
      await loadRace(eventId);
      window.dispatchEvent(new Event('wallet:updated'));
      showMessage(`Race settled. Winner: ${getWinnerName(runners, result.winningHorseId)}. ${result.settledBets} bets settled.`);
    } catch (error: unknown) {
      showMessage(getApiErrorMessage(error, 'Failed to settle race.'), 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePlaceBet = async (submitEvent: FormEvent) => {
    submitEvent.preventDefault();
    if (!event || !selectedOdds) return;

    if (!Number.isFinite(stakeNumber) || stakeNumber <= 0) {
      showMessage('Enter a stake greater than 0.', 'error');
      return;
    }

    setLoadingAction('bet');
    try {
      await betsApi.placeBet({
        eventId: event.id,
        marketId: selectedOdds.marketId,
        selectionId: selectedOdds.selectionId,
        stake: stakeNumber,
      });
      window.dispatchEvent(new Event('wallet:updated'));
      showMessage(`Bet placed on ${selectedOdds.selectionName} at ${selectedOdds.odds.toFixed(2)}.`);
      setSelectedOdds(null);
    } catch (error: unknown) {
      showMessage(getApiErrorMessage(error, 'Failed to place bet.'), 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const selectOdd = (odd: Odd & { marketName: string }) => {
    if (!firstMarket && !markets.some((market) => market.id === odd.marketId)) return;
    setSelectedOdds({
      marketId: odd.marketId,
      selectionId: odd.selectionId,
      selectionName: odd.selectionName,
      odds: odd.decimalOdds,
    });
    setMessage('');
  };

  return (
    <AppShell activePage="Control Room">
      <div className="workspace-page race-control-page">
        <div className="page-title-row">
          <div>
            <h1>Live Race Control Room</h1>
            <p>Generate, fund, bet, run, and settle a horse race from one development console.</p>
          </div>
          <div className="live-summary">
            <span>{event ? `Race #${event.id}` : 'No race loaded'}</span>
            <span>{event ? formatRaceClock(event, simulation, now) : 'Idle'}</span>
          </div>
        </div>

        {message && (
          <div className={`message-banner ${messageType}`} role={messageType === 'error' ? 'alert' : 'status'}>
            {message}
          </div>
        )}

        <section className="panel race-control-toolbar" aria-label="Race controls">
          <form className="race-control-form" onSubmit={handleDeposit}>
            <label htmlFor="control-deposit">Deposit Credits</label>
            <div>
              <input
                id="control-deposit"
                type="number"
                min="1"
                max="100000"
                step="0.01"
                value={depositAmount}
                onChange={(inputEvent) => setDepositAmount(inputEvent.target.value)}
                disabled={busy}
              />
              <button className="secondary-action" type="submit" disabled={busy}>
                {loadingAction === 'deposit' ? 'Depositing...' : 'Deposit'}
              </button>
            </div>
          </form>

          <button className="primary-action race-control-generate" type="button" onClick={handleGenerateRace} disabled={busy}>
            {loadingAction === 'generate' ? 'Generating...' : 'Generate Race'}
          </button>

          <form className="race-control-form" onSubmit={handleLoadRace}>
            <label htmlFor="control-race-id">Load Race ID</label>
            <div>
              <input
                id="control-race-id"
                type="number"
                min="1"
                value={raceIdInput}
                onChange={(inputEvent) => setRaceIdInput(inputEvent.target.value)}
                disabled={busy}
              />
              <button className="secondary-action" type="submit" disabled={busy}>
                {loadingAction === 'load' ? 'Loading...' : 'Load'}
              </button>
            </div>
          </form>
        </section>

        {!event ? (
          <section className="panel empty-state-panel">
            <h2>Generate a race to begin</h2>
            <p>The control room will show runners, odds, live rankings, and settlement once a dev race is loaded.</p>
            <button className="primary-action narrow" type="button" onClick={handleGenerateRace} disabled={busy}>
              Generate Race
            </button>
          </section>
        ) : (
          <>
            <section className="panel race-control-hero">
              <div className="race-control-status">
                <span className={`status-chip ${event.status}`}>{event.status}</span>
                <h2>{event.name}</h2>
                <p>{formatStart(event.startTime)}</p>
              </div>

              <div className="race-control-progress-block">
                <div>
                  <span>Progress</span>
                  <strong>{progress}%</strong>
                </div>
                <div className="live-race-progress" aria-label={`${progress}% complete`}>
                  <span style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="race-control-actions">
                <button className="secondary-action" type="button" onClick={() => navigate(`/events/${event.id}`, { state: { sourcePage: 'Live' } })}>
                  Open Race Page
                </button>
                <button className="secondary-action" type="button" onClick={handleRunRace} disabled={busy || event.status !== 'scheduled'}>
                  {loadingAction === 'run' ? 'Starting...' : 'Run 30s Sim'}
                </button>
                <button className="secondary-action danger" type="button" onClick={handleSettleRace} disabled={busy || event.status === 'finished'}>
                  {loadingAction === 'settle' ? 'Settling...' : 'Instant Settle'}
                </button>
              </div>
            </section>

            {loadingRace ? (
              <div className="dashboard-loading" role="status" aria-label="Loading race control room">
                <span />
                <span />
              </div>
            ) : (
              <div className="race-control-grid">
                <section className="panel race-control-runner-panel">
                  <div className="panel-heading-row">
                    <h2>Live Field</h2>
                    <span>{orderedRunners.length} runners</span>
                  </div>

                  <div className="race-control-runner-list">
                    {orderedRunners.length === 0 ? (
                      <p>No runners have been assigned.</p>
                    ) : (
                      orderedRunners.map((runner) => (
                        <div className="race-control-runner-row" key={runner.id}>
                          <span
                            className="horse-number"
                            style={{ '--horse-color': HORSE_COLORS[(runner.stallNumber - 1) % HORSE_COLORS.length] } as CSSProperties}
                          >
                            {runner.stallNumber}
                          </span>
                          <div>
                            <strong>{runner.horseName}</strong>
                            <span>{runner.jockeyName}</span>
                          </div>
                          <em>{runner.livePosition ? `#${runner.livePosition}` : 'Pending'}</em>
                          <b>{runner.liveDistance ? `${Math.round(runner.liveDistance)}m` : runner.finalPosition ? 'Final' : `${runner.startingOdds.toFixed(2)}`}</b>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="panel race-control-market-panel">
                  <div className="panel-heading-row">
                    <h2>Race Winner Market</h2>
                    <span>{activeOdds.length} prices</span>
                  </div>

                  {activeOdds.length === 0 ? (
                    <p>No odds are available for this race.</p>
                  ) : (
                    <div className="race-control-odds-grid">
                      {activeOdds.map((odd) => (
                        <button
                          key={odd.id}
                          type="button"
                          onClick={() => selectOdd(odd)}
                          disabled={event.status !== 'scheduled' || !odd.isActive || busy}
                          className={
                            selectedOdds?.marketId === odd.marketId && selectedOdds.selectionId === odd.selectionId
                              ? 'is-selected'
                              : ''
                          }
                        >
                          <span>{odd.selectionName}</span>
                          <small>{odd.marketName}</small>
                          <strong>{odd.decimalOdds.toFixed(2)}</strong>
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                <aside className="panel race-control-bet-panel">
                  <h2>Test Bet</h2>
                  {selectedOdds ? (
                    <form onSubmit={handlePlaceBet}>
                      <div className="quick-selection">
                        <span>Selection</span>
                        <strong>{selectedOdds.selectionName}</strong>
                        <em>{selectedOdds.odds.toFixed(2)}</em>
                      </div>

                      <label htmlFor="control-stake">Stake</label>
                      <input
                        id="control-stake"
                        type="number"
                        min="1"
                        step="0.01"
                        value={stake}
                        onChange={(inputEvent) => setStake(inputEvent.target.value)}
                        disabled={busy}
                      />

                      <div className="quick-payout">
                        <span>Potential Payout</span>
                        <strong>${potentialPayout.toFixed(2)}</strong>
                      </div>

                      <button className="primary-action" type="submit" disabled={busy || event.status !== 'scheduled'}>
                        {loadingAction === 'bet' ? 'Placing...' : 'Place Test Bet'}
                      </button>
                      <button className="secondary-action" type="button" onClick={() => setSelectedOdds(null)} disabled={busy}>
                        Clear Selection
                      </button>
                    </form>
                  ) : (
                    <p>Select a price from the market while the race is scheduled.</p>
                  )}
                </aside>

                <section className="panel race-control-result-panel">
                  <div className="panel-heading-row">
                    <h2>Settlement</h2>
                    <span>{event.status === 'finished' ? 'Complete' : 'Pending'}</span>
                  </div>
                  <dl>
                    <div>
                      <dt>Winner</dt>
                      <dd>{winnerName}</dd>
                    </div>
                    <div>
                      <dt>Simulation</dt>
                      <dd>{simulation.simulationId || simulation.phase || 'Not started'}</dd>
                    </div>
                    <div>
                      <dt>Market</dt>
                      <dd>{firstMarket?.name || 'No market'}</dd>
                    </div>
                  </dl>
                </section>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
