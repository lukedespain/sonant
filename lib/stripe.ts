import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-07-29.dahlia',
});

// Price IDs — set these in env after creating products in Stripe dashboard
export const PRICES = {
  proMonthly:        process.env.STRIPE_PRICE_PRO_MONTHLY!,
  submissionFree:    process.env.STRIPE_PRICE_SUBMISSION_FREE!,   // $10
  submissionPro:     process.env.STRIPE_PRICE_SUBMISSION_PRO!,    // $5
  sessionFree:       process.env.STRIPE_PRICE_SESSION_FREE!,      // $50
  sessionPro:        process.env.STRIPE_PRICE_SESSION_PRO!,       // $25
};
