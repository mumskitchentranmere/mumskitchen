import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Employee } from '@/models/Employee';
import { auth } from '@/lib/auth';

async function requireAdmin() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') return false;
  return true;
}

export async function GET() {
  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const employees = await Employee.find().sort({ name: 1 });
  return NextResponse.json(employees);
}

export async function POST(req: NextRequest) {
  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    await connectDB();
    const body = await req.json();
    if (!body.name || !body.wagesPerHour) return NextResponse.json({ error: 'Name and wages per hour are required' }, { status: 400 });
    const employee = await Employee.create(body);
    return NextResponse.json(employee, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
