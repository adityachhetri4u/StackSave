import { useState, useEffect } from 'react';
import api from '../lib/api';
import TextType from '../components/TextType';

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
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/recommendations/history');
      setHistory(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
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
          <span className="screen-label text-[10px] uppercase tracking-widest">{history.length} logs detected</span>
        </div>

        <div className="screen-line relative z-10 my-3" />

        {error && (
          <div className="relative z-10 mb-4 p-3 rounded-md bg-red-900/40 border border-red-500/50 text-red-200 text-xs">
            [ERROR]: {error}
          </div>
        )}

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
                    </div>
                    <span className="text-[9px] text-slate-500 uppercase">{formatDate(entry.created_at)}</span>
                  </div>
                  
                  <div className="mt-2 grid gap-4 text-[10px] sm:grid-cols-2">
                    <p className="screen-label">
                      Savings achieved: <span className="screen-value text-emerald-400 font-bold">{formatCurrency(entry.total_savings)}</span>
                    </p>
                    <p className="screen-label">
                      Cart value: <span className="screen-value text-slate-300">{formatCurrency(entry.cart_value)}</span>
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
