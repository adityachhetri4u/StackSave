function History({ history }) {
  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-950/80 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold uppercase tracking-[0.14em] text-slate-100">
          Savings History
        </h2>
        <span className="text-xs uppercase tracking-[0.12em] text-slate-500">{history.length} entries</span>
      </div>

      {history.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">
          No analysis history yet. Run a terminal analysis first.
        </div>
      )}

      {history.length > 0 && (
        <ul className="space-y-3">
          {history.map((entry) => (
            <li
              key={entry.id}
              className="rounded-xl border border-slate-700 bg-slate-900 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-slate-100">{entry.product}</p>
                <span className="text-xs uppercase tracking-[0.13em] text-slate-500">{entry.platform}</span>
              </div>

              <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                <p className="text-emerald-400">
                  Savings achieved: Rs {entry.savings.toLocaleString()}
                </p>
                <p className="text-slate-400">
                  Selected method: {entry.paymentMethod}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default History
