import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Settings } from '@/models/Settings';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Public — menu page reads this to apply discount to prices
export async function GET() {
  try {
    await connectDB();
    const s = await Settings.findOne().lean();
    return NextResponse.json({ globalDiscount: (s as any)?.globalDiscount ?? 0 });
  } catch {
    return NextResponse.json({ globalDiscount: 0 });
  }
}

// Admin only — set the global discount
export async function PUT(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { globalDiscount } = await req.json();
  const pct = Math.min(100, Math.max(0, Number(globalDiscount) || 0));

  await connectDB();
  await Settings.findOneAndUpdate({}, { globalDiscount: pct }, { upsert: true, new: true });
  return NextResponse.json({ ok: true, globalDiscount: pct });
}
