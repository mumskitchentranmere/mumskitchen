import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { MenuItem } from '@/models/MenuItem';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const cuisine = searchParams.get('cuisine');
    const featured = searchParams.get('featured');
    const query: any = { isAvailable: true };
    if (category && category !== 'all') query.category = category;
    if (cuisine && cuisine !== 'all') query.cuisine = cuisine;
    if (featured === 'true') query.isFeatured = true;
    const session = await auth();
    if ((session?.user as any)?.role === 'admin') delete query.isAvailable;
    const items = await MenuItem.find(query).sort({ sortOrder: 1, name: 1 });
    return NextResponse.json(items);
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
