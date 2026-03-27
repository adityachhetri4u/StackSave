import {
  alternativeDealsTemplate,
  baseProducts,
  coupons,
  paymentOptionsTemplate,
} from "../data/mockData"

const formatMoney = (value) => Number(value.toFixed(2))

const buildProfilePaymentOptions = (userProfile) => {
  const cardOptions = userProfile.cards.map((name, index) => {
    const template = paymentOptionsTemplate[index % paymentOptionsTemplate.length]

    return {
      ...template,
      id: `card-${index + 1}`,
      name,
      type: "Card",
      cashbackPercent: Math.max(4, template.cashbackPercent - (index % 3)),
      rewardPercent: template.rewardPercent + (index % 2),
      tags: [...template.tags, "Vault Synced"],
    }
  })

  const upiOptions = userProfile.upiApps.map((name, index) => {
    const template = paymentOptionsTemplate[(index + 2) % paymentOptionsTemplate.length]

    return {
      ...template,
      id: `upi-${index + 1}`,
      name: `${name} UPI`,
      type: "UPI",
      cashbackPercent: Math.max(2, template.cashbackPercent - 2),
      rewardPercent: Math.max(1, template.rewardPercent - 1),
      tags: ["Fast Checkout", "UPI Assist"],
    }
  })

  const merged = [...cardOptions, ...upiOptions]

  if (merged.length > 0) {
    return merged
  }

  return paymentOptionsTemplate
}

const getPreferredBoost = (option, preferredBenefitType) => {
  if (preferredBenefitType === "Cashback") {
    return option.cashbackPercent * 0.15
  }

  if (preferredBenefitType === "Rewards") {
    return option.rewardPercent * 0.2
  }

  return option.tags.includes("Instant Discount") ? 1.2 : 0.4
}

export const mockAnalyzeUrl = (url, userProfile) => {
  const productSeed = url.length % baseProducts.length
  const couponSeed = url.length % coupons.length

  const product = baseProducts[productSeed]
  const coupon = coupons[couponSeed]
  const availableOptions = buildProfilePaymentOptions(userProfile)

  const paymentOptions = availableOptions.map((option) => {
    const cashbackValue = formatMoney(
      (product.originalPrice * option.cashbackPercent) / 100,
    )
    const rewardPointsValue = formatMoney(
      (product.originalPrice * option.rewardPercent) / 100,
    )
    const effectivePrice = formatMoney(
      product.originalPrice - coupon.amount - cashbackValue - rewardPointsValue,
    )
    const totalSavings = formatMoney(product.originalPrice - effectivePrice)
    const score =
      totalSavings + getPreferredBoost(option, userProfile.preferredBenefitType)

    return {
      ...option,
      cashbackValue,
      rewardPointsValue,
      couponCode: coupon.code,
      couponAmount: coupon.amount,
      totalSavings,
      effectivePrice,
      score,
    }
  })

  const bestPaymentOption = paymentOptions
    .slice()
    .sort((a, b) => b.score - a.score)[0]

  const betterDeals = alternativeDealsTemplate.map((deal) => {
    const savingsPotential = Math.max(
      0,
      formatMoney(product.originalPrice - deal.price),
    )

    return {
      ...deal,
      savingsPotential,
    }
  })

  return {
    product: {
      ...product,
      couponCode: coupon.code,
      couponAmount: coupon.amount,
    },
    paymentOptions,
    bestPaymentOption,
    betterDeals,
    analyzedAt: new Date().toISOString(),
  }
}

export const simulateAnalyzeRequest = (url, userProfile) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockAnalyzeUrl(url, userProfile))
    }, 900)
  })
