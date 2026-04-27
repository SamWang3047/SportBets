import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsApi, walletApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { Event, Wallet } from '../types';

export default function HomePage() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    loadData();
  }, [isAuthenticated, navigate]);

  const loadData = async () => {
    try {
      const [eventsData, walletData] = await Promise.all([
        eventsApi.getEvents({ limit: 10 }),
        walletApi.getWallet(),
      ]);
      setEvents(eventsData);
      setWallet(walletData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">SportBets</h1>
          <div className="flex items-center gap-4">
            {wallet && (
              <div className="bg-gray-700 px-4 py-2 rounded">
                <span className="text-gray-400">Balance:</span>{' '}
                <span className="font-bold text-green-400">{wallet.balance.toFixed(2)} {wallet.currency}</span>
              </div>
            )}
            <span className="text-gray-400">{user?.displayName}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Live Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 cursor-pointer transition-colors"
                onClick={() => navigate(`/events/${event.id}`)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{event.name}</h3>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      event.status === 'live'
                        ? 'bg-green-600'
                        : event.status === 'scheduled'
                        ? 'bg-blue-600'
                        : 'bg-gray-600'
                    }`}
                  >
                    {event.status}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">
                  {new Date(event.startTime).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/bets')}
                className="w-full bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded transition-colors"
              >
                View My Bets
              </button>
              <button
                onClick={() => navigate('/wallet')}
                className="w-full bg-green-600 hover:bg-green-700 py-2 px-4 rounded transition-colors"
              >
                View Wallet
              </button>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Welcome to SportBets</h3>
            <p className="text-gray-400">
              Place bets on your favorite sports events using virtual credits. Watch live odds and track your winnings!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
