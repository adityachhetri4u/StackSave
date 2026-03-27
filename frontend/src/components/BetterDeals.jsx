function BetterDeals({ deals }) {
  if (!deals || deals.length === 0) {
    return null
  }

  const bestDeal = deals.slice().sort((a, b) => a.price - b.price)[0]

  return (
    <section className="rounded-2xl border border-emerald-500/25 bg-slate-950/80 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold uppercase tracking-[0.14em] text-amber-300">
            Better Deal Detected
          </h3>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Premium scan simulation
          </p>
        </div>
        <span className="rounded-full border border-emerald-500/45 bg-emerald-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
          Live Radar
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-3">
          {deals.map((deal) => (
            <article
              key={deal.id}
              className={`rounded-xl border p-4 ${
                deal.id === bestDeal.id
                  ? "border-emerald-400/45 bg-emerald-500/10"
                  : "border-slate-700 bg-slate-900"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-100">{deal.platform}</p>
                {deal.id === bestDeal.id && (
                  <span className="rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-950">
                    Best Value
                  </span>
                )}
              </div>
              <p className="mt-1 text-2xl font-semibold text-emerald-300">Rs {deal.price.toLocaleString()}</p>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                Stack gain: Rs {deal.savingsPotential.toLocaleString()}
              </p>
            </article>
          ))}
        </div>

        <aside className="rounded-xl border border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 p-4">
          <div className="radar-grid h-44 rounded-lg border border-emerald-500/25" />
          <p className="mt-4 text-center text-xs uppercase tracking-[0.17em] text-slate-500">Total stack gain</p>
          <p className="text-center text-4xl font-semibold text-emerald-300">Rs {bestDeal.savingsPotential.toLocaleString()}</p>
          <button
            type="button"
            className="mt-4 w-full rounded-lg bg-emerald-500 py-3 text-sm font-bold uppercase tracking-[0.12em] text-slate-950 transition hover:bg-emerald-400"
          >
            Switch to {bestDeal.platform}
          </button>
        </aside>
      </div>
    </section>
  )
}

export default BetterDeals
