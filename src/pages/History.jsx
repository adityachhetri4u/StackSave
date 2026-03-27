import TextType from "../components/TextType"

function History({ history }) {
  return (
    <section className="screen-section history-screen relative overflow-hidden p-5 sm:p-6">
      <div className="relative z-10 flex items-center justify-between">
        <h2 className="screen-title text-xl">
          <TextType
            as="span"
            text="History Console"
            typingSpeed={34}
            pauseDuration={1500}
            loop={false}
            showCursor
            cursorCharacter="_"
            cursorBlinkDuration={0.55}
            className="screen-blink"
          />
        </h2>
        <span className="screen-label text-xs">{history.length} logs</span>
      </div>

      <div className="screen-line relative z-10 my-3" />

      {history.length === 0 && (
        <div className="relative z-10 min-h-[56vh] rounded-xl border border-dashed border-slate-600/45 p-8 text-center text-sm screen-label flex items-center justify-center">
          <span className="screen-blink">No history signal found. Run a terminal analysis first.</span>
        </div>
      )}

      {history.length > 0 && (
        <div className="relative z-10 min-h-[56vh] screen-box mt-2">
          <div className="screen-box-header">
            <span className="screen-label text-[10px]">ARCHIVE STREAM</span>
            <span className="screen-value text-[11px] screen-blink">
              <TextType
                as="span"
                text="LIVE READ"
                typingSpeed={26}
                pauseDuration={1300}
                loop={false}
                showCursor
                cursorCharacter="_"
                cursorBlinkDuration={0.5}
              />
            </span>
          </div>

          <ul className="terminal-feed space-y-2">
            {history.map((entry, index) => (
              <li
                key={entry.id}
                className="screen-box-item terminal-entry"
                style={{ animationDelay: `${Math.min(index * 65, 800)}ms` }}
              >
                <p className="screen-label text-[10px]">
                  LOG {String(history.length - index).padStart(3, "0")} // {entry.platform.toUpperCase()}
                </p>
                <p className="screen-value text-sm mt-1">{entry.product}</p>
                <p className="screen-label text-[11px] mt-1">
                  Savings achieved: <span className="screen-value">Rs {entry.savings.toLocaleString()}</span>
                </p>
                <p className="screen-label text-[11px] mt-1">
                  Selected method: <span className="screen-value">{entry.paymentMethod}</span>
                </p>
              </li>
            ))}
          </ul>

          <p className="screen-label text-[10px] mt-4 terminal-cursor">Awaiting next entry</p>
        </div>
      )}
    </section>
  )
}

export default History
