import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { Booking } from '@/models/Booking';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (e: any) {
    console.error('[Stripe Webhook] Signature verification failed:', e.message);
    return NextResponse.json({ error: `Webhook signature verification failed: ${e.message}` }, { status: 400 });
  }

  try {
    await connectDB();
  } catch (e) {
    console.error('[Stripe Webhook] DB connection failed:', e);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  const pi = event.data?.object;

  if (event.type === 'payment_intent.succeeded') {
    if (pi.metadata?.type === 'order') {
      await Order.findByIdAndUpdate(pi.metadata.orderId, {
        paymentStatus:   'paid',
        status:          'confirmed',
        paymentIntentId: pi.id,
      });

      // Push to Epos Now POS (fire-and-forget — kitchen docket)
      try {
        const base = (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '');
        await fetch(`${base}/api/epos/push-order`, {
          method:  'POST',
          headers: {
            'Content-Type':     'application/json',
            ...(process.env.INTERNAL_API_SECRET
              ? { 'x-internal-secret': process.env.INTERNAL_API_SECRET }
              : {}),
          },
          body: JSON.stringify({ orderId: pi.metadata.orderId }),
        });
      } catch (eposErr) {
        console.error('[Stripe Webhook] Epos push failed (non-critical):', eposErr);
      }
    }

    if (pi.metadata?.type === 'booking') {
      await Booking.findByIdAndUpdate(pi.metadata.bookingId, {
        depositPaid:     true,
        status:          'confirmed',
        paymentIntentId: pi.id,
      });
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    if (pi.metadata?.type === 'order')   await Order.findByIdAndUpdate(pi.metadata.orderId,     { paymentStatus: 'failed' });
    if (pi.metadata?.type === 'booking') await Booking.findByIdAndUpdate(pi.metadata.bookingId, { status: 'cancelled' });
  }

  return NextResponse.json({ received: true });
}
