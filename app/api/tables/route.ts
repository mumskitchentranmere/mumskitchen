import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Table } from '@/models/Table';
import { Booking } from '@/models/Booking';
import { auth } from '@/lib/auth';
export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date'); const time = searchParams.get('time'); const ps = searchParams.get('partySize');
  let tables = await Table.find({ isActive: true });
  if (date && time) {
    const booked = await Booking.find({ date, time, status: { $in: ['pending','confirmed'] } }).distinct('tableId');
    tables = tables.filter(t => !booked.some(id => id.toString() === t._id.toString()));
  }
  if (ps) { const n = parseInt(ps, 10); if (!isNaN(n)) tables = tables.filter(t => t.capacity >= n); }
  return NextResponse.json(tables);
}
export async function POST(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const table = await Table.create(await req.json());
  return NextResponse.json(table, { status: 201 });
}
