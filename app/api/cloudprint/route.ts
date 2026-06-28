import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { PrintJob } from '@/models/PrintJob';

export const dynamic = 'force-dynamic';

// ── GET — printer polls this to check if a job is waiting ─────────────────────
// Star CloudPRNT sends: GET /api/cloudprint?mac=XX-XX-XX&version=1.3
export async function GET() {
  try {
    await connectDB();
    const job = await PrintJob.findOne({ status: 'pending' }).lean();
    if (!job) {
      return NextResponse.json({ jobReady: false });
    }
    return NextResponse.json({
      jobReady:   true,
      mediaTypes: ['application/octet-stream'],
    });
  } catch {
    return NextResponse.json({ jobReady: false });
  }
}

// ── POST — printer either requests the job data or reports completion ──────────
export async function POST(req: NextRequest) {
  await connectDB();

  let body: any = {};
  try { body = await req.json(); } catch {}

  // Printer finished printing → mark job done
  if (body.deleteJob) {
    await PrintJob.findOneAndUpdate({ status: 'printing' }, { status: 'done' });
    return NextResponse.json({ jobReady: false });
  }

  // Printer requesting job data
  const job = await PrintJob.findOneAndUpdate(
    { status: 'pending' },
    { status: 'printing' },
    { new: true, sort: { createdAt: 1 } }
  );

  if (!job) {
    return NextResponse.json({ jobReady: false }, { status: 404 });
  }

  const data = Buffer.from(job.hex, 'hex');
  return new NextResponse(data, {
    headers: { 'Content-Type': 'application/octet-stream' },
  });
}
