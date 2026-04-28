import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from './Button';
import type { Wallet } from '../types';

interface HeaderProps {
  wallet?: Wallet | null;
}

export function Header({ wallet }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">SportBets</h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => navigate('/')}
              className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
            >
              Events
            </button>
            <button
              onClick={() => navigate('/bets')}
              className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
            >
              My Bets
            </button>
            <button
              onClick={() => navigate('/wallet')}
              className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
            >
              Wallet
            </button>
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-4">
            {/* Wallet Balance */}
            {wallet && (
              <div className="hidden sm:flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full">
                <span className="text-xs text-gray-500">Balance:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {wallet.balance.toFixed(2)} {wallet.currency}
                </span>
              </div>
            )}

            {/* User Name */}
            <span className="hidden sm:block text-sm text-gray-600">{user?.displayName}</span>

            {/* Logout Button */}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
