import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Booking } from '@/models/Booking';
import { auth } from '@/lib/auth';
import { rateLimit, LIMITS } from '@/lib/rateLimit';
import { validateBody, CreateBookingSchema } from '@/lib/validation';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const isAdmin = (session.user as any)?.role === 'admin';
  const q = isAdmin ? {} : { userId: (session.user as any).id };
  const bookings = await Booking.find(q).populate('tableId').sort({ createdAt: -1 });
  return NextResponse.json(bookings);
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, LIMITS.order);
  if (limited) return limited;
  try {
    const body = await req.json();
    const result = validateBody(CreateBookingSchema, body);
    if (result.error || !result.data) return NextResponse.json({ error: result.error }, { status: 400 });
    const data = result.data;
    await connectDB();
    const session = await auth();
    const conflict = await Booking.findOne({ tableId: data.tableId, date: data.date, time: data.time, status: { $in: ['pending','confirmed'] } });
    if (conflict) return NextResponse.json({ error: 'Table already booked for this slot' }, { status: 409 });
    const booking = await Booking.create({ ...data, userId: session?.user ? (session.user as any).id : undefined });
    return NextResponse.json(booking, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
