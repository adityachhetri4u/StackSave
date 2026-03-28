import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const quickActions = [
  {
    to: '/product-scraper',
    label: 'Terminal',
    description: 'Scan any product URL for live bank offers',
    letter: 'T',
    glow: 'shadow-emerald-500/20',
    border: 'border-emerald-500/30 hover:border-emerald-400',
  },
  {
    to: '/cards',
    label: 'Vault',
    description: 'Manage your saved credit cards',
    letter: 'V',
    glow: 'shadow-amber-500/20',
    border: 'border-amber-500/30 hover:border-amber-400',
  },

  {
    to: '/history',
    label: 'History',
    description: 'View past recommendation logs',
    letter: 'H',
    glow: 'shadow-purple-500/20',
    border: 'border-purple-500/30 hover:border-purple-400',
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.email?.split('@')[0] || 'Operator';

  return (
    <div className="mx-auto max-w-[1120px] space-y-8">
      {/* Hero */}
      <section className="machine-screen relative overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,197,94,0.12),transparent_45%)]" />
        <div className="absolute inset-x-0 top-24 h-px bg-emerald-500/40" />
        <div className="absolute inset-0 opacity-20 [background:repeating-linear-gradient(0deg,transparent,transparent_23px,rgba(16,185,129,0.09)_24px)]" />

        <div className="relative">
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-400">System Online</p>
          <h1 className="mt-1 font-display text-3xl font-semibold uppercase tracking-wide text-slate-100 sm:text-4xl">
            Welcome back, <span className="text-emerald-400">{firstName}</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-slate-400">
            StackSave Checkout Console is ready. Scan any product URL for live bank offers, compare payment methods, and stack your savings.
          </p>

          <Link
            to="/product-scraper"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-slate-950 transition hover:bg-emerald-400"
          >
            Launch Terminal
            <span className="text-lg">→</span>
          </Link>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map(({ to, label, description, letter, glow, border }) => (
            <Link
              key={to}
              to={to}
              className={`group relative rounded-2xl border bg-slate-950/80 p-5 transition-all duration-300 hover:shadow-lg ${border} ${glow}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-lg border border-slate-700 bg-slate-900 text-sm font-semibold text-emerald-300">
                  {letter}
                </div>
                <span className="text-lg text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-emerald-400">→</span>
              </div>
              <h3 className="font-semibold text-slate-100">{label}</h3>
              <p className="mt-1 text-xs text-slate-500">{description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="machine-panel rounded-2xl p-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">How It Works</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { step: '01', title: 'Paste URL', desc: 'Drop any Amazon or Flipkart product link into the Terminal.' },
            { step: '02', title: 'AI Extraction', desc: 'A headless browser scans the page and extracts real-time bank offers.' },
            { step: '03', title: 'Stack & Save', desc: 'View all offers, compare discounts, and pick the best checkout strategy.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <span className="font-display text-2xl font-bold text-emerald-500/30">{step}</span>
              <h3 className="mt-2 font-semibold text-slate-100">{title}</h3>
              <p className="mt-1 text-xs text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer status bar */}
      <div className="grid gap-2 border-t border-slate-800 pt-4 text-xs uppercase tracking-[0.17em] text-slate-500 sm:grid-cols-3">
        <p>Engine: Playwright Chromium v1.52</p>
        <p>Security: AES-256 Vault Shield</p>
        <p className="text-emerald-400">Status: All Systems Nominal</p>
      </div>
    </div>
  );
}
