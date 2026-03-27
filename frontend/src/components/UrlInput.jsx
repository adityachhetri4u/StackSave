import { useState } from "react"

function UrlInput({ onAnalyze, isLoading }) {
  const [url, setUrl] = useState("")
  const [isInserting, setIsInserting] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!url.trim() || isLoading) {
      return
    }

    setIsInserting(true)
    setTimeout(() => {
      onAnalyze(url.trim())
      setIsInserting(false)
    }, 400)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <label
          className="block text-xs font-semibold uppercase tracking-[0.25em] text-slate-300"
          htmlFor="url-input"
        >
          Insert Tape to Scan
        </label>
        <span className="machine-status-light">
          <span className={`status-light-dot ${isLoading ? "active" : "idle"}`} />
          <span className="text-[10px] uppercase tracking-wider">{isLoading ? "Processing" : "Ready"}</span>
        </span>
      </div>

      <div className="tape-inserter p-2 sm:p-3">
        <div className={`tape-input-wrapper ${isInserting || isLoading ? "loading" : ""}`}>
          <div className="tape-slot flex flex-col sm:flex-row gap-3">
            <input
              id="url-input"
              type="text"
              value={url}
              placeholder="https://www.flipkart.com/product/..."
              onChange={(event) => setUrl(event.target.value)}
              className="tape-input w-full"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="tape-button whitespace-nowrap min-w-[100px]"
            >
              {isLoading ? "Loading" : "Analyze"}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

export default UrlInput
