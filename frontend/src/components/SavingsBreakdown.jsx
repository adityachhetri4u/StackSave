import TextType from "./TextType"
import CountUp from "./CountUp"

function SavingsBreakdown({ product, bestPaymentOption }) {
  if (!bestPaymentOption) return null;

  const couponCode = product?.couponCode || 'None'
  const couponAmount = product?.couponAmount || 0
  const cashbackValue = bestPaymentOption?.cashbackValue || bestPaymentOption?.totalSavings || 0
  const creditPointsEarned = bestPaymentOption?.creditPointsEarned || 0
  const rewardPointsValue = bestPaymentOption?.rewardPointsValue || 0
  const effectivePrice = bestPaymentOption?.effectivePrice || 0

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
          <span className="text-[10px] uppercase tracking-wider">Computing</span>
        </span>
      </div>

      <div className="screen-line relative z-10 my-3" />

      <div className="relative z-10 screen-box mt-4 font-mono">
        <div className="screen-box-content space-y-3">
          <div className="screen-box-item">
            <div className="flex items-center justify-between">
              <dt className="screen-label text-[10px]">Coupon ({couponCode})</dt>
              <dd className="screen-value accent font-semibold">- Rs {couponAmount.toLocaleString()}</dd>
            </div>
          </div>

          <div className="screen-box-item">
            <div className="flex items-center justify-between">
              <dt className="screen-label text-[10px]">Card Cashback</dt>
              <dd className="screen-value accent font-semibold">
                - Rs {cashbackValue.toLocaleString()}
              </dd>
            </div>
          </div>

          <div className="screen-box-item">
            <div className="flex items-center justify-between">
              <dt className="screen-label text-[10px]">Reward Points ({creditPointsEarned} pts)</dt>
              <dd className="screen-value accent font-semibold">
                - Rs {rewardPointsValue.toLocaleString()}
              </dd>
            </div>
          </div>

          <div className="screen-box-item accent">
            <div className="flex items-center justify-between">
              <dt className="screen-label text-[10px] screen-blink">Effective Price</dt>
              <dd className="screen-value accent text-xl font-semibold screen-blink">
                Rs <CountUp to={effectivePrice} from={product?.originalPrice || 0} duration={1.5} className="font-semibold" direction="down" />
              </dd>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SavingsBreakdown
