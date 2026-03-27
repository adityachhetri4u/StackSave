import { useMemo, useState } from "react"
import TextType from "../components/TextType"

const benefitOptions = ["Cashback", "Rewards", "Discounts"]

function Profile({ userProfile, onUpdateProfile }) {
  const [newCard, setNewCard] = useState("")
  const [newUpi, setNewUpi] = useState("")
  const [flippedCards, setFlippedCards] = useState({})

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

  const toggleCardFlip = (card) => {
    setFlippedCards((previous) => ({
      ...previous,
      [card]: !previous[card],
    }))
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
      <section className="screen-section relative overflow-hidden p-5">
        <div className="relative z-10 flex items-center justify-between gap-3">
          <h2 className="screen-title text-xl">
            <TextType
              as="span"
              text="Asset Inventory"
              typingSpeed={34}
              pauseDuration={1400}
              loop={false}
              showCursor
              cursorCharacter="_"
              cursorBlinkDuration={0.5}
            />
          </h2>
          <span className="screen-value text-xs font-semibold px-3 py-1 rounded-full border border-slate-600/40 bg-slate-700/10">
            {cardsCount} saved
          </span>
        </div>

        <div className="screen-line relative z-10 my-3" />

        <div className="relative z-10 flex gap-2">
          <input
            type="text"
            value={newCard}
            onChange={(event) => setNewCard(event.target.value)}
            placeholder="Add terminal card"
            className="tape-input w-full"
          />
          <button
            type="button"
            onClick={() => {
              addItem("cards", newCard)
              setNewCard("")
            }}
            className="machine-button px-4"
          >
            Add
          </button>
        </div>

        <div className="relative z-10 screen-box mt-4">
          <div className="screen-box-content vault-cards-grid">
            {userProfile.cards.map((card, index) => {
              const compactId = card.replace(/[^a-zA-Z0-9]/g, "").slice(-4).padStart(4, "0")
              const isFlipped = Boolean(flippedCards[card])
              const pseudoLast4 = String((card.length * 271 + index * 97) % 10000).padStart(4, "0")
              const expMonth = String(((index * 3 + 7) % 12) + 1).padStart(2, "0")
              const expYear = String(27 + (index % 5)).padStart(2, "0")

              return (
                <div
                  key={card}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleCardFlip(card)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      toggleCardFlip(card)
                    }
                  }}
                  className="vault-card-frame"
                >
                  <div className={`vault-card-inner ${isFlipped ? "is-flipped" : ""}`}>
                    <article className="vault-card-face vault-card-front rounded-xl border border-slate-700 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-3 transition">
                      <div className="credit-skin h-full px-4 pb-4 pt-4">
                        <span className="credit-line top" />
                        <span className="credit-line bottom" />
                        <span className="credit-skin-track" />

                        <div className="relative z-10 flex items-center justify-between">
                          <span className="screen-label text-[10px]">Credit // Vault</span>
                          <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300/80" />
                            <span className="h-4 w-6 rounded bg-gradient-to-b from-slate-200/60 to-slate-500/35" />
                          </div>
                        </div>

                        <p className="relative z-10 mt-6 screen-value text-sm font-semibold">{card}</p>
                        <p className="relative z-10 mt-2 screen-label text-[11px] tracking-[0.2em]">
                          **** **** **** {pseudoLast4}
                        </p>

                        <div className="relative z-10 mt-3 flex items-end justify-between">
                          <div>
                            <p className="screen-label text-[9px]">Valid Thru</p>
                            <p className="screen-value text-xs font-semibold">{expMonth}/{expYear}</p>
                          </div>
                          <p className="screen-label text-[9px]">Slot {String(index + 1).padStart(2, "0")}</p>
                        </div>

                        <div className="relative z-10 mt-3 flex items-center justify-between">
                          <span className="screen-label text-[10px]">Tap to flip</span>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              removeItem("cards", card)
                            }}
                            className="rounded-md border border-slate-500/35 bg-slate-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-300"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </article>

                    <article className="vault-card-face vault-card-back rounded-xl border border-slate-700 p-4">
                      <div className="vault-back-strip" />
                      <p className="screen-label text-[10px]">Card Back Interface</p>
                      <p className="screen-value mt-3 text-sm font-semibold">Vault ID: {compactId}</p>
                      <p className="screen-label mt-2 text-[10px]">Slot: {String(index + 1).padStart(2, "0")}</p>
                      <p className="screen-label mt-1 text-[10px]">Security: Offline Encrypted</p>
                      <p className="screen-label mt-4 text-[10px] screen-blink">Tap card to return front face</p>
                    </article>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="screen-line my-3" />

          <div className="vault-utility-grid">
            <div className="screen-box-item">
              <p className="screen-label text-[10px]">Encryption</p>
              <p className="screen-value text-xs font-semibold mt-1">AES-256 Active</p>
            </div>
            <div className="screen-box-item">
              <p className="screen-label text-[10px]">Sync Pulse</p>
              <p className="screen-value text-xs font-semibold mt-1 screen-blink">Live every 3.8s</p>
            </div>
            <div className="screen-box-item">
              <p className="screen-label text-[10px]">Storage</p>
              <div className="mt-2 h-1.5 rounded-full bg-slate-700/70 overflow-hidden">
                <div className="h-full w-[68%] rounded-full bg-slate-300/85" />
              </div>
              <p className="screen-label text-[9px] mt-1">68% occupied</p>
            </div>
          </div>
        </div>
      </section>

      <section className="screen-section relative overflow-hidden p-5">
        <div className="relative z-10 flex items-center justify-between gap-2">
          <h2 className="screen-title text-xl">
            <TextType
              as="span"
              text="Wallet Node"
              typingSpeed={32}
              pauseDuration={1400}
              loop={false}
              showCursor
              cursorCharacter="_"
              cursorBlinkDuration={0.5}
            />
          </h2>
          <span className="screen-label text-[10px]">UPI Registry</span>
        </div>

        <div className="screen-line relative z-10 my-3" />

        <div className="relative z-10 flex gap-2">
          <input
            type="text"
            value={newUpi}
            onChange={(event) => setNewUpi(event.target.value)}
            placeholder="Add UPI app"
            className="tape-input w-full"
          />
          <button
            type="button"
            onClick={() => {
              addItem("upiApps", newUpi)
              setNewUpi("")
            }}
            className="machine-button px-4"
          >
            Add
          </button>
        </div>

        <div className="relative z-10 screen-box mt-4">
          <div className="screen-box-content space-y-2">
            {userProfile.upiApps.map((app) => (
              <div
                key={app}
                className="screen-box-item flex items-center justify-between text-sm"
              >
                <span className="screen-value">{app}</span>
                <button
                  type="button"
                  onClick={() => removeItem("upiApps", app)}
                  className="text-xs font-medium text-slate-300 hover:text-slate-100"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-5">
          <h3 className="screen-label text-xs">Preferred Benefit Type</h3>
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
                      ? "border-slate-500 bg-slate-500/20 text-slate-200"
                      : "border-slate-700 text-slate-400 hover:border-slate-500"
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
