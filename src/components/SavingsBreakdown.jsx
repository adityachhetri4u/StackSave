import TextType from "./TextType"

function SavingsBreakdown({ product, bestPaymentOption }) {
  return (
    <section className="screen-section relative overflow-hidden p-5">
      <div className="relative z-10 flex items-center justify-between mb-4">
        <h3 className="screen-title text-lg">
          <TextType
            as="span"
            text="Stacking Breakdown"
            typingSpeed={32}
            pauseDuration={1400}
            loop={false}
            showCursor
            cursorCharacter="_"
            cursorBlinkDuration={0.5}
          />
        </h3>
        <span className="machine-status-light">
          <span className="status-light-dot active" />
          Computing
        </span>
      </div>

      <div className="screen-line relative z-10 my-3" />

      <div className="relative z-10 screen-box mt-4">
        <div className="screen-box-content space-y-3">
          <div className="screen-box-item">
            <div className="flex items-center justify-between">
              <dt className="screen-label text-xs">Coupon ({product.couponCode})</dt>
              <dd className="screen-value accent font-semibold">- Rs {product.couponAmount}</dd>
            </div>
          </div>

          <div className="screen-box-item">
            <div className="flex items-center justify-between">
              <dt className="screen-label text-xs">Card Cashback</dt>
              <dd className="screen-value accent font-semibold">
                - Rs {bestPaymentOption.cashbackValue.toLocaleString()}
              </dd>
            </div>
          </div>

          <div className="screen-box-item">
            <div className="flex items-center justify-between">
              <dt className="screen-label text-xs">Reward Points Value</dt>
              <dd className="screen-value accent font-semibold">
                - Rs {bestPaymentOption.rewardPointsValue.toLocaleString()}
              </dd>
            </div>
          </div>

          <div className="screen-box-item accent">
            <div className="flex items-center justify-between">
              <dt className="screen-label text-xs screen-blink">Final Effective Price</dt>
              <dd className="screen-value accent text-2xl font-semibold screen-blink">
                Rs {bestPaymentOption.effectivePrice.toLocaleString()}
              </dd>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SavingsBreakdown
