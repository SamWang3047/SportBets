import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string } } }).response;
    return response?.data?.error || fallback;
  }

  return fallback;
}

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = isLogin
        ? await authApi.login(email, password)
        : await authApi.register(email, password, displayName);

      setAuth(result.user, result.token);
      navigate('/');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Authentication failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-shell">
      <section className="login-brand-panel">
        <div className="brand-mark login-brand">
          <span className="brand-logo">S</span>
          <span>SportBets</span>
        </div>
        <div className="login-preview panel">
          <div className="featured-topline">
            <div>
              <span className="live-pill">LIVE</span>
              <span>Horse Racing - Race Winner</span>
            </div>
            <button type="button">Preview</button>
          </div>
          <div className="login-score">
            <span>Golden Sprint Stakes</span>
            <strong>6 runners</strong>
            <span>Riverside Track</span>
          </div>
          <div className="featured-odds">
            <button type="button"><span>Thunder Strike</span><strong>1</strong><em>3.50</em></button>
            <button type="button"><span>Silver Bullet</span><strong>2</strong><em>2.80</em></button>
            <button type="button"><span>Golden Gale</span><strong>4</strong><em>3.80</em></button>
          </div>
        </div>
      </section>

      <section className="login-card panel">
        <h1>{isLogin ? 'Login to SportBets' : 'Create Account'}</h1>
        <p>Use virtual credits to follow markets, place slips, and track performance.</p>

        {error && (
          <div className="message-banner error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <label>
              <span>Display Name</span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required={!isLogin}
              />
            </label>
          )}

          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>

          <button className="primary-action" type="submit" disabled={loading}>
            {loading ? 'Loading...' : isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="auth-switch"
        >
          {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
        </button>
      </section>
    </main>
  );
}
