import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Booking } from '@/models/Booking';
import { auth } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const booking = await Booking.findById(id);
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const isAdmin = (session.user as any)?.role === 'admin';
  const isOwner = booking.userId?.toString() === (session.user as any)?.id;
  if (!isAdmin && !isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const updated = await Booking.findByIdAndUpdate(id, body, { new: true });
  return NextResponse.json(updated);
}
