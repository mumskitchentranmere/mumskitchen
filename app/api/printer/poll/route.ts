import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { PrintJob } from '@/models/PrintJob';

export const dynamic = 'force-dynamic';

const KEY = process.env.PRINTER_API_KEY;

function auth(req: NextRequest) {
  if (!KEY) return true; // no key configured → open (dev only)
  return req.headers.get('x-printer-key') === KEY;
}

// GET /api/printer/poll
// Returns the oldest pending print job and atomically marks it as done.
// The printer-bridge.js on the local Mac polls this every few seconds.
export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const job = await PrintJob.findOneAndUpdate(
    { status: 'pending' },
    { $set: { status: 'done' } },
    { sort: { createdAt: 1 }, new: false }
  );

  if (!job) return NextResponse.json(null);
  return NextResponse.json(job.order);
}
