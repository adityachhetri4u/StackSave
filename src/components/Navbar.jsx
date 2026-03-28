const tabs = ["Terminal", "Cards", "Vault", "Rewards", "History"]

function Navbar({ activeTab, onTabChange }) {
  return (
    <header className="sticky top-0 z-40 border-b border-emerald-400/20 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1300px] items-center justify-between px-3 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_#00ff80]" />
          <h1 className="font-display text-xl font-bold tracking-[0.12em] text-emerald-400 sm:text-2xl">
            StackSave
          </h1>
          <p className="hidden text-[11px] uppercase tracking-[0.2em] text-slate-500 sm:block">
            Checkout Console
          </p>
        </div>

        <nav className="flex gap-1 rounded-full border border-slate-800 bg-slate-900/80 p-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab

            return (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange(tab)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition sm:px-4 sm:py-2 ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.35)]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab}
              </button>
            )
          })}
        </nav>

        <div className="hidden items-center gap-3 text-xs text-slate-400 sm:flex">
          <span className="rounded-full border border-slate-700 px-2 py-1">AI Scan</span>
          <span className="rounded-full border border-slate-700 px-2 py-1">Secure Mode</span>
        </div>
      </div>
    </header>
  )
}

export default Navbar
