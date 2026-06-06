import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { auth } from '@/lib/auth';
import { rateLimit, LIMITS } from '@/lib/rateLimit';
import { validateBody, CreateOrderSchema } from '@/lib/validation';
import { sendOrderConfirmation, sendOrderNotificationToRestaurant } from '@/lib/email';

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const isAdmin = (session.user as any)?.role === 'admin';
    const userId  = (session.user as any)?.id;
    const email   = session.user?.email;
    const query   = isAdmin ? {} : { $or: [{ userId }, { customerEmail: email }] };
    const orders  = await Order.find(query).sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch { return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, LIMITS.order);
  if (limited) return limited;
  try {
    const raw = await req.json();
    const v = validateBody(CreateOrderSchema, raw);
    if (!v.data) return NextResponse.json({ error: v.error }, { status: 400 });
    await connectDB();
    const session = await auth();
    const order = await Order.create({ ...v.data, userId: session?.user ? (session.user as any).id : undefined });

    // Send confirmation email to customer + notification to restaurant (fire and forget)
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
    // Send to the email entered in the checkout form
    sendOrderConfirmation(emailData).catch(() => {});

    // If logged in and their account Gmail differs from the entered email, also send there
    const sessionEmail = session?.user?.email;
    if (sessionEmail && sessionEmail.toLowerCase() !== order.customerEmail.toLowerCase()) {
      sendOrderConfirmation({ ...emailData, customerEmail: sessionEmail }).catch(() => {});
    }

    sendOrderNotificationToRestaurant(emailData).catch(() => {});

    return NextResponse.json(order, { status: 201 });
  } catch { return NextResponse.json({ error: 'Failed to create order' }, { status: 500 }); }
}
