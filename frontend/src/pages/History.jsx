import { useEffect, useMemo, useState } from 'react';
import TextType from '../components/TextType';
import CountUp from '../components/CountUp';

const ANALYSIS_HISTORY_KEY = 'stacksave_analysis_history_v1';

function formatCurrency(value) {
  return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(ANALYSIS_HISTORY_KEY) || '[]');
      setHistory(Array.isArray(stored) ? stored : []);
    } finally {
      setLoading(false);
    }
  }, []);

  const totalSavings = useMemo(
    () => history.reduce((sum, entry) => sum + Number(entry?.total_savings || 0), 0),
    [history],
  );

  const totalExpenditure = useMemo(
    () =>
      history.reduce((sum, entry) => {
        const effective = Number(entry?.effective_price ?? NaN);
        if (Number.isFinite(effective)) {
          return sum + Math.max(0, effective);
        }

        const cart = Number(entry?.cart_value || 0);
        const savings = Number(entry?.total_savings || 0);
        return sum + Math.max(0, cart - savings);
      }, 0),
    [history],
  );

  const handleClearHistory = () => {
    localStorage.removeItem(ANALYSIS_HISTORY_KEY);
    setHistory([]);
  };

  return (
    <div className="mx-auto max-w-[1120px] space-y-6">
      <section className="screen-section history-screen relative overflow-hidden p-5 sm:p-6 font-mono">
        <div className="relative z-10 flex items-center justify-between">
          <h2 className="screen-title text-xl">
            <TextType
              as="span"
              text="History Console"
              typingSpeed={34}
              pauseDuration={1500}
              loop={false}
              showCursor
              cursorCharacter="_"
              cursorBlinkDuration={0.55}
              className="screen-blink"
            />
          </h2>
          <div className="flex items-center gap-2">
            <span className="screen-label text-[10px] uppercase tracking-widest">{history.length} logs detected</span>
            <button
              type="button"
              onClick={handleClearHistory}
              disabled={history.length === 0}
              className="rounded-md border border-slate-600 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-slate-300 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear History
            </button>
          </div>
        </div>

        <div className="screen-line relative z-10 my-3" />

        <div className="relative z-10 mb-4 grid gap-3 sm:grid-cols-3">
          <div className="screen-box-item">
            <p className="screen-label text-[10px]">Total Savings</p>
            <p className="screen-value accent text-2xl font-semibold mt-1">
              ₹<CountUp to={Math.round(totalSavings)} from={0} separator="," duration={1.6} />
            </p>
          </div>
          <div className="screen-box-item">
            <p className="screen-label text-[10px]">Total Expenditure</p>
            <p className="screen-value text-xl font-semibold mt-1 text-emerald-300">
              ₹<CountUp to={Math.round(totalExpenditure)} from={0} separator="," duration={1.6} />
            </p>
          </div>
          <div className="screen-box-item">
            <p className="screen-label text-[10px]">Entries Stored</p>
            <p className="screen-value text-xl font-semibold mt-1">{history.length}</p>
          </div>
        </div>

        {loading ? (
          <div className="relative z-10 min-h-[56vh] flex items-center justify-center">
             <span className="screen-blink text-slate-400 text-xs tracking-[0.2em] uppercase">Reading archive stream...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="relative z-10 min-h-[56vh] rounded-xl border border-dashed border-slate-600/45 p-8 text-center text-xs screen-label flex items-center justify-center">
            <span className="screen-blink">No history signal found. Run a terminal analysis first.</span>
          </div>
        ) : (
          <div className="relative z-10 min-h-[56vh] screen-box mt-2">
            <div className="screen-box-header px-4 py-2 border-b border-slate-700/50 flex justify-between items-center">
              <span className="screen-label text-[9px] tracking-widest">ARCHIVE STREAM // DATA READ</span>
              <span className="screen-value text-[9px] screen-blink text-emerald-400">LIVE READ</span>
            </div>

            <ul className="terminal-feed space-y-2 p-2 max-h-[60vh] overflow-y-auto">
              {history.map((entry, index) => (
                <li
                  key={entry.id}
                  className="screen-box-item terminal-entry group hover:border-slate-500 transition-all"
                  style={{ animationDelay: `${Math.min(index * 65, 800)}ms` }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                        <p className="screen-label text-[9px] opacity-70">
                            LOG {String(history.length - index).padStart(3, "0")} // {entry.merchant_name?.toUpperCase() || 'UNKNOWN'}
                        </p>
                        <p className="screen-value text-xs font-bold mt-1 text-slate-200">{entry.product_name || 'Processed Product'}</p>
                        <p className="screen-label text-[9px] mt-1">Best option: {entry.selected_option || 'N/A'}</p>
                    </div>
                    <span className="text-[9px] text-slate-500 uppercase">{formatDate(entry.created_at)}</span>
                  </div>
                  
                  <div className="mt-2 grid gap-4 text-[10px] sm:grid-cols-3">
                    <p className="screen-label">
                      Savings achieved: <span className="screen-value text-emerald-400 font-bold">{formatCurrency(entry.total_savings)}</span>
                    </p>
                    <p className="screen-label">
                      Cart value: <span className="screen-value text-slate-300">{formatCurrency(entry.cart_value)}</span>
                    </p>
                    <p className="screen-label">
                      Expenditure: <span className="screen-value text-emerald-300 font-bold">{formatCurrency(Number.isFinite(Number(entry?.effective_price)) ? Number(entry.effective_price) : Math.max(0, Number(entry?.cart_value || 0) - Number(entry?.total_savings || 0)))}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="screen-label text-[9px] mt-4 px-4 pb-2 terminal-cursor opacity-50">Awaiting next sequence input</p>
          </div>
        )}
      </section>
    </div>
  )
}

export default History;
