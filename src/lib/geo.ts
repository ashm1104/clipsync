// Pricing tier detection. Client-side, timezone-based. Good enough for
// surfacing the right prices in UpgradeModal — actual billing enforcement
// happens in Dodo Payments via the customer's billing address.
//
// Tier 1 = Western markets, default for everyone outside listed Tier 3
// timezones. Priced in USD.
// Tier 3 = India + South Asia. Priced in INR.
//
// Tiers 2 and 4 are deferred to v1.5. Anyone in those regions sees
// Tier 1 prices for now.

export type PricingTier = 'tier1' | 'tier3';
export type BillingInterval = 'monthly' | 'yearly';

const TIER_3_TIMEZONES: ReadonlyArray<string> = [
  // India
  'Asia/Kolkata',
  'Asia/Calcutta',
  // Pakistan
  'Asia/Karachi',
  // Bangladesh
  'Asia/Dhaka',
  // Sri Lanka
  'Asia/Colombo',
  // Nepal
  'Asia/Kathmandu',
];

export function detectPricingTier(): PricingTier {
  if (typeof Intl === 'undefined') return 'tier1';
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TIER_3_TIMEZONES.includes(tz)) return 'tier3';
  } catch {
    // Fall through
  }
  return 'tier1';
}

type PriceEntry = {
  amount: number;
  label: string;
  // Dodo product or price ID — filled in once we provision them in
  // the Dodo dashboard. Until then these are placeholders so the UI
  // still renders correctly.
  dodoProductId: string;
};

type TierConfig = {
  currency: 'USD' | 'INR';
  symbol: '$' | '₹';
  monthly: PriceEntry;
  yearly: PriceEntry;
  // Yearly equivalent monthly cost, for the 'save N%' badge.
  yearlyAsMonthly: number;
  yearlyDiscountPct: number;
};

export const PRICING: Record<PricingTier, TierConfig> = {
  tier1: {
    currency: 'USD',
    symbol: '$',
    monthly: {
      amount: 5,
      label: '$5',
      dodoProductId: 'TIER1_MONTHLY_TBD',
    },
    yearly: {
      amount: 40,
      label: '$40',
      dodoProductId: 'TIER1_YEARLY_TBD',
    },
    yearlyAsMonthly: 40 / 12,
    yearlyDiscountPct: Math.round((1 - 40 / (5 * 12)) * 100),
  },
  tier3: {
    currency: 'INR',
    symbol: '₹',
    monthly: {
      amount: 99,
      label: '₹99',
      dodoProductId: 'TIER3_MONTHLY_TBD',
    },
    yearly: {
      amount: 999,
      label: '₹999',
      dodoProductId: 'TIER3_YEARLY_TBD',
    },
    yearlyAsMonthly: 999 / 12,
    yearlyDiscountPct: Math.round((1 - 999 / (99 * 12)) * 100),
  },
};

export function getPricing(tier: PricingTier = detectPricingTier()): TierConfig {
  return PRICING[tier];
}

export function formatYearlyAsMonthly(tier: PricingTier = detectPricingTier()): string {
  const cfg = PRICING[tier];
  const amt = cfg.yearlyAsMonthly;
  const rounded = cfg.currency === 'INR' ? Math.round(amt) : Math.round(amt * 100) / 100;
  return `${cfg.symbol}${rounded}/mo`;
}
