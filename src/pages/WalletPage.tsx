import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { walletApi } from '../services/api';
import type { Wallet, Transaction } from '../types';

export default function WalletPage() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const [walletData, transactionsData] = await Promise.all([
        walletApi.getWallet(),
        walletApi.getTransactions(50),
      ]);
      setWallet(walletData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'bet_payout':
      case 'bet_refund':
        return 'text-green-400';
      case 'bet_stake':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getTransactionLabel = (type: string) => {
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
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/')}
            className="text-blue-400 hover:text-blue-300 mb-2"
          >
            ← Back to Home
          </button>
          <h1 className="text-2xl font-bold">My Wallet</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {wallet && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Balance</h2>
            <div className="text-4xl font-bold text-green-400">
              {wallet.balance.toFixed(2)} {wallet.currency}
            </div>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Transaction History</h2>

          {transactions.length === 0 ? (
            <p className="text-gray-400">No transactions yet.</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="border-b border-gray-700 pb-3 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{getTransactionLabel(tx.type)}</div>
                      {tx.description && (
                        <div className="text-gray-400 text-sm">{tx.description}</div>
                      )}
                      <div className="text-gray-500 text-sm">
                        {new Date(tx.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${getTransactionColor(tx.type)}`}>
                        {tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(2)}
                      </div>
                      <div className="text-gray-400 text-sm">
                        Balance: {tx.balanceAfter.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
