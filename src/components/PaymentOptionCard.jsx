function PaymentOptionCard({ option, isRecommended = false, mode = "full" }) {
  const isCompact = mode === "compact"

  return (
    <article
      className={`rounded-2xl border p-4 transition ${
        isRecommended
          ? "border-emerald-400/45 bg-emerald-500/10 shadow-[0_0_24px_rgba(16,185,129,0.18)]"
          : "border-slate-700 bg-slate-900/80"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-100">{option.name}</p>
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{option.type}</p>
        </div>
        {isRecommended && (
          <span className="rounded-full border border-emerald-300/50 bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
            Recommended
          </span>
        )}
      </div>

      <div className="mt-3 rounded-xl border border-slate-700 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-3">
        <div className="credit-skin px-5 pb-6 pt-5">
          <span className="credit-line top" />
          <span className="credit-line bottom" />
          <span className="credit-skin-track" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="h-8 w-11 rounded-md bg-gradient-to-b from-[#f5d28b] via-[#caa157] to-[#84622d] shadow-[0_2px_8px_rgba(0,0,0,0.5)]" />
            <p className="text-xs uppercase tracking-[0.24em] text-[#d8b873]">{option.type} Node</p>
          </div>

          <div className="relative z-10 mt-10">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">StackSave Financial</p>
            <p className="mt-3 text-[13px] tracking-[0.25em] text-slate-400">
              **** **** **** {option.id.slice(-1)}{option.id.slice(-1)}{option.id.slice(-1)}{option.id.slice(-1)}
            </p>
          </div>

          <div className="relative z-10 mt-4 flex items-end justify-between">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Member Node</p>
            <p className="text-xs uppercase tracking-[0.18em] text-[#d8b873]">{option.type}</p>
          </div>
        </div>
      </div>

      <div className={`mt-3 grid gap-2 text-xs ${isCompact ? "grid-cols-2" : "grid-cols-2"}`}>
        <p className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-300">
          Cashback {option.cashbackPercent}%
        </p>
        <p className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-300">
          Rewards {option.rewardPercent}%
        </p>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Final Price</p>
          <p className="text-lg font-semibold text-emerald-300">Rs {option.effectivePrice.toLocaleString()}</p>
        </div>
        <p className="text-sm font-semibold text-emerald-400">Save Rs {option.totalSavings.toLocaleString()}</p>
      </div>

      {!isCompact && (
        <div className="mt-3 flex flex-wrap gap-2">
          {option.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-emerald-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}

export default PaymentOptionCard
