import { useMemo, useState } from "react"

const benefitOptions = ["Cashback", "Rewards", "Discounts"]

function Profile({ userProfile, onUpdateProfile }) {
  const [newCard, setNewCard] = useState("")
  const [newUpi, setNewUpi] = useState("")

  const cardsCount = useMemo(() => userProfile.cards.length, [userProfile.cards.length])

  const addItem = (type, value) => {
    const trimmed = value.trim()
    if (!trimmed) {
      return
    }

    const existingItems = userProfile[type]
    if (existingItems.includes(trimmed)) {
      return
    }

    onUpdateProfile({
      ...userProfile,
      [type]: [...existingItems, trimmed],
    })
  }

  const removeItem = (type, value) => {
    onUpdateProfile({
      ...userProfile,
      [type]: userProfile[type].filter((item) => item !== value),
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
      <section className="rounded-2xl border border-emerald-500/25 bg-slate-950/80 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold uppercase tracking-[0.14em] text-slate-100">
            Asset Inventory
          </h2>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
            {cardsCount} saved
          </span>
        </div>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={newCard}
            onChange={(event) => setNewCard(event.target.value)}
            placeholder="Add terminal card"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 outline-none ring-emerald-500/50 transition placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2"
          />
          <button
            type="button"
            onClick={() => {
              addItem("cards", newCard)
              setNewCard("")
            }}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-slate-950 hover:bg-emerald-400"
          >
            Add
          </button>
        </div>

        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {userProfile.cards.map((card) => (
            <li
              key={card}
              className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-950 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs uppercase tracking-[0.15em] text-slate-500">Credit // HDFC</span>
                <span className="h-4 w-6 rounded bg-gradient-to-b from-amber-200/70 to-amber-600/40" />
              </div>
              <p className="mt-4 font-medium text-slate-100">{card}</p>
              <button
                type="button"
                onClick={() => removeItem("cards", card)}
                className="mt-4 rounded-md border border-rose-500/35 bg-rose-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-rose-300"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-700 bg-slate-950/80 p-5">
        <h2 className="font-display text-xl font-semibold uppercase tracking-[0.14em] text-slate-100">Wallet Node</h2>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={newUpi}
            onChange={(event) => setNewUpi(event.target.value)}
            placeholder="Add UPI app"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 outline-none ring-emerald-500/50 transition placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2"
          />
          <button
            type="button"
            onClick={() => {
              addItem("upiApps", newUpi)
              setNewUpi("")
            }}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-slate-950 hover:bg-emerald-400"
          >
            Add
          </button>
        </div>

        <ul className="mt-4 space-y-2">
          {userProfile.upiApps.map((app) => (
            <li
              key={app}
              className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            >
              <span className="text-slate-200">{app}</span>
              <button
                type="button"
                onClick={() => removeItem("upiApps", app)}
                className="text-xs font-medium text-rose-300 hover:text-rose-200"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-6 border-t border-slate-800 pt-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.13em] text-slate-400">Preferred Benefit Type</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {benefitOptions.map((option) => {
              const isActive = option === userProfile.preferredBenefitType

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    onUpdateProfile({
                      ...userProfile,
                      preferredBenefitType: option,
                    })
                  }
                  className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] transition ${
                    isActive
                      ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                      : "border-slate-700 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  {option}
                </button>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Profile
