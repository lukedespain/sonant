import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import type Stripe from 'stripe';

export const runtime = 'nodejs';

// Disable body parsing — Stripe needs the raw body for signature verification
export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const admin = createAdminClient();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.supabase_user_id;
    const purchaseType = session.metadata?.purchase_type;

    if (!userId) return NextResponse.json({ error: 'Missing user id' }, { status: 400 });

    if (purchaseType === 'pro') {
      // Grant pro tier + starter credits
      await admin.from('profiles').update({
        tier: 'pro',
        stripe_customer_id: session.customer as string,
      }).eq('id', userId);

      await admin.rpc('increment_credits', {
        p_user_id: userId,
        p_submission_delta: 3,
        p_session_delta: 0,
      });

    } else if (purchaseType === 'submission') {
      await admin.rpc('increment_credits', {
        p_user_id: userId,
        p_submission_delta: 1,
        p_session_delta: 0,
      });

    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.supabase_user_id;
    if (userId) {
      await admin.from('profiles').update({ tier: 'free' }).eq('id', userId);
    }
  }

  return NextResponse.json({ received: true });
}
