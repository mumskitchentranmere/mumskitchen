import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { Booking } from '@/models/Booking';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get('stripe-signature')!;
  let event: any;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }

  await connectDB();
  const pi = event.data?.object;

  if (event.type === 'payment_intent.succeeded') {
    if (pi.metadata?.type === 'order') {
      await Order.findByIdAndUpdate(pi.metadata.orderId, {
        paymentStatus:   'paid',
        status:          'confirmed',
        paymentIntentId: pi.id,
      });

      // Auto-push to Epos Now POS (fire and forget — don't fail payment if Epos is down)
      try {
        const base = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        await fetch(`${base}/api/epos/push-order`, {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(process.env.INTERNAL_API_SECRET ? { 'x-internal-secret': process.env.INTERNAL_API_SECRET } : {}),
          },
          body: JSON.stringify({ orderId: pi.metadata.orderId }),
        });
      } catch (eposError) {
        console.error('[Stripe Webhook] Epos push failed (non-critical):', eposError);
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
