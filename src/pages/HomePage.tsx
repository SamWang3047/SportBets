import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { eventsApi } from '../services/api';
import type { Event as SportEvent, Market } from '../types';

type EventCard = {
  id: number;
  sport: string;
  time: string;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  marketCount: number;
  odds: Array<{ label: string; value: string }>;
};

const fallbackEvents: SportEvent[] = [
  {
    id: -1,
    sportId: 1,
    name: 'Northside vs Southridge',
    status: 'live',
    startTime: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: -2,
    sportId: 1,
    name: 'City United vs Harbor FC',
    status: 'scheduled',
    startTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: -3,
    sportId: 2,
    name: 'Golden Sprint Stakes',
    status: 'scheduled',
    startTime: new Date(Date.now() + 150 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const fallbackLiveCards: EventCard[] = [
  {
    id: -10,
    sport: 'Basketball',
    time: 'Q3 04:32',
    teamA: 'Northside',
    teamB: 'Southridge',
    scoreA: 78,
    scoreB: 72,
    marketCount: 128,
    odds: [
      { label: 'ML', value: '1.90' },
      { label: 'Spread', value: '-2.5 1.90' },
      { label: 'Total', value: '215.5 1.91' },
    ],
  },
  {
    id: -11,
    sport: 'Football',
    time: 'Q2 07:15',
    teamA: 'Lions',
    teamB: 'Tigers',
    scoreA: 17,
    scoreB: 14,
    marketCount: 95,
    odds: [
      { label: 'ML', value: '1.88' },
      { label: 'Spread', value: '-3.5 1.90' },
      { label: 'Total', value: '48.5 1.92' },
    ],
  },
  {
    id: -12,
    sport: 'Tennis',
    time: '2nd Set',
    teamA: 'A. Johnson',
    teamB: 'M. Petrova',
    scoreA: 40,
    scoreB: 30,
    marketCount: 67,
    odds: [
      { label: 'Winner', value: '1.40' },
      { label: 'Set Winner', value: '2.85' },
    ],
  },
  {
    id: -13,
    sport: 'Esports',
    time: 'Map 2',
    teamA: 'Team Alpha',
    teamB: 'Team Beta',
    scoreA: 9,
    scoreB: 7,
    marketCount: 42,
    odds: [
      { label: 'Alpha', value: '1.35' },
      { label: 'Beta', value: '2.90' },
    ],
  },
];

const featuredFallbackOdds = [
  { selectionName: 'Northside', selectionId: 'home', decimalOdds: 1.9 },
  { selectionName: 'Total', selectionId: 'total', decimalOdds: 1.91 },
  { selectionName: 'Southridge', selectionId: 'away', decimalOdds: 1.9 },
];

function splitEventName(name: string) {
  const parts = name.split(/\s+vs\s+/i);
  if (parts.length >= 2) {
    return [parts[0], parts.slice(1).join(' vs ')];
  }
  return [name, 'Field'];
}

function formatStartLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Today';

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getSportLabel(event: SportEvent) {
  if (event.name.toLowerCase().includes('stakes') || event.name.toLowerCase().includes('sprint')) {
    return 'Horse Racing';
  }
  return event.sportId === 2 ? 'Horse Racing' : 'Football';
}

function normalizeOdds(market?: Market) {
  const source = market?.odds?.length ? market.odds : featuredFallbackOdds;
  return source.slice(0, 3).map((odd, index) => ({
    label: index === 1 && odd.selectionName === 'Draw' ? 'Draw' : odd.selectionName,
    subtitle: index === 1 && odd.selectionName !== 'Draw' ? 'Total' : odd.selectionId,
    value: odd.decimalOdds.toFixed(2),
  }));
}

function toEventCard(event: SportEvent, market?: Market, index = 0): EventCard {
  const [teamA, teamB] = splitEventName(event.name);
  const odds = normalizeOdds(market).map((odd) => ({ label: odd.label, value: odd.value }));

  return {
    id: event.id,
    sport: getSportLabel(event),
    time: event.status === 'live' ? 'Live' : formatStartLabel(event.startTime),
    teamA,
    teamB,
    scoreA: event.status === 'live' ? 17 + index * 3 : 0,
    scoreB: event.status === 'live' ? 14 + index * 2 : 0,
    marketCount: Math.max(12, (market?.odds?.length || 3) * 32 + index * 9),
    odds,
  };
}

function BasketballMark({ variant = 'blue' }: { variant?: 'blue' | 'purple' }) {
  return (
    <div className={`ball-mark ${variant}`}>
      <svg viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r="17" />
        <path d="M8 22h28M22 5v34M10 12c7 2 13 8 16 24M34 12c-7 2-13 8-16 24" />
      </svg>
    </div>
  );
}

function MiniSportIcon({ sport }: { sport: string }) {
  const className = `mini-sport ${sport.toLowerCase().replace(/\s+/g, '-')}`;
  return <span className={className} aria-hidden="true" />;
}

function StatRow({ label, left, right, split = 50 }: { label: string; left: string; right: string; split?: number }) {
  return (
    <div className="stat-row">
      <div className="stat-values">
        <span>{left}</span>
        <span>{label}</span>
        <span>{right}</span>
      </div>
      <div className="stat-bar" style={{ '--split': `${split}%` } as CSSProperties}>
        <span />
      </div>
    </div>
  );
}

function LiveStatsPanel() {
  return (
    <section className="panel live-stats-panel" aria-label="Live game stats">
      <h2>Live Game Stats</h2>
      <div className="stat-teams">
        <span>NOR</span>
        <span>SOU</span>
      </div>
      <StatRow label="FG%" left="48%" right="45%" split={49} />
      <StatRow label="3PT%" left="36%" right="38%" split={59} />
      <StatRow label="REB" left="34" right="31" split={53} />
      <StatRow label="AST" left="19" right="17" split={50} />
      <StatRow label="TO" left="8" right="9" split={48} />
      <button className="link-button" type="button">
        View Full Stats
        <span aria-hidden="true">&gt;</span>
      </button>
    </section>
  );
}

function BetSlipPanel() {
  return (
    <section className="panel bet-slip" aria-label="Bet slip">
      <div className="panel-heading-row">
        <h2>Bet Slip <span>3</span></h2>
        <button type="button">Clear All</button>
      </div>
      <div className="segmented-tabs">
        <button className="is-active" type="button">Singles</button>
        <button type="button">Parlay</button>
        <button type="button">System</button>
      </div>
      {[
        ['Northside -2.5', 'Spread', 'Northside vs Southridge', '1.90'],
        ['Over 215.5', 'Total Points', 'Northside vs Southridge', '1.91'],
        ['City United', 'Moneyline', 'City United vs Harbor FC', '1.72'],
      ].map(([title, type, event, odd]) => (
        <div className="bet-slip-row" key={title}>
          <button type="button" aria-label={`Remove ${title}`}>x</button>
          <div>
            <strong>{title}</strong>
            <span>{type}</span>
            <span>{event}</span>
          </div>
          <em>{odd}</em>
        </div>
      ))}
      <div className="boost-row">
        <span>Parlay Boost <strong>5%</strong></span>
        <button className="toggle is-on" type="button" aria-label="Parlay boost enabled" />
      </div>
      <div className="stake-row">
        <label htmlFor="stake">Stake</label>
        <div>
          <input id="stake" type="number" defaultValue="100" min="1" />
          <button type="button" aria-label="Decrease stake">-</button>
          <button type="button" aria-label="Increase stake">+</button>
        </div>
      </div>
      <dl className="payout-summary">
        <div><dt>Total Odds</dt><dd>5.90</dd></div>
        <div><dt>Boosted Odds</dt><dd>6.20</dd></div>
        <div><dt>Potential Payout</dt><dd>$620.00</dd></div>
      </dl>
      <button className="primary-action" type="button">Place Bet $100.00</button>
      <p>Est. Return: <span>$620.00</span></p>
    </section>
  );
}

function RecentBetsPanel() {
  const outcomes = ['W', 'W', 'L', 'W', 'W', 'W', 'L', 'W', 'W', 'W'];
  return (
    <section className="panel compact-panel">
      <div className="panel-heading-row">
        <h2>Recent Bets</h2>
        <button type="button">View All</button>
      </div>
      <div className="outcome-strip">
        {outcomes.map((outcome, index) => (
          <span key={`${outcome}-${index}`} className={outcome === 'W' ? 'win' : 'loss'}>
            {outcome}
          </span>
        ))}
      </div>
    </section>
  );
}

function PerformancePanel() {
  return (
    <section className="panel compact-panel performance-panel">
      <div className="panel-heading-row">
        <h2>Performance <small>(7D)</small></h2>
        <button type="button">View Analytics</button>
      </div>
      <div className="performance-metrics">
        <div><span>Bets</span><strong>28</strong></div>
        <div><span>Win Rate</span><strong>64%</strong></div>
        <div><span>Profit</span><strong>+$234.50</strong></div>
      </div>
      <svg className="performance-chart" viewBox="0 0 280 92" aria-label="Seven day performance chart">
        <path d="M8 70 38 52 52 38 66 48 82 40 104 68 118 64 134 78 150 60 168 46 184 62 202 42 218 48 238 28 260 32 272 30" fill="none" stroke="#22c55e" strokeWidth="3" />
        <path d="M8 70 38 52 52 38 66 48 82 40 104 68 118 64 134 78 150 60 168 46 184 62 202 42 218 48 238 28 260 32 272 30V84H8Z" fill="#22c55e" opacity=".14" />
        <path d="M104 68 118 64 134 78" fill="none" stroke="#ef4444" strokeWidth="3" />
        <line x1="8" y1="84" x2="272" y2="84" stroke="#e5e7eb" />
      </svg>
    </section>
  );
}

function DashboardRightRail() {
  return (
    <div className="rail-stack">
      <BetSlipPanel />
      <RecentBetsPanel />
      <PerformancePanel />
    </div>
  );
}

function LiveCard({ card, onOpen }: { card: EventCard; onOpen: (id: number) => void }) {
  return (
    <article className="live-card">
      <div className="card-meta">
        <span><MiniSportIcon sport={card.sport} /> {card.sport}</span>
        <span className="live-pill small">LIVE</span>
        <span>{card.time}</span>
      </div>
      <button className="live-card-body" type="button" onClick={() => onOpen(card.id)}>
        <div>
          <strong>{card.teamA}</strong>
          <span>{card.teamB}</span>
        </div>
        <div>
          <strong>{card.scoreA}</strong>
          <span>{card.scoreB}</span>
        </div>
      </button>
      <div className="market-count">+{card.marketCount} Markets</div>
      <div className="odds-grid">
        {card.odds.map((odd) => (
          <button key={`${card.id}-${odd.label}`} type="button">
            <span>{odd.label}</span>
            <strong>{odd.value}</strong>
          </button>
        ))}
      </div>
    </article>
  );
}

function UpcomingTable({ events, marketsByEvent }: { events: SportEvent[]; marketsByEvent: Record<number, Market[]> }) {
  const rows = [
    ...events.slice(0, 4),
    ...fallbackEvents.filter((event) => !events.some((realEvent) => realEvent.name === event.name)),
  ].slice(0, 4);

  return (
    <section className="dashboard-section upcoming-panel">
      <div className="section-heading">
        <h2>Upcoming Events</h2>
        <button type="button">View All Upcoming <span aria-hidden="true">&gt;</span></button>
      </div>
      <div className="market-table" role="table" aria-label="Upcoming events">
        <div className="market-table-head" role="row">
          <span>Time</span>
          <span>Event</span>
          <span>Market</span>
          <span>1</span>
          <span>X</span>
          <span>2</span>
          <span>+Markets</span>
        </div>
        {rows.map((event, index) => {
          const [teamA, teamB] = splitEventName(event.name);
          const market = marketsByEvent[event.id]?.[0];
          const odds = normalizeOdds(market);
          return (
            <div className="market-table-row" role="row" key={`${event.id}-${index}`}>
              <span>{index === 3 ? 'Tomorrow' : 'Today'}<strong>{formatStartLabel(event.startTime)}</strong></span>
              <span><MiniSportIcon sport={getSportLabel(event)} /><strong>{teamA}</strong><small>{teamB}</small></span>
              <span>{market?.name || (getSportLabel(event) === 'Football' ? '1X2' : 'Winner')}</span>
              {[0, 1, 2].map((slot) => (
                <button type="button" key={slot}>{odds[slot]?.value || '-'}</button>
              ))}
              <span className="more-markets"><span className="tiny-bars" /> +{126 - index * 18}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [marketsByEvent, setMarketsByEvent] = useState<Record<number, Market[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const nextEvents = await eventsApi.getEvents({ limit: 8 });
        const marketEntries = await Promise.all(
          nextEvents.slice(0, 6).map(async (event) => {
            try {
              const markets = await eventsApi.getEventMarkets(event.id);
              return [event.id, markets] as const;
            } catch {
              return [event.id, []] as const;
            }
          })
        );

        if (!mounted) return;
        setEvents(nextEvents);
        setMarketsByEvent(Object.fromEntries(marketEntries));
      } catch {
        if (!mounted) return;
        setEvents([]);
        setMarketsByEvent({});
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const displayEvents = events.length ? events : fallbackEvents;
  const featuredEvent = displayEvents[0];
  const featuredMarket = marketsByEvent[featuredEvent.id]?.[0];
  const featuredOdds = normalizeOdds(featuredMarket);
  const [featuredTeamA, featuredTeamB] = splitEventName(featuredEvent.name);

  const liveCards = useMemo(() => {
    const realCards = displayEvents.slice(0, 4).map((event, index) => toEventCard(event, marketsByEvent[event.id]?.[0], index));
    return [...realCards, ...fallbackLiveCards].slice(0, 4);
  }, [displayEvents, marketsByEvent]);

  const openEvent = (id: number) => {
    if (id > 0) navigate(`/events/${id}`);
  };

  return (
    <AppShell activePage="Dashboard" rightRail={<DashboardRightRail />}>
      {loading ? (
        <div className="dashboard-loading" role="status" aria-label="Loading dashboard">
          <span />
          <span />
          <span />
        </div>
      ) : (
        <div className="dashboard-home">
          <h1 className="sr-only">SportBets Dashboard</h1>
          <section className="spotlight-grid">
            <article className="panel featured-event">
              <div className="featured-topline">
                <div>
                  <span className="live-pill">LIVE</span>
                  <span>{getSportLabel(featuredEvent)} - League Play</span>
                </div>
                <button type="button">
                  <span className="play-icon" aria-hidden="true" />
                  Watch Live
                </button>
              </div>

              <div className="matchup">
                <div className="team-block">
                  <BasketballMark variant="blue" />
                  <h2>{featuredTeamA}</h2>
                  <p>32-14</p>
                </div>
                <div className="score-block">
                  <span>Q3 <strong>04:32</strong></span>
                  <strong>78 - 72</strong>
                  <p>Riverside Arena</p>
                </div>
                <div className="team-block">
                  <BasketballMark variant="purple" />
                  <h2>{featuredTeamB}</h2>
                  <p>30-16</p>
                </div>
              </div>

              <div className="featured-odds">
                {featuredOdds.map((odd, index) => (
                  <button type="button" key={`${odd.label}-${index}`}>
                    <span>{odd.label}</span>
                    <strong>{index === 1 && odd.label === 'Total' ? '215.5' : odd.subtitle}</strong>
                    <em>{odd.value}</em>
                  </button>
                ))}
              </div>

              <button className="wide-action" type="button" onClick={() => openEvent(featuredEvent.id)}>
                View All Markets ({Math.max(12, featuredMarket?.odds.length || 128)})
                <span aria-hidden="true">&gt;</span>
              </button>
            </article>

            <LiveStatsPanel />
          </section>

          <section className="dashboard-section">
            <div className="section-heading">
              <h2>Live Now</h2>
              <button type="button">View All Live (24) <span aria-hidden="true">&gt;</span></button>
            </div>
            <div className="live-card-grid">
              {liveCards.map((card) => (
                <LiveCard key={card.id} card={card} onOpen={openEvent} />
              ))}
            </div>
          </section>

          <UpcomingTable events={displayEvents} marketsByEvent={marketsByEvent} />
        </div>
      )}
    </AppShell>
  );
}
