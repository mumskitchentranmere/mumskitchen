import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { MenuItem } from '@/models/MenuItem';

// Returns the distinct categories that have at least one available item
export async function GET() {
  try {
    await connectDB();
    const cats = await MenuItem.distinct('category', { isAvailable: true });
    return NextResponse.json(cats, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
