import { useMemo } from "react"
import TextType from "./TextType"

function ProductCard({ product, bestPaymentOption }) {
  const productId = typeof product?.id === 'number' ? product.id : (product?.name || '').length
  const productName = product?.name || 'Unknown Product'
  const originalPrice = product?.originalPrice || product?.displayPrice || 0
  const platform = product?.platform || 'Unknown'

  const deadPixels = useMemo(() => {
    const seed = productId
    const pixels = []
    
    for (let i = 0; i < 8; i++) {
      const hash = Math.sin(seed + i * 12.9898) * 43758.5453
      const randomX = (hash - Math.floor(hash)) * 100
      
      const hash2 = Math.sin(seed + i * 78.233) * 43758.5453
      const randomY = (hash2 - Math.floor(hash2)) * 100
      
      const hash3 = Math.sin(seed + i * 45.1645) * 43758.5453
      const isBright = (hash3 - Math.floor(hash3)) > 0.6
      
      pixels.push({
        id: i,
        x: randomX,
        y: randomY,
        bright: isBright,
      })
    }
    return pixels
  }, [productId])

  return (
    <section className="screen-section relative overflow-hidden p-4 sm:p-5">
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-3 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="machine-status-light">
              <span className="status-light-dot active" />
              Display
            </span>
          </div>
          <h2 className="screen-title text-xl">
            <TextType
              as="span"
              text={productName}
              typingSpeed={34}
              pauseDuration={1400}
              loop={false}
              showCursor
              cursorCharacter="_"
              cursorBlinkDuration={0.5}
              className="screen-blink"
            />
          </h2>
          <p className="screen-label text-[11px] mt-1">
            <TextType
              as="span"
              text={`Source: ${platform}`}
              typingSpeed={22}
              initialDelay={130}
              pauseDuration={1200}
              loop={false}
              showCursor
              cursorCharacter="_"
              cursorBlinkDuration={0.45}
            />
          </p>
        </div>
        <span className="screen-value accent text-xs font-semibold px-3 py-1 border border-yellow-600/20 rounded-full bg-yellow-600/5">
          {platform}
        </span>
      </div>

      <div className="screen-line relative z-10" />

      <div className="relative z-10 mt-4 grid gap-3 sm:grid-cols-[180px_1fr]">
        <div className="damaged-screen relative overflow-hidden p-3">
          <div className="dead-pixels">
            {deadPixels.map((pixel) => (
              <div
                key={pixel.id}
                className={`dead-pixel ${pixel.bright ? "bright" : ""}`}
                style={{
                  left: `${pixel.x}%`,
                  top: `${pixel.y}%`,
                }}
              />
            ))}
          </div>
          <div className="screen-crack" />
          <div className="screen-degradation" />
          
          <div className="relative mt-4 h-24 rounded-sm border border-slate-600/40 bg-gradient-to-b from-slate-700 to-slate-900 shadow-inner">
            <div className="absolute inset-0 opacity-30 [background:repeating-linear-gradient(0deg,rgba(0,0,0,0.3),rgba(0,0,0,0.3)_1px,transparent_1px,transparent_2px)]" />
            <div className="absolute inset-0 flex items-center justify-center text-[10px] screen-label">
              [Display]
            </div>
          </div>

          <p className="relative mt-3 screen-label text-[10px]">
            Linked Product
          </p>
        </div>

        <div className="space-y-3">
          <div className="screen-box-item">
            <p className="screen-label text-xs mb-2">Original Price</p>
            <p className="screen-value text-lg font-semibold">
              Rs {originalPrice.toLocaleString()}
            </p>
          </div>

          {bestPaymentOption && (
            <div className="screen-box-item accent">
              <p className="screen-label text-xs mb-2">Effective Price</p>
              <p className="screen-value accent text-3xl font-semibold">
                Rs {(bestPaymentOption.effectivePrice || 0).toLocaleString()}
              </p>
              <p className="screen-value accent text-xs mt-2 opacity-75">
                Total saved: Rs {(bestPaymentOption.totalSavings || 0).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dead pixels for the full screen section */}
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
        background: `
          radial-gradient(circle at ${15 + Math.sin(productName.length) * 5}% ${25 + Math.cos(productName.length) * 5}%, 
            rgba(255, 100, 100, 0.1), transparent 15%),
          radial-gradient(circle at ${70 + Math.sin(productId) * 10}% ${75 + Math.cos(productId) * 10}%, 
            rgba(100, 150, 255, 0.08), transparent 15%)
        `
      }} />
    </section>
  )
}

export default ProductCard
