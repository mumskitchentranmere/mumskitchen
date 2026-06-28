import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Settings } from '@/models/Settings';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Public — menu page reads this to apply discount to prices and category order
export async function GET() {
  try {
    await connectDB();
    const s = await Settings.findOne().lean() as any;
    return NextResponse.json(
      { globalDiscount: s?.globalDiscount ?? 0, categoryOrder: s?.categoryOrder ?? [] },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch {
    return NextResponse.json(
      { globalDiscount: 0, categoryOrder: [] },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  }
}

// Admin only — update settings
export async function PUT(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const update: any = {};

  if (body.globalDiscount !== undefined) {
    update.globalDiscount = Math.min(100, Math.max(0, Number(body.globalDiscount) || 0));
  }
  if (body.categoryOrder !== undefined) {
    update.categoryOrder = body.categoryOrder;
  }

  await connectDB();
  const s = await Settings.findOneAndUpdate({}, { $set: update }, { upsert: true, new: true });
  return NextResponse.json({ ok: true, globalDiscount: s.globalDiscount, categoryOrder: s.categoryOrder });
}
