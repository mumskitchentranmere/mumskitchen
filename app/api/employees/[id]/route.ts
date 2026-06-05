import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Employee } from '@/models/Employee';
import { auth } from '@/lib/auth';

async function requireAdmin() {
  const session = await auth();
  return (session?.user as any)?.role === 'admin';
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const employee = await Employee.findByIdAndUpdate(id, body, { new: true });
  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(employee);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  await Employee.findByIdAndDelete(id);
  return NextResponse.json({ message: 'Deleted' });
}
