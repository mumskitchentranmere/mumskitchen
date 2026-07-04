import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { sendOrderConfirmed, sendOrderCancelled } from '@/lib/email';

export const dynamic = 'force-dynamic';

// POST /api/payments/capture
// Body: { orderId: string, action: 'accept' | 'reject' }
// Accept → capture the authorised payment, status → confirmed
// Reject → cancel the payment intent (no charge), status → cancelled
export async function POST(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { orderId, action } = await req.json();
  if (!orderId || !['accept', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'orderId and action (accept|reject) required' }, { status: 400 });
  }

  await connectDB();

  // Atomic check-and-lock: only one concurrent request can pass this for a given order.
  // findOneAndUpdate with a condition returns null if paymentStatus is no longer 'authorized'.
  const order = await Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: 'authorized' },
    { $set: { paymentStatus: 'capturing' } },
    { new: false }
  );

  if (!order) {
    // Either the order doesn't exist or it's already past 'authorized'
    const current = await Order.findById(orderId);
    if (!current) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    // If accepting and it's already paid, treat as success (idempotent)
    if (action === 'accept' && current.paymentStatus === 'paid') {
      return NextResponse.json({ ok: true, status: 'confirmed' });
    }
    return NextResponse.json(
      { error: `Order payment is '${current.paymentStatus}', not 'authorized'` },
      { status: 400 }
    );
  }

  if (!order.paymentIntentId) {
    await Order.findByIdAndUpdate(orderId, { $set: { paymentStatus: 'authorized' } });
    return NextResponse.json({ error: 'No payment intent found for this order' }, { status: 400 });
  }

  const admin = (session?.user as any)?.email || 'admin';

  try {
    if (action === 'accept') {
      console.log(`[Capture] ▶ Admin (${admin}) accepting order ${orderId} | PI: ${order.paymentIntentId}`);
      await stripe.paymentIntents.capture(order.paymentIntentId);
      await Order.findByIdAndUpdate(orderId, { $set: { paymentStatus: 'paid', status: 'confirmed' } });
      console.log(`[Capture] ✅ Payment captured for order ${orderId}`);
      if (order.customerEmail) {
        sendOrderConfirmed({
          orderId: orderId, customerName: order.customerName, customerEmail: order.customerEmail,
          orderType: order.orderType, items: order.items, subtotal: order.subtotal ?? order.total,
          deliveryFee: order.deliveryFee || 0, total: order.total,
          pickupTime: order.pickupTime, specialInstructions: order.specialInstructions,
        }).catch(() => {});
      }
      return NextResponse.json({ ok: true, status: 'confirmed' });
    } else {
      console.log(`[Capture] ▶ Admin (${admin}) rejecting order ${orderId} | PI: ${order.paymentIntentId}`);
      await stripe.paymentIntents.cancel(order.paymentIntentId);
      await Order.findByIdAndUpdate(orderId, { $set: { paymentStatus: 'cancelled', status: 'cancelled' } });
      console.log(`[Capture] ✅ Payment cancelled (void) for order ${orderId}`);
      if (order.customerEmail) {
        sendOrderCancelled({
          orderId: orderId, customerName: order.customerName, customerEmail: order.customerEmail,
          orderType: order.orderType, items: order.items, subtotal: order.subtotal ?? order.total,
          deliveryFee: order.deliveryFee || 0, total: order.total,
        }, false).catch(() => {});
      }
      return NextResponse.json({ ok: true, status: 'cancelled' });
    }
  } catch (e: any) {
    // If Stripe reports the PI was already captured, sync the DB and return success.
    if (action === 'accept' && e?.code === 'payment_intent_unexpected_state') {
      await Order.findByIdAndUpdate(orderId, { $set: { paymentStatus: 'paid', status: 'confirmed' } });
      console.log(`[Capture] ℹ️ PI already captured for order ${orderId} — DB synced`);
      return NextResponse.json({ ok: true, status: 'confirmed' });
    }
    // Revert the 'capturing' lock so the order can be retried
    await Order.findByIdAndUpdate(orderId, { $set: { paymentStatus: 'authorized' } });
    console.error(`[Capture] ❌ Stripe error for order ${orderId}:`, e.message);
    return NextResponse.json({ error: e.message || 'Stripe error' }, { status: 500 });
  }
}
