import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UtensilsCrossed, Loader2 } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@quickserve.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center px-4 font-body">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 rounded-sm bg-amber-500 flex items-center justify-center">
            <UtensilsCrossed size={18} className="text-ink-950" />
          </div>
          <span className="font-display font-semibold text-lg text-steel-50 tracking-tight">
            QuickServe
          </span>
        </div>

        <div className="bg-ink-900 border border-ink-700 rounded-sm p-7">
          <h1 className="font-display text-xl font-semibold text-steel-50 mb-1">Kitchen sign in</h1>
          <p className="text-steel-400 text-sm mb-6">Admin and staff access only.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-steel-400 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="focus-ring w-full bg-ink-800 border border-ink-700 rounded-sm px-3 py-2.5 text-steel-50 text-sm placeholder:text-steel-600"
                placeholder="you@quickserve.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-steel-400 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="focus-ring w-full bg-ink-800 border border-ink-700 rounded-sm px-3 py-2.5 text-steel-50 text-sm placeholder:text-steel-600"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-signal-rejected text-sm bg-signal-rejected/10 border border-signal-rejected/30 rounded-sm px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="focus-ring w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-ink-950 font-semibold text-sm rounded-sm py-2.5 flex items-center justify-center gap-2 transition-colors"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-steel-600 text-xs text-center mt-5">
          Default seeded login: admin@quickserve.com / Admin@123
        </p>
      </div>
    </div>
  );
}
