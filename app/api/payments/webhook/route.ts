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

  // Card authorized — funds held but not captured yet.
  // Admin must confirm the order to trigger capture.
  if (event.type === 'payment_intent.amount_capturable_updated') {
    if (pi.metadata?.type === 'order') {
      await Order.findByIdAndUpdate(pi.metadata.orderId, {
        paymentStatus:   'authorized',
        paymentIntentId: pi.id,
      });
    }
  }

  // Payment captured (admin confirmed order) — mark as paid.
  if (event.type === 'payment_intent.succeeded') {
    if (pi.metadata?.type === 'order') {
      await Order.findByIdAndUpdate(pi.metadata.orderId, {
        paymentStatus: 'paid',
        status:        'confirmed',
      });
    }

    if (pi.metadata?.type === 'booking') {
      await Booking.findByIdAndUpdate(pi.metadata.bookingId, {
        depositPaid:     true,
        status:          'confirmed',
        paymentIntentId: pi.id,
      });
    }
  }

  // Payment intent cancelled (admin rejected order) — refund authorisation.
  if (event.type === 'payment_intent.canceled') {
    if (pi.metadata?.type === 'order') {
      await Order.findByIdAndUpdate(pi.metadata.orderId, {
        paymentStatus: 'cancelled',
        status:        'cancelled',
      });
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    if (pi.metadata?.type === 'order')   await Order.findByIdAndUpdate(pi.metadata.orderId,     { paymentStatus: 'failed' });
    if (pi.metadata?.type === 'booking') await Booking.findByIdAndUpdate(pi.metadata.bookingId, { status: 'cancelled' });
  }

  return NextResponse.json({ received: true });
}
