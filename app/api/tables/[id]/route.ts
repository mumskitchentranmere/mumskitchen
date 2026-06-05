import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Table } from '@/models/Table';
import { auth } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const body = await req.json();
  return NextResponse.json(await Table.findByIdAndUpdate(id, body, { new: true }));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  await Table.findByIdAndDelete(id);
  return NextResponse.json({ message: 'Deleted' });
}
