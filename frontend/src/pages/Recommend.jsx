import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useRecommendation } from '../contexts/RecommendationContext';
import TextType from '../components/TextType';

export default function Recommend() {
  const [merchants, setMerchants] = useState([]);
  const [loadingMerchants, setLoadingMerchants] = useState(true);
  const {
    merchant,
    setMerchant,
    cartValue,
    setCartValue,
    result,
    loading,
    error,
    getRecommendation,
    clearResult,
  } = useRecommendation();

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      const res = await api.get('/merchants');
      setMerchants(res.data);
    } catch (err) {
      console.error('Failed to load merchants:', err);
    } finally {
      setLoadingMerchants(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!merchant || !cartValue) return;
    await getRecommendation(merchant, cartValue);
  };

  const handleReset = () => {
    setMerchant(null);
    setCartValue('');
    clearResult();
  };

  return (
    <div className="mx-auto max-w-[1120px] space-y-6" id="recommend-page">
      <section className="machine-screen relative overflow-hidden p-4 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(100,116,139,0.12),transparent_45%)]" />
        <div className="absolute inset-x-0 top-20 h-px bg-slate-500/35" />
        <div className="absolute inset-0 opacity-20 [background:repeating-linear-gradient(0deg,transparent,transparent_23px,rgba(100,116,139,0.08)_24px)]" />

        <div className="relative space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <TextType
                as="p"
                text="Stack Engine"
                typingSpeed={38}
                pauseDuration={1500}
                loop={false}
                showCursor
                cursorCharacter="_"
                cursorBlinkDuration={0.55}
                className="text-xs uppercase tracking-[0.22em] text-slate-400"
              />
              <TextType
                as="h2"
                text="StackMode // Optimizer"
                typingSpeed={44}
                initialDelay={150}
                pauseDuration={1600}
                loop={false}
                showCursor
                cursorCharacter="_"
                cursorBlinkDuration={0.55}
                className="font-display text-3xl font-semibold uppercase tracking-wide text-slate-100 screen-blink"
              />
            </div>
            <p className="rounded-full border border-slate-500/40 bg-slate-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
              <TextType
                as="span"
                text="Optimization Active"
                typingSpeed={28}
                pauseDuration={1400}
                loop={false}
                showCursor
                cursorCharacter="_"
                cursorBlinkDuration={0.5}
              />
            </p>
          </div>

          <div className="machine-panel rounded-2xl p-6 border border-slate-700 font-mono shadow-2xl" id="recommend-form">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-3" htmlFor="select-merchant">
                  [STEP 01] TARGET MERCHANT
                </label>
                {loadingMerchants ? (
                  <div className="animate-pulse h-12 rounded-lg bg-slate-800/50 border border-slate-700" />
                ) : (
                  <select
                    id="select-merchant"
                    value={merchant || ''}
                    onChange={(e) => setMerchant(e.target.value || null)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none ring-slate-500/30 transition focus:border-slate-500 focus:ring-4 appearance-none"
                    required
                  >
                    <option value="">SCAN NETWORK FOR MERCHANT...</option>
                    {merchants.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name.toUpperCase()} // {m.category.toUpperCase()}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-3" htmlFor="cart-value">
                  [STEP 02] NUMERIC CART PAYLOAD
                </label>
                <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">₹</span>
                   <input
                    type="number"
                    id="cart-value"
                    value={cartValue}
                    onChange={(e) => setCartValue(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-10 pr-4 py-4 text-sm text-slate-200 outline-none ring-slate-500/30 transition focus:border-slate-500 focus:ring-4 text-xl font-bold tracking-wider"
                    placeholder="2500"
                    min="1"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/40 text-red-200 text-xs" id="recommend-error">
                  [FAILURE]: {error}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading || !merchant || !cartValue}
                  className="flex-1 rounded-lg bg-slate-200 py-4 text-sm font-black uppercase tracking-[0.2em] text-slate-950 transition hover:bg-white disabled:opacity-30 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                  id="btn-find-savings"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      OPTIMIZING...
                    </>
                  ) : (
                    'RUN OPTIMIZATION'
                  )}
                </button>
                {result && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 hover:text-slate-200 hover:border-slate-500 transition"
                    id="btn-reset"
                  >
                    RESET
                  </button>
                )}
              </div>
            </form>
          </div>

          {loading && (
            <div className="rounded-xl border border-slate-700 bg-slate-950 p-8 text-center text-slate-400 text-xs font-mono uppercase tracking-[0.3em] animate-pulse">
              [ANALYZING POSSIBILITIES] <br/>
              Iterating database combinations...
            </div>
          )}

          {result && !loading && (
            <div id="recommend-results" className="space-y-5 animate-fade-in font-mono">
              <h2 className="font-display text-xs font-bold uppercase tracking-[0.25em] text-slate-500 px-1">
                COMBINATIONS DETECTED FOR: <span className="text-slate-200 font-bold">{result.merchant_name.toUpperCase()}</span>
              </h2>

              {result.savings_breakdown && result.savings_breakdown.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {result.savings_breakdown.map((item, idx) => (
                    <div key={idx} className={`rounded-xl border p-5 transition-all group ${idx === 0 ? 'border-slate-300 bg-slate-500/10' : 'border-slate-700 bg-slate-900 group-hover:border-slate-500'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">{item.card_name?.toUpperCase() || 'PAYMENT NODE'}</span>
                        {idx === 0 && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-black uppercase text-slate-950 tracking-tighter">
                            OPTIMAL
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px]">
                           <span className="text-slate-500 uppercase tracking-widest">COUPON APPLIED</span>
                           <span className="text-slate-200 font-bold">{item.coupon_code || 'NONE'}</span>
                        </div>
                        
                        <div className="pt-2 border-t border-slate-700/50">
                           <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">EFFECTIVE PAYLOAD</p>
                           <p className="text-2xl font-black text-slate-100">
                             ₹{Number(item.final_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                           </p>
                        </div>

                        <div className="flex justify-between items-center pt-1">
                           <p className="text-[10px] text-emerald-400 uppercase tracking-widest bg-emerald-900/30 px-2 py-0.5 rounded">
                             SAVED ₹{Number(item.total_savings || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                           </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-700 p-12 text-center text-[10px] text-slate-500 uppercase tracking-[0.3em]">
                  SEQUENCE FAILURE: NO COMBINATIONS FOUND
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
