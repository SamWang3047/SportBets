import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { betsApi, walletApi } from '../services/api';
import type { Bet, User, Wallet } from '../types';

type ProfileSidebarProps = {
  open: boolean;
  user: User | null;
  wallet: Wallet | null;
  initials: string;
  onClose: () => void;
  onLogout: () => void;
};

type BetSummary = {
  total: number;
  pending: number;
  won: number;
  lost: number;
  openExposure: number;
  potentialPayout: number;
};

const emptyBetSummary: BetSummary = {
  total: 0,
  pending: 0,
  won: 0,
  lost: 0,
  openExposure: 0,
  potentialPayout: 0,
};

function currency(value: number, currencyCode = 'CREDITS') {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currencyCode}`;
}

function summarizeBets(bets: Bet[]): BetSummary {
  return bets.reduce<BetSummary>(
    (summary, bet) => {
      summary.total += 1;

      if (bet.status === 'pending') {
        summary.pending += 1;
        summary.openExposure += bet.stake;
        summary.potentialPayout += bet.potentialPayout;
      }

      if (bet.status === 'won') summary.won += 1;
      if (bet.status === 'lost') summary.lost += 1;

      return summary;
    },
    { ...emptyBetSummary }
  );
}

export default function ProfileSidebar({
  open,
  user,
  wallet,
  initials,
  onClose,
  onLogout,
}: ProfileSidebarProps) {
  const navigate = useNavigate();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [sidebarWallet, setSidebarWallet] = useState<Wallet | null>(null);
  const [betSummary, setBetSummary] = useState<BetSummary>(emptyBetSummary);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!open) return;

    let mounted = true;
    closeButtonRef.current?.focus();

    queueMicrotask(() => {
      if (!mounted) return;
      setLoading(true);
      setLoadFailed(false);
    });

    Promise.all([walletApi.getWallet(), betsApi.getBets(50)])
      .then(([nextWallet, bets]) => {
        if (!mounted) return;
        setSidebarWallet(nextWallet);
        setBetSummary(summarizeBets(bets));
      })
      .catch(() => {
        if (!mounted) return;
        setBetSummary(emptyBetSummary);
        setLoadFailed(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (!open) return;

    const refreshWallet = () => {
      walletApi
        .getWallet()
        .then(setSidebarWallet)
        .catch(() => setLoadFailed(true));
    };

    window.addEventListener('wallet:updated', refreshWallet);
    return () => window.removeEventListener('wallet:updated', refreshWallet);
  }, [open]);

  const displayName = user?.displayName || 'SportBets User';
  const email = user?.email || 'No email available';
  const role = user?.role || 'member';
  const displayWallet = sidebarWallet || wallet;
  const isPrivileged = useMemo(() => ['admin', 'dev', 'developer'].includes(role.toLowerCase()), [role]);

  const navigateAndClose = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <aside
      className={`profile-sidebar ${open ? 'is-open' : ''}`}
      aria-label="Profile and account actions"
      aria-hidden={!open}
    >
      <div className="profile-sidebar-header">
        <div className="profile-identity">
          <span className="profile-avatar" aria-hidden="true">
            {initials || 'SB'}
          </span>
          <div>
            <h2>{displayName}</h2>
            <p>{email}</p>
          </div>
        </div>
        <button ref={closeButtonRef} className="profile-close" type="button" onClick={onClose} aria-label="Close profile sidebar">
          x
        </button>
      </div>

      <div className="profile-role-row">
        <span className="profile-role-badge">{role}</span>
        {loadFailed && <span className="profile-load-note">Some account data is unavailable</span>}
      </div>

      <section className="profile-balance-panel" aria-label="Wallet balance">
        <span>Available Balance</span>
        <strong>{displayWallet ? currency(displayWallet.balance, displayWallet.currency) : '$0.00 CREDITS'}</strong>
        <button className="profile-primary-action" type="button" onClick={() => navigateAndClose('/wallet')}>
          Open Wallet
        </button>
      </section>

      <section className="profile-summary-grid" aria-label="Bet summary" aria-busy={loading}>
        <div>
          <span>Pending</span>
          <strong>{betSummary.pending}</strong>
        </div>
        <div>
          <span>Won</span>
          <strong>{betSummary.won}</strong>
        </div>
        <div>
          <span>Lost</span>
          <strong>{betSummary.lost}</strong>
        </div>
        <div>
          <span>Recent</span>
          <strong>{betSummary.total}</strong>
        </div>
      </section>

      <section className="profile-risk-panel" aria-label="Open betting exposure">
        <div>
          <span>Open Exposure</span>
          <strong>${betSummary.openExposure.toFixed(2)}</strong>
        </div>
        <div>
          <span>Potential Pending Payout</span>
          <strong>${betSummary.potentialPayout.toFixed(2)}</strong>
        </div>
      </section>

      <nav className="profile-action-list" aria-label="Account shortcuts">
        <button type="button" onClick={() => navigateAndClose('/wallet')}>
          Wallet
        </button>
        <button type="button" onClick={() => navigateAndClose('/bets')}>
          My Bets
        </button>
        <button type="button" onClick={() => navigateAndClose('/')}>
          Browse Events
        </button>
        <button type="button" onClick={() => navigateAndClose('/settings')}>
          Settings
        </button>
        {isPrivileged && (
          <button type="button" onClick={() => navigateAndClose('/settings')}>
            Dev Controls
          </button>
        )}
      </nav>

      <button className="profile-logout" type="button" onClick={onLogout}>
        Logout
      </button>
    </aside>
  );
}
