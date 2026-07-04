import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { PrintJob } from '@/models/PrintJob';

export const dynamic = 'force-dynamic';

// POST /api/printer/print
// Saves an order as a pending print job — the local printer-bridge.js polls
// /api/printer/poll to pick it up and print via Bluetooth.
export async function POST(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let order: any;
  try {
    order = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!order?._id) {
    return NextResponse.json({ error: 'order._id is required' }, { status: 400 });
  }

  await connectDB();
  await PrintJob.create({ order });
  return NextResponse.json({ ok: true });
}
