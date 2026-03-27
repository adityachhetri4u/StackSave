import { useEffect, useMemo, useState } from "react"
import api from '../lib/api';
import BetterDeals from "../components/BetterDeals"
import PaymentOptionCard from "../components/PaymentOptionCard"
import ProductCard from "../components/ProductCard"
import SavingsBreakdown from "../components/SavingsBreakdown"
import TextType from "../components/TextType"
import UrlInput from "../components/UrlInput"

function ProductScraper() {
  const [lastAnalysis, setLastAnalysis] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [coupons, setCoupons] = useState([])
  const [appliedCoupon, setAppliedCoupon] = useState(null)

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
      
      // Transform our backend ScrapedOffer array into the paymentOptions array expected by the UI.
      const paymentOptions = data.offers.map((offer, index) => {
        let discount = 0;
        if (offer.discount_type === 'FLAT') {
          discount = offer.discount_value;
        } else if (offer.discount_type === 'PERCENTAGE' || offer.discount_type === 'CASHBACK') {
          discount = price * (offer.discount_value / 100);
        }
        
        if (offer.max_discount > 0 && discount > offer.max_discount) discount = offer.max_discount;
        if (offer.min_spend > 0 && price < offer.min_spend) discount = 0; // Ineligible

        return {
          id: `opt-${index}`,
          name: offer.bank_name,
          effectivePrice: price - discount,
          totalSavings: discount,
          type: offer.payment_type || 'Credit Card',
          cashbackPercent: offer.discount_type !== 'FLAT' ? offer.discount_value : 0,
          rewardPercent: 0,
          tags: [offer.discount_type, offer.bank_name],
          details: { features: [offer.raw_text, `Discount: ${offer.discount_type}`, `Min Spend: ₹${offer.min_spend}`] },
          cashbackValue: discount,
          rewardPointsValue: 0
        }
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

          {!lastAnalysis && !error && (
            <section className="machine-panel rounded-2xl border border-dashed border-slate-500/30 p-8 text-center">
              <h3 className="font-display text-xl font-semibold uppercase tracking-wide text-slate-100">
                Insert URL and Run Analysis
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                StackSave will launch a headless browser, extract live base prices and bank offers natively.
              </p>
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
              return (
                <div
                  key={idx}
                  className={`rounded-xl border p-4 transition-all cursor-pointer ${
                    isApplied
                      ? 'border-slate-300 bg-slate-500/10 shadow-[0_0_20px_rgba(148,163,184,0.15)]'
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
                      let couponDiscount = 0;
                      const basePrice = lastAnalysis._rawPrice || lastAnalysis.product.originalPrice;
                      if (coupon.discount_type === 'FLAT') {
                        couponDiscount = coupon.discount_value;
                      } else {
                        couponDiscount = basePrice * (coupon.discount_value / 100);
                      }
                      if (coupon.max_discount > 0 && couponDiscount > coupon.max_discount) {
                        couponDiscount = coupon.max_discount;
                      }
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
                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-3 leading-relaxed">{coupon.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      {coupon.discount_type === 'FLAT' ? `₹${coupon.discount_value} OFF` : `${coupon.discount_value}% OFF`}
                    </span>
                    {coupon.min_order_value > 0 && (
                      <span className="text-[9px] text-slate-500 font-mono">MIN ₹{coupon.min_order_value}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

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
