import { useEffect, useState, type CSSProperties } from 'react';
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
    sportId: 2,
    name: 'Golden Sprint Stakes',
    status: 'live',
    startTime: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: -2,
    sportId: 2,
    name: 'Harbor Trial Plate',
    status: 'scheduled',
    startTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: -3,
    sportId: 2,
    name: 'Riverside Cup',
    status: 'scheduled',
    startTime: new Date(Date.now() + 150 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
const fallbackLiveCards: EventCard[] = [
  {
    id: -10,
    sport: 'Horse Racing',
    time: 'Live',
    teamA: 'Golden Sprint Stakes',
    teamB: 'Race Winner',
    scoreA: 6,
    scoreB: 1,
    marketCount: 96,
    odds: [
      { label: 'Thunder Strike', value: '3.50' },
      { label: 'Silver Bullet', value: '2.80' },
      { label: 'Golden Gale', value: '3.80' },
    ],
  },
  {
    id: -11,
    sport: 'Horse Racing',
    time: 'Soon',
    teamA: 'Harbor Trial Plate',
    teamB: 'Race Winner',
    scoreA: 8,
    scoreB: 1,
    marketCount: 84,
    odds: [
      { label: 'Wind Dancer', value: '6.50' },
      { label: 'Storm Chaser', value: '5.00' },
      { label: 'Midnight Runner', value: '4.20' },
    ],
  },
  {
    id: -12,
    sport: 'Horse Racing',
    time: 'Today',
    teamA: 'Riverside Cup',
    teamB: 'Race Winner',
    scoreA: 7,
    scoreB: 1,
    marketCount: 72,
    odds: [
      { label: 'Silver Bullet', value: '2.80' },
      { label: 'Thunder Strike', value: '3.50' },
      { label: 'Storm Chaser', value: '5.00' },
    ],
  },
  {
    id: -13,
    sport: 'Horse Racing',
    time: 'Tomorrow',
    teamA: 'Metro Mile',
    teamB: 'Race Winner',
    scoreA: 9,
    scoreB: 1,
    marketCount: 64,
    odds: [
      { label: 'Golden Gale', value: '3.80' },
      { label: 'Wind Dancer', value: '6.50' },
      { label: 'Midnight Runner', value: '4.20' },
    ],
  },
];
const featuredFallbackOdds = [
  { selectionName: 'Thunder Strike', selectionId: '1', decimalOdds: 3.5 },
  { selectionName: 'Silver Bullet', selectionId: '2', decimalOdds: 2.8 },
  { selectionName: 'Golden Gale', selectionId: '4', decimalOdds: 3.8 },
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
function getSportLabel() {
  return 'Horse Racing';
}
function normalizeOdds(market?: Market) {
  const source = market?.odds?.length ? market.odds : featuredFallbackOdds;
  return source.slice(0, 3).map((odd) => ({
    label: odd.selectionName,
    subtitle: odd.selectionId,
    value: odd.decimalOdds.toFixed(2),
  }));
}
function toEventCard(event: SportEvent, market?: Market, index = 0): EventCard {
  const [teamA, teamB] = splitEventName(event.name);
  const odds = normalizeOdds(market).map((odd) => ({ label: odd.label, value: odd.value }));
  return {
    id: event.id,
    sport: getSportLabel(),
    time: event.status === 'live' ? 'Live' : formatStartLabel(event.startTime),
    teamA,
    teamB,
    scoreA: Math.max(3, market?.odds?.length || 6),
    scoreB: index + 1,
    marketCount: Math.max(12, (market?.odds?.length || 3) * 32 + index * 9),
    odds,
  };
}
function RaceSilkMark({ variant = 'blue' }: { variant?: 'blue' | 'purple' }) {
  return (
    <div className={`ball-mark ${variant}`}>
      <svg viewBox="0 0 44 44" aria-hidden="true">
        <path d="M14 9h16l5 9-6 4v13H15V22l-6-4 5-9Z" />
        <path d="M18 10v25M26 10v25M12 18h20" />
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
    <section className="panel live-stats-panel" aria-label="Race conditions">
      <h2>Race Conditions</h2>
      <div className="stat-teams">
        <span>Track</span>
        <span>Field</span>
      </div>
      <StatRow label="Pace" left="Fast" right="Even" split={58} />
      <StatRow label="Going" left="Good" right="Firm" split={62} />
      <StatRow label="Runners" left="6" right="Open" split={48} />
      <StatRow label="Distance" left="1200m" right="Sprint" split={55} />
      <StatRow label="Market" left="96" right="Live" split={66} />
      <button className="link-button" type="button">
        View Race Detail
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
        <button type="button">Exacta</button>
        <button type="button">Trifecta</button>
      </div>
      {[
        ['Thunder Strike', 'Race Winner', 'Golden Sprint Stakes', '3.50'],
        ['Silver Bullet', 'Race Winner', 'Harbor Trial Plate', '2.80'],
        ['Golden Gale', 'Race Winner', 'Riverside Cup', '3.80'],
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
        <span>Race Boost <strong>5%</strong></span>
        <button className="toggle is-on" type="button" aria-label="Race boost enabled" />
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
function UpcomingTable({
  events,
  marketsByEvent,
  onViewAll,
}: {
  events: SportEvent[];
  marketsByEvent: Record<number, Market[]>;
  onViewAll: () => void;
}) {
  const rows = [
    ...events.slice(0, 4),
    ...fallbackEvents.filter((event) => !events.some((realEvent) => realEvent.name === event.name)),
  ].slice(0, 4);
  return (
    <section className="dashboard-section upcoming-panel">
      <div className="section-heading">
        <h2>Upcoming Events</h2>
        <button type="button" onClick={onViewAll}>View All Upcoming <span aria-hidden="true">&gt;</span></button>
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
              <span><MiniSportIcon sport={getSportLabel()} /><strong>{teamA}</strong><small>{teamB}</small></span>
              <span>{market?.name || 'Race Winner'}</span>
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
  const [horseRacingSportId, setHorseRacingSportId] = useState<number | null>(null);
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const sports = await eventsApi.getSports();
        const horseRacingSport = sports.find((sport: { code: string }) => sport.code === 'horse_racing');
        const nextEvents = await eventsApi.getEvents({ sportId: horseRacingSport?.id, limit: 8 });
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
        setHorseRacingSportId(horseRacingSport?.id ?? null);
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
  const displayEvents = events.filter((event) => !horseRacingSportId || event.sportId === horseRacingSportId);
  const raceEvents = displayEvents.length ? displayEvents : fallbackEvents;
  const featuredEvent = raceEvents[0];
  const featuredMarket = marketsByEvent[featuredEvent.id]?.[0];
  const featuredOdds = normalizeOdds(featuredMarket);
  const [featuredTeamA, featuredTeamB] = splitEventName(featuredEvent.name);
  const realCards = raceEvents.slice(0, 4).map((event, index) => toEventCard(event, marketsByEvent[event.id]?.[0], index));
  const liveCards = [...realCards, ...fallbackLiveCards].slice(0, 4);
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
                  <span>{getSportLabel()} - Race Winner</span>
                </div>
                <button type="button">
                  <span className="play-icon" aria-hidden="true" />
                  Watch Live
                </button>
              </div>
              <div className="matchup">
                <div className="team-block">
                  <RaceSilkMark variant="blue" />
                  <h2>{featuredTeamA}</h2>
                  <p>1200m</p>
                </div>
                <div className="score-block">
                  <span>Next <strong>{formatStartLabel(featuredEvent.startTime)}</strong></span>
                  <strong>{featuredOdds.length} runners</strong>
                  <p>Riverside Track</p>
                </div>
                <div className="team-block">
                  <RaceSilkMark variant="purple" />
                  <h2>{featuredTeamB}</h2>
                  <p>Open market</p>
                </div>
              </div>
              <div className="featured-odds">
                {featuredOdds.map((odd, index) => (
                  <button type="button" key={`${odd.label}-${index}`}>
                    <span>{odd.label}</span>
                    <strong>{odd.subtitle}</strong>
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
              <button type="button" onClick={() => navigate('/live')}>
                View All Live ({liveCards.length}) <span aria-hidden="true">&gt;</span>
              </button>
            </div>
            <div className="live-card-grid">
              {liveCards.map((card) => (
                <LiveCard key={card.id} card={card} onOpen={openEvent} />
              ))}
            </div>
          </section>
          <UpcomingTable events={raceEvents} marketsByEvent={marketsByEvent} onViewAll={() => navigate('/upcoming')} />
        </div>
      )}
    </AppShell>
  );
}
