import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { auth } from '@/lib/auth';
import { eposCreateTransaction, mapOrderToEposTransaction } from '@/lib/eposnow';

/**
 * POST /api/epos/push-order
 * Pushes a website order into Epos Now as a transaction.
 * Called automatically after successful payment.
 */
export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

    await connectDB();
    const order = await Order.findById(orderId);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Map our order to Epos Now transaction format
    const eposData = mapOrderToEposTransaction(order);
    const eposTransaction = await eposCreateTransaction(eposData);

    // Save the Epos transaction ID back to our order
    await Order.findByIdAndUpdate(orderId, {
      eposOrderId: String(eposTransaction.Id || eposTransaction.id || ''),
    });

    return NextResponse.json({
      success: true,
      eposTransactionId: eposTransaction.Id,
      message: 'Order pushed to Epos Now POS successfully',
    });

  } catch (e: any) {
    if (e.message?.includes('EPOSNOW_API_TOKEN')) {
      return NextResponse.json({ error: 'Epos Now not configured' }, { status: 503 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
