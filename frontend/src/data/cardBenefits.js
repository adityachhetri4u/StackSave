const CARD_BENEFITS = [
  {
    id: 'hdfc-millennia',
    matchTokens: ['hdfc', 'millennia'],
    title: 'HDFC Millennia Credit Card',
    metrics: {
      returnRate: '5%',
      pointsValue: 'Rs 1/pt',
      boostZone: 'Amazon/Flipkart',
      avoidZone: 'Fuel/Rent',
    },
    bullets: [
      'Target 5% ROI on major online shopping spends.',
      'Redeem points at about Rs 1/pt and stack HDFC offers.',
    ],
  },
  {
    id: 'sbi-cashback',
    matchTokens: ['sbi', 'cashback'],
    title: 'SBI Cashback Credit Card',
    metrics: {
      returnRate: '5%',
      pointsValue: 'Direct CB',
      boostZone: 'All Online',
      avoidZone: 'Rent/Utilities',
    },
    bullets: [
      'Flat 5% cashback on online spends with auto credit.',
      'Best with coupons + SBI merchant offers.',
    ],
  },
  {
    id: 'hdfc-infinia',
    matchTokens: ['hdfc', 'infinia'],
    title: 'HDFC Infinia Credit Card',
    metrics: {
      returnRate: '16-33%',
      pointsValue: 'Rs 1+/pt',
      boostZone: 'SmartBuy',
      avoidZone: 'Fuel/Rent/Tax',
    },
    bullets: [
      'Use SmartBuy routes for very high reward acceleration.',
      'Redeem points for travel at around Rs 1+ value.',
    ],
  },
  {
    id: 'sbi-simplyclick',
    matchTokens: ['sbi', 'simplyclick'],
    title: 'SBI SimplyCLICK Credit Card',
    metrics: {
      returnRate: '~2.5%',
      pointsValue: 'Reward Pts',
      boostZone: 'Partner Apps',
      avoidZone: 'Offline',
    },
    bullets: [
      'Use partner merchants for around 2.5% return profile.',
      'Fallback for online spends when no better card is active.',
    ],
  },
  {
    id: 'sc-ultimate',
    matchTokens: ['standard chartered', 'ultimate'],
    title: 'Standard Chartered Ultimate Credit Card',
    metrics: {
      returnRate: '~3.3%',
      pointsValue: 'Rs 1/pt',
      boostZone: 'High Ticket',
      avoidZone: 'Low Utilization',
    },
    bullets: [
      'Strong uncapped return on high-value spends.',
      'Use lounge/golf/duty-free perks to justify annual fee.',
    ],
  },
  {
    id: 'hdfc-diners-privilege',
    matchTokens: ['hdfc', 'diners', 'privilege'],
    title: 'HDFC Diners Club Privilege',
    metrics: {
      returnRate: '5%+',
      pointsValue: 'SmartBuy',
      boostZone: 'Travel/Vouchers',
      avoidZone: 'Low Acceptance',
    },
    bullets: [
      'Focus SmartBuy + weekend online usage for higher gains.',
      'Avoid merchants where Diners acceptance is weak.',
    ],
  },
];

const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').trim();

export const getCardBenefits = (cardName, bankName = '') => {
  const haystack = normalize(`${bankName} ${cardName}`);

  const matched = CARD_BENEFITS.find((item) =>
    item.matchTokens.every((token) => haystack.includes(normalize(token))),
  );

  return matched || null;
};

export default CARD_BENEFITS;
