import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { betsApi } from '../services/api';
import type { Bet } from '../types';

export default function BetsPage() {
  const navigate = useNavigate();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBets();
  }, []);

  const loadBets = async () => {
    try {
      const betsData = await betsApi.getBets(50);
      setBets(betsData);
    } catch (error) {
      console.error('Failed to load bets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won':
        return 'text-green-400';
      case 'lost':
        return 'text-red-400';
      case 'pending':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
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
          <h1 className="text-2xl font-bold">My Bets</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {bets.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400">No bets placed yet.</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded transition-colors"
            >
              Browse Events
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bets.map((bet) => (
              <div key={bet.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">Bet #{bet.id}</h3>
                    <p className="text-gray-400 text-sm">Event ID: {bet.eventId}</p>
                  </div>
                  <span className={`font-semibold ${getStatusColor(bet.status)}`}>
                    {bet.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <div className="text-gray-400 text-sm">Stake</div>
                    <div className="font-semibold">{bet.stake.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Odds</div>
                    <div className="font-semibold">{bet.oddsAtPlacement.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Potential Payout</div>
                    <div className="font-semibold text-green-400">{bet.potentialPayout.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Placed At</div>
                    <div className="font-semibold">{new Date(bet.placedAt).toLocaleString()}</div>
                  </div>
                </div>

                {bet.settledAt && (
                  <div className="mt-2 text-gray-400 text-sm">
                    Settled at: {new Date(bet.settledAt).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
