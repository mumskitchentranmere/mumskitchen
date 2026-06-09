import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { rateLimit, LIMITS } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, LIMITS.order);
  if (limited) return limited;

  try {
    const { amount, metadata } = await req.json();

    if (typeof amount !== 'number' || amount <= 0 || amount > 10000) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // capture_method: 'manual' — funds are authorised but NOT charged yet.
    // Admin must call /api/payments/capture to actually take the money.
    const pi = await stripe.paymentIntents.create({
      amount:              Math.round(amount * 100),
      currency:            'aud',
      capture_method:      'manual',
      payment_method_types: ['card'],
      metadata,
    });

    return NextResponse.json({ clientSecret: pi.client_secret, id: pi.id });
  } catch (e: any) {
    console.error('[Stripe] Failed to create payment intent:', e.message);
    return NextResponse.json({ error: 'Failed to initialise payment' }, { status: 500 });
  }
}
