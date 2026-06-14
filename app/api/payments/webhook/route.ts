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
    console.error('[Webhook] ❌ Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Webhook] ❌ STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (e: any) {
    console.error('[Webhook] ❌ Signature verification failed:', e.message);
    return NextResponse.json({ error: `Webhook signature verification failed: ${e.message}` }, { status: 400 });
  }

  console.log('[Webhook] 📨 Event received:', event.type, '| id:', event.id);

  try {
    await connectDB();
  } catch (e) {
    console.error('[Webhook] ❌ DB connection failed:', e);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  const pi = event.data?.object;

  // Card authorised — funds held, not charged yet. Admin must accept to capture.
  if (event.type === 'payment_intent.amount_capturable_updated') {
    if (pi.metadata?.type === 'order') {
      const orderId = pi.metadata.orderId;
      await Order.findByIdAndUpdate(orderId, { paymentStatus: 'authorized', paymentIntentId: pi.id });
      console.log('[Webhook] ✅ Order AUTHORISED — orderId:', orderId, '| PI:', pi.id, '| amount: $' + (pi.amount / 100).toFixed(2));
    }
  }

  // Admin captured payment — order confirmed and paid.
  if (event.type === 'payment_intent.succeeded') {
    if (pi.metadata?.type === 'order') {
      const orderId = pi.metadata.orderId;
      await Order.findByIdAndUpdate(orderId, { paymentStatus: 'paid', status: 'confirmed' });
      console.log('[Webhook] ✅ Order PAID & CONFIRMED — orderId:', orderId, '| PI:', pi.id, '| amount: $' + (pi.amount_received / 100).toFixed(2));
    }
    if (pi.metadata?.type === 'booking') {
      await Booking.findByIdAndUpdate(pi.metadata.bookingId, { depositPaid: true, status: 'confirmed', paymentIntentId: pi.id });
      console.log('[Webhook] ✅ Booking deposit PAID — bookingId:', pi.metadata.bookingId);
    }
  }

  // Admin rejected — authorisation voided, customer never charged.
  if (event.type === 'payment_intent.canceled') {
    if (pi.metadata?.type === 'order') {
      const orderId = pi.metadata.orderId;
      await Order.findByIdAndUpdate(orderId, { paymentStatus: 'cancelled', status: 'cancelled' });
      console.log('[Webhook] ✅ Order CANCELLED — orderId:', orderId, '| PI:', pi.id);
    }
  }

  // Card declined or authentication failed — customer never charged.
  if (event.type === 'payment_intent.payment_failed') {
    const reason = pi.last_payment_error?.message || 'unknown';
    if (pi.metadata?.type === 'order') {
      const orderId = pi.metadata.orderId;
      await Order.findByIdAndUpdate(orderId, { paymentStatus: 'failed' });
      console.warn('[Webhook] ⚠️  Order payment FAILED — orderId:', orderId, '| reason:', reason);
    }
    if (pi.metadata?.type === 'booking') {
      await Booking.findByIdAndUpdate(pi.metadata.bookingId, { status: 'cancelled' });
      console.warn('[Webhook] ⚠️  Booking payment FAILED — bookingId:', pi.metadata.bookingId, '| reason:', reason);
    }
  }

  return NextResponse.json({ received: true });
}
