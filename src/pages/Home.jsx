import { useEffect, useMemo, useState } from "react"
import BetterDeals from "../components/BetterDeals"
import PaymentOptionCard from "../components/PaymentOptionCard"
import ProductCard from "../components/ProductCard"
import SavingsBreakdown from "../components/SavingsBreakdown"
import TextType from "../components/TextType"
import UrlInput from "../components/UrlInput"
import RewardsSummary from "../components/RewardsSummary"

function Home({ lastAnalysis, onAnalyze, isLoading }) {
  const sortedPaymentOptions = useMemo(
    () =>
      lastAnalysis?.paymentOptions
        ?.slice()
        .sort((a, b) => a.effectivePrice - b.effectivePrice) ?? [],
    [lastAnalysis],
  )

  const [activePaymentIndex, setActivePaymentIndex] = useState(0)

  const clampedPaymentIndex =
    sortedPaymentOptions.length > 0
      ? activePaymentIndex % sortedPaymentOptions.length
      : 0

  useEffect(() => {
    if (sortedPaymentOptions.length <= 1) {
      return
    }

    const timer = setInterval(() => {
      setActivePaymentIndex((current) =>
        current === sortedPaymentOptions.length - 1 ? 0 : current + 1,
      )
    }, 3800)

    return () => clearInterval(timer)
  }, [sortedPaymentOptions.length])

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
                text="Transaction Node"
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

          <UrlInput onAnalyze={onAnalyze} isLoading={isLoading} />

          {!lastAnalysis && (
            <section className="machine-panel rounded-2xl border border-dashed border-slate-500/30 p-8 text-center">
              <h3 className="font-display text-xl font-semibold uppercase tracking-wide text-slate-100">
                Insert URL and Run Analysis
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                StackSave will load product, compare cards and UPI methods, and show your best checkout stack.
              </p>
            </section>
          )}

          {lastAnalysis && (
            <>
              <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
                <ProductCard
                  product={lastAnalysis.product}
                  bestPaymentOption={lastAnalysis.bestPaymentOption}
                />

                <section className="machine-panel space-y-4 rounded-2xl p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Select Terminal Card
                  </h3>
                  <PaymentOptionCard option={lastAnalysis.bestPaymentOption} isRecommended />
                  <button
                    type="button"
                    className="w-full rounded-lg bg-slate-600 py-3 text-sm font-bold uppercase tracking-[0.12em] text-slate-100 transition hover:bg-slate-500"
                  >
                    Apply and Pay
                  </button>
                </section>
              </div>

              <div className="grid gap-5 lg:grid-cols-[0.95fr_1.25fr]">
                <SavingsBreakdown
                  product={lastAnalysis.product}
                  bestPaymentOption={lastAnalysis.bestPaymentOption}
                />

                <section className="machine-panel overflow-hidden rounded-2xl p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Payment Modules
                    </h3>
                    <span className="text-xs text-slate-300">
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
                            isRecommended={option.id === lastAnalysis.bestPaymentOption.id}
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

              <div className="grid gap-2 border-t border-slate-800 pt-4 text-xs uppercase tracking-[0.17em] text-slate-500 sm:grid-cols-3">
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

      {lastAnalysis && <BetterDeals deals={lastAnalysis.betterDeals} />}

      <RewardsSummary />
    </div>
  )
}

export default Home
