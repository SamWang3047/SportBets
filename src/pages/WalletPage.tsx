import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import { walletApi } from '../services/api';
import type { Transaction, Wallet } from '../types';

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

function transactionLabel(type: string) {
  switch (type) {
    case 'deposit':
      return 'Deposit';
    case 'bet_stake':
      return 'Bet Stake';
    case 'bet_payout':
      return 'Bet Payout';
    case 'bet_refund':
      return 'Bet Refund';
    default:
      return type;
  }
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.all([walletApi.getWallet(), walletApi.getTransactions(50)])
      .then(([walletData, transactionsData]) => {
        if (!mounted) return;
        setWallet(walletData);
        setTransactions(transactionsData);
      })
      .catch(() => {
        if (!mounted) return;
        setWallet(null);
        setTransactions([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AppShell activePage="Wallet">
      <div className="workspace-page">
        <div className="page-title-row">
          <div>
            <h1>Wallet</h1>
            <p>Review your virtual credit balance and transaction activity.</p>
          </div>
          <button className="deposit-button" type="button">
            Deposit
          </button>
        </div>

        {loading ? (
          <div className="dashboard-loading" role="status" aria-label="Loading wallet">
            <span />
            <span />
          </div>
        ) : (
          <>
            <section className="wallet-overview">
              <article className="panel wallet-balance-card">
                <span>Available Balance</span>
                <strong>{wallet ? `$${wallet.balance.toFixed(2)}` : '$0.00'}</strong>
                <p>{wallet?.currency || 'CREDITS'}</p>
              </article>
              <article className="panel wallet-metric-card">
                <span>Settled Returns</span>
                <strong>+$234.50</strong>
                <p>Last 7 days</p>
              </article>
              <article className="panel wallet-metric-card">
                <span>Open Exposure</span>
                <strong>$100.00</strong>
                <p>Pending bets</p>
              </article>
            </section>

            <section className="panel history-panel">
              <div className="history-table-head transaction-head">
                <span>Type</span>
                <span>Description</span>
                <span>Amount</span>
                <span>Balance</span>
                <span>Date</span>
              </div>
              {transactions.length === 0 ? (
                <div className="history-empty-row">No transactions yet.</div>
              ) : (
                transactions.map((tx) => (
                  <article className="history-row transaction-row" key={tx.id}>
                    <span>{transactionLabel(tx.type)}</span>
                    <span>
                      <strong>{tx.description || 'Wallet transaction'}</strong>
                      {tx.referenceId && <small>Reference {tx.referenceId}</small>}
                    </span>
                    <span className={tx.amount >= 0 ? 'positive' : 'negative'}>
                      {tx.amount >= 0 ? '+' : ''}${tx.amount.toFixed(2)}
                    </span>
                    <span>${tx.balanceAfter.toFixed(2)}</span>
                    <span>{formatDateTime(tx.createdAt)}</span>
                  </article>
                ))
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
