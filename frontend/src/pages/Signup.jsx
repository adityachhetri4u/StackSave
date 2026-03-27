import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-machine px-4" id="signup-success">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-emerald-500/40 bg-emerald-500/10 mb-6">
            <span className="text-3xl text-emerald-400">✓</span>
          </div>
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-slate-100 mb-2">Verification Sent</h2>
          <p className="text-slate-400 mb-6 text-sm">
            We've sent a confirmation link to <strong className="text-emerald-400">{email}</strong>.
            Click the link to activate your terminal access.
          </p>
          <Link to="/login" className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-slate-950 transition hover:bg-emerald-400" id="link-back-to-login">
            Back to Login →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-machine px-4" id="signup-page">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_14px_#00ff80]" />
            <h1 className="font-display text-3xl font-bold tracking-[0.12em] text-emerald-400">
              StackSave
            </h1>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Register New Operator</p>
        </div>

        {/* Form */}
        <div className="machine-shell p-8">
          <div className="relative">
            <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-slate-100 mb-6">
              Create Account
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm" id="signup-error">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400 mb-2" htmlFor="signup-email">
                  Email
                </label>
                <input
                  type="email"
                  id="signup-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none ring-emerald-500/50 transition placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2"
                  placeholder="operator@stacksave.io"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400 mb-2" htmlFor="signup-password">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="signup-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 pr-12 text-sm text-slate-100 outline-none ring-emerald-500/50 transition placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2"
                    placeholder="Min 6 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-400 transition-colors text-xs uppercase tracking-widest"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400 mb-2" htmlFor="signup-confirm">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="signup-confirm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none ring-emerald-500/50 transition placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-emerald-500 py-3 text-sm font-bold uppercase tracking-[0.12em] text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                id="btn-signup"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Initializing...
                  </span>
                ) : (
                  'Register Operator →'
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6 uppercase tracking-[0.15em]">
          Already registered?{' '}
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors" id="link-login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
