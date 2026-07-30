import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe, PRICES } from '@/lib/stripe';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { type } = await req.json() as { type: 'pro' | 'submission' | 'session' };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('tier, stripe_customer_id')
    .eq('id', user.id)
    .single();

  const isPro = profile?.tier === 'pro' || (user.email?.endsWith('@sonant.ac') ?? false);

  // Get or create Stripe customer
  let customerId = (profile as any)?.stripe_customer_id as string | null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
  }

  const origin = req.headers.get('origin') ?? 'https://sonant.ac';

  let priceId: string;
  let mode: 'subscription' | 'payment';

  if (type === 'pro') {
    priceId = PRICES.proMonthly;
    mode = 'subscription';
  } else if (type === 'submission') {
    priceId = isPro ? PRICES.submissionPro : PRICES.submissionFree;
    mode = 'payment';
  } else if (type === 'session') {
    priceId = isPro ? PRICES.sessionPro : PRICES.sessionFree;
    mode = 'payment';
  } else {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/account?success=1`,
    cancel_url: `${origin}/account`,
    metadata: { supabase_user_id: user.id, purchase_type: type },
    ...(mode === 'subscription' && {
      subscription_data: { metadata: { supabase_user_id: user.id } },
    }),
  });

  return NextResponse.json({ url: session.url });
}
