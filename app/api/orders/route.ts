import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { auth } from '@/lib/auth';
import { rateLimit, LIMITS } from '@/lib/rateLimit';
import { validateBody, CreateOrderSchema } from '@/lib/validation';
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const isAdmin = (session.user as any)?.role === 'admin';
    const orders = await Order.find(isAdmin ? {} : { userId: (session.user as any).id }).sort({ createdAt: -1 });
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
    return NextResponse.json(order, { status: 201 });
  } catch { return NextResponse.json({ error: 'Failed to create order' }, { status: 500 }); }
}
