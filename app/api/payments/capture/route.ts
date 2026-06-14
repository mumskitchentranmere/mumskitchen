import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';

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
  const order = await Order.findById(orderId);
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  if (!order.paymentIntentId) {
    return NextResponse.json({ error: 'No payment intent found for this order' }, { status: 400 });
  }

  if (order.paymentStatus !== 'authorized') {
    return NextResponse.json({ error: `Order payment is '${order.paymentStatus}', not 'authorized'` }, { status: 400 });
  }

  const admin = (session?.user as any)?.email || 'admin';

  try {
    if (action === 'accept') {
      console.log(`[Capture] ▶ Admin (${admin}) accepting order ${orderId} | PI: ${order.paymentIntentId}`);
      await stripe.paymentIntents.capture(order.paymentIntentId);
      await Order.findByIdAndUpdate(orderId, { paymentStatus: 'paid', status: 'confirmed' });
      console.log(`[Capture] ✅ Payment captured for order ${orderId}`);
      return NextResponse.json({ ok: true, status: 'confirmed' });
    } else {
      console.log(`[Capture] ▶ Admin (${admin}) rejecting order ${orderId} | PI: ${order.paymentIntentId}`);
      await stripe.paymentIntents.cancel(order.paymentIntentId);
      await Order.findByIdAndUpdate(orderId, { paymentStatus: 'cancelled', status: 'cancelled' });
      console.log(`[Capture] ✅ Payment cancelled (void) for order ${orderId}`);
      return NextResponse.json({ ok: true, status: 'cancelled' });
    }
  } catch (e: any) {
    console.error(`[Capture] ❌ Stripe error for order ${orderId}:`, e.message);
    return NextResponse.json({ error: e.message || 'Stripe error' }, { status: 500 });
  }
}
