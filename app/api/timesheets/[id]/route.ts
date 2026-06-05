import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Timesheet } from '@/models/Timesheet';
import { Employee } from '@/models/Employee';
import { auth } from '@/lib/auth';

async function requireAdmin() {
  const session = await auth();
  return (session?.user as any)?.role === 'admin';
}

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;

function shiftHours(start: string, finish: string): number {
  if (!start || !finish) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [fh, fm] = finish.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(fh) || isNaN(fm)) return 0;
  let diff = (fh * 60 + fm) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return Math.round(diff / 60 * 100) / 100;
}

function buildShifts(raw: Record<string, { start?: string; finish?: string }>) {
  const shifts: Record<string, { start: string; finish: string; hours: number }> = {};
  for (const day of DAYS) {
    const s = raw[day]?.start || '';
    const f = raw[day]?.finish || '';
    shifts[day] = { start: s, finish: f, hours: shiftHours(s, f) };
  }
  return shifts;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const { shifts: rawShifts, notes, status, paid } = body;

  const existing = await Timesheet.findById(id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const update: any = {};

  if (rawShifts) {
    const employee    = await Employee.findById(existing.employeeId);
    const wagesPerHour = employee?.wagesPerHour ?? existing.wagesPerHour;
    const shifts = buildShifts(rawShifts);
    const totalHours = DAYS.reduce((s, d) => s + (shifts[d]?.hours || 0), 0);
    const totalWages = Math.round(totalHours * wagesPerHour * 100) / 100;
    update.shifts      = shifts;
    update.totalHours  = Math.round(totalHours * 100) / 100;
    update.totalWages  = totalWages;
    update.wagesPerHour = wagesPerHour;
  }

  if (notes  !== undefined) update.notes  = notes;
  if (status !== undefined) update.status = status;

  if (paid !== undefined) {
    update.paid       = paid;
    update.paidAt     = paid ? new Date() : null;
    update.paidAmount = paid ? existing.totalWages : 0;
  }

  const updated = await Timesheet.findByIdAndUpdate(id, update, { new: true });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  await Timesheet.findByIdAndDelete(id);
  return NextResponse.json({ message: 'Deleted' });
}
