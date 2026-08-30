import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { MenuItem } from '@/models/MenuItem';

// Returns the distinct categories that have at least one item.
// Not filtered by isAvailable — unavailable items still show on the menu (sorted last), so their
// category tab must stay visible too, otherwise the whole subcategory disappears when everything
// in it happens to be temporarily unavailable.
export async function GET() {
  try {
    await connectDB();
    const cats = await MenuItem.distinct('category');
    return NextResponse.json(cats, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
