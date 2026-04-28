import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { betsApi } from '../services/api';
import type { Bet } from '../types';

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

export default function BetsPage() {
  const navigate = useNavigate();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    betsApi
      .getBets(50)
      .then((betsData) => {
        if (mounted) setBets(betsData);
      })
      .catch(() => {
        if (mounted) setBets([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AppShell activePage="My Bets">
      <div className="workspace-page">
        <div className="page-title-row">
          <div>
            <h1>My Bets</h1>
            <p>Track pending slips, settlements, and payout history.</p>
          </div>
          <button className="deposit-button" type="button" onClick={() => navigate('/')}>
            Browse Events
          </button>
        </div>

        {loading ? (
          <div className="dashboard-loading" role="status" aria-label="Loading bets">
            <span />
            <span />
          </div>
        ) : bets.length === 0 ? (
          <section className="panel empty-state-panel">
            <h2>No bets placed yet</h2>
            <p>Your active and settled wagers will appear here after you place a bet.</p>
            <button className="primary-action narrow" type="button" onClick={() => navigate('/')}>
              Browse Events
            </button>
          </section>
        ) : (
          <section className="panel history-panel">
            <div className="history-table-head">
              <span>Bet</span>
              <span>Selection</span>
              <span>Stake</span>
              <span>Odds</span>
              <span>Payout</span>
              <span>Status</span>
              <span>Placed</span>
            </div>
            {bets.map((bet) => (
              <article className="history-row" key={bet.id}>
                <span>#{bet.id}</span>
                <span>
                  <strong>{bet.selectionId}</strong>
                  <small>Event {bet.eventId}</small>
                </span>
                <span>${bet.stake.toFixed(2)}</span>
                <span>{bet.oddsAtPlacement.toFixed(2)}</span>
                <span>${bet.potentialPayout.toFixed(2)}</span>
                <span className={`status-chip ${bet.status}`}>{bet.status}</span>
                <span>{formatDateTime(bet.placedAt)}</span>
              </article>
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}
