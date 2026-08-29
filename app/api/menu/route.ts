import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { MenuItem } from '@/models/MenuItem';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const cuisine  = searchParams.get('cuisine');
    const featured = searchParams.get('featured');
    const session  = await auth();
    const isAdmin  = (session?.user as any)?.role === 'admin';
    // featured requests (homepage) only show available items
    const query: any = (featured === 'true') ? { isAvailable: true } : {};
    if (category && category !== 'all') query.category = category;
    if (cuisine  && cuisine  !== 'all') query.cuisine = { $in: [cuisine, 'both'] };
    if (featured === 'true') query.isFeatured = true;
    // Sort: available items first (isAvailable: -1), then by admin-set sortOrder, then name
    const items = await MenuItem.find(query).sort({ isAvailable: -1, sortOrder: 1, name: 1 }).lean();
    const res = NextResponse.json(items);
    if (!isAdmin) res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res;
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const body = await req.json();
    const item = await MenuItem.create(body);
    return NextResponse.json(item, { status: 201 });
  } catch(e:any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
