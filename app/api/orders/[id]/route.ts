import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { sendOrderConfirmed, sendOrderCancelled } from '@/lib/email';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const body = await req.json();

  // Fetch the order BEFORE updating so we have the previous paymentStatus
  const before = await Order.findById(id);
  const order  = await Order.findByIdAndUpdate(id, body, { new: true });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const emailBase = {
    orderId:             order._id.toString(),
    customerName:        order.customerName,
    customerEmail:       order.customerEmail,
    orderType:           order.orderType,
    items:               order.items,
    subtotal:            order.subtotal ?? order.total,
    deliveryFee:         order.deliveryFee || 0,
    total:               order.total,
    pickupTime:          order.pickupTime,
    specialInstructions: order.specialInstructions,
  };

  if (body.status === 'confirmed' && order.customerEmail) {
    sendOrderConfirmed(emailBase).catch(() => {});
  }

  if (body.status === 'cancelled' && order.customerEmail) {
    const alreadyPaid = before?.paymentStatus === 'paid' && before?.paymentIntentId;
    if (alreadyPaid) {
      // Issue Stripe refund then send refund email
      try {
        await stripe.refunds.create({ payment_intent: before.paymentIntentId });
        await Order.findByIdAndUpdate(id, { $set: { paymentStatus: 'refunded' } });
        sendOrderCancelled(emailBase, true).catch(() => {});
      } catch (e: any) {
        console.error('[Refund] Stripe refund failed:', e.message);
        sendOrderCancelled(emailBase, false).catch(() => {});
      }
    } else {
      sendOrderCancelled(emailBase, false).catch(() => {});
    }
  }

  return NextResponse.json(order);
}
