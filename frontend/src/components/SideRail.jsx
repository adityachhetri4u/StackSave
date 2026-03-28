import { Link } from 'react-router-dom';
import { LogOut, Home } from 'lucide-react';

const railActions = [
  { name: "Terminal", path: "/product-scraper", label: "T" },
  { name: "Vault", path: "/cards", label: "V" },
  { name: "History", path: "/history", label: "H" },
]

function SideRail({ activeTab, onSignOut }) {
  return (
    <aside className="hidden w-16 flex-col items-center justify-between rounded-2xl border border-emerald-500/25 bg-slate-950/95 p-3 shadow-xl shadow-black/50 md:flex">
      <div className="space-y-3">
        <Link 
          to="/dashboard"
          title="Dashboard"
          className="grid h-10 w-10 place-items-center rounded-lg border border-slate-700 bg-slate-900 text-slate-400 hover:border-emerald-700 mb-4"
        >
          <Home className="w-5 h-5 text-emerald-400" />
        </Link>
        <div className="w-8 h-px bg-slate-800 mx-auto my-2" />
        
        {railActions.map((action) => {
          const isActive = activeTab === action.name

          return (
            <Link
              key={action.name}
              to={action.path}
              title={action.name}
              className={`grid h-10 w-10 place-items-center rounded-lg border text-xs font-semibold transition ${
                isActive
                  ? "border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-lg shadow-emerald-500/20"
                  : "border-slate-700 bg-slate-900 text-slate-400 hover:border-emerald-700"
              }`}
            >
              {action.label}
            </Link>
          )
        })}
      </div>

      <div className="space-y-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg border border-slate-700 bg-slate-900 text-slate-500 text-xs">
          AI
        </div>
        <button 
          title="Sign Out"
          onClick={onSignOut}
          className="grid h-9 w-9 place-items-center rounded-lg border border-rose-900/50 bg-slate-900 text-rose-500 hover:bg-rose-950/30 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  )
}

export default SideRail
