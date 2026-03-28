import { useEffect, useMemo, useState } from "react"
import api from '../lib/api';
import BetterDeals from "../components/BetterDeals"
import PaymentOptionCard from "../components/PaymentOptionCard"
import ProductCard from "../components/ProductCard"
import SavingsBreakdown from "../components/SavingsBreakdown"
import TextType from "../components/TextType"
import UrlInput from "../components/UrlInput"
import AnalysisLoader from "../components/AnalysisLoader"
import { useAuth } from '../contexts/AuthContext';

const BANK_TOKENS = ["HDFC", "SBI", "AXIS", "ICICI", "KOTAK", "AMEX", "HSBC", "CITI", "BOB"];
const POINT_VALUE_INR = 0.25;
const ANALYSIS_HISTORY_KEY = 'stacksave_analysis_history_v1';
const ANALYSIS_HISTORY_LIMIT = 100;

const extractIssuer = (text) => {
  const upper = String(text || '').toUpperCase();
  const match = BANK_TOKENS.find((token) => upper.includes(token));
  return match || null;
};

const normalizePaymentType = (paymentType) => {
  const value = String(paymentType || '').toLowerCase();
  if (value.includes('debit')) return 'debit';
  if (value.includes('emi')) return 'emi';
  return 'credit';
};

const isCardTypeEligible = (cardType, offerPaymentType) => {
  const cardKind = String(cardType || '').toLowerCase();
  const offerKind = normalizePaymentType(offerPaymentType);

  if (offerKind === 'debit') return cardKind.includes('debit');
  if (offerKind === 'credit') return cardKind.includes('credit');
  if (offerKind === 'emi') return cardKind.includes('credit') || cardKind.includes('emi');
  return true;
};

const calculateCouponDiscount = (coupon, basePrice) => {
  if (!coupon || !basePrice || basePrice <= 0) return 0;
  if (coupon.min_order_value > 0 && basePrice < coupon.min_order_value) return 0;

  let discount = 0;
  if (coupon.discount_type === 'FLAT') {
    discount = coupon.discount_value;
  } else if (coupon.discount_type === 'PERCENTAGE') {
    discount = basePrice * (coupon.discount_value / 100);
  }

  if (coupon.max_discount > 0 && discount > coupon.max_discount) {
    discount = coupon.max_discount;
  }

  return Number(discount.toFixed(2));
};

function ProductScraper() {
  const { user } = useAuth();
  const [lastAnalysis, setLastAnalysis] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [coupons, setCoupons] = useState([])
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [savedCards, setSavedCards] = useState([])

  const appendAnalysisToHistory = (entry) => {
    try {
      const existing = JSON.parse(localStorage.getItem(ANALYSIS_HISTORY_KEY) || '[]');
      const updated = [entry, ...existing].slice(0, ANALYSIS_HISTORY_LIMIT);
      localStorage.setItem(ANALYSIS_HISTORY_KEY, JSON.stringify(updated));
    } catch {
      // Ignore history persistence failures to avoid blocking analysis flow.
    }
  };

  const bestCoupon = useMemo(() => {
    if (!coupons.length || !lastAnalysis) return null;
    const basePrice = lastAnalysis?._rawPrice || lastAnalysis?.product?.originalPrice || 0;

    return coupons
      .map((coupon) => ({
        ...coupon,
        _estimatedDiscount: calculateCouponDiscount(coupon, basePrice),
      }))
      .sort((a, b) => b._estimatedDiscount - a._estimatedDiscount)[0] || null;
  }, [coupons, lastAnalysis]);

  useEffect(() => {
    const fetchSavedCards = async () => {
      if (!user) {
        setSavedCards([]);
        return;
      }

      try {
        const res = await api.get('/cards');
        setSavedCards(res.data || []);
      } catch {
        setSavedCards([]);
      }
    };

    fetchSavedCards();
  }, [user]);

  const sortedPaymentOptions = useMemo(() => {
    if (!lastAnalysis) return [];
    
    const couponAmount = lastAnalysis.product.couponAmount || 0;
    
    return lastAnalysis.paymentOptions.map(option => ({
      ...option,
      effectivePrice: Math.max(0, option.effectivePrice - couponAmount),
      totalSavings: option.totalSavings + couponAmount
    })).sort((a, b) => a.effectivePrice - b.effectivePrice);
  }, [lastAnalysis]);

  const bestPaymentOption = sortedPaymentOptions.length > 0 ? sortedPaymentOptions[0] : null;

  const [activePaymentIndex, setActivePaymentIndex] = useState(0)

  const clampedPaymentIndex =
    sortedPaymentOptions.length > 0
      ? activePaymentIndex % sortedPaymentOptions.length
      : 0

  useEffect(() => {
    if (sortedPaymentOptions.length <= 1) return
    const timer = setInterval(() => {
      setActivePaymentIndex((current) =>
        current === sortedPaymentOptions.length - 1 ? 0 : current + 1,
      )
    }, 3800)
    return () => clearInterval(timer)
  }, [sortedPaymentOptions.length])

  const handleAnalyze = async (url) => {
    setIsLoading(true);
    setError(null);
    setLastAnalysis(null);
    
    try {
      let formattedUrl = url;
      if (!formattedUrl.startsWith('http')) {
        formattedUrl = `https://${formattedUrl}`;
      }
      
      const { data } = await api.post('/scraper/product-offers', { url: formattedUrl });
      
      const price = data.product_price || 0;
      
      // Store coupons from backend
      setCoupons(data.coupons || []);
      setAppliedCoupon(null);
      
      // Transform scraped offers into card-eligible options.
      const paymentOptions = data.offers.flatMap((offer, index) => {
        let discount = 0;
        if (offer.discount_type === 'FLAT') {
          discount = offer.discount_value;
        } else if (offer.discount_type === 'PERCENTAGE' || offer.discount_type === 'CASHBACK') {
          discount = price * (offer.discount_value / 100);
        }
        
        if (offer.max_discount > 0 && discount > offer.max_discount) discount = offer.max_discount;
        if (offer.min_spend > 0 && price < offer.min_spend) discount = 0; // Ineligible

        const offerIssuer = extractIssuer(`${offer.bank_name} ${offer.raw_text}`);
        const isIssuerSpecificOffer = Boolean(offerIssuer);

        const eligibleCards = (savedCards || []).filter((card) => {
          const cardIssuer = extractIssuer(`${card.bank_name} ${card.card_name}`);
          const bankEligible = offerIssuer ? cardIssuer === offerIssuer : true;
          const typeEligible = isCardTypeEligible(card.card_type, offer.payment_type);
          return bankEligible && typeEligible;
        });

        const cardsToEvaluate = eligibleCards.length > 0
          ? eligibleCards
          : [{
              id: `offer-${index}`,
              card_name: `${offer.bank_name} ${String(offer.payment_type || 'card').replace('_', ' ')}`,
              bank_name: offer.bank_name,
              card_type: offer.payment_type || 'credit_card',
              cashback_rate: 0,
              max_cap: 0,
            }];

        return cardsToEvaluate.map((card, cardIdx) => {
          const hasSavedCardMatch = eligibleCards.length > 0;
          const offerDiscountApplied = isIssuerSpecificOffer && !hasSavedCardMatch ? 0 : discount;
          const postOfferAmount = Math.max(price - offerDiscountApplied, 0);

          const cardCashbackRate = Number(card.cashback_rate || 0);
          let cardCashbackValue = (postOfferAmount * cardCashbackRate) / 100;
          if (Number(card.max_cap || 0) > 0) {
            cardCashbackValue = Math.min(cardCashbackValue, Number(card.max_cap));
          }

          const cardSpendType = normalizePaymentType(card.card_type);
          const pointsPer100 = cardSpendType === 'credit' ? 5 : cardSpendType === 'debit' ? 1 : 0;
          const creditPointsEarned = hasSavedCardMatch ? Math.floor(postOfferAmount / 100) * pointsPer100 : 0;
          const rewardPointsValue = Number((creditPointsEarned * POINT_VALUE_INR).toFixed(2));

          const finalEffectivePrice = Math.max(
            0,
            price - offerDiscountApplied - cardCashbackValue - rewardPointsValue,
          );
          const finalTotalSavings = Number((price - finalEffectivePrice).toFixed(2));

          const cashbackPercent =
            price > 0 ? Number((((offerDiscountApplied + cardCashbackValue) / price) * 100).toFixed(2)) : 0;
          const rewardPercent =
            price > 0 ? Number(((rewardPointsValue / price) * 100).toFixed(2)) : 0;

          return {
            id: `opt-${index}-${card.id || cardIdx}`,
            name: card.card_name || offer.bank_name,
            effectivePrice: finalEffectivePrice,
            totalSavings: finalTotalSavings,
            type: card.card_type || offer.payment_type || 'Credit Card',
            cashbackPercent,
            rewardPercent,
            tags: [
              offer.discount_type,
              `Issuer: ${offer.bank_name}`,
              hasSavedCardMatch ? 'Eligible Card' : 'No Eligible Saved Card',
            ],
            details: {
              features: [
                offer.raw_text,
                `Offer Discount: ₹${Number(offerDiscountApplied).toFixed(2)}`,
                `Card Cashback: ₹${Number(cardCashbackValue).toFixed(2)}`,
                `Credit Points: ${creditPointsEarned}`,
                `Point Value: ₹${POINT_VALUE_INR}/point`,
              ],
            },
            cashbackValue: Number((offerDiscountApplied + cardCashbackValue).toFixed(2)),
            rewardPointsValue,
            creditPointsEarned,
            pointValueInr: POINT_VALUE_INR,
          };
        });
      });

      // Filter to only include options that actually gave a discount (if any)
      const validOptions = paymentOptions.filter(o => o.totalSavings > 0);
      const optionsToUse = validOptions.length > 0 ? validOptions : paymentOptions;
      
      // Sort and find best
      optionsToUse.sort((a, b) => a.effectivePrice - b.effectivePrice);
      const best = optionsToUse.length > 0 ? optionsToUse[0] : null;

      const analysis = {
        product: {
          id: Date.now(),
          name: data.product_name || "Scraped Product",
          platform: url.includes("amazon") ? "Amazon" : "Flipkart",
          originalPrice: price,
          displayPrice: price,
          couponCode: "None",
          couponAmount: 0,
        },
        paymentOptions: optionsToUse,
        bestPaymentOption: best,
        betterDeals: [],
        _rawPrice: price,
        _rawOffers: data.offers
      };

      if (best) {
        appendAnalysisToHistory({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          created_at: new Date().toISOString(),
          merchant_name: analysis.product.platform,
          product_name: analysis.product.name,
          cart_value: analysis.product.originalPrice,
          total_savings: best.totalSavings,
          credit_points: Number(best.creditPointsEarned || 0),
          effective_price: best.effectivePrice,
          selected_option: best.name,
          coupon_code: analysis.product.couponCode || 'None',
        });
      }
      
      setLastAnalysis(analysis);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to analyze product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1120px] space-y-6">
      <section className="machine-screen p-4 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(100,116,139,0.12),transparent_45%)]" />
        <div className="absolute inset-x-0 top-20 h-px bg-slate-500/35" />
        <div className="absolute inset-0 opacity-20 [background:repeating-linear-gradient(0deg,transparent,transparent_23px,rgba(100,116,139,0.08)_24px)]" />

        <div className="relative space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <TextType
                as="p"
                text="System Control"
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
                text="Live Scanner Terminal"
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
                text="Secure scan active"
                typingSpeed={28}
                pauseDuration={1400}
                loop={false}
                showCursor
                cursorCharacter="_"
                cursorBlinkDuration={0.5}
              />
            </p>
          </div>

          <UrlInput onAnalyze={handleAnalyze} isLoading={isLoading} />
          
          {error && (
            <div className="mt-4 p-4 rounded bg-red-900/40 border border-red-500/50 text-red-200 text-sm font-mono">
              [ERROR]: {error}
            </div>
          )}

          {!lastAnalysis && !error && !isLoading && (
            <section className="machine-panel rounded-2xl border border-dashed border-slate-500/30 p-8 text-center">
              <h3 className="font-display text-xl font-semibold uppercase tracking-wide text-slate-100">
                Insert URL and Run Analysis
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                StackSave will launch a headless browser, extract live base prices and bank offers natively.
              </p>
            </section>
          )}

          {isLoading && (
            <section className="machine-panel rounded-2xl border border-dashed border-slate-500/30 p-8 flex justify-center">
              <AnalysisLoader />
            </section>
          )}

          {lastAnalysis && (
            <>
              <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
                <ProductCard
                  product={lastAnalysis.product}
                  bestPaymentOption={bestPaymentOption}
                />

                <section className="machine-panel space-y-4 rounded-2xl p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Select Terminal Card
                  </h3>
                  {bestPaymentOption && (
                    <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400">
                      Points to INR: 1 point = ₹{bestPaymentOption.pointValueInr || POINT_VALUE_INR}
                    </p>
                  )}
                  {bestPaymentOption && (
                    <PaymentOptionCard option={bestPaymentOption} isRecommended />
                  )}
                  <button
                    type="button"
                    className="w-full rounded-lg bg-slate-600 py-3 text-sm font-bold uppercase tracking-[0.12em] text-slate-100 transition hover:bg-slate-500 shadow-[0_0_15px_rgba(100,116,139,0.3)]"
                  >
                    Apply and Pay
                  </button>
                </section>
              </div>

              <div className="grid gap-5 lg:grid-cols-[0.95fr_1.25fr]">
                <SavingsBreakdown
                  product={lastAnalysis.product}
                  bestPaymentOption={bestPaymentOption}
                />

                <section className="machine-panel overflow-hidden rounded-2xl p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Payment Modules
                    </h3>
                    <span className="text-xs text-slate-300 font-mono">
                      {sortedPaymentOptions.length > 0 ? clampedPaymentIndex + 1 : 0}/{sortedPaymentOptions.length || 0}
                    </span>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-slate-700/70 bg-black/35">
                    <div
                      className="flex transition-transform duration-500 ease-out"
                      style={{ transform: `translateX(-${clampedPaymentIndex * 100}%)` }}
                    >
                      {sortedPaymentOptions.map((option) => (
                        <div key={option.id} className="min-w-full p-1">
                          <PaymentOptionCard
                            option={option}
                            mode="compact"
                            isRecommended={option.id === bestPaymentOption?.id}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setActivePaymentIndex((current) =>
                          current === 0 ? sortedPaymentOptions.length - 1 : current - 1,
                        )
                      }
                      disabled={sortedPaymentOptions.length <= 1}
                      className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300 transition hover:border-slate-500/60 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Prev
                    </button>

                    <div className="flex gap-1.5">
                      {sortedPaymentOptions.map((option, index) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setActivePaymentIndex(index)}
                          aria-label={`Go to payment card ${index + 1}`}
                          className={`h-1.5 rounded-full transition-all ${
                            index === clampedPaymentIndex
                              ? "w-7 bg-slate-300"
                              : "w-2 bg-slate-600"
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setActivePaymentIndex((current) =>
                          current === sortedPaymentOptions.length - 1 ? 0 : current + 1,
                        )
                      }
                      disabled={sortedPaymentOptions.length <= 1}
                      className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300 transition hover:border-slate-500/60 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </section>
              </div>

              <div className="grid gap-2 border-t border-slate-800 pt-4 text-[10px] uppercase tracking-[0.17em] text-slate-500 sm:grid-cols-3 font-mono">
                <p>
                  Active wallet: {lastAnalysis.paymentOptions.length} methods
                </p>
                <p>
                  Security: End-to-end encrypted
                </p>
                <p className="text-slate-300">Status: Ready to stack</p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Coupons Section */}
      {lastAnalysis && coupons.length > 0 && (
        <section className="rounded-2xl border border-slate-700 bg-slate-950/80 p-5 shadow-2xl">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-display text-lg font-semibold uppercase tracking-[0.14em] text-slate-200">
                Available Coupons
              </h3>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-mono">
                Extracted from sequence scan
              </p>
            </div>
            <span className="rounded-full border border-slate-500/40 bg-slate-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
              {coupons.length} detected
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {coupons.map((coupon, idx) => {
              const isApplied = appliedCoupon?.code === coupon.code;
              const isBestCoupon = bestCoupon?.code === coupon.code;
              const estimatedDiscount = calculateCouponDiscount(
                coupon,
                lastAnalysis?._rawPrice || lastAnalysis?.product?.originalPrice || 0,
              );
              return (
                <div
                  key={idx}
                  className={`rounded-xl border p-4 transition-all cursor-pointer ${
                    isApplied
                      ? 'border-slate-300 bg-slate-500/10 shadow-[0_0_20px_rgba(148,163,184,0.15)]'
                      : isBestCoupon
                        ? 'border-emerald-400/60 bg-emerald-900/10 hover:border-emerald-300'
                        : 'border-slate-700 bg-slate-900 hover:border-slate-500'
                  }`}
                  onClick={() => {
                    if (isApplied) {
                      setAppliedCoupon(null);
                      setLastAnalysis(prev => ({
                        ...prev,
                        product: { ...prev.product, couponCode: 'None', couponAmount: 0 }
                      }));
                    } else {
                      setAppliedCoupon(coupon);
                      const basePrice = lastAnalysis._rawPrice || lastAnalysis.product.originalPrice;
                      const couponDiscount = calculateCouponDiscount(coupon, basePrice);
                      setLastAnalysis(prev => ({
                        ...prev,
                        product: {
                          ...prev.product,
                          couponCode: coupon.code,
                          couponAmount: couponDiscount
                        }
                      }));
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-bold text-slate-200 tracking-wider">
                      {coupon.code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isBestCoupon && (
                        <span className="rounded-full border border-emerald-400/60 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                          Best
                        </span>
                      )}
                      {isApplied ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-950">
                          Applied ✓
                        </span>
                      ) : (
                        <span className="rounded-full border border-slate-600 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                          Apply
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-3 leading-relaxed">{coupon.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      {coupon.discount_type === 'FLAT' ? `₹${coupon.discount_value} OFF` : `${coupon.discount_value}% OFF`}
                    </span>
                    {coupon.min_order_value > 0 && (
                      <span className="text-[9px] text-slate-500 font-mono">MIN ₹{coupon.min_order_value}</span>
                    )}
                  </div>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-emerald-300 font-mono">
                    Estimated Savings: ₹{estimatedDiscount.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>

          {bestCoupon && !appliedCoupon && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-900/10 p-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-emerald-300">Recommended Coupon</p>
                <p className="font-mono text-lg font-bold text-slate-200">{bestCoupon.code}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const basePrice = lastAnalysis._rawPrice || lastAnalysis.product.originalPrice;
                  const couponDiscount = calculateCouponDiscount(bestCoupon, basePrice);
                  setAppliedCoupon(bestCoupon);
                  setLastAnalysis(prev => ({
                    ...prev,
                    product: {
                      ...prev.product,
                      couponCode: bestCoupon.code,
                      couponAmount: couponDiscount,
                    },
                  }));
                }}
                className="rounded-lg border border-emerald-400/60 bg-emerald-500/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-200 hover:bg-emerald-500/25"
              >
                Apply Best
              </button>
            </div>
          )}

          {appliedCoupon && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-500/30 bg-slate-500/5 p-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400">Coupon Validated</p>
                <p className="font-mono text-lg font-bold text-slate-200">{appliedCoupon.code}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Node Savings</p>
                <p className="text-xl font-bold text-slate-200">₹{(lastAnalysis.product.couponAmount || 0).toLocaleString()}</p>
              </div>
            </div>
          )}
        </section>
      )}

      {lastAnalysis && coupons.length === 0 && (
        <section className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/80 p-5 text-center">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-mono">
            No external coupons detected in product sequence
          </p>
        </section>
      )}

      {lastAnalysis && <BetterDeals deals={lastAnalysis.betterDeals} />}
    </div>
  )
}

export default ProductScraper;
