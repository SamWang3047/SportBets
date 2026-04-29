import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { walletApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { Wallet } from '../types';

type AppShellProps = {
  children: ReactNode;
  activePage?: string;
  rightRail?: ReactNode;
};

type IconName =
  | 'home'
  | 'live'
  | 'calendar'
  | 'bets'
  | 'profile'
  | 'gift'
  | 'settings'
  | 'search';

const navItems = [
  { label: 'Dashboard', icon: 'home' as IconName, path: '/' },
  { label: 'Live', icon: 'live' as IconName, path: '/live' },
  { label: 'Upcoming', icon: 'calendar' as IconName, path: '/' },
  { label: 'My Bets', icon: 'bets' as IconName, path: '/bets', count: 3 },
  { label: 'Profile', icon: 'profile' as IconName, path: '/' },
  { label: 'Settings', icon: 'settings' as IconName, path: '/settings' },
];

function Icon({ name }: { name: IconName }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M3 10.8 12 3l9 7.8" />
          <path d="M5 10v10h14V10" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );
    case 'live':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="m10 8 6 4-6 4V8Z" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4M16 3v4M4 10h16" />
        </svg>
      );
    case 'bets':
      return (
        <svg {...common}>
          <path d="M5 4h14v16H5z" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      );
    case 'profile':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );
    case 'gift':
      return (
        <svg {...common}>
          <path d="M20 12v8H4v-8M2 8h20v4H2zM12 8v12" />
          <path d="M12 8H7a2.5 2.5 0 1 1 2.5-2.5L12 8Zm0 0h5a2.5 2.5 0 1 0-2.5-2.5L12 8Z" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a8 8 0 0 0 .1-6l2-1.2-2-3.4-2.2 1a8 8 0 0 0-5.2-3v2.4a8 8 0 0 0-5.2 3l-2.2-1-2 3.4 2 1.2a8 8 0 0 0 .1 6l-2 1.2 2 3.4 2.2-1a8 8 0 0 0 5.1 3v-2.4a8 8 0 0 0 5.2-3l2.2 1 2-3.4-2.1-1.2Z" />
        </svg>
      );
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
      );
    default:
      return null;
  }
}

export default function AppShell({ children, activePage = 'Dashboard', rightRail }: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [wallet, setWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    let mounted = true;

    walletApi
      .getWallet()
      .then((nextWallet) => {
        if (mounted) setWallet(nextWallet);
      })
      .catch(() => {
        if (mounted) setWallet(null);
      });

    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  const initials = useMemo(() => {
    const display = user?.displayName || user?.email || 'SB';
    return display
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`app-shell ${rightRail ? 'has-right-rail' : ''}`}>
      <aside className="app-sidebar" aria-label="Primary navigation">
        <button className="brand-mark" onClick={() => navigate('/')} aria-label="Go to dashboard">
          <span className="brand-logo">S</span>
          <span>SportBets</span>
        </button>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const selected = activePage === item.label;
            return (
              <button
                key={item.label}
                className={`nav-row ${selected ? 'is-active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
                {item.label === 'Live' && <span className="live-pill">LIVE</span>}
                {item.label === 'Upcoming' && <span className="nav-count">24</span>}
                {item.count && <span className="nav-count accent">{item.count}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="app-center">
        <header className="topbar">
          <label className="search-box">
            <Icon name="search" />
            <input type="search" placeholder="Search races, horses or markets..." />
            <span className="shortcut">Ctrl K</span>
          </label>

          <nav className="top-tabs" aria-label="Event filters">
            <button className="top-tab is-active">Live <span /></button>
            <button className="top-tab">Upcoming</button>
            <button className="top-tab">Results</button>
            <button className="top-tab">Analytics</button>
          </nav>

          <div className="top-actions">
            <button className="promo-button" type="button">
              <Icon name="gift" />
              Promotions
            </button>
            <div className="wallet-summary">
              <span>Wallet</span>
              <strong>{wallet ? `$${wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}</strong>
            </div>
            <button className="deposit-button" type="button">
              Deposit
            </button>
            <button className="avatar-button" type="button" onClick={handleLogout} title="Logout">
              {initials || 'SB'}
            </button>
          </div>
        </header>

        <main className="app-main">{children}</main>
      </div>

      {rightRail && <aside className="right-rail">{rightRail}</aside>}
    </div>
  );
}
