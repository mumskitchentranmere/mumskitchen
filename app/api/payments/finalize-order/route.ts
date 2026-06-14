import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { auth } from '@/lib/auth';
import { rateLimit, LIMITS } from '@/lib/rateLimit';
import { validateBody, CreateOrderSchema } from '@/lib/validation';
import { sendOrderConfirmation, sendOrderNotificationToRestaurant } from '@/lib/email';

export const dynamic = 'force-dynamic';

// POST /api/payments/finalize-order
// Called by the frontend AFTER stripe.confirmCardPayment() returns requires_capture.
// Verifies the PaymentIntent status directly from Stripe (server-to-server),
// then creates the order — so no order ever exists for a declined/fake card.
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, LIMITS.order);
  if (limited) return limited;

  try {
    const raw = await req.json();
    const { paymentIntentId, ...orderFields } = raw;

    if (!paymentIntentId || typeof paymentIntentId !== 'string') {
      return NextResponse.json({ error: 'paymentIntentId is required' }, { status: 400 });
    }

    // ── 1. Verify PaymentIntent directly from Stripe (cannot be faked) ──────
    let pi: Awaited<ReturnType<typeof stripe.paymentIntents.retrieve>>;
    try {
      pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (e: any) {
      console.error('[FinalizeOrder] ❌ Invalid PI id:', paymentIntentId, e.message);
      return NextResponse.json({ error: 'Invalid payment reference' }, { status: 400 });
    }

    if (pi.status !== 'requires_capture' && pi.status !== 'succeeded') {
      console.warn('[FinalizeOrder] ⚠️  PI status is', pi.status, '— card not authorised');
      return NextResponse.json(
        { error: `Card was not authorised (status: ${pi.status}). Please check your card details.` },
        { status: 400 }
      );
    }

    // ── 2. Validate order data ────────────────────────────────────────────────
    const v = validateBody(CreateOrderSchema, orderFields);
    if (!v.data) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    // ── 3. Verify amount matches — prevents price manipulation ────────────────
    const expectedCents = Math.round(v.data.total * 100);
    if (pi.amount !== expectedCents) {
      console.error(`[FinalizeOrder] ❌ Amount mismatch: PI=${pi.amount}c expected=${expectedCents}c`);
      return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 });
    }

    // ── 4. Create order in DB ─────────────────────────────────────────────────
    await connectDB();
    const session = await auth();

    const order = await Order.create({
      ...v.data,
      userId:          session?.user ? (session.user as any).id : undefined,
      paymentStatus:   'authorized',
      paymentIntentId: pi.id,
    });

    console.log('[FinalizeOrder] ✅ Order created:', order._id.toString(), '| PI:', pi.id);

    // ── 5. Update PI metadata so webhook can find the order on capture ────────
    stripe.paymentIntents.update(pi.id, {
      metadata: { type: 'order', orderId: order._id.toString() },
    }).catch(e => console.warn('[FinalizeOrder] Could not update PI metadata:', e.message));

    // ── 6. Send confirmation emails ───────────────────────────────────────────
    const emailData = {
      orderId:             order._id.toString(),
      customerName:        order.customerName,
      customerEmail:       order.customerEmail,
      orderType:           order.orderType,
      items:               order.items,
      subtotal:            order.subtotal,
      deliveryFee:         order.deliveryFee || 0,
      total:               order.total,
      deliveryAddress:     order.deliveryAddress,
      pickupTime:          order.pickupTime,
      specialInstructions: order.specialInstructions,
    };
    sendOrderConfirmation(emailData).catch(() => {});
    const sessionEmail = session?.user?.email;
    if (sessionEmail && sessionEmail.toLowerCase() !== order.customerEmail.toLowerCase()) {
      sendOrderConfirmation({ ...emailData, customerEmail: sessionEmail }).catch(() => {});
    }
    sendOrderNotificationToRestaurant(emailData).catch(() => {});

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error('[FinalizeOrder] ❌ Unexpected error:', err);
    return NextResponse.json({ error: 'Failed to finalise order' }, { status: 500 });
  }
}
