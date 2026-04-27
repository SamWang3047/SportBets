import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsApi, betsApi } from '../services/api';
import type { Event, Market, Odd } from '../types';

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedOdds, setSelectedOdds] = useState<{ marketId: number; selectionId: string; odds: number } | null>(null);
  const [stake, setStake] = useState('');
  const [loading, setLoading] = useState(true);
  const [placingBet, setPlacingBet] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (eventId) {
      loadEventData();
    }
  }, [eventId]);

  const loadEventData = async () => {
    try {
      const [eventData, marketsData] = await Promise.all([
        eventsApi.getEvent(parseInt(eventId!)),
        eventsApi.getEventMarkets(parseInt(eventId!)),
      ]);
      setEvent(eventData);
      setMarkets(marketsData);
    } catch (error) {
      console.error('Failed to load event:', error);
      setError('Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOdds = (marketId: number, selectionId: string, odds: number) => {
    setSelectedOdds({ marketId, selectionId, odds });
  };

  const handlePlaceBet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOdds || !stake || !event) return;

    setPlacingBet(true);
    setError('');

    try {
      const stakeNum = parseFloat(stake);
      await betsApi.placeBet({
        eventId: event.id,
        marketId: selectedOdds.marketId,
        selectionId: selectedOdds.selectionId,
        stake: stakeNum,
      });

      alert('Bet placed successfully!');
      setSelectedOdds(null);
      setStake('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to place bet');
    } finally {
      setPlacingBet(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Event not found</div>
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
          <h1 className="text-2xl font-bold">{event.name}</h1>
          <p className="text-gray-400">
            Status: <span className={`font-semibold ${
              event.status === 'live' ? 'text-green-400' : event.status === 'scheduled' ? 'text-blue-400' : 'text-gray-400'
            }`}>{event.status}</span>
          </p>
          <p className="text-gray-400">
            Start Time: {new Date(event.startTime).toLocaleString()}
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Betting Markets</h2>
            {markets.map((market) => (
              <div key={market.id} className="bg-gray-800 rounded-lg p-4 mb-4">
                <h3 className="font-semibold mb-3">{market.name}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {market.odds.map((odd) => (
                    <button
                      key={odd.id}
                      onClick={() => handleSelectOdds(market.id, odd.selectionId, odd.decimalOdds)}
                      disabled={event.status !== 'scheduled' || !odd.isActive}
                      className={`p-3 rounded border transition-colors ${
                        selectedOdds?.marketId === market.id && selectedOdds?.selectionId === odd.selectionId
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      } ${!odd.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="text-sm text-gray-400">{odd.selectionName}</div>
                      <div className="text-lg font-bold">{odd.decimalOdds.toFixed(2)}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {selectedOdds && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Place Bet</h2>
              <form onSubmit={handlePlaceBet}>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Selection</label>
                  <div className="bg-gray-700 px-4 py-2 rounded">
                    {selectedOdds.selectionId} @ {selectedOdds.odds.toFixed(2)}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Stake</label>
                  <input
                    type="number"
                    value={stake}
                    onChange={(e) => setStake(e.target.value)}
                    min="1"
                    step="0.01"
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                {stake && (
                  <div className="mb-4 bg-gray-700 px-4 py-2 rounded">
                    <div className="text-gray-400">Potential Payout:</div>
                    <div className="text-xl font-bold text-green-400">
                      {(parseFloat(stake) * selectedOdds.odds).toFixed(2)}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={placingBet || event.status !== 'scheduled'}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
                >
                  {placingBet ? 'Placing Bet...' : 'Place Bet'}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOdds(null)}
                  className="w-full mt-2 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded transition-colors"
                >
                  Cancel
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
