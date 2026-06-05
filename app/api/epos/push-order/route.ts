import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { eposCreateTransaction, mapOrderToEposTransaction } from '@/lib/eposnow';

/**
 * POST /api/epos/push-order
 * Pushes a confirmed, paid website order into Epos Now as a transaction so the
 * kitchen printer receives a docket. Called automatically from the Stripe webhook
 * after payment succeeds — not intended to be called from the browser.
 *
 * Security: requires the X-Internal-Secret header to match INTERNAL_API_SECRET.
 * The Stripe webhook sets this header when it calls the endpoint internally.
 */
export async function POST(req: NextRequest) {
  // Verify this is an internal call from our own Stripe webhook
  const secret = process.env.INTERNAL_API_SECRET;
  if (secret) {
    const provided = req.headers.get('x-internal-secret');
    if (provided !== secret) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  try {
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

    await connectDB();
    const order = await Order.findById(orderId);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Only push paid orders to Epos Now
    if (order.paymentStatus !== 'paid') {
      return NextResponse.json({ error: 'Order is not paid' }, { status: 400 });
    }

    const eposData = mapOrderToEposTransaction(order);
    const eposTransaction = await eposCreateTransaction(eposData);

    await Order.findByIdAndUpdate(orderId, {
      eposOrderId: String(eposTransaction.Id || eposTransaction.id || ''),
    });

    return NextResponse.json({
      success: true,
      eposTransactionId: eposTransaction.Id,
      message: 'Order pushed to Epos Now POS — kitchen docket sent',
    });

  } catch (e: any) {
    if (e.message?.includes('EPOSNOW_API_TOKEN')) {
      return NextResponse.json({ error: 'Epos Now not configured' }, { status: 503 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
