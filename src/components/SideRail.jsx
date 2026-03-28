const railActions = [
  { tab: "Terminal", label: "T" },
  { tab: "Cards", label: "C" },
  { tab: "Vault", label: "V" },
  { tab: "Rewards", label: "R" },
  { tab: "History", label: "H" },
]

function SideRail({ activeTab, onTabChange }) {
  return (
    <aside className="hidden w-16 flex-col items-center justify-between rounded-2xl border border-emerald-500/25 bg-slate-950/95 p-3 shadow-xl shadow-black/50 md:flex">
      <div className="space-y-3">
        {railActions.map((action) => {
          const isActive = activeTab === action.tab

          return (
            <button
              key={action.tab}
              type="button"
              title={action.tab}
              onClick={() => onTabChange(action.tab)}
              className={`grid h-10 w-10 place-items-center rounded-lg border text-xs font-semibold transition ${
                isActive
                  ? "border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-lg shadow-emerald-500/20"
                  : "border-slate-700 bg-slate-900 text-slate-400 hover:border-emerald-700"
              }`}
            >
              {action.label}
            </button>
          )
        })}
      </div>

      <div className="space-y-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg border border-slate-700 bg-slate-900 text-slate-500">
          *
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-lg border border-slate-700 bg-slate-900 text-rose-500">
          O
        </div>
      </div>
    </aside>
  )
}

export default SideRail
