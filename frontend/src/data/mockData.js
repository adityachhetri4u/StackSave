export const baseProducts = [
  {
    id: "prd-1",
    name: "NoiseFit Halo Smartwatch",
    platform: "Flipkart",
    originalPrice: 3999,
  },
  {
    id: "prd-2",
    name: "Sony WH-CH720N Headphones",
    platform: "Amazon",
    originalPrice: 8990,
  },
  {
    id: "prd-3",
    name: "Boat Airdopes 441 Pro",
    platform: "Myntra",
    originalPrice: 2999,
  },
]

export const paymentOptionsTemplate = [
  {
    id: "pay-1",
    name: "HDFC Millennia Credit Card",
    type: "Card",
    cashbackPercent: 10,
    rewardPercent: 2,
    tags: ["Best Cashback", "Instant Discount"],
  },
  {
    id: "pay-2",
    name: "Axis Ace Credit Card",
    type: "Card",
    cashbackPercent: 8,
    rewardPercent: 3,
    tags: ["Max Reward Points"],
  },
  {
    id: "pay-3",
    name: "Google Pay UPI",
    type: "UPI",
    cashbackPercent: 5,
    rewardPercent: 1,
    tags: ["Fastest Checkout"],
  },
  {
    id: "pay-4",
    name: "Amazon Pay ICICI Card",
    type: "Card",
    cashbackPercent: 6,
    rewardPercent: 4,
    tags: ["Prime Benefit"],
  },
]

export const coupons = [
  {
    code: "SAVE250",
    amount: 250,
  },
  {
    code: "STACK100",
    amount: 100,
  },
]

export const alternativeDealsTemplate = [
  {
    id: "deal-1",
    platform: "Amazon",
    price: 3799,
  },
  {
    id: "deal-2",
    platform: "Flipkart",
    price: 3699,
  },
  {
    id: "deal-3",
    platform: "Croma",
    price: 3890,
  },
]

export const defaultUserProfile = {
  cards: ["HDFC Millennia Credit Card", "Axis Ace Credit Card"],
  upiApps: ["Google Pay", "PhonePe"],
  preferredBenefitType: "Cashback",
}
