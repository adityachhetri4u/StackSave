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
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          className="block text-xs font-semibold uppercase tracking-[0.25em] text-slate-300"
          htmlFor="url-input"
        >
          Insert Tape to Stack
        </label>
        <span className="machine-status-light">
          <span className={`status-light-dot ${isLoading ? "active" : "idle"}`} />
          {isLoading ? "Processing" : "Ready"}
        </span>
      </div>

      <div className="tape-inserter">
        <div className={`tape-input-wrapper ${isInserting ? "loading" : ""}`}>
          <div className="tape-slot">
            <input
              id="url-input"
              type="url"
              value={url}
              placeholder="https://www.flipkart.com/product/..."
              onChange={(event) => setUrl(event.target.value)}
              className="tape-input w-full"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="tape-button whitespace-nowrap"
            >
              {isLoading ? "Loading" : "Insert"}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

export default UrlInput
