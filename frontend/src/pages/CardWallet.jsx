import { useState, useEffect, useMemo } from 'react';
import api from '../lib/api';
import TextType from '../components/TextType';
import { useAuth } from '../contexts/AuthContext';
import { getCardBenefits } from '../data/cardBenefits';

function CardWallet() {
  const { user, loading: authLoading } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [flippedCards, setFlippedCards] = useState({});

  const [newCardBank, setNewCardBank] = useState('');
  const [newCardType, setNewCardType] = useState('Credit Card');

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setError('Please log in to manage your cards');
      setLoading(false);
      console.log('[CardWallet] User not logged in');
      return;
    }

    console.log('[CardWallet] User logged in, fetching cards...', { user_id: user.id, email: user.email });
    fetchCards();
  }, [user, authLoading]);

  const fetchCards = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('[fetchCards] Starting fetch...');
      const res = await api.get('/cards');
      console.log('[fetchCards] Success:', res.data);
      setCards(res.data || []);
    } catch (err) {
      console.error('[fetchCards] Error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        errorMsg: err.response?.data?.detail?.error?.message || err.message || 'Failed to fetch cards'
      });
      const errorMsg = err.response?.data?.detail?.error?.message || err.message || 'Failed to fetch cards';
      setError(errorMsg);
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  const addCard = async (e) => {
    e.preventDefault();
    if (!newCardBank.trim()) return;

    try {
      setError('');
      const cardPayload = {
        card_name: `${newCardBank} ${newCardType}`,
        bank_name: newCardBank.trim(),
        card_type: newCardType,
        cashback_rate: 1.5,
      };

      const res = await api.post('/cards', cardPayload);
      setCards([res.data, ...cards]);
      setNewCardBank('');
      setSuccess('Card successfully added to vault.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.detail?.error?.message || err.message || 'Failed to add card';
      setError(errorMsg);
      console.error('Add card error:', err.response?.data || err.message);
    }
  };

  const removeCard = async (id, e) => {
    e?.stopPropagation();
    try {
      setError('');
      await api.delete(`/cards/${id}`);
      setCards(cards.filter(c => c.id !== id));
      setSuccess('Card removed from vault.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.detail?.error?.message || err.message || 'Failed to delete card';
      setError(errorMsg);
      console.error('Delete card error:', err.response?.data || err.message);
    }
  };

  const toggleCardFlip = (id) => {
    setFlippedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const cardCount = cards.length;

  return (
    <div className="mx-auto max-w-[1120px] grid gap-6 xl:grid-cols-[1.6fr_1fr]">
      <section className="screen-section relative overflow-hidden p-5">
        <div className="relative z-10 flex items-center justify-between gap-3">
          <h2 className="screen-title text-xl">
            <TextType
              as="span"
              text="Asset Inventory"
              typingSpeed={34}
              pauseDuration={1400}
              loop={false}
              showCursor
              cursorCharacter="_"
              cursorBlinkDuration={0.5}
            />
          </h2>
          <span className="screen-value text-[10px] font-semibold px-3 py-1 rounded-full border border-slate-600/40 bg-slate-700/10 uppercase tracking-widest text-slate-300">
            {cardCount} saved
          </span>
        </div>

        <div className="screen-line relative z-10 my-3" />

        {error && (
          <div className="relative z-10 mb-4 p-3 rounded-md bg-red-900/40 border border-red-500/50 text-red-200 text-xs font-mono">
            [ERROR]: {error}
          </div>
        )}
        {success && (
          <div className="relative z-10 mb-4 p-3 rounded-md bg-emerald-900/40 border border-emerald-500/50 text-emerald-200 text-xs font-mono">
            [SUCCESS]: {success}
          </div>
        )}

        {authLoading ? (
          <div className="relative z-10 p-4 text-center text-slate-300">
            <p className="text-xs uppercase tracking-widest">Authenticating...</p>
          </div>
        ) : !user ? (
          <div className="relative z-10 p-4 rounded-md bg-slate-800/40 border border-slate-700 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-widest">Please log in to manage your cards</p>
          </div>
        ) : (
          <>
            <form onSubmit={addCard} className="relative z-10 flex gap-2">
              <input
                type="text"
                value={newCardBank}
                onChange={(event) => setNewCardBank(event.target.value)}
                placeholder="Add bank card (e.g. HDFC Credit)"
                className="tape-input w-full"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !newCardBank.trim()}
                className="machine-button px-6"
              >
                {loading ? 'Adding...' : 'Add'}
              </button>
            </form>
          </>
        )}

        <div className="relative z-10 screen-box mt-4">
          <div className="screen-box-content vault-cards-grid">
            {loading && user ? (
              <div className="col-span-full p-8 text-center">
                <p className="text-xs text-slate-400 uppercase tracking-widest">Loading cards...</p>
              </div>
            ) : !user ? (
              <div className="col-span-full p-8 text-center">
                <p className="text-xs text-slate-400 uppercase tracking-widest">Sign in to view saved cards</p>
              </div>
            ) : cards.length === 0 ? (
              <div className="col-span-full p-8 text-center">
                <p className="text-xs text-slate-400 uppercase tracking-widest">No cards saved. Add one above to get started.</p>
              </div>
            ) : (
              cards.map((card, index) => {
              const isFlipped = Boolean(flippedCards[card.id]);
              const bankName = card.bank_name || 'Bank';
              const last4 = card.id ? String(card.id).slice(-4).padStart(4, "0") : "0000";
              const benefitInfo = getCardBenefits(card.card_name || '', bankName);
              const benefitMetrics = benefitInfo?.metrics || {
                returnRate: 'N/A',
                pointsValue: 'N/A',
                boostZone: 'Offers',
                avoidZone: 'Excluded MCC',
              };
              const benefitBullets = benefitInfo?.bullets || [
                'Prioritize categories with top return profile.',
                'Stack issuer offers and redeem points regularly.',
              ];
              
              return (
                <div
                  key={card.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleCardFlip(card.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleCardFlip(card.id);
                    }
                  }}
                  className="vault-card-frame"
                >
                  <div className={`vault-card-inner ${isFlipped ? "is-flipped" : ""}`}>
                    {/* Front Face */}
                    <article className="vault-card-face vault-card-front rounded-xl border border-slate-700 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-3 shadow-2xl">
                      <div className="credit-skin h-full px-4 pb-4 pt-4">
                        <span className="credit-line top" />
                        <span className="credit-line bottom" />
                        <span className="credit-skin-track" />

                        <div className="relative z-10 flex items-center justify-between">
                          <span className="screen-label text-[9px] font-mono">Credit // Physical Node</span>
                          <div className="flex items-center gap-1.5 opacity-60">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                            <div className="h-4 w-6 rounded bg-gradient-to-b from-slate-400 to-slate-600" />
                          </div>
                        </div>

                        <p className="relative z-10 mt-6 screen-value text-sm font-bold uppercase tracking-widest">{bankName}</p>
                        <p className="relative z-10 mt-2 screen-label text-[10px] tracking-[0.25em] font-mono">
                          **** **** **** {last4}
                        </p>

                        <div className="relative z-10 mt-3 flex items-end justify-between">
                          <div>
                            <p className="screen-label text-[8px] font-mono">Protocol</p>
                            <p className="screen-value text-[10px] font-bold uppercase">{card.card_type || 'ACTIVE'}</p>
                          </div>
                          <p className="screen-label text-[8px] font-mono">Slot {String(index + 1).padStart(2, "0")}</p>
                        </div>

                        <div className="relative z-10 mt-3 flex items-center justify-between">
                          <span className="screen-label text-[8px] font-mono opacity-50 italic">Tap to flip // Secure</span>
                          <button
                            type="button"
                            onClick={(e) => removeCard(card.id, e)}
                            className="rounded border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/20"
                          >
                            Purge
                          </button>
                        </div>
                      </div>
                    </article>

                    {/* Back Face */}
                    <article className="vault-card-face vault-card-back rounded-xl border border-slate-700 p-4 font-mono shadow-2xl">
                      <div className="vault-back-strip" />
                      <p className="screen-label text-[9px] tracking-[0.16em]">Smart Usage Notes</p>

                      <div className="mt-2 space-y-1.5 px-0.5">
                        <div className="flex items-center justify-between gap-2 text-[9px]">
                          <span className="screen-label text-slate-400">Return</span>
                          <span className="screen-value text-[12px] font-extrabold text-emerald-300">{benefitMetrics.returnRate}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-[9px]">
                          <span className="screen-label text-slate-400">Point Value</span>
                          <span className="screen-value text-[11px] font-bold text-cyan-300">{benefitMetrics.pointsValue}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-[9px]">
                          <span className="screen-label text-slate-400">Best Use</span>
                          <span className="screen-value text-[10px] font-semibold text-slate-200 truncate">{benefitMetrics.boostZone}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-[9px]">
                          <span className="screen-label text-slate-400">Avoid</span>
                          <span className="screen-value text-[10px] font-semibold text-rose-200 truncate">{benefitMetrics.avoidZone}</span>
                        </div>
                      </div>

                      <ul className="mt-2 space-y-1">
                        {benefitBullets.map((line) => (
                          <li key={line} className="screen-label text-[8px] leading-[1.2] text-slate-300">
                            - {line}
                          </li>
                        ))}
                      </ul>

                      <div className="mt-3 pt-2 border-t border-slate-700/50">
                        <p className="screen-label text-[8px] opacity-65">UID: {card.id}</p>
                      </div>
                    </article>
                  </div>
                </div>
              );
              })
            )}
            
            {!loading && cards.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-slate-800 p-12 text-center">
                <p className="text-xs uppercase tracking-widest text-slate-600 font-mono">
                  Vault empty. Initialize assets to begin.
                </p>
              </div>
            )}
          </div>

          <div className="screen-line my-3" />

          <div className="vault-utility-grid font-mono">
            <div className="screen-box-item">
              <p className="screen-label text-[9px]">Encryption</p>
              <p className="screen-value text-[11px] font-bold mt-1 text-emerald-400">Vault Shield On</p>
            </div>
            <div className="screen-box-item">
              <p className="screen-label text-[9px]">Sync Pulse</p>
              <p className="screen-value text-[11px] font-bold mt-1 screen-blink text-slate-300">Live 3.8s</p>
            </div>
            <div className="screen-box-item">
              <p className="screen-label text-[9px]">Database</p>
              <div className="mt-2 h-1 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full w-[42%] rounded-full bg-slate-400" />
              </div>
              <p className="screen-label text-[8px] mt-1 italic">Supabase Connected</p>
            </div>
          </div>
        </div>
      </section>

      <section className="screen-section relative overflow-hidden p-5">
        <div className="relative z-10 flex items-center justify-between gap-2">
          <h2 className="screen-title text-xl">
            <TextType
              as="span"
              text="Wallet Node"
              typingSpeed={32}
              pauseDuration={1400}
              loop={false}
              showCursor
              cursorCharacter="_"
              cursorBlinkDuration={0.5}
            />
          </h2>
          <span className="screen-label text-[10px] font-mono tracking-widest">UPI Registry</span>
        </div>

        <div className="screen-line relative z-10 my-3" />

        <div className="relative z-10 flex gap-2">
          <input
            type="text"
            placeholder="Add UPI protocol (e.g. GPay)"
            className="tape-input w-full"
          />
          <button
            type="button"
            className="machine-button px-5"
          >
            Link
          </button>
        </div>

        <div className="relative z-10 screen-box mt-4 font-mono">
          <div className="screen-box-content space-y-2">
            {/* Standard placeholders for visual demo */}
            <div className="screen-box-item flex items-center justify-between text-[11px]">
              <span className="screen-value uppercase tracking-wider text-slate-200 font-bold">Google Pay</span>
              <span className="text-[9px] text-emerald-400 uppercase tracking-widest bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-500/20">Active</span>
            </div>
            <div className="screen-box-item flex items-center justify-between text-[11px]">
              <span className="screen-value uppercase tracking-wider text-slate-200 font-bold">PhonePe</span>
              <span className="text-[9px] text-emerald-400 uppercase tracking-widest bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-500/20">Active</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-6 bg-slate-900/50 p-4 border border-slate-800 rounded-xl">
          <h3 className="screen-label text-[10px] font-mono opacity-70">Infrastructure Security</h3>
          <div className="mt-3 flex items-center justify-center p-4 border border-slate-700/50 bg-black/40 rounded-lg text-[10px] text-slate-400 font-mono text-center leading-relaxed">
            [DATA ENCRYPTED] <br/>
            No server-side plaintext storage. <br/>
            Point-to-point authentication only.
          </div>
        </div>
      </section>
    </div>
  )
}

export default CardWallet;
